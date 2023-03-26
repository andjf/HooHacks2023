use chumsky::prelude::*;

use crate::{Constant, Instruction, Value, Variable};

pub fn parser<'input>(
) -> impl Parser<'input, &'input str, Vec<Instruction>, extra::Err<Rich<'input, char>>> {
    let variable = text::ident().map(|s: &str| Variable(s.to_string()));
    let negative_integer = just("-")
        .then(text::int(10))
        .slice()
        .try_map(|s: &str, span| {
            s.parse()
                .map_err(|e| Rich::custom(span, format!("Invalid negative constant: {e}")))
        });
    let positive_integer = text::int(10).slice().try_map(|s: &str, span| {
        s.parse()
            .map_err(|e| Rich::custom(span, format!("Invalid positive constant: {e}")))
    });
    let constant = choice((negative_integer, positive_integer)).map(Constant);
    let value = choice((variable.map(Value::Variable), constant.map(Value::Constant)));

    macro_rules! movement {
        ($op: literal, $variant:ident) => {
            just($op)
                .ignore_then(text::inline_whitespace())
                .ignore_then(value)
                .map(Instruction::$variant)
        };
    }
    let forward = movement!("forward", Forward);
    let backward = movement!("backward", Backward);
    let left = movement!("left", Left);
    let right = movement!("right", Right);
    let turn = movement!("turn", Turn);

    let pendown = just("pendown").to(Instruction::Pendown);
    let penup = just("penup").to(Instruction::Pendown);

    macro_rules! operator {
        ($op: literal, $variant:ident) => {
            just($op)
                .ignore_then(text::inline_whitespace())
                .ignore_then(variable)
                .then_ignore(text::inline_whitespace())
                .then(value)
                .map(|(var, val)| Instruction::$variant { var, val })
        };
    }
    let add = operator!("add", Add);
    let sub = operator!("sub", Sub);
    let mul = operator!("mul", Mul);
    let div = operator!("div", Div);

    let set = just("set")
        .ignore_then(text::inline_whitespace())
        .ignore_then(variable)
        .then_ignore(text::inline_whitespace())
        .then(constant)
        .map(|(var, val)| Instruction::Set { var, val });

    let random = just("random")
        .ignore_then(text::inline_whitespace())
        .ignore_then(variable)
        .then_ignore(text::inline_whitespace())
        .then(constant)
        .then_ignore(text::inline_whitespace())
        .then(constant)
        .map(|((var, start), end)| Instruction::Random { var, start, end });

    let hex = any().filter(char::is_ascii_hexdigit).repeated();
    let color_hex = just("#").ignore_then(choice((
        hex.exactly(6).collect::<String>(),
        hex.exactly(3).collect::<String>(),
    )));
    let color = just("color")
        .ignore_then(text::inline_whitespace())
        .ignore_then(color_hex)
        .map(Instruction::Color);

    let empty = text::inline_whitespace()
        .ignore_then(text::newline())
        .ignored()
        .to(Instruction::Empty);

    let instruction = choice((
        forward, backward, left, right, turn, pendown, penup, add, sub, mul, div, set, random,
        color,
    ))
    .then_ignore(text::newline());

    let block = recursive(|block| {
        let indent = just(' ')
            .repeated()
            .configure(|cfg, parent_indent| cfg.exactly(*parent_indent));

        let repeat = just("repeat")
            .ignore_then(text::inline_whitespace())
            .ignore_then(value)
            .then_ignore(text::inline_whitespace())
            .then_ignore(just(":"))
            .then_ignore(text::newline())
            .then(block)
            .map(|(amount, instructions)| Instruction::Repeat {
                amount,
                instructions,
            });
        let statement = choice((instruction, empty, repeat));
        text::whitespace()
            .count()
            .then_with_ctx(statement.separated_by(indent).collect())
    });

    block.with_ctx(0)
}
