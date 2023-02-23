using csharp_robotchallenge.Utils;

namespace csharp_robotchallenge;

public interface IAlgorithm
{
    public void DoStep(Map map, int robotToMoveIndex, uint roundNo);
    public void InitGame(GameConfig config, uint owner);
    public LibInfo GetLibraryAuthor();
}