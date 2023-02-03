import Lightning from '../assets/lottie/Lightning.json';
import Robot from '../assets/lottie/Robot.json';
import Diamond from '../assets/lottie/Diamond.json';
import Crown from '../assets/lottie/Crown.json';

const LOTTIE_ICONS = {
  Lightning,
  Robot,
  Diamond,
  Crown,
};

export type LottieIcon = keyof typeof LOTTIE_ICONS;

export default LOTTIE_ICONS;
