import React, { useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import cn from 'classnames';
import styles from './ContextMenu.module.scss';
import getAdjustedBoundingClientRect from '../../../helpers/getAdjustedBoundingClientRect';
import type { ContextMenuItem } from '../../../hooks/useContextMenu';
import useResizeObserver from '../../../hooks/useResizeObserver';

type OwnProps = {
  isOpen: boolean;
  position: [number, number];
  onClose: VoidFunction;
  contextMenuItems: ContextMenuItem[]
};

const MIN_PADDING = 10;
const $contextMenuRoot = document.querySelector('#context-menu')! as HTMLElement;

export default function ContextMenu({
  isOpen,
  position,
  onClose,
  contextMenuItems,
}: OwnProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const windowSize = useResizeObserver($contextMenuRoot);

  const {
    x, y, shouldOpenToLeft, shouldOpenToTop,
  } = useMemo(() => {
    const $root = rootRef.current;
    if (!$root) return { x: 0, y: 0 };

    const { width, height } = getAdjustedBoundingClientRect($root);
    const [oldX, oldY] = position;
    const { width: windowWidth, height: windowHeight } = windowSize;

    const openToLeft = oldX + width >= windowWidth;
    const openToTop = oldY + height >= windowHeight;
    const newX = openToLeft ? windowWidth - width - MIN_PADDING : oldX;
    const newY = openToTop ? windowHeight - height - MIN_PADDING : oldY;

    return {
      x: newX, y: newY, shouldOpenToLeft: openToLeft, shouldOpenToTop: openToTop,
    };
  }, [position, windowSize]);

  return ReactDOM.createPortal(
    <div
      className={cn(
        styles.wrapper,
        isOpen && styles.wrapperOpen,
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          styles.root,
          isOpen && styles.open,
        )}
        ref={rootRef}
        style={{
          '--x': `${x}px`,
          '--y': `${y}px`,
          transformOrigin: `${shouldOpenToLeft ? 'right' : 'left'} ${shouldOpenToTop ? 'bottom' : 'top'}`,
        }}
      >
        {contextMenuItems.map(({ label, icon, onClick }) => {
          const Icon = icon;
          return (
            <div className={styles.item} key={label} onClick={onClick}>
              <div className={styles.itemIcon}>
                <Icon />
              </div>
              {label}
            </div>
          );
        })}
      </div>
    </div>,
    $contextMenuRoot,
  );
}
