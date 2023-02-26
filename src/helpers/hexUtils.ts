import type { GamePosition } from '../types/gameTypes';

export function axialDistance(a: GamePosition, b: GamePosition): number {
  return ((Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2);
}

export function axialAdd(a: GamePosition, b: GamePosition): GamePosition {
  return {
    q: a.q + b.q,
    r: a.r + b.r,
  };
}
