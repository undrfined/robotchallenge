export * from "./pkg/wasmer_wasi_js";
import { InitInput } from "./pkg/wasmer_wasi_js";
export declare const init: (input?: InitInput | Promise<InitInput>, force?: boolean) => Promise<void>;
