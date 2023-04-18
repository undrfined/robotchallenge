import React from 'react';
import cn from 'classnames';
import styles from './Button.module.scss';
import Loader from '../Loader/Loader';

type OwnProps = {
  type?: 'submit' | 'reset' | 'button';
  buttonStyle?: 'primary' | 'secondary' | 'white';
  isLoading?: boolean;
} & React.HTMLProps<HTMLButtonElement>;

export default function Button({
  className,
  type = 'button',
  buttonStyle = 'primary',
  isLoading,
  children,
  ...otherProps
}: OwnProps) {
  return (
    <button
      {...otherProps}
      className={cn(styles.root, className, styles[buttonStyle])}
      type={type}
    >
      {children}
      {isLoading && <Loader />}
    </button>
  );
}
