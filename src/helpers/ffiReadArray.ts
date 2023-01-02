import { Pointer } from 'wasm-ffi';

export default function ffiReadArray<T>(length: number, ptr: Pointer<T>) {
  const ref = ptr.ref();
  return Array(length).fill(undefined).map((_, i) => {
    const ptrNew = ref + i * ptr.type.width;
    const view = new DataView(ptr.view.buffer, ptrNew, ptr.type.width);
    return ptr.type.read(view, ptr.wrapper);
  });
}
