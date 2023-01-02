export default function hexToPx(cx: number, cy: number) {
  const a = (2 * Math.PI) / 6;
  const r = 50;
  const x = r + cx * r * (1 + Math.cos(a));
  const y = r + cy * r * Math.sin(a) * 2 + (cx % 2 !== 0 ? r * Math.sin(a) : 0);
  return [x, y];
}
