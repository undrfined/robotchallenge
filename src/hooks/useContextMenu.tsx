import React, { useState } from 'react';
import ContextMenu from '../components/common/ContextMenu/ContextMenu';

export type ContextMenuItem = {
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  onClick: VoidFunction;
};

export default function useContextMenu(contextMenuItems: ContextMenuItem[]) {
  const [isOpen, setOpen] = useState(false);
  const [position, setPosition] = useState<[number, number]>([0, 0]);

  const openContextMenu = (e: React.MouseEvent) => {
    setOpen(true);
    setPosition([e.clientX, e.clientY]);
  };

  const closeContextMenu = () => setOpen(false);

  const contextMenu = (
    <ContextMenu isOpen={isOpen} position={position} onClose={closeContextMenu} contextMenuItems={contextMenuItems} />
  );

  return {
    isOpen,
    openContextMenu,
    closeContextMenu,
    contextMenu,
  };
}
