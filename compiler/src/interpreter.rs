use std::{collections::HashMap, f32::consts::PI};

use rand::{rngs::OsRng, Rng};

use crate::{line, Color, Constant, Instruction, Position, Tick, Value, Variable};

fn degrees_to_radians(degrees: i16) -> f32 {
    degrees as f32 / 180.0 * PI
}

fn radians_to_degrees(radians: f32) -> i16 {
    (radians / PI * 180.0) as i16
}

pub struct Interpreter {
    pos: Position,
    dir: f32,
    pen_down: bool,
    instructions: Vec<Instruction>,
    variables: HashMap<String, i16>,
    current_color: String,
    rng: OsRng,
}

impl Interpreter {
    pub fn new(starting_pos: Position) -> Self {
        Self {
            pos: starting_pos,
            dir: 0.0,
            pen_down: false,
            instructions: Vec::new(),
            variables: HashMap::new(),
            current_color: "#000".to_string(),
            rng: OsRng::default(),
        }
    }

    pub fn run(mut self, instructions: Vec<Instruction>) -> Vec<Tick> {
        instructions
            .into_iter()
            .enumerate()
            .map(|(line, inst)| match self.tick(inst) {
                Ok(tick) => tick,
                Err(message) => Tick::Invalid { line, message },
            })
            .collect()
    }

    fn tick(&mut self, inst: Instruction) -> Result<Tick, String> {
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
            ($pos:expr, $dir:expr, $val:expr) => {{
                $pos.x += ($dir.cos() * f32::from($val)).trunc() as i16;
                $pos.y += ($dir.sin() * f32::from($val)).trunc() as i16;
            }};
        }

        let old_pos = self.pos;
        let mut color_changed = false;
        let mut modified = Vec::new();
        match inst {
            Instruction::Forward(val) => {
                let val = extract_value!(self.variables, val)?;
                _move!(self.pos, self.dir, val);

                if self.pen_down {
                    modified = line::lerp(self.pos, old_pos);
                }
            }
            Instruction::Backward(val) => {
                let val = extract_value!(self.variables, val)?;
                _move!(self.pos, self.dir, -val);

                if self.pen_down {
                    modified = line::lerp(self.pos, old_pos);
                }
            }
            Instruction::Left(val) => {
                let val = extract_value!(self.variables, val)?;
                let dir = self.dir - degrees_to_radians(90);
                _move!(self.pos, dir, val);

                if self.pen_down {
                    modified = line::lerp(self.pos, old_pos);
                }
            }
            Instruction::Right(val) => {
                let val = extract_value!(self.variables, val)?;
                let dir = self.dir + degrees_to_radians(90);
                _move!(self.pos, dir, val);

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
        }

        if self.pos == old_pos && !color_changed && modified.is_empty() {
            Ok(Tick::Tick)
        } else {
            Ok(Tick::Changed {
                position: self.pos,
                color: self.current_color.clone(),
                modified,
            })
        }
    }
}
