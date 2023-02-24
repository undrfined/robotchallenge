use std::ffi::CString;
use std::os::raw::{c_char, c_void};
use std::panic;

#[derive(Debug, Clone, Copy)]
#[repr(C)]
pub struct Position {
    pub q: i32,
    pub r: i32,
}

#[derive(Debug, Clone, Copy)]
#[repr(C)]
pub struct Robot {
    pub position: Position,
    pub energy: u32,
    pub owner: u32,
}

#[derive(Debug)]
#[repr(C)]
pub struct EnergyStation {
    pub position: Position,
    pub recovery_rate: u32,
    pub energy: u32,
}

#[derive(Debug)]
pub struct Map {
    pub robots: Vec<Robot>,
    pub energy_stations: Vec<EnergyStation>,
}

#[repr(C)]
struct MapFFI {
    robots_len: usize,
    robots: *mut Robot,
    energy_stations_len: usize,
    energy_stations: *mut EnergyStation,
}

#[repr(C)]
#[derive(Debug, Clone)]
pub struct GameConfig {
    pub width: i32,
    pub rounds_count: u32,
    pub players_count: u32,
    pub initial_robots_count: u32,
    pub start_energy: u32,
    pub rng_seed: u32,
    pub energy_stations_per_robot: u32,
    pub energy_loss_to_clone_robot: u32,
    pub max_robots_count: u32,
    pub energy_collect_distance: i32,
}

#[repr(C)]
struct InternalLibInfo {
    name: *mut c_char,
    language: *mut c_char,
    version: *mut c_char,
}

pub struct LibInfo {
    pub name: String,
    pub version: String,
}

mod lib {
    use crate::{GameConfig, LibInfo, Map};

    extern "C" {
        pub fn get_library_info() -> LibInfo;
        pub fn do_step(map: &Map, robot_to_move_index: usize, round_no: u32);
        pub fn init(game_config: GameConfig, owner: u32);
    }
}

mod imports {
    #[link(wasm_import_module = "robotchallenge")]
    extern "C" {
        pub fn clone_robot(new_bot_energy: u32);
        pub fn collect_energy();
        pub fn move_robot(x: i32, y: i32);
    }
}

fn ffi_to_map(map_ffi: &mut MapFFI) -> Map {
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

pub fn move_robot(q: i32, r: i32) {
    unsafe {
        imports::move_robot(q, r);
    }
}

fn console_error_panic_hook(info: &panic::PanicInfo) {
    eprintln!("{}", info);
}

#[no_mangle]
extern "C" fn init_game(game_config: GameConfig, owner: u32) {
    panic::set_hook(Box::new(console_error_panic_hook));
    unsafe {
        lib::init(game_config, owner);
    }
}

#[no_mangle]
extern "C" fn do_step_ffi(map_ffi: *mut MapFFI, robot_to_move_index: usize, round_no: u32) {
    unsafe {
        let map = ffi_to_map(&mut *map_ffi);
        lib::do_step(&map, robot_to_move_index, round_no);
    }
}

#[no_mangle]
extern "C" fn get_lib_info() -> *const InternalLibInfo {
    unsafe {
        let info = lib::get_library_info();

        return Box::into_raw(Box::new(InternalLibInfo {
            name: CString::new(info.name).unwrap().into_raw(),
            language: CString::new("rust").unwrap().into_raw(),
            version: CString::new(info.version).unwrap().into_raw(),
        }));
    }
}

#[no_mangle]
fn allocate(length: usize) -> *mut c_void {
    let mut v = Vec::with_capacity(length);
    let ptr = v.as_mut_ptr();
    std::mem::forget(v);
    ptr
}

#[no_mangle]
fn deallocate(ptr: *mut c_void, length: usize) {
    unsafe {
        drop(Vec::from_raw_parts(ptr, 0, length));
    }
}
