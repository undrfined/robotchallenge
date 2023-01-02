#include <string.h>

int mono_wasm_add_assembly(const char* name, const unsigned char* data, unsigned int size);

extern const unsigned char test_dll_16D83255[];
extern const int test_dll_16D83255_len;
extern const unsigned char System_Console_dll_6D9CF9BA[];
extern const int System_Console_dll_6D9CF9BA_len;
extern const unsigned char System_Memory_dll_ED27588D[];
extern const int System_Memory_dll_ED27588D_len;
extern const unsigned char System_Private_CoreLib_dll_7C216BA8[];
extern const int System_Private_CoreLib_dll_7C216BA8_len;
extern const unsigned char System_Private_Runtime_InteropServices_JavaScript_dll_DD942E57[];
extern const int System_Private_Runtime_InteropServices_JavaScript_dll_DD942E57_len;
extern const unsigned char System_Threading_dll_E5090116[];
extern const int System_Threading_dll_E5090116_len;
extern const unsigned char System_Collections_dll_163EAE22[];
extern const int System_Collections_dll_163EAE22_len;
extern const unsigned char System_Runtime_InteropServices_dll_E321408F[];
extern const int System_Runtime_InteropServices_dll_E321408F_len;
extern const unsigned char System_Runtime_dll_DBB8B2EF[];
extern const int System_Runtime_dll_DBB8B2EF_len;
extern const unsigned char System_Private_Uri_dll_35D3D5E9[];
extern const int System_Private_Uri_dll_35D3D5E9_len;

const unsigned char* dotnet_wasi_getbundledfile(const char* name, int* out_length) {
  return NULL;
}

void dotnet_wasi_registerbundledassemblies() {
  mono_wasm_add_assembly ("test.dll", test_dll_16D83255, test_dll_16D83255_len);
  mono_wasm_add_assembly ("System.Console.dll", System_Console_dll_6D9CF9BA, System_Console_dll_6D9CF9BA_len);
  mono_wasm_add_assembly ("System.Memory.dll", System_Memory_dll_ED27588D, System_Memory_dll_ED27588D_len);
  mono_wasm_add_assembly ("System.Private.CoreLib.dll", System_Private_CoreLib_dll_7C216BA8, System_Private_CoreLib_dll_7C216BA8_len);
  mono_wasm_add_assembly ("System.Private.Runtime.InteropServices.JavaScript.dll", System_Private_Runtime_InteropServices_JavaScript_dll_DD942E57, System_Private_Runtime_InteropServices_JavaScript_dll_DD942E57_len);
  mono_wasm_add_assembly ("System.Threading.dll", System_Threading_dll_E5090116, System_Threading_dll_E5090116_len);
  mono_wasm_add_assembly ("System.Collections.dll", System_Collections_dll_163EAE22, System_Collections_dll_163EAE22_len);
  mono_wasm_add_assembly ("System.Runtime.InteropServices.dll", System_Runtime_InteropServices_dll_E321408F, System_Runtime_InteropServices_dll_E321408F_len);
  mono_wasm_add_assembly ("System.Runtime.dll", System_Runtime_dll_DBB8B2EF, System_Runtime_dll_DBB8B2EF_len);
  mono_wasm_add_assembly ("System.Private.Uri.dll", System_Private_Uri_dll_35D3D5E9, System_Private_Uri_dll_35D3D5E9_len);
}

