export type UUID = string;

export default function createUUID(): UUID {
  return crypto.randomUUID();
}
