import styles from "./Label.module.scss";
import React from "react";
import LabelIcon from "./LabelIcon.svg";
import cn from "classnames";

type OwnProps = {
    className?: string;
    children?: React.ReactNode;
}

export default function Label({
    children,
    className,
}: OwnProps) {
    return <div className={cn(styles.root, className)}>
        <LabelIcon className={styles.labelIcon}/>
        <div className={styles.labelText}>{children}</div>
    </div>;
}
