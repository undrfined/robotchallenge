using System.Runtime.InteropServices;

namespace csharp_robotchallenge.Utils;

[StructLayout(LayoutKind.Sequential)]
public struct LibInfo
{
    public string Name;
    public string Version;
}

[StructLayout(LayoutKind.Sequential)]
public struct Position {
    public readonly int Q;
    public readonly int R;
}

[StructLayout(LayoutKind.Sequential)]
public struct Robot
{
    public Position Position;
    public readonly uint Energy;
    public readonly uint Owner;
}

[StructLayout(LayoutKind.Sequential)]
public struct EnergyStation
{
    public Position Position;
    public readonly uint RecoveryRate;
    public readonly uint Energy;
}

[StructLayout(LayoutKind.Sequential)]
public unsafe struct MapFFI
{
    public readonly int RobotsLen;
    public readonly Robot* Robots;
    public readonly int EnergyStationsLen;
    public readonly EnergyStation* EnergyStations;
}

[StructLayout(LayoutKind.Sequential)]
public struct GameConfig {
    public readonly int Width;
    public readonly uint RoundsCount;
    public readonly uint PlayersCount;
    public readonly uint InitialRobotsCount;
    public readonly uint StartEnergy;
    public readonly uint RngSeed;
    public readonly uint EnergyStationsPerRobot;
    public readonly uint EnergyLossToCloneRobot;
    public readonly uint MaxRobotsCount;
    public readonly int EnergyCollectDistance;
}

public struct Map
{
    public EnergyStation[] EnergyStations;
    public Robot[] Robots;
}