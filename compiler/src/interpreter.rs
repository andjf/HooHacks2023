use std::{collections::HashMap, f32::consts::PI};

use rand::{rngs::OsRng, Rng};

use crate::{line, Constant, Instruction, Position, Tick, Value, Variable};

fn degrees_to_radians(degrees: i16) -> f32 {
    degrees as f32 / 180.0 * PI
}

pub struct Interpreter {
    pos: Position,
    dir: f32,
    pen_down: bool,
    variables: HashMap<String, i16>,
    current_color: String,
    rng: OsRng,
    current_inst: usize,
    width: i16,
    height: i16,
}

impl Interpreter {
    pub fn new(starting_pos: Position, width: i16, height: i16) -> Self {
        Self {
            pos: starting_pos,
            dir: 0.0,
            pen_down: false,
            variables: HashMap::new(),
            current_color: "#000".to_string(),
            rng: OsRng::default(),
            current_inst: 0,
            width,
            height,
        }
    }

    pub fn run(&mut self, instructions: Vec<Instruction>) -> Vec<Tick> {
        let mut ticks = Vec::new();
        for inst in instructions {
            match self.tick(inst) {
                Ok(tick) => {
                    ticks.extend(tick.into_iter());
                }
                Err(message) => {
                    ticks.push(Tick::Invalid {
                        line: self.current_inst,
                        message,
                    });
                    break;
                }
            };
        }
        ticks
    }

    fn tick(&mut self, inst: Instruction) -> Result<Vec<Tick>, String> {
        macro_rules! extract_value {
            ($variables:expr, $value: ident) => {
                match $value {
                    Value::Variable(Variable(v)) => $variables
                        .get(&v)
                        .copied()
                        .ok_or_else(|| format!("Variable {v} referenced before first value set")),
                    Value::Constant(Constant(c)) => Ok(c),
                }
            };
        }

        macro_rules! _move {
            ($self:expr, $dir:expr, $val:expr) => {{
                $self.pos.x = $self
                    .pos
                    .x
                    .saturating_add(($dir.cos() * f32::from($val)).trunc() as i16)
                    .clamp(0, $self.width - 1);
                $self.pos.y = $self
                    .pos
                    .y
                    .saturating_add(($dir.sin() * f32::from($val)).trunc() as i16)
                    .clamp(0, $self.height - 1);
            }};
        }

        let old_pos = self.pos;
        let mut color_changed = false;
        let mut modified = Vec::new();
        match inst {
            Instruction::Forward(val) => {
                let val = extract_value!(self.variables, val)?;
                _move!(self, self.dir, val);

                if self.pen_down {
                    modified = line::lerp(self.pos, old_pos);
                }
            }
            Instruction::Backward(val) => {
                let val = extract_value!(self.variables, val)?;
                _move!(self, self.dir, -val);

                if self.pen_down {
                    modified = line::lerp(self.pos, old_pos);
                }
            }
            Instruction::Left(val) => {
                let val = extract_value!(self.variables, val)?;
                let dir = self.dir - degrees_to_radians(90);
                _move!(self, dir, val);

                if self.pen_down {
                    modified = line::lerp(self.pos, old_pos);
                }
            }
            Instruction::Right(val) => {
                let val = extract_value!(self.variables, val)?;
                let dir = self.dir + degrees_to_radians(90);
                _move!(self, dir, val);

                if self.pen_down {
                    modified = line::lerp(self.pos, old_pos);
                }
            }
            Instruction::Turn(val) => {
                let val = extract_value!(self.variables, val)?;
                self.dir += degrees_to_radians(val);
            }
            Instruction::Pendown => {
                self.pen_down = true;
            }
            Instruction::Penup => {
                self.pen_down = false;
            }
            Instruction::Add { var, val } => {
                let rhs = extract_value!(self.variables, val)?;
                match self.variables.get_mut(&var.0) {
                    Some(lhs) => {
                        *lhs += rhs;
                    }
                    None => return Err(format!("Variable {} does not exist", var.0)),
                }
            }
            Instruction::Sub { var, val } => {
                let rhs = extract_value!(self.variables, val)?;
                match self.variables.get_mut(&var.0) {
                    Some(lhs) => {
                        *lhs -= rhs;
                    }
                    None => return Err(format!("Variable {} does not exist", var.0)),
                }
            }
            Instruction::Mul { var, val } => {
                let rhs = extract_value!(self.variables, val)?;
                match self.variables.get_mut(&var.0) {
                    Some(lhs) => {
                        *lhs *= rhs;
                    }
                    None => return Err(format!("Variable {} does not exist", var.0)),
                }
            }
            Instruction::Div { var, val } => {
                let rhs = extract_value!(self.variables, val)?;
                if rhs == 0 {
                    return Err("Attempting to divide by zero".to_string());
                }
                match self.variables.get_mut(&var.0) {
                    Some(lhs) => {
                        *lhs /= rhs;
                    }
                    None => return Err(format!("Variable {} does not exist", var.0)),
                }
            }
            Instruction::Set { var, val } => {
                self.variables.insert(var.0, val.0);
            }
            Instruction::Random { var, start, end } => {
                self.variables
                    .insert(var.0, self.rng.gen_range(start.0..end.0));
            }
            Instruction::Color(c) => {
                self.current_color = c;
                color_changed = true;
            }
            Instruction::Repeat {
                amount,
                instructions,
            } => {
                let val = extract_value!(self.variables, amount)?;
                let mut ticks = Vec::new();
                self.current_inst += 1;
                'outer: for _ in 0..val {
                    let old_inst = self.current_inst;
                    let it = self.run(instructions.clone()).into_iter();
                    ticks.reserve_exact(it.size_hint().0);
                    for inst in it {
                        let invalid = matches!(inst, Tick::Invalid { .. });
                        ticks.push(inst);
                        if invalid {
                            break 'outer;
                        }
                    }
                    self.current_inst = old_inst;
                }
                return Ok(ticks);
            }
            Instruction::Empty => {
                self.current_inst += 1;
                return Ok(Vec::new());
            }
        }

        if self.pos == old_pos && !color_changed && modified.is_empty() {
            let tick = vec![Tick::Tick {
                line: self.current_inst,
            }];
            self.current_inst += 1;
            Ok(tick)
        } else {
            let tick = vec![Tick::Changed {
                line: self.current_inst,
                position: self.pos,
                color: self.current_color.clone(),
                modified,
            }];
            self.current_inst += 1;
            Ok(tick)
        }
    }
}
