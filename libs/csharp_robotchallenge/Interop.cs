using System.Runtime.CompilerServices;
using csharp_robotchallenge.Utils;

namespace csharp_robotchallenge;

public class Interop
{
    private static IAlgorithm? _algorithm;
    
    public static void Register()
    {
        if (_algorithm != null) return;
        
        var type = typeof(IAlgorithm);
        var assemblies = AppDomain.CurrentDomain.GetAssemblies();
        var types = assemblies
            .SelectMany(s => s.GetTypes())
            .Where(p => type.IsAssignableFrom(p) && type != p)
            .ToArray();

        if (types.Length > 0)
        {
            _algorithm = (IAlgorithm?)Activator.CreateInstance(types[0]);
        }
        else
        {
            throw new Exception("No algorithms found.");
        }
    }
    
    public static unsafe void DoStep(MapFFI map, int robotToMoveIndex, uint roundNo)
    {
        Register();
        
        _algorithm!.DoStep(new Map
        {
            Robots = Utils.Utils.CreateArray<Robot>(map.Robots, map.RobotsLen),
            EnergyStations = Utils.Utils.CreateArray<EnergyStation>(map.EnergyStations, map.EnergyStationsLen)
        }, robotToMoveIndex, roundNo);
    }
    
    public static void InitGame(GameConfig config, uint owner) {
        Register();
        _algorithm!.InitGame(config, owner);
    }

    public static LibInfo GetLibraryAuthor() {
        Register();

        return _algorithm!.GetLibraryAuthor();
    }

    [MethodImpl(MethodImplOptions.InternalCall)]
    public static extern void CloneRobot(uint newBotEnergy);
    [MethodImpl(MethodImplOptions.InternalCall)]
    public static extern void MoveRobot(int q, int r);
    [MethodImpl(MethodImplOptions.InternalCall)]
    public static extern void CollectEnergy();
}
