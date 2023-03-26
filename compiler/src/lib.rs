mod interpreter;
mod line;
mod parser;

pub use interpreter::Interpreter;
pub use parser::parser;

pub type Color = String;

#[derive(Clone, Debug)]
pub struct Variable(String);
#[derive(Clone, Copy, Debug)]
pub struct Constant(i16);

#[derive(Clone, Debug)]
pub enum Value {
    Variable(Variable),
    Constant(Constant),
}

#[derive(Clone, Debug)]
pub enum Instruction {
    Forward(Value),
    Backward(Value),
    Left(Value),
    Right(Value),
    Turn(Value),

    Pendown,
    Penup,

    Add {
        var: Variable,
        val: Value,
    },
    Sub {
        var: Variable,
        val: Value,
    },
    Mul {
        var: Variable,
        val: Value,
    },
    Div {
        var: Variable,
        val: Value,
    },

    Set {
        var: Variable,
        val: Constant,
    },

    Random {
        var: Variable,
        start: Constant,
        end: Constant,
    },
    Color(String),
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Position {
    pub x: i16,
    pub y: i16,
}

#[derive(Clone, Debug)]
pub enum Tick {
    Tick,
    Changed {
        position: Position,
        color: Color,
        modified: Vec<Position>,
    },
    Invalid {
        line: usize,
        message: String,
    },
}
