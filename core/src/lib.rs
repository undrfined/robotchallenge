use lazy_static::lazy_static;
use rand::prelude::*;
use rand_chacha::ChaCha8Rng;
use std::collections::HashMap;
use std::os::raw::c_void;
use std::panic;
use std::sync::RwLock;

#[derive(Debug, Copy, Clone)]
#[repr(C)]
pub struct Position {
    x: i32,
    y: i32,
}

#[derive(Debug, Copy, Clone)]
#[repr(C)]
pub struct Robot {
    position: Position,
    energy: u32,
    owner: u32,
}

#[derive(Debug)]
#[repr(C)]
pub struct EnergyStation {
    position: Position,
    recovery_rate: u32,
    energy: u32,
}

#[repr(C)]
pub struct MapFFI {
    robots_len: usize,
    robots: *const Robot,
    energy_stations_len: usize,
    energy_stations: *const EnergyStation,
}

#[repr(C)]
#[derive(Debug, Clone)]
pub struct GameConfig {
    width: i32,
    height: i32,
    rounds_count: u32,
    players_count: u32,
    initial_robots_count: u32,
    start_energy: u32,
    rng_seed: u32,
    energy_stations_per_robot: u32,
    energy_loss_to_clone_robot: u32,
    max_robots_count: u32,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
struct PlayerActionMove {
    robot_id: usize,
    new_position: Position,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
struct PlayerActionMoveFailed {
    robot_id: usize,
    new_position: Position,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
struct CloneRobot {
    robot_id: usize,
    new_robot: Robot,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
struct CloneRobotFailed {
    robot_id: usize,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
struct CollectEnergy {
    robot_id: usize,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
struct CollectEnergyFailed {
    robot_id: usize,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
enum PlayerActions {
    PlayerActionMove(PlayerActionMove),
    PlayerActionMoveFailed(PlayerActionMoveFailed),
    CloneRobot(CloneRobot),
    CloneRobotFailed(CloneRobotFailed),
    CollectEnergy(CollectEnergy),
    CollectEnergyFailed(CollectEnergyFailed),
}

#[derive(Debug)]
struct GameState {
    round: u32,
    robots: Vec<Robot>,
    energy_stations: Vec<EnergyStation>,
    config: GameConfig,
    rng: ChaCha8Rng,
    current_robot_index: usize,
    current_robot_done_action: bool,
    player_actions: HashMap<u32, Vec<PlayerActions>>,
}

#[derive(Copy, Clone)]
struct Hex {
    q: i32,
    r: i32,
}

fn console_error_panic_hook(info: &panic::PanicInfo) {
    eprintln!("{}", info);
}

const AXIAL_DIRECTION_VECTORS: [Hex; 6] = [
    Hex { q: 1, r: 0 },
    Hex { q: 1, r: -1 },
    Hex { q: 0, r: -1 },
    Hex { q: -1, r: 0 },
    Hex { q: -1, r: 1 },
    Hex { q: 0, r: 1 },
];

fn axial_direction(direction: usize) -> Hex {
    AXIAL_DIRECTION_VECTORS[direction]
}

fn axial_add(hex: Hex, vec: Hex) -> Hex {
    Hex {
        q: hex.q + vec.q,
        r: hex.r + vec.r,
    }
}

fn axial_neighbor(hex: Hex, direction: usize) -> Hex {
    axial_add(hex, axial_direction(direction))
}

// https://www.redblobgames.com/grids/hexagons/#conversions-offset
fn axial_to_evenq(hex: Hex) -> Position {
    let x = hex.q;
    let y = hex.r + (hex.q + (hex.q & 1)) / 2;
    Position { x, y }
}

fn evenq_to_axial(position: Position) -> Hex {
    let q = position.x;
    let r = position.y - (position.x + !(position.x & 1)) / 2;
    Hex { q, r }
}

fn axial_distance(a: Hex, b: Hex) -> i32 {
    (((a.q - b.q).abs() + (a.q + a.r - b.q - b.r).abs() + (a.r - b.r).abs()) / 2)
        .try_into()
        .unwrap()
}

fn evenq_distance(a: Position, b: Position) -> i32 {
    return axial_distance(evenq_to_axial(a), evenq_to_axial(b));
}

impl GameState {
    fn new(config: GameConfig) -> GameState {
        GameState {
            round: 0,
            robots: vec![],
            energy_stations: vec![],
            rng: ChaCha8Rng::seed_from_u64(config.rng_seed as u64),
            config: config,
            current_robot_index: 0,
            current_robot_done_action: false,
            player_actions: HashMap::new(),
        }
    }

    fn is_empty(&self, x: i32, y: i32) -> bool {
        self.is_valid_position(x, y)
            && !self
                .robots
                .iter()
                .any(|r| r.position.x == x && r.position.y == y)
            && !self
                .energy_stations
                .iter()
                .any(|e| e.position.x == x && e.position.y == y)
    }

    fn is_valid_position(&self, x: i32, y: i32) -> bool {
        x >= 0 && y >= 0 && x < self.config.width && y < self.config.height
    }

    fn calculate_loss(&self, x: i32, y: i32, new_x: i32, new_y: i32) -> u32 {
        return evenq_distance(Position { x, y }, Position { x: new_x, y: new_y }) as u32;
    }

    fn get_robots_by_owner(&self, owner: u32) -> Vec<&Robot> {
        self.robots.iter().filter(|r| r.owner == owner).collect()
    }

    fn find_free_cell(&self, near_x: i32, near_y: i32) -> Option<Position> {
        let mut distance = 1;
        while distance <= self.config.width.max(self.config.height) {
            for dx in -distance..=distance {
                for dy in -distance..=distance {
                    let new_x = near_x + dx;
                    let new_y = near_y + dy;

                    if evenq_distance(
                        Position {
                            x: near_x,
                            y: near_y,
                        },
                        Position { x: new_x, y: new_y },
                    ) > distance
                    {
                        continue;
                    }

                    return Some(Position { x: new_x, y: new_y });
                }
            }

            distance += 1;
        }

        None
    }

    fn get_energy_stations_around(&mut self, x: i32, y: i32) -> Vec<&mut EnergyStation> {
        self.energy_stations
            .iter_mut()
            .filter(|e| evenq_distance(e.position, Position { x, y }) <= 1)
            .collect()
    }

    fn add_robot(&mut self, owner: u32, x: i32, y: i32, energy: u32) -> usize {
        let new_robot = Robot {
            position: Position { x, y },
            energy,
            owner,
        };
        self.robots.push(new_robot);
        return self.robots.len() - 1;
    }

    fn generate(&mut self) {
        let energy_stations_count = self.config.initial_robots_count
            * self.config.players_count
            * self.config.energy_stations_per_robot;

        for _ in 0..energy_stations_count {
            let x = self.rng.gen_range(0..self.config.width);
            let y = self.rng.gen_range(0..self.config.height);
            if self.is_empty(x, y) {
                self.energy_stations.push(EnergyStation {
                    position: Position { x, y },
                    recovery_rate: self.rng.gen_range(1..10), // TODO calculate
                    energy: 200,                              // TODO calculate
                });
            }
        }

        for owner in 0..self.config.players_count {
            for _ in 0..self.config.initial_robots_count {
                loop {
                    let x = (&mut self.rng).gen_range(0..self.config.width);
                    let y = (&mut self.rng).gen_range(0..self.config.height);
                    if self.is_empty(x, y) {
                        self.add_robot(owner, x, y, self.config.start_energy);

                        // let distance: i32 = 3;
                        // for dx in -distance..=distance {
                        //     for dy in -distance..=distance {
                        //         let new_x = x + dx;
                        //         let new_y = y + dy;
                        //         println!("{} {}", new_x, new_y);
                        //         if evenq_distance(
                        //             Position { x, y },
                        //             Position { x: new_x, y: new_y },
                        //         ) > distance {
                        //             continue;
                        //         }
                        //
                        //         self.energy_stations.push(EnergyStation {
                        //             position: Position { x: new_x, y: new_y },
                        //             recovery_rate: self.rng.gen_range(1..10), // TODO calculate
                        //             energy: 200, // TODO calculate
                        //         });
                        //     }
                        // }
                        break;
                    }
                }
            }
        }
    }
}

lazy_static! {
    static ref CURRENT_GAME_STATE: RwLock<Option<GameState>> = RwLock::new(None);
}

mod imports {
    use crate::MapFFI;
    #[link(wasm_import_module = "robotchallenge")]
    extern "C" {
        pub fn do_step(owner: u32, robot_to_move_index: usize, map: *mut MapFFI) -> u32;
        pub fn update_map(map: *mut MapFFI);
        pub fn round_finished();
    }
}

#[no_mangle]
pub fn init_mod() {
    panic::set_hook(Box::new(console_error_panic_hook));
}

#[no_mangle]
pub fn init_game(ptr: *const GameConfig) {
    let config = unsafe { &*ptr };
    *CURRENT_GAME_STATE.write().unwrap() = Some(GameState::new((*config).clone()));
    let guard = &mut *CURRENT_GAME_STATE.write().unwrap();
    let game_state = guard.as_mut().unwrap();
    game_state.generate();
    // println!("{:#?}", game_state);
}

macro_rules! with_game_state {
    ($name: ident, $block: block) => {{
        let lol = &mut *CURRENT_GAME_STATE.write().unwrap();
        let $name = lol.as_mut().unwrap();
        $block
    }};
}

#[no_mangle]
pub fn do_round() {
    println!("[core] do_round");

    with_game_state!(game_state, {
        if (game_state.round >= game_state.config.rounds_count) {
            eprintln!("[core] do_round: game is over");
            return;
        }

        if (game_state.current_robot_index >= game_state.robots.len()) {
            println!("[core] do_round finished");
            game_state.current_robot_index = 0;
            game_state.round += 1;
            unsafe {
                imports::update_map(get_map_ffi(game_state));
                imports::round_finished();
            }
            return;
        }
        let robot = &game_state.robots[game_state.current_robot_index];
        unsafe {
            imports::do_step(
                robot.owner,
                game_state.current_robot_index,
                get_map_ffi(game_state),
            )
        };
        println!("[core] player_actions: {:#?}", game_state.player_actions);
    });

    println!("[core] do_round done");
}

#[no_mangle]
pub fn done_step() {
    with_game_state!(game_state, {
        game_state.current_robot_index += 1;
        game_state.current_robot_done_action = false;

        println!("[core] done_step");
    });

    do_round();
}

macro_rules! game_action {
    ($name: ident, $current_robot_name: ident, $block: block) => {
        with_game_state!($name, {
            if($name.current_robot_done_action) {
                println!("[core] Robot tried to do action twice");
                return 1;
            }

            let $current_robot_name = &$name.robots[$name.current_robot_index];

            $block

            $name.current_robot_done_action = true;

            unsafe {
                imports::update_map(get_map_ffi($name));
            }

            return 0;
        });
    }
}

macro_rules! add_player_action {
    ($game_state: ident, $action: expr) => {
        (*$game_state
            .player_actions
            .entry($game_state.round)
            .or_insert(Vec::new()))
        .push($action);
    };
}

#[no_mangle]
pub fn clone_robot(new_bot_energy: u32) -> u32 {
    game_action!(game_state, current_robot, {
        let loss = game_state.config.energy_loss_to_clone_robot + new_bot_energy;

        if (current_robot.energy < loss) {
            println!("Robot tried to clone with too much energy");
            add_player_action!(
                game_state,
                PlayerActions::CloneRobotFailed(CloneRobotFailed {
                    robot_id: game_state.current_robot_index,
                })
            );
            return 1;
        }

        if (game_state.get_robots_by_owner(current_robot.owner).len()
            >= game_state.config.max_robots_count.try_into().unwrap())
        {
            println!("Robot tried to clone too many robots");
            add_player_action!(
                game_state,
                PlayerActions::CloneRobotFailed(CloneRobotFailed {
                    robot_id: game_state.current_robot_index,
                })
            );
            return 2;
        }

        let free_cell =
            game_state.find_free_cell(current_robot.position.x, current_robot.position.y);

        if (free_cell.is_none()) {
            println!("Robot tried to clone but there is no free cell");
            add_player_action!(
                game_state,
                PlayerActions::CloneRobotFailed(CloneRobotFailed {
                    robot_id: game_state.current_robot_index,
                })
            );
            return 3;
        }

        let free_cell = free_cell.unwrap();

        let new_robot_index = game_state.add_robot(
            current_robot.owner,
            free_cell.x,
            free_cell.y,
            new_bot_energy,
        );

        let current_robot = &mut game_state.robots[game_state.current_robot_index];
        current_robot.energy -= loss;

        let new_robot = &game_state.robots[new_robot_index];
        let current_robot = &game_state.robots[game_state.current_robot_index];

        add_player_action!(
            game_state,
            PlayerActions::CloneRobot(CloneRobot {
                robot_id: game_state.current_robot_index,
                new_robot: new_robot.clone(),
            })
        );

        println!("[core] clone_robot {:?} {:?}", current_robot, new_robot);
    });
}

#[no_mangle]
pub fn collect_energy() -> u32 {
    game_action!(game_state, current_robot, {
        println!("[core] collect_energy {:?}", current_robot);

        let energy_stations_around = game_state
            .get_energy_stations_around(current_robot.position.x, current_robot.position.y);

        if energy_stations_around.is_empty() {
            add_player_action!(
                game_state,
                PlayerActions::CollectEnergyFailed(CollectEnergyFailed {
                    robot_id: game_state.current_robot_index,
                })
            );
            println!("Robot tried to collect energy but there is no energy station around");
            return 1;
        }

        let mut total_energy = 0;
        for energy_station in energy_stations_around {
            let energy = energy_station.energy;
            energy_station.energy = 0;
            total_energy += energy;
        }

        let current_robot = &mut game_state.robots[game_state.current_robot_index];
        current_robot.energy += total_energy;

        add_player_action!(
            game_state,
            PlayerActions::CollectEnergy(CollectEnergy {
                robot_id: game_state.current_robot_index,
            })
        );
    });
    return 0;
}

#[no_mangle]
pub fn move_robot(x: i32, y: i32) -> u32 {
    game_action!(game_state, current_robot, {
        let old_x = current_robot.position.x;
        let old_y = current_robot.position.y;
        let energy = current_robot.energy;

        if !game_state.is_empty(x, y) {
            add_player_action!(
                game_state,
                PlayerActions::PlayerActionMoveFailed(PlayerActionMoveFailed {
                    robot_id: game_state.current_robot_index,
                    new_position: Position { x, y },
                })
            );
            println!("[core] move_robot cell is occupied {:?}", current_robot);
            return 1;
        }

        let loss = game_state.calculate_loss(old_x, old_y, x, y);

        if loss > energy {
            add_player_action!(
                game_state,
                PlayerActions::PlayerActionMoveFailed(PlayerActionMoveFailed {
                    robot_id: game_state.current_robot_index,
                    new_position: Position { x, y },
                })
            );
            println!("[core] not enough energy {:?}", current_robot);
            return 2;
        }

        let current_robot = &mut game_state.robots[game_state.current_robot_index];
        current_robot.position.x = x;
        current_robot.position.y = y;
        current_robot.energy -= loss;

        add_player_action!(
            game_state,
            PlayerActions::PlayerActionMove(PlayerActionMove {
                robot_id: game_state.current_robot_index,
                new_position: Position { x, y },
            })
        );
    });
    return 1;
}

#[no_mangle]
pub fn allocate(length: usize) -> *mut c_void {
    let mut v = Vec::with_capacity(length);
    let ptr = v.as_mut_ptr();
    std::mem::forget(v);
    ptr
}

#[no_mangle]
pub fn deallocate(ptr: *mut c_void, length: usize) {
    unsafe {
        std::mem::drop(Vec::from_raw_parts(ptr, 0, length));
    }
}

#[no_mangle]
pub fn get_map() -> *mut MapFFI {
    let guard = &mut *CURRENT_GAME_STATE.write().unwrap();
    let game_state = guard.as_ref().unwrap();

    get_map_ffi(game_state)
}

fn get_map_ffi(game_state: &GameState) -> *mut MapFFI {
    let map_ffi = MapFFI {
        robots_len: game_state.robots.len(),
        robots: game_state.robots.as_ptr(),
        energy_stations_len: game_state.energy_stations.len(),
        energy_stations: game_state.energy_stations.as_ptr(),
    };

    Box::into_raw(Box::new(map_ffi))
}

#[repr(C)]
pub struct PlayerActionsFFI {
    player_actions_len: usize,
    player_actions_values: *const PlayerActions,
}

#[no_mangle]
fn test() -> *mut PlayerActionsFFI {
    let guard = &mut *CURRENT_GAME_STATE.write().unwrap();
    let game_state = guard.as_ref().unwrap();

    get_player_actions_ffi(game_state, &0)
}

fn get_player_actions_ffi(game_state: &GameState, key: &u32) -> *mut PlayerActionsFFI {
    let player_actions_ffi = PlayerActionsFFI {
        player_actions_len: game_state.player_actions.get(key).unwrap().len(),
        player_actions_values: game_state.player_actions.get(key).unwrap().as_ptr(),
    };

    Box::into_raw(Box::new(player_actions_ffi))
}
