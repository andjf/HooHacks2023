use crate::Position;

pub fn lerp(mut start: Position, mut end: Position) -> Vec<Position> {
    let dx = end.x - start.x;
    let dy = end.y - start.y;
    let n = dx.abs().max(dy.abs());

    let dx = f32::from(dx);
    let dy = f32::from(dy);
    let div_n = if n == 0 { 0.0 } else { 1.0 / f32::from(n) };
    let x_step = dx * div_n;
    let y_step = dy * div_n;

    let mut x: f32 = start.x.into();
    let mut y: f32 = start.y.into();

    (0..=n)
        .map(|_| {
            let pos = Position {
                x: x.round() as i16,
                y: y.round() as i16,
            };
            x += x_step;
            y += y_step;
            pos
        })
        .collect()
}
