import { GamePosition } from '../types/gameTypes';

export function axialToPixel(hex: GamePosition, width: number) {
  const size = 50;
  const x = size * ((3.0 / 2) * hex.q);
  const y = size * ((Math.sqrt(3) / 2) * hex.q + Math.sqrt(3) * hex.r);

  return [x + ((3 / 2) * size) * (width - 1), y + Math.sqrt(3) * size * (width - 1)];
}
