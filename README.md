# Canvassembly

Providing a collaborative drawing space that combines programming and art.

This project was created exclusively for HooHacks 2023.

---

## Acknowlegements

Components of the source code derived from external sources are listed in sources.txt

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