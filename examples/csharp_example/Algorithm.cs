using csharp_robotchallenge;
using csharp_robotchallenge.Utils;

namespace csharp_example;

public class Algorithm: IAlgorithm
{
    public void DoStep(Map map, int robotToMoveIndex, uint roundNo)
    {
        var robot = map.Robots[robotToMoveIndex];
        Console.WriteLine("LOL robot is " + robot.Owner);
        Interop.MoveRobot(robot.Position.Q, robot.Position.R + 1);
    }

    public void InitGame(GameConfig config, uint owner)
    {
        Console.WriteLine("INIT, width= " + config.Width + ", owner = " + owner);
    }

    public LibInfo GetLibraryAuthor()
    {
        return new LibInfo
        {
            Name = "My great other library",
            Version = "1.2.3"
        };
    }
}
