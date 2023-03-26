# Canvassembly

Providing a collaborative drawing space that combines programming and art.

This project was created exclusively for HooHacks 2023.

---

## Acknowlegements

Components of the source code derived from external sources are listed in sources.txt.

---

## Building and Running

Each of the following steps must be completed in order as dependencies exist between each step. The following tools/applications/programs are required:
* `angular-cli`
* `cargo`
* `node`
* `npm`
* `rustc`
* `wasm-pack`

Execute each of the following steps in a separate terminal or background the processes:

### Compiling the Compiler

`cd ./compiler/ && wasm-pack build`

### Starting the Backend

`cd ./backend/ && npm i && npm run start`

The backend will be available at `ws://localhost:3000`

### Starting the Frontend

`tar -xvf ./compiler/pkg.tar --directory ./frontend/src/assets`

`cd ./frontend/ && npm i && ng serve`

The frontend will be available at `http://localhost:4200`

# Assembly Syntax

The canvas is a 2-dimensional grid of size 1000x1000 pixels.
The top left corner is position `(0, 0)`, and the bottom right corner is position `(999, 999)`.
Your player starts at coordinate `(50, 50)`, facing east (positive x-direction).

You are carrying a magic pen capable of coloring squares with any color from your 24-bit imagination.
Anywhere you travel with your pen down, colors sprout from the Earth in their wonderful blocky goodness.

## Literals
- `<constant>`: A signed 16 bit integer.
- `<variable>`: A C-style identifier representing a `<constant>`.
- `<color>`: A hexadecimal RGB value, eg. `#FAFAFA`.

## Instructions
### General
- `begin <X: constant> <Y: constant>`: Start your journey at the coordinate `(X, Y)`. This instruction is optional, and can only appear once as the very first instruction (line 1).
- `set <A: variable> <B: constant>`: Assign `B` to `A`.
- `color <color>`: Magically transform the color of your pen.
- `random <V: variable> <S: constant> <E: constant>`: Generate a random number between `[S, E)` and assign to `V`.
- `repeat <N: constant | variable>:`: Start a new block to repeat a sequence of instructions exactly `N` times. The list is determined by the indentation of the first instruction after the line containing `repeat`.

### Movement
- `forward <N: constant | variable>`: Move forward by `N` number of pixels. Your direction is unchanged.
- `backward <N: constant | variable>`: Move backward by `N` number of pixels. Your direction is unchanged.
- `left <N: constant | variable>`: Move left by `N` number of pixels. Your direction is unchanged.
- `right <N: constant | variable>`: Move right by `N` number of pixels. Your direction is unchanged.
- `turn <N: constant | variable>`: Turn `N` degrees clockwise.

### Pen
- `pen_up`: Lift up your pen.
- `pen_down`: Put down your pen.

### Arithmetic
- `add <A: variable> <B: constant | variable>`: Assign the result of `A + B` to `A`. The value wraps on signed 16-bit overflow.
- `sub <A: variable> <B: constant | variable>`: Assign the result of `A - B` to `A`. The value wraps on signed 16-bit overflow.
- `mul <A: variable> <B: constant | variable>`: Assign the result of `A * B` to `A`. The value wraps on signed 16-bit overflow.
- `div <A: variable> <B: constant | variable>`: Assign the result of `A / B` to `A`. An error is returned if division-by-zero occurs.

