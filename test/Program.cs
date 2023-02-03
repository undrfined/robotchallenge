using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;

unsafe class Interop {
    static int a = 1;
    [StructLayout(LayoutKind.Sequential)]
    public struct LibInfo
    {
      public string Name;
      public string Language;
      public string Version;
    }
    
    [StructLayout(LayoutKind.Sequential)]
    public struct Position {
        public int q;
        public int r;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct Robot
    {
        public Position position;
        public uint energy;
        public uint owner;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct EnergyStation
    {
        public Position position;
        public uint recovery_rate;
        public uint energy;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct MapFFI
    {
        public int robots_len;
        public Robot* robots;
        public int energy_stations_len;
        public EnergyStation* energy_stations;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct GameConfig {
        public int width;
        public uint rounds_count;
        public uint players_count;
        public uint initial_robots_count;
        public uint start_energy;
        public uint rng_seed;
        public uint energy_stations_per_robot;
        public uint energy_loss_to_clone_robot;
        public uint max_robots_count;
        public int energy_collect_distance;
    }

    public static void DoStep(MapFFI map, int robotToMoveIndex, uint roundNo)
    {
        Console.WriteLine("Do step! " + robotToMoveIndex + ", " + roundNo);
        Console.WriteLine(map.energy_stations_len);
        var stations = Create<EnergyStation>(map.energy_stations, map.energy_stations_len);
        var robots = Create<Robot>(map.robots, map.robots_len);

        foreach (var robot in robots)
        {
            Console.WriteLine("Robot " + robot.owner + " (" + robot.position.q + "/" + robot.position.r + ") " + robot.energy);
        }

        var currentRobot = robots[robotToMoveIndex];

        MoveRobot(currentRobot.position.q + 1, currentRobot.position.r);
    }
    
    public unsafe static T[] Create<T>(void* source, int length)
    {
        var type = typeof(T);
        var sizeInBytes =  Marshal.SizeOf(typeof(T));

        T[] output = new T[length];

        if (type.IsPrimitive)
        {
            // Make sure the array won't be moved around by the GC 
            var handle = GCHandle.Alloc(output, GCHandleType.Pinned);

            var destination = (byte*)handle.AddrOfPinnedObject().ToPointer();
            var byteLength = length * sizeInBytes;

            // There are faster ways to do this, particularly by using wider types or by 
            // handling special lengths.
            for (int i = 0; i < byteLength; i++)
                destination[i] = ((byte*)source)[i];

            handle.Free();
        }
        else if (type.IsValueType)
        {
            if (!type.IsLayoutSequential && !type.IsExplicitLayout)
            {
                throw new InvalidOperationException(string.Format("{0} does not define a StructLayout attribute", type));
            }

            IntPtr sourcePtr = new IntPtr(source);

            for (int i = 0; i < length; i++)
            {
                IntPtr p = new IntPtr((byte*)source + i * sizeInBytes);

                output[i] = (T)System.Runtime.InteropServices.Marshal.PtrToStructure(p, typeof(T));
            }
        }
        else 
        {
            throw new InvalidOperationException(string.Format("{0} is not supported", type));
        }

        return output;
    }

    
    //GameConfig gameConfig, uint owner
    public static void InitGame(GameConfig config, uint owner) {
        Console.WriteLine("Init game, owner= " + owner);
        Console.WriteLine(config.players_count);
    }

    public static LibInfo GetLibraryAuthor() {
        Console.WriteLine("TEST, hello! " + a++);

        return new LibInfo {
            Name = "C# Library",
            Language = "csharp",
            Version = "1.0.5"
        };
    }

    [MethodImpl(MethodImplOptions.InternalCall)]
    public static extern void CloneRobot(uint newBotEnergy);
    [MethodImpl(MethodImplOptions.InternalCall)]
    public static extern void MoveRobot(int q, int r);
    [MethodImpl(MethodImplOptions.InternalCall)]
    public static extern void CollectEnergy();
}
