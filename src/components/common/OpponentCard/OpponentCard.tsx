import React from 'react';
import Avatar from '../Avatar/Avatar';
import Version from '../../../assets/icons/Version.svg';
import Dropdown from '../../../assets/icons/Dropdown.svg';
import Code from '../../../assets/icons/Code.svg';
import Checkbox from '../Checkbox/Checkbox';
import { ApiAlgo } from '../../../api/types';

import styles from './OpponentCard.module.scss';
import useEnsureUser from '../../../hooks/useEnsureUser';
import { LANGUAGE_ICONS } from '../../../helpers/languageIcons';

type OwnProps = {
  algo: ApiAlgo & {
    isLoading?: boolean;
  };
  isSelected: boolean;
  onToggle: (checked: boolean, id: number) => void;
};

export default function OpponentCard({
  algo, isSelected, onToggle,
}: OwnProps) {
  const user = useEnsureUser(algo.userId);

  const Icon = LANGUAGE_ICONS[algo.language];

  return (
    <div className={styles.opponent}>
      <Avatar size="small" userId={algo.userId} />
      <div className={styles.opponentName}>{user?.name}</div>

      <div className={styles.dropdown}>
        <Version />
        <div className={styles.dropdownName}>
          Version
        </div>
        <div className={styles.dropdownContent}>
          {algo.version}
        </div>
        <Dropdown />
      </div>

      <div className={styles.dropdown}>
        <Code />
        <div className={styles.dropdownName}>
          Algorithm
        </div>
        <div className={styles.dropdownContent}>
          <Icon />
          {algo.name}
        </div>
        <Dropdown />
      </div>

      <Checkbox
        checked={!algo.isLoading && isSelected}
        className={styles.checkbox}
        index={algo.id}
        onToggle={onToggle}
        isLoading={algo.isLoading}
      />
    </div>
  );
}
