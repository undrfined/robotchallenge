use lazy_static::lazy_static;
use rand::prelude::*;
use rand_chacha::ChaCha8Rng;
use std::collections::HashMap;
use std::os::raw::c_void;
use std::panic;
use std::sync::RwLock;

#[derive(Debug, Copy, Clone)]
#[repr(C)]
pub struct Robot {
    position: Hex,
    energy: u32,
    owner: u32,
}

#[derive(Debug)]
#[repr(C)]
pub struct EnergyStation {
    position: Hex,
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
    rounds_count: u32,
    players_count: u32,
    initial_robots_count: u32,
    start_energy: u32,
    rng_seed: u32,
    energy_stations_per_robot: u32,
    energy_loss_to_clone_robot: u32,
    max_robots_count: u32,
    energy_collect_distance: i32,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct PlayerActionMove {
    robot_id: usize,
    new_position: Hex,
    loss: u32,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct PlayerActionMoveFailed {
    robot_id: usize,
    new_position: Hex,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct CloneRobot {
    robot_id: usize,
    new_robot: Robot,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct CloneRobotFailed {
    robot_id: usize,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct CollectEnergy {
    robot_id: usize,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct CollectEnergyFailed {
    robot_id: usize,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct Timeout {
    robot_id: usize,
    is_timeout_too_much: bool,
}

#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub enum PlayerActions {
    PlayerActionMove(PlayerActionMove),
    PlayerActionMoveFailed(PlayerActionMoveFailed),
    CloneRobot(CloneRobot),
    CloneRobotFailed(CloneRobotFailed),
    CollectEnergy(CollectEnergy),
    CollectEnergyFailed(CollectEnergyFailed),
    Timeout(Timeout),
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

#[repr(C)]
pub struct PlayerActionsFFI {
    player_actions_len: usize,
    player_actions_values: *const PlayerActions,
}

#[derive(Debug, Copy, Clone)]
#[repr(C)]
pub struct Hex {
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

fn axial_distance(a: Hex, b: Hex) -> i32 {
    (((a.q - b.q).abs() + (a.q + a.r - b.q - b.r).abs() + (a.r - b.r).abs()) / 2)
        .try_into()
        .unwrap()
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

    fn is_empty(&self, q: i32, r: i32) -> bool {
        self.is_valid_position(q, r)
            && !self
                .robots
                .iter()
                .any(|robot| robot.position.q == q && robot.position.r == r)
            && !self
                .energy_stations
                .iter()
                .any(|e| e.position.q == q && e.position.r == r)
    }

    fn is_valid_position(&self, q: i32, r: i32) -> bool {
        axial_distance(Hex { q, r }, Hex { q: 0, r: 0 }) < self.config.width
    }

    fn calculate_loss(&self, q: i32, r: i32, new_q: i32, new_r: i32) -> u32 {
        return axial_distance(Hex { q, r }, Hex { q: new_q, r: new_r }) as u32;
    }

    fn get_robots_by_owner(&self, owner: u32) -> Vec<&Robot> {
        self.robots.iter().filter(|r| r.owner == owner).collect()
    }

    fn find_free_cell(&self, near_q: i32, near_r: i32) -> Option<Hex> {
        let mut distance = 1;
        while distance <= self.config.width {
            for dx in -distance..=distance {
                for dy in -distance..=distance {
                    let new_q = near_q + dx;
                    let new_r = near_r + dy;

                    if !self.is_empty(new_q, new_r)
                        || axial_distance(
                            Hex {
                                q: near_q,
                                r: near_r,
                            },
                            Hex { q: new_q, r: new_r },
                        ) > distance
                    {
                        continue;
                    }

                    return Some(Hex { q: new_q, r: new_r });
                }
            }

            distance += 1;
        }

        None
    }

    fn get_energy_stations_around(&mut self, q: i32, r: i32) -> Vec<&mut EnergyStation> {
        self.energy_stations
            .iter_mut()
            .filter(|e| {
                axial_distance(e.position, Hex { q, r }) <= self.config.energy_collect_distance
            })
            .collect()
    }

    fn add_robot(&mut self, owner: u32, q: i32, r: i32, energy: u32) -> usize {
        let new_robot = Robot {
            position: Hex { q, r },
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
            let q = self.rng.gen_range(-self.config.width..self.config.width);
            let r = self.rng.gen_range(-self.config.width..self.config.width);
            if self.is_empty(q, r) {
                self.energy_stations.push(EnergyStation {
                    position: Hex { q, r },
                    recovery_rate: self.rng.gen_range(1..10), // TODO calculate
                    energy: 200,                              // TODO calculate
                });
            }
        }

        for _ in 0..self.config.initial_robots_count {
            for owner in 0..self.config.players_count {
                loop {
                    let q = (&mut self.rng).gen_range(-self.config.width..self.config.width);
                    let r = (&mut self.rng).gen_range(-self.config.width..self.config.width);
                    if self.is_empty(q, r) {
                        self.add_robot(owner, q, r, self.config.start_energy);

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
    use crate::{MapFFI, PlayerActionsFFI};
    #[link(wasm_import_module = "robotchallenge")]
    extern "C" {
        pub fn do_step(
            owner: u32,
            robot_to_move_index: usize,
            map: *mut MapFFI,
            round_no: u32,
        ) -> u32;
        pub fn round_finished(map: *mut MapFFI, player_actions: *mut PlayerActionsFFI);
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

macro_rules! with_game_state_drop {
    ($name: ident, $lock: ident, $block: block) => {{
        let $lock = &mut *CURRENT_GAME_STATE.write().unwrap();
        let $name = $lock.as_mut().unwrap();
        $block
    }};
}

#[no_mangle]
pub fn do_round() {
    println!("[core] do_round");

    with_game_state_drop!(game_state, lock, {
        if (game_state.round >= game_state.config.rounds_count) {
            eprintln!("[core] do_round: game is over");
            return;
        }

        if (game_state.current_robot_index >= game_state.robots.len()) {
            println!("[core] do_round finished");
            game_state.current_robot_index = 0;
            game_state.round += 1;
            game_state.energy_stations.iter_mut().for_each(|e| {
                e.energy += e.recovery_rate;
            });
            unsafe {
                imports::round_finished(
                    get_map_ffi(game_state),
                    get_player_actions_ffi(game_state, &(game_state.round - 1)),
                );
            }
            return;
        }
        let robot = &game_state.robots[game_state.current_robot_index];
        // TODO we're too fast, drop lock here
        unsafe {
            imports::do_step(
                robot.owner,
                game_state.current_robot_index,
                get_map_ffi(game_state),
                game_state.round,
            )
        };
        // println!("[core] player_actions: {:#?}", game_state.player_actions);
    });

    println!("[core] do_round done");
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
pub fn done_step(is_timeout: bool, is_timeout_too_much: bool) {
    with_game_state!(game_state, {
        if (is_timeout && !game_state.current_robot_done_action) {
            add_player_action!(
                game_state,
                PlayerActions::Timeout(Timeout {
                    robot_id: game_state.current_robot_index,
                    is_timeout_too_much,
                })
            );
            println!("[core] done_step (timeout) {:?}", is_timeout_too_much);
        } else {
            println!("[core] done_step");
        }
        game_state.current_robot_index += 1;
        game_state.current_robot_done_action = false;
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

            return 0;
        });
    }
}

#[no_mangle]
pub fn clone_robot(new_bot_energy: u32) -> u32 {
    game_action!(game_state, current_robot, {
        let loss = game_state.config.energy_loss_to_clone_robot + new_bot_energy;

        if (new_bot_energy == 0) {
            add_player_action!(
                game_state,
                PlayerActions::CloneRobotFailed(CloneRobotFailed {
                    robot_id: game_state.current_robot_index,
                })
            );
            return 1;
        }

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
            game_state.find_free_cell(current_robot.position.q, current_robot.position.r);

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
            free_cell.q,
            free_cell.r,
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
            .get_energy_stations_around(current_robot.position.q, current_robot.position.r);

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

        if !energy_stations_around.iter().any(|e| e.energy > 0) {
            add_player_action!(
                game_state,
                PlayerActions::CollectEnergyFailed(CollectEnergyFailed {
                    robot_id: game_state.current_robot_index,
                })
            );
            println!("Robot tried to collect energy but there is no energy in energy stations");
            return 2;
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
pub fn move_robot(q: i32, r: i32) -> u32 {
    game_action!(game_state, current_robot, {
        let old_q = current_robot.position.q;
        let old_r = current_robot.position.r;
        let energy = current_robot.energy;

        if old_q == q && old_r == r {
            println!("Robot tried to move to the same cell");
            add_player_action!(
                game_state,
                PlayerActions::PlayerActionMoveFailed(PlayerActionMoveFailed {
                    robot_id: game_state.current_robot_index,
                    new_position: Hex { q, r },
                })
            );
            return 1;
        }

        if !game_state.is_empty(q, r) {
            add_player_action!(
                game_state,
                PlayerActions::PlayerActionMoveFailed(PlayerActionMoveFailed {
                    robot_id: game_state.current_robot_index,
                    new_position: Hex { q, r },
                })
            );
            println!("[core] move_robot cell is occupied {:?}", current_robot);
            return 1;
        }

        let loss = game_state.calculate_loss(old_q, old_r, q, r);

        if loss > energy {
            add_player_action!(
                game_state,
                PlayerActions::PlayerActionMoveFailed(PlayerActionMoveFailed {
                    robot_id: game_state.current_robot_index,
                    new_position: Hex { q, r },
                })
            );
            println!("[core] not enough energy {:?}", current_robot);
            return 2;
        }

        let current_robot = &mut game_state.robots[game_state.current_robot_index];
        current_robot.position.q = q;
        current_robot.position.r = r;
        current_robot.energy -= loss;

        add_player_action!(
            game_state,
            PlayerActions::PlayerActionMove(PlayerActionMove {
                robot_id: game_state.current_robot_index,
                new_position: Hex { q, r },
                loss,
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

#[no_mangle]
fn get_player_actions(round: u32) -> *mut PlayerActionsFFI {
    let guard = &mut *CURRENT_GAME_STATE.write().unwrap();
    let game_state = guard.as_ref().unwrap();

    get_player_actions_ffi(game_state, &round)
}

fn get_player_actions_ffi(game_state: &GameState, key: &u32) -> *mut PlayerActionsFFI {
    if (game_state.player_actions.get(key).is_none()) {
        return Box::into_raw(Box::new(PlayerActionsFFI {
            player_actions_len: 0,
            player_actions_values: std::ptr::null(),
        }));
    }

    let player_actions_ffi = PlayerActionsFFI {
        player_actions_len: game_state.player_actions.get(key).unwrap().len(),
        player_actions_values: game_state.player_actions.get(key).unwrap().as_ptr(),
    };

    Box::into_raw(Box::new(player_actions_ffi))
}
