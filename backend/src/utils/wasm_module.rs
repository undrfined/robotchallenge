extern crate wasmer_types;

use serde::{Deserialize, Serialize};
use wasmer::{
    imports, AsStoreRef, FromToNativeWasmType, Function, Instance, Module, Store, TypedFunction,
    WasmPtr,
};
use wasmer_derive::ValueType;
use wasmer_wasi::WasiState;

#[derive(Debug, Copy, Clone, PartialEq, Eq, ValueType)]
#[repr(C)]
pub struct InternalLibInfo {
    pub name: WasmPtr<u8>,
    pub language: WasmPtr<u8>,
    pub version: WasmPtr<u8>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LibInfo {
    pub name: String,
    pub language: String,
    pub version: String,
}

pub fn get_lib_info(data: &Vec<u8>) -> Result<LibInfo, ()> {
    let mut store = Store::default();
    let module = Module::new(&store, data).unwrap();
    let wasi_env = WasiState::new("robotchallenge")
        .finalize(&mut store)
        .unwrap();

    let mut import_object = imports! {
        "robotchallenge" => {
            "move_robot" => Function::new_typed(&mut store, move |q: i32, r: i32| {
                println!("move_robot({}, {})", q, r);
            }),
            "collect_energy" => Function::new_typed(&mut store, move || {
                println!("collect_energy()");
            }),
            "clone_robot" => Function::new_typed(&mut store, move |new_bot_energy: u32| {
                println!("clone_robot({})", new_bot_energy);
            }),
        }
    };
    let wasi_imports = wasi_env.import_object(&mut store, &module).unwrap();
    import_object.extend(wasi_imports.into_iter());

    let instance = Instance::new(&mut store, &module, &import_object).unwrap();

    let memory = instance.exports.get_memory("memory").unwrap();
    wasi_env.data_mut(&mut store).set_memory(memory.clone());

    let get_lib_info = instance.exports.get_function("get_lib_info").unwrap();
    let get_lib_info_typed = get_lib_info
        .typed::<(), WasmPtr<InternalLibInfo>>(&mut store)
        .unwrap();
    let result = get_lib_info_typed.call(&mut store).unwrap();
    let internal_lib_info = result.read(&memory.view(&mut store)).unwrap();

    Ok(LibInfo {
        name: internal_lib_info
            .name
            .read_utf8_string_with_nul(&memory.view(&mut store))
            .unwrap(),
        version: internal_lib_info
            .version
            .read_utf8_string_with_nul(&memory.view(&mut store))
            .unwrap(),
        language: internal_lib_info
            .language
            .read_utf8_string_with_nul(&memory.view(&mut store))
            .unwrap(),
    })
}
