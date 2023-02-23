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
    char* author;
    char* version;
};
