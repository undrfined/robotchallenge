import React, { useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import styles from './AnimatedText.module.scss';

type OwnProps = {
  text: string;
  postfix?: string;
  shouldHidePostfix?: boolean;
  delay?: number;
  containerType: 'div' | 'span' | 'h1' | 'p';
};

export default function AnimatedText({
  containerType,
  postfix = '...\\\\\\',
  shouldHidePostfix = true,
  delay = 500,
  text,
}: OwnProps) {
  const intervalRef = useRef<NodeJS.Timeout>();
  const [actualText, setActualText] = useState<string>('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setActualText((prevText) => {
          if (prevText === text) {
            clearInterval(intervalRef.current);
            return prevText;
          }

          return text.slice(0, prevText.length + 1);
        });
      }, 25);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalRef.current);
    };
  }, [delay, text]);

  const ContainerType = containerType;
  return (
    <ContainerType>
      {actualText}
      {(!shouldHidePostfix || actualText !== text)
          && <span className={cn(actualText !== text && styles.postfix)}>{postfix}</span>}
    </ContainerType>
  );
}
