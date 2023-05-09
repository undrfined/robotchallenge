import React, { useCallback, useEffect, useState } from 'react';
import cn from 'classnames';
import Lottie from 'lottie-react';
import styles from './Dropdown.module.scss';
import type { LottieIcon } from '../../../helpers/lottieIcons';
import LOTTIE_ICONS from '../../../helpers/lottieIcons';
import type { IconType } from '../Icon/Icon';
import Icon from '../Icon/Icon';

export type DropdownItem = {
  name: string;
  icon?: IconType;
  lottieIcon?: LottieIcon;
};

type OwnProps = {
  icon: IconType;
  name: string;
  items: Record<string, DropdownItem> | undefined;
  selectedIndex: string | undefined;
  onSelect: (id: string) => void;
  className?: string;
};

export default function Dropdown({
  icon, name, selectedIndex, items, onSelect, className,
}: OwnProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const handleDocumentClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  const currentLottieIcon = selectedIndex !== undefined && items
      && Object.keys(items) && items[selectedIndex]?.lottieIcon;

  useEffect(() => {
    if (!isOpen) return undefined;

    // Ignore propagated event when opening dropdown
    requestAnimationFrame(() => {
      document.addEventListener('click', handleDocumentClick, { once: true });
    });

    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [handleClick, handleDocumentClick, isOpen]);

  const currentIcon = selectedIndex !== undefined && items && Object.keys(items) && items[selectedIndex]?.icon;
  return (
    <button className={cn(styles.root, className)} onClick={handleClick}>
      <Icon name={icon} className={styles.leftIcon} />
      <div className={styles.dropdownName}>
        {name}
      </div>
      <div className={styles.dropdownContent}>
        {selectedIndex !== undefined && items && Object.keys(items) && items[selectedIndex] ? (
          <>
            {currentIcon && <Icon name={currentIcon} className={styles.dropdownContentIcon} />}
            {currentLottieIcon
                && (
                  <Lottie
                    animationData={LOTTIE_ICONS[currentLottieIcon]}
                    loop
                    className={styles.dropdownContentIcon}
                  />
                )}

            <span className={styles.dropdownContentText}>{items && items[selectedIndex].name}</span>
          </>
        ) : <span className={styles.dropdownContentText}>Loading...</span>}
      </div>
      <div className={cn(styles.moreContent, isOpen && styles.open)}>
        {items && Object.keys(items).map((key) => {
          const itemIcon = items[key].icon;
          const lottieIcon = items[key].lottieIcon;
          return (
            <button
              key={key}
              className={cn(styles.item, key === selectedIndex && styles.selected)}
              onClick={() => onSelect(key)}
            >
              {itemIcon && <Icon name={itemIcon} className={styles.dropdownContentIcon} />}
              {lottieIcon
                    && (
                      <Lottie
                        animationData={LOTTIE_ICONS[lottieIcon]}
                        loop
                        className={styles.dropdownContentIcon}
                      />
                    )}
              {items[key].name}
            </button>
          );
        })}
      </div>
      <Icon name="Dropdown" className={cn(styles.icon, isOpen && styles.flipped)} />
    </button>
  );
}
