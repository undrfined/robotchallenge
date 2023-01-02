using System.Runtime.CompilerServices;


class Interop {
static int a = 1;
    public static string HandleIncomingRequest() {
        Console.WriteLine("TEST, hello! " + a++);
        Wow();
        while(true) {
            Console.WriteLine("TEST, hello! " + a++);
        }
        return "TEST";
    }

    [MethodImpl(MethodImplOptions.InternalCall)]
    public static extern void Wow();
}
