import React from 'react';
import cn from 'classnames';
import styles from './Button.module.scss';

type OwnProps = {
  type?: 'submit' | 'reset' | 'button';
  buttonStyle?: 'primary' | 'secondary';
} & React.HTMLProps<HTMLButtonElement>;

export default function Button({
  className,
  type = 'button',
  buttonStyle = 'primary',
  ...otherProps
}: OwnProps) {
  return (
    <button
      {...otherProps}
      className={cn(styles.root, className, styles[buttonStyle])}
      type={type}
    />
  );
}
