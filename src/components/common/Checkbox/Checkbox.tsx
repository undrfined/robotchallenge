import React, { ChangeEvent, useCallback } from 'react';
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
    <label className={cn(styles.root, checked && styles.checked, isLoading && styles.loading, className)}>
      <input type="checkbox" className={styles.input} checked={checked} {...rest} onChange={handleChange} />
      {checked && <Check className={styles.check} />}
    </label>
  );
}
