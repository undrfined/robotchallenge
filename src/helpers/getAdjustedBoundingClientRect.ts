export default function getAdjustedBoundingClientRect($el: HTMLElement) {
  let ta;
  const rect = $el.getBoundingClientRect();
  const style = getComputedStyle($el);
  const tx = style.transform;

  if (tx) {
    let sx; let sy; let dx; let
      dy;
    if (tx.startsWith('matrix3d(')) {
      ta = tx.slice(9, -1).split(/, /);
      sx = Number(ta[0]);
      sy = Number(ta[5]);
      dx = Number(ta[12]);
      dy = Number(ta[13]);
    } else if (tx.startsWith('matrix(')) {
      ta = tx.slice(7, -1).split(/, /);
      sx = Number(ta[0]);
      sy = Number(ta[3]);
      dx = Number(ta[4]);
      dy = Number(ta[5]);
    } else {
      return rect;
    }

    const to = style.transformOrigin;
    const x = rect.x - dx - (1 - sx) * parseFloat(to);
    const y = rect.y - dy - (1 - sy) * parseFloat(to.slice(to.indexOf(' ') + 1));
    const w = sx ? rect.width / sx : $el.offsetWidth;
    const h = sy ? rect.height / sy : $el.offsetHeight;
    return {
      x, y, width: w, height: h, top: y, right: x + w, bottom: y + h, left: x,
    };
  } else {
    return rect;
  }
}
