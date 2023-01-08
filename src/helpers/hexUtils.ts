import { GamePosition } from '../types/gameTypes';

export type Hex = {
  q: number;
  r: number;
};

export function evenqToAxial(position: GamePosition): Hex {
  const q = position.x;
  // eslint-disable-next-line no-bitwise
  const r = position.y - (position.x + (!(position.x & 1) ? 1 : 0)) / 2;
  return { q, r };
}

export function axialDistance(a: Hex, b: Hex): number {
  return ((Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2);
}

export function evenqDistance(a: GamePosition, b: GamePosition): number {
  return axialDistance(evenqToAxial(a), evenqToAxial(b));
}
