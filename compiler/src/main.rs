use chumsky::Parser;
use color_eyre::Result;

use compiler::{parser, Interpreter, Position};

fn main() -> Result<()> {
    setup()?;
    tracing::debug!("Debug logging enabled.");

    let test_file = std::fs::read_to_string("test.ca")?;
    let instructions = parser().parse(&test_file).into_result().unwrap();
    println!("{:#?}", instructions);
    let mut interpreter = Interpreter::new(Position { x: 0, y: 0 });
    let ticks = interpreter.run(instructions);
    println!("{:#?}", ticks);

    Ok(())
}

fn setup() -> Result<()> {
    use tracing_subscriber::{fmt, prelude::*, EnvFilter};

    // Install error report and panic hooks
    color_eyre::install()?;

    // Default logging level
    if std::env::var("RUST_LOG").is_err() {
        std::env::set_var("RUST_LOG", "info");
    }

    let filter_layer = EnvFilter::try_from_default_env().or_else(|e| {
        eprintln!("Invalid EnvFilter env: {e}, defaulting to info");
        EnvFilter::try_new("info")
    })?;

    let time_format =
        time::format_description::parse("[hour]:[minute]:[second].[subsecond digits:5]")?;
    let fmt_layer = fmt::layer()
        .compact()
        .with_timer(fmt::time::UtcTime::new(time_format));

    tracing_subscriber::registry()
        .with(filter_layer)
        .with(fmt_layer)
        .with(tracing_error::ErrorLayer::default())
        .init();

    Ok(())
}
