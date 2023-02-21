export function compact<T extends any>(array: T[]) {
  return array.filter(Boolean) as Exclude<NonNullable<T>, boolean>[];
}
