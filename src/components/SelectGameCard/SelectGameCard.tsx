import styles from './SelectGameCard.module.scss';
import Button from "../common/Button/Button";
import Lottie from "lottie-react";
import Diamond from '../../assets/lottie/Diamond.json';

type OwnProps = {
    icon: any;
    title: string;
    description: string;
    maxPoints: number;
};

export default function SelectGameCard({
    icon,
    title,
    description,
    maxPoints,
}: OwnProps) {
    return <div className={styles.root}>
        <Lottie animationData={icon} loop={true} className={styles.animation}/>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.description}>{description}</div>
        <div className={styles.prize}>
            <Lottie animationData={Diamond} loop={true} className={styles.diamondAnimation}/>
            <div className={styles.prizeText}>Max Points: {maxPoints}</div>
        </div>
        <Button className={styles.button}>Upload solution</Button>
    </div>
}
