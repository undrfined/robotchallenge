# C# library for RobotChallenge

## Usage

Create a new project inside a new folder:
```bash
dotnet new classlib
```

Add the RobotChallenge library:
```bash
dotnet add package csharp_robotchallenge
```

Inside your `Class1.cs` file, you can now inherit the IAlgorithm interface and implement the methods:
```csharp
using csharp_robotchallenge;
using csharp_robotchallenge.Utils;

public class Class1: IAlgorithm
{
    public void DoStep(Map map, int robotToMoveIndex, uint roundNo)
    {
        // Select your robot
        var robot = map.Robots[robotToMoveIndex];
        Console.WriteLine("My robot owner is " + robot.Owner);
        // Move robot 1 cell
        Interop.MoveRobot(robot.Position.Q, robot.Position.R + 1);
    }

    public void InitGame(GameConfig config, uint owner)
    {
        // This method is called once upon game start
        Console.WriteLine("Game initialized, width= " + config.Width + ", owner = " + owner);
    }

    public LibInfo GetLibraryAuthor()
    {
        return new LibInfo
        {
            Name = "My Library",
            Version = "1.0.0"
        };
    }
}
```

Then, you can build your library:
```bash
dotnet build
```

And finally, you can run your algorithm. You can find the .wasm file inside `bin/Debug/net7.0/` folder.