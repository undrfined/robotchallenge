#include <string.h>
#include <mono-wasi/driver.h>
#include <mono/metadata/assembly.h>
#include <assert.h>

struct GameConfig {
    int width;
    unsigned int rounds_count;
    unsigned int players_count;
    unsigned int initial_robots_count;
    unsigned int start_energy;
    unsigned int rng_seed;
    unsigned int energy_stations_per_robot;
    unsigned int energy_loss_to_clone_robot;
    unsigned int max_robots_count;
    int energy_collect_distance;
};

struct Position {
    int q;
    int r;
};

struct Robot
{
    struct Position position;
    unsigned int energy;
    unsigned int owner;
};

struct EnergyStation
{
    struct Position position;
    unsigned int recovery_rate;
    unsigned int energy;
};

struct MapFFI
{
    int robots_len;
    struct Robot * robots;
    int energy_stations_len;
    struct EnergyStation * energy_stations;
};

struct LibInfo {
    char* name;
    char* language;
    char* version;
};


void load_runtime();
// This symbol's implementation is generated during the build
const char* dotnet_wasi_getentrypointassemblyname();

// These are generated by EmitWasmBundleObjectFile
const char* dotnet_wasi_getbundledfile(const char* name, int* out_length);
void dotnet_wasi_registerbundledassemblies();

// TODO: This should actually go in driver.c in the runtime
void mono_marshal_ilgen_init() {}

struct MonoLibInfo {
    MonoString* name;
    MonoString* version;
};

const char* entrypoint_name;
MonoMethod* method_InitGame;
MonoMethod* method_GetLibraryAuthor;
MonoMethod* method_DoStep;
MonoObject* interop_instance = 0;

int is_runtime_loaded = 0;

__attribute__((export_name("init_game")))
void init_game(struct GameConfig config, unsigned int owner) {
    load_runtime();

    if (!method_InitGame) {
        method_InitGame = lookup_dotnet_method(entrypoint_name, "csharp_robotchallenge", "Interop", "InitGame", -1);
        assert(method_InitGame);
    }

    void* method_params[] = { &config, &owner };
    MonoObject* exception;
    mono_wasm_invoke_method(method_InitGame, NULL, method_params, &exception);
    assert(!exception);
}

__attribute__((export_name("get_lib_info")))
struct LibInfo* get_lib_info() {
    load_runtime();

    if (!method_GetLibraryAuthor) {
        method_GetLibraryAuthor = lookup_dotnet_method(entrypoint_name, "csharp_robotchallenge", "Interop", "GetLibraryAuthor", -1);
        assert(method_GetLibraryAuthor);
    }

    void* method_params[] = {};
    MonoObject* exception;
    MonoObject *result = mono_wasm_invoke_method(method_GetLibraryAuthor, NULL, method_params, &exception);
    assert(!exception);

    struct MonoLibInfo lib_info = *(struct MonoLibInfo*) mono_object_unbox(result);

    struct LibInfo* info;
    info = (struct LibInfo*) malloc(sizeof(struct LibInfo));
    info->name = mono_string_to_utf8(lib_info.name);
    info->language = "csharp";
    info->version = mono_string_to_utf8(lib_info.version);
    return info;
}

__attribute__((export_name("do_step_ffi")))
void do_step_ffi(struct MapFFI map_ffi, int robot_to_move_index, unsigned int round_no) {
    load_runtime();

    if (!method_DoStep) {
        method_DoStep = lookup_dotnet_method(entrypoint_name, "csharp_robotchallenge", "Interop", "DoStep", -1);
        assert(method_DoStep);
    }

    void* method_params[] = { &map_ffi, &robot_to_move_index, &round_no };
    MonoObject* exception;
    mono_wasm_invoke_method(method_DoStep, NULL, method_params, &exception);
    assert(!exception);
}


__attribute__((__import_module__("robotchallenge"), import_name("clone_robot"))) extern
void clone_robot(unsigned int new_bot_energy);

__attribute__((__import_module__("robotchallenge"), import_name("collect_energy"))) extern
void collect_energy();

__attribute__((__import_module__("robotchallenge"), import_name("move_robot"))) extern
void move_robot(int q, int r);

void load_runtime() {
    if(!is_runtime_loaded) {
        is_runtime_loaded = 1;
        dotnet_wasi_registerbundledassemblies();

        mono_wasm_load_runtime("", 0);
        mono_add_internal_call("csharp_robotchallenge.Interop::CollectEnergy", collect_energy);
        mono_add_internal_call("csharp_robotchallenge.Interop::MoveRobot", move_robot);
        mono_add_internal_call("csharp_robotchallenge.Interop::CloneRobot", clone_robot);

        mono_wasm_assembly_load(dotnet_wasi_getentrypointassemblyname());
        entrypoint_name = "csharp_robotchallenge.dll";
    }
}

__attribute__((export_name("allocate")))
void* allocate(int length) {
    return malloc(length + 1);
}

__attribute__((export_name("deallocate")))
void deallocate(void* ptr, int length) {
    free(ptr);
}

int main(){
    return 0;
}