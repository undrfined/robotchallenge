declare module 'wasm-ffi' {
  export type AbstractStructType<T> = { [key in keyof T]: T[key] };

    type AbstractStructCtor<T> = (new (fields: { [key in keyof T]: T[key] }) => AbstractStructType<T>);

    export const Struct: {
      new<T>(fields: { [key: string]: any }): AbstractStructCtor<T>;
    };

    export type IWrapper<T extends Record<string, Function>> = { [key in keyof T]: T[key] } & {
      use(instance: WebAssembly.Instance): void;
      imports(imports: (wrap: (...args: any[]) => any) => any): any;
    };

    export const Wrapper: {
      new<T extends Record<string, Function>>(fields: any): IWrapper<T>;
    };

    // eslint-disable-next-line @typescript-eslint/naming-convention
    export class types {
      static pointer<T>(value: T): AbstractStructType<T>;
    }

    export class Pointer<T> {
      constructor(a: [AbstractStructCtor<T>, number], b: AbstractStructType<T>[] | undefined);
      ref(): number;
      wrapper: IWrapper;

      view: DataView;

      type: T & {
        width: number;
        read(view: DataView, wrapper: Wrapper): T;
      };
    }
}

declare module '*.wasm' {
  const src: string;
  export default src;
}

declare module '@wasmer/wasi' {
  export * from '@wasmer/wasi/wasi';
}
