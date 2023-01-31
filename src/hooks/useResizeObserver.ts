import { useEffect, useRef, useState } from 'react';

export default function useResizeObserver($target: HTMLElement, onResize?: VoidFunction) {
  const resizeObserver = useRef<ResizeObserver | undefined>(undefined);
  const [size, setSize] = useState({});

  useEffect(() => {
    setSize({ width: $target.clientWidth, height: $target.clientHeight });
  }, [$target.clientHeight, $target.clientWidth]);

  if (!resizeObserver.current) {
    resizeObserver.current = new ResizeObserver(() => {
      setSize({ width: $target.clientWidth, height: $target.clientHeight });
      onResize?.();
    });
  }

  useEffect(() => {
    resizeObserver.current?.observe($target);

    return () => {
      resizeObserver.current?.unobserve($target);
    };
  }, [$target]);

  return size;
}
