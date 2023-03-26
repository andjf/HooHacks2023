use ariadne::{Label, Report, ReportKind, Source};
use chumsky::Parser;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

pub mod ansi;
mod interpreter;
mod line;
mod parser;

pub use interpreter::Interpreter;
pub use parser::parser;

pub type Color = String;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Variable(String);

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct Constant(i16);

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum Value {
    Variable(Variable),
    Constant(Constant),
}

#[derive(Clone, Debug, Serialize, Deserialize)]
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

    Repeat {
        amount: Value,
        instructions: Vec<Instruction>,
    },

    Empty,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Position {
    pub x: i16,
    pub y: i16,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum Tick {
    Tick {
        line: usize,
    },
    Changed {
        line: usize,
        position: Position,
        color: Color,
        modified: Vec<Position>,
    },
    Invalid {
        line: usize,
        message: String,
    },
}

#[wasm_bindgen]
pub fn compile_and_execute(
    mut code: String,
    start_position: JsValue,
    width: i16,
    height: i16,
) -> Result<JsValue, JsValue> {
    // Hacky workaround for parser enforcing trailing newlines
    code.push('\n');

    let start_position: Position = serde_wasm_bindgen::from_value(start_position)?;
    let instructions = parser().parse(&code).into_result().map_err(|errs| {
        let mut err_message = Vec::new();
        errs.into_iter().for_each(|e| {
            Report::build(ReportKind::Error, (), e.span().start)
                .with_message(e.to_string())
                .with_label(Label::new(e.span().into_range()).with_message(e.reason().to_string()))
                .finish()
                .write(Source::from(&code), &mut err_message)
                .unwrap();
        });
        let err_message = String::from_utf8_lossy(&err_message).to_string();
        ansi::convert_ansi_to_html(&err_message)
    })?;

    let mut interpreter = Interpreter::new(start_position, width, height);
    let ticks = interpreter.run(instructions);
    Ok(serde_wasm_bindgen::to_value(&ticks)?)
}
