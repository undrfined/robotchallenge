import ReactDOM from 'react-dom';
import React from 'react';

import cn from 'classnames';
import styles from './Modal.module.scss';
import Close from '../../../assets/icons/Close.svg';

const $modalRoot = document.querySelector('#modal')! as HTMLElement;

type OwnProps = {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
};
export default function Modal({
  isOpen, children, className,
}: OwnProps) {
  return ReactDOM.createPortal(
    <div className={cn(styles.root, isOpen && styles.open)}>
      <div className={styles.modalContent}>
        <div className={cn(styles.content, className)}>
          {children}
          <Close className={styles.closeButton} />
        </div>
      </div>
    </div>,
    $modalRoot,
  );
}
