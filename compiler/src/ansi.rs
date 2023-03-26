use std::collections::HashSet;

pub fn convert_ansi_to_html(input: &str) -> String {
    macro_rules! add {
        ($output: ident, $tok: literal) => {{
            $output.insert($tok);
        }};
    }

    let mut output = String::new();

    let mut current_span = String::new();
    let mut previous_colors: HashSet<&'static str> = HashSet::new();
    let mut colors: HashSet<&'static str> = HashSet::new();
    let mut input = input.chars();
    while let Some(c) = input.next() {
        tracing::debug!("c: {c}");
        if c == '' {
            if !current_span.is_empty() && colors.is_empty() {
                output.push_str(&current_span);
                current_span.clear();
            }
            let seq: String = input.by_ref().skip(1).take_while(|&c| c != 'm').collect();
            let seq: usize = seq.parse().unwrap();
            match seq {
                0 | 22 | 23 | 24 | 25 | 27 | 28 | 29 => {
                    // TODO: Handle reset sequences separately
                    if !current_span.is_empty() {
                        if previous_colors == colors && output.ends_with("</span>") {
                            output.truncate(output.len() - 7); // Length of ^
                            output.push_str(&current_span);
                            output.push_str("</span>");
                        } else {
                            output.push_str(r#"<span class=""#);
                            for s in colors.iter() {
                                output.push_str(s);
                                output.push(' ');
                            }
                            if output.as_bytes()[output.len() - 1] == b' ' {
                                output.pop();
                            }
                            output.push_str(r#"">"#);
                            output.push_str(&current_span);
                            output.push_str("</span>");
                        }
                        current_span.clear();
                    } else {
                        colors.clear();
                    }
                    previous_colors = colors;
                    colors = HashSet::new();
                }
                1 => add!(colors, "ansi-bold"),
                2 => add!(colors, "ansi-dim"),
                3 => add!(colors, "ansi-italic"),
                4 => add!(colors, "ansi-underline"),
                5 => add!(colors, "ansi-blink"),
                7 => add!(colors, "ansi-inverse"),
                8 => add!(colors, "ansi-hidden"),
                9 => add!(colors, "ansi-strikethrough"),
                30 => add!(colors, "ansi-black"),
                31 => add!(colors, "ansi-red"),
                32 => add!(colors, "ansi-green"),
                33 => add!(colors, "ansi-yellow"),
                34 => add!(colors, "ansi-blue"),
                35 => add!(colors, "ansi-magenta"),
                36 => add!(colors, "ansi-cyan"),
                37 => add!(colors, "ansi-white"),
                39 => add!(colors, "ansi-default"),
                40 => add!(colors, "ansi-bg-black"),
                41 => add!(colors, "ansi-bg-red"),
                42 => add!(colors, "ansi-bg-green"),
                43 => add!(colors, "ansi-bg-yellow"),
                44 => add!(colors, "ansi-bg-blue"),
                45 => add!(colors, "ansi-bg-magenta"),
                46 => add!(colors, "ansi-bg-cyan"),
                47 => add!(colors, "ansi-bg-white"),
                49 => add!(colors, "ansi-bg-default"),
                _ => unreachable!(),
            }
        } else {
            current_span.push(c);
        }
    }
    if !current_span.is_empty() && colors.is_empty() {
        output.push_str(&current_span);
    }

    output
}
