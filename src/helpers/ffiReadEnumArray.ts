import { AbstractStructCtor, Pointer } from 'wasm-ffi';

export default function ffiReadEnumArray(length: number, ptr: Pointer<number>, structs: AbstractStructCtor<any>[]) {
  const lengths = structs.map((struct) => {
    const ptrEnum = new Pointer([struct, 1], undefined);
    return ptrEnum.type.width;
  });
  const maxLength = Math.max(...lengths);

  let ref = ptr.ref();
  return Array(length).fill(undefined).map(() => {
    const ptrNew = ref;
    const view = new DataView(ptr.view.buffer, ptrNew, ptr.type.width);
    const enumIndex = ptr.type.read(view, ptr.wrapper);

    const ptrEnum = new Pointer([structs[enumIndex], 1], undefined);
    const viewEnum = new DataView(ptr.view.buffer, ptrNew, ptrEnum.type.width);

    ref += maxLength;
    return ptrEnum.type.read(viewEnum, ptr.wrapper)[0];
  });
}
