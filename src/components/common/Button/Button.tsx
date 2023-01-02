import React from 'react';
import styles from './Button.module.scss';
import cn from "classnames";

type OwnProps = {
    type?: 'submit' | 'reset' | 'button';
} & React.HTMLProps<HTMLButtonElement>;

export default function Button({
    className,
    type = "button",
    ...otherProps
}: OwnProps) {
    return <button
        {...otherProps}
        className={cn(styles.root, className)}
        type={type}
    />
}
