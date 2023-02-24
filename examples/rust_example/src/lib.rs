use robotchallenge::{move_robot, GameConfig, LibInfo, Map};

#[no_mangle]
pub fn get_library_info() -> LibInfo {
    return LibInfo {
        name: "Rust example".to_string(),
        version: "0.1.0".to_string(),
    };
}

#[no_mangle]
pub fn do_step(map: &Map, robot_to_move_index: usize, round_no: u32) {
    let robot = map.robots[robot_to_move_index];
    move_robot(robot.position.q + 1, robot.position.r);
}

#[no_mangle]
pub fn init(game_config: GameConfig, owner: u32) {
    println!("Init game: {:?}, owner: {:?}", game_config, owner);
}
