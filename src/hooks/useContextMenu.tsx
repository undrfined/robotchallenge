import React, { useState } from 'react';
import ContextMenu from '../components/common/ContextMenu/ContextMenu';
import { compact } from '../helpers/iteratees';

export type ContextMenuItem = {
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  onClick: VoidFunction;
};

export default function useContextMenu(contextMenuItems: (ContextMenuItem | boolean | undefined)[]) {
  const [isOpen, setOpen] = useState(false);
  const [position, setPosition] = useState<[number, number]>([0, 0]);
  const compactContextMenuItems = compact(contextMenuItems);

  function openContextMenu(e: React.MouseEvent) {
    if (!compactContextMenuItems.length) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    setPosition([e.clientX, e.clientY]);
  }

  const closeContextMenu = () => setOpen(false);

  const contextMenu = (
    <ContextMenu
      isOpen={isOpen}
      position={position}
      onClose={closeContextMenu}
      contextMenuItems={compactContextMenuItems}
    />
  );

  return {
    isOpen,
    openContextMenu,
    closeContextMenu,
    contextMenu,
  };
}
