use chumsky::Parser;
use color_eyre::Result;

use compiler::{parser, Interpreter, Position};

fn main() -> Result<()> {
    setup()?;
    tracing::debug!("Debug logging enabled.");

    let code = std::fs::read_to_string("test.ca")?;
    let start_position = Position { x: 0, y: 0 };
    let instructions = parser().parse(&code).into_result().map_err(|errs| {
        let mut err_message = Vec::new();
        errs.into_iter().for_each(|e| {
            ariadne::Report::build(ariadne::ReportKind::Error, (), e.span().start)
                .with_message(e.to_string())
                .with_label(
                    ariadne::Label::new(e.span().into_range()).with_message(e.reason().to_string()),
                )
                .finish()
                .write(ariadne::Source::from(&code), &mut err_message)
                .unwrap();
        });
        let err_message = String::from_utf8_lossy(&err_message).to_string();
        let err_message = compiler::ansi::convert_ansi_to_html(&err_message);
        println!("{err_message}");
        color_eyre::eyre::eyre!(err_message)
    })?;

    let mut interpreter = Interpreter::new(start_position);
    let ticks = interpreter.run(instructions);
    tracing::info!("Ticks: {ticks:#?}");

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
