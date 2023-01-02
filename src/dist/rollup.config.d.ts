declare function _default(commandLineArgs: any): {
    input: string;
    external: any[];
    output: ({
        banner: string;
        name: string;
        file: string;
        format: string;
        exports: string;
        globals: {};
    } | {
        banner: string;
        file: string;
        format: string;
        exports: string;
        globals: {};
        name?: undefined;
    })[];
    plugins: import("rollup").Plugin[];
}[];
export default _default;
