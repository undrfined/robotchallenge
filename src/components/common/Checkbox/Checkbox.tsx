import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import cn from 'classnames';
import styles from './Checkbox.module.scss';
import Check from '../../../assets/icons/Check.svg';

type OwnProps = {
  checked?: boolean;
  index: number;
  onToggle?: (checked: boolean, index: number) => void;
  isLoading?: boolean;
} & React.HTMLProps<HTMLInputElement>;

export default function Checkbox({
  checked,
  onToggle,
  className,
  index,
  isLoading,
  ...rest
}: OwnProps) {
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    onToggle?.(e.target.checked, index);
  }, [onToggle, index]);

  return (
  // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label className={cn(styles.root, checked && styles.checked, className)}>
      {isLoading && (
        <svg viewBox="0 0 24 24" className={styles.loader}>
          <rect
            x="1"
            y="1"
            width="22"
            height="22"
            strokeWidth="2"
            rx="3"
            ry="3"
            fill="none"
            className={styles.loaderRect}
          />
        </svg>
      )}
      <input type="checkbox" className={styles.input} checked={checked} {...rest} onChange={handleChange} />
      {checked && <Check className={styles.check} />}
    </label>
  );
}
