import React from 'react';
import cn from 'classnames';
import styles from './Button.module.scss';

type OwnProps = {
  type?: 'submit' | 'reset' | 'button';
} & React.HTMLProps<HTMLButtonElement>;

export default function Button({
  className,
  type = 'button',
  ...otherProps
}: OwnProps) {
  return (
    <button
      {...otherProps}
      className={cn(styles.root, className)}
      type={type}
    />
  );
}
