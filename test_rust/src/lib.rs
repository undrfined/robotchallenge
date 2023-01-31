use lazy_static::lazy_static;
use rand::prelude::*;
use rand_chacha::ChaCha8Rng;
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_void};
use std::panic;
use std::sync::Mutex;

#[derive(Debug)]
#[repr(C)]
pub struct Position {
    x: i32,
    y: i32,
}

#[derive(Debug)]
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

#[derive(Debug)]
pub struct Map {
    robots: Vec<Robot>,
    energy_stations: Vec<EnergyStation>,
}

#[repr(C)]
pub struct MapFFI {
    robots_len: usize,
    robots: *mut Robot,
    energy_stations_len: usize,
    energy_stations: *mut EnergyStation,
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
}

mod imports {
    #[link(wasm_import_module = "robotchallenge")]
    extern "C" {
        pub fn clone_robot(new_bot_energy: u32);
        pub fn collect_energy();
        pub fn move_robot(x: i32, y: i32) -> u32;
    }
}

pub fn ffi_to_map(map_ffi: &mut MapFFI) -> Map {
    unsafe {
        let map = Map {
            robots: Vec::<Robot>::from_raw_parts(
                map_ffi.robots,
                map_ffi.robots_len,
                map_ffi.robots_len,
            ),
            energy_stations: Vec::<EnergyStation>::from_raw_parts(
                map_ffi.energy_stations,
                map_ffi.energy_stations_len,
                map_ffi.energy_stations_len,
            ),
        };
        map
    }
}

pub fn clone_robot(new_bot_energy: u32) {
    unsafe {
        imports::clone_robot(new_bot_energy);
    }
}

pub fn collect_energy() {
    unsafe {
        imports::collect_energy();
    }
}

pub fn move_robot(x: i32, y: i32) -> Result<bool, String> {
    unsafe {
        match imports::move_robot(x, y) {
            0 => Ok(true),
            _ => Err("Move not possible".to_string()),
        }
    }
}

lazy_static! {
    static ref CURRENT_OWNER: Mutex<Option<u32>> = Mutex::new(None);
    static ref RANDOM: Mutex<ChaCha8Rng> = Mutex::new(ChaCha8Rng::from_entropy());
}

fn do_step(map: Map, robot_to_move_index: usize, round_no: u32) {
    let robot = &map.robots[robot_to_move_index];
    // println!("map: {:#?}", map);
    println!(
        "----=== round: {}/{} ===----",
        round_no, robot_to_move_index
    );
    println!("current bot {:#?}", robot);
    let owner = (*CURRENT_OWNER.lock().unwrap()).expect("Game hasn't started yet");
    // println!("my bots count: {:?}", &map.robots.iter().filter(|r| r.owner == (*CURRENT_OWNER.lock().unwrap()).expect("Game hasn't started yet")).count());
    if robot_to_move_index % 3 == 0 && owner == 0 {
        println!("Doing dumb shit!");
        loop {}
    }
    if robot_to_move_index % 2 == 0 {
        println!("Collecting!");
        collect_energy();
    } else {
        let rnd_x = (*RANDOM).lock().unwrap().gen_range(-3..3);
        let rnd_y = (*RANDOM).lock().unwrap().gen_range(-1..2);
        println!("Moving to: {}, {}", rnd_x, rnd_y);
        move_robot(robot.position.x + rnd_x, robot.position.y + rnd_y)
            .expect("Couldn't move robot");
    }
    // collect_energy();
    // clone_robot(robot.energy - 10);
}

fn console_error_panic_hook(info: &panic::PanicInfo) {
    eprintln!("{}", info);
}

#[no_mangle]
pub extern "C" fn init_game(game_config: GameConfig, owner: u32) {
    panic::set_hook(Box::new(console_error_panic_hook));
    *CURRENT_OWNER.lock().unwrap() = Some(owner);
}

#[no_mangle]
pub extern "C" fn do_step_ffi(map_ffi: *mut MapFFI, robot_to_move_index: usize, round_no: u32) {
    unsafe {
        let map = ffi_to_map(&mut *map_ffi);
        do_step(map, robot_to_move_index, round_no);
    }
}
// #[repr(C)]
// pub struct Hello {
//     name: *mut c_char,
//     lol: u8,
//     version: [u32; 3],
//     kek: f32,
//     robot: Robot,
//     test_length: usize,
//     test: *mut u32,
// }

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

// #[no_mangle]
// pub extern fn lol(ptr: *mut Hello) {
//     let hello = unsafe { &mut *ptr };
//     unsafe {
//         println!("{}", CString::from_raw(hello.name).to_string_lossy());
//     }
// }
//
// #[no_mangle]
// #[allow(dead_code)]
// pub extern fn test_string() -> *const c_char {
//     return CString::new("Hello world").unwrap().into_raw()
// }

// #[no_mangle]
// pub extern fn run_e() -> *mut Hello {
//     let name = CString::new("Jean-Luc Picard").unwrap();
//     let mut v: Vec<u32> = vec!(1, 2, 3, 4, 5, 6);
//
//     return Box::into_raw(
//         Box::new(
//             Hello {
//                 name: name.into_raw(),
//                 lol: 1,
//                 kek: 2.021f32,
//                 version: [6, 6, 6],
//                 robot: Robot { x: 1 },
//                 test_length: v.len(),
//                 test: v.as_mut_ptr(),
//             }
//         )
//     );
// }
