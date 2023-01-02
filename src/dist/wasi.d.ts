import { InitInput } from "./pkg/wasmer_wasi_js.js";
export { WASI, MemFS, JSVirtualFile, WasmerRuntimeError } from "./pkg/wasmer_wasi_js.js";
export declare const init: (input?: InitInput | Promise<InitInput>, force?: boolean) => Promise<void>;
