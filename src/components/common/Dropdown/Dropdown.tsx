import React, { useCallback, useEffect, useState } from 'react';
import cn from 'classnames';
import Lottie from 'lottie-react';
import styles from './Dropdown.module.scss';
import DropdownIcon from '../../../assets/icons/Dropdown.svg';
import type { LottieIcon } from '../../../helpers/lottieIcons';
import LOTTIE_ICONS from '../../../helpers/lottieIcons';

export type DropdownItem = {
  name: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  lottieIcon?: LottieIcon;
};

type OwnProps = {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  name: string;
  items: Record<string, DropdownItem> | undefined;
  selectedIndex: string | undefined;
  onSelect: (id: string) => void;
  className?: string;
};

export default function Dropdown({
  icon, name, selectedIndex, items, onSelect, className,
}: OwnProps) {
  const Icon = icon;

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

  const CurrentIcon = selectedIndex !== undefined && items && Object.keys(items) && items[selectedIndex]?.icon;
  return (
    <button className={cn(styles.root, className)} onClick={handleClick}>
      <Icon className={styles.leftIcon} />
      <div className={styles.dropdownName}>
        {name}
      </div>
      <div className={styles.dropdownContent}>
        {selectedIndex !== undefined && items && Object.keys(items) && items[selectedIndex] ? (
          <>
            {CurrentIcon && <CurrentIcon className={styles.dropdownContentIcon} />}
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
          const ItemIcon = items[key].icon;
          const lottieIcon = items[key].lottieIcon;
          return (
            <button
              key={key}
              className={cn(styles.item, key === selectedIndex && styles.selected)}
              onClick={() => onSelect(key)}
            >
              {ItemIcon && <ItemIcon className={styles.dropdownContentIcon} />}
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
      <DropdownIcon className={cn(styles.icon, isOpen && styles.flipped)} />
    </button>
  );
}
