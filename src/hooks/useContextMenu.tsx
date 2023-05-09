import React, { useState } from 'react';
import ContextMenu from '../components/common/ContextMenu/ContextMenu';
import { compact } from '../helpers/iteratees';
import type { IconType } from '../components/common/Icon/Icon';

export type ContextMenuItem = {
  label: string;
  icon: IconType;
  onClick: VoidFunction;
};

export default function useContextMenu(
  contextMenuItems: (ContextMenuItem | boolean | undefined)[], isDisabled?: boolean,
) {
  const [isOpen, setOpen] = useState(false);
  const [position, setPosition] = useState<[number, number]>([0, 0]);
  const compactContextMenuItems = compact(contextMenuItems);

  function openContextMenu(e: React.MouseEvent) {
    if (!compactContextMenuItems.length || isDisabled) return;
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
    isOpen: isOpen && !isDisabled,
    openContextMenu,
    closeContextMenu,
    contextMenu: !isDisabled ? contextMenu : undefined,
  };
}
