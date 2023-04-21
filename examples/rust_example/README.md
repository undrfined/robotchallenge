# Rust library for RobotChallenge

## Usage

Create a new project:
```bash
cargo new --lib algo_rust
cd algo_rust
```

Add the RobotChallenge library:
```bash
cargo add robotchallenge
```

Inside your `Cargo.toml` file, add the following section:
```toml
[lib]
crate-type=["cdylib"]
```

Create a folder named `.cargo` and add the following `config.toml` file inside it:
```toml
[build]
target = "wasm32-wasi"
```

Inside your `src/lib.cs` file, you can now implement the methods. Do not forget to use the `#[no_mangle]` attribute on your functions:
```rust
use robotchallenge::{move_robot, GameConfig, LibInfo, Map};

#[no_mangle]
pub fn get_library_info() -> LibInfo {
    return LibInfo {
        name: "My Rust Library".to_string(),
        version: "0.1.0".to_string(),
    };
}

#[no_mangle]
pub fn do_step(map: &Map, robot_to_move_index: usize, round_no: u32) {
    // Select your robot
    let robot = map.robots[robot_to_move_index];
    // Move robot 1 cell
    move_robot(robot.position.q + 1, robot.position.r);
}

#[no_mangle]
pub fn init(game_config: GameConfig, owner: u32) {
    // This method is called once upon game start
    println!("Init game: {:?}, owner: {:?}", game_config, owner);
}
```

Then, you can build your library:
```bash
cargo build
```

And finally, you can run your algorithm. You can find the .wasm file inside `target/wasm32-wasi/debug` folder.