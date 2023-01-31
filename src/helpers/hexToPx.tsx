import { GamePosition } from '../types/gameTypes';

export function axialToPixel(hex: GamePosition, width: number = 16) {
  const size = 50;
  const x = size * ((3.0 / 2) * hex.q);
  const y = size * ((Math.sqrt(3) / 2) * hex.q + Math.sqrt(3) * hex.r);
  const totalWidth = 100 * (5 / 6) * width * 2;
  const totalHeight = width * 2 * size * Math.sqrt(3) + size * 4;
  return [x + totalWidth / 2, y + totalHeight / 2];
}
