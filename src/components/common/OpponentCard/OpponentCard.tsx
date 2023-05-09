import React, { useCallback, useEffect, useState } from 'react';
import Avatar from '../Avatar/Avatar';
import Checkbox from '../Checkbox/Checkbox';

import styles from './OpponentCard.module.scss';
import useEnsureUser from '../../../hooks/useEnsureUser';
import { LANGUAGES } from '../../../helpers/languages';
import Dropdown from '../Dropdown/Dropdown';
import useAppSelector from '../../../hooks/useAppSelector';
import { fetchAlgoVersions } from '../../../store/slices/algosSlice';
import useAppDispatch from '../../../hooks/useAppDispatch';
import type { ApiAlgoId, ApiAlgoVersionId } from '../../../api/types';

type OwnProps = {
  userId: string;
  selectedAlgos?: {
    algoId: ApiAlgoId;
    algoVersionId: ApiAlgoVersionId;
  }[];
  onSelectAlgoVersion: (isChecked: boolean, userId: string, algoId: ApiAlgoId, algoVersionId: ApiAlgoVersionId) => void;
};

export default function OpponentCard({
  userId, selectedAlgos, onSelectAlgoVersion,
}: OwnProps) {
  const user = useEnsureUser(userId);

  const dispatch = useAppDispatch();
  const algosByUser = useAppSelector((state) => state.algos.algos[userId]);
  const [selectedAlgoId, setSelectedAlgoId] = useState<ApiAlgoId>(Number(Object.keys(algosByUser)[0]));
  const selectedAlgo = algosByUser[selectedAlgoId];

  const versions = useAppSelector((state) => state.algos.algoVersions[selectedAlgo.id]);

  const [selectedVersionId, setSelectedVersionId] = useState<ApiAlgoVersionId | undefined>();
  const selectedVersion = selectedVersionId ? versions[selectedVersionId] : undefined;

  const isAlgoFromThisUserSelected = selectedAlgos?.some((q) => algosByUser[q.algoId]);
  const isAlgoSelected = selectedAlgos?.some((q) => q.algoId === selectedAlgo.id);
  const isVersionSelected = isAlgoSelected && selectedAlgos?.some((q) => q.algoVersionId === selectedVersionId);

  const handleSelectAlgoId = useCallback((value: string) => {
    setSelectedAlgoId(Number(value));
  }, []);
  const handleSelectVersionId = useCallback((value: string) => {
    const algoVersionId = Number(value);
    setSelectedVersionId(algoVersionId);
    onSelectAlgoVersion(true, userId, selectedAlgo.id, algoVersionId);
  }, [onSelectAlgoVersion, selectedAlgo.id, userId]);

  const handleToggleCheckbox = useCallback((isChecked: boolean) => {
    if (!selectedVersionId) return;
    onSelectAlgoVersion(isChecked, userId, selectedAlgo.id, selectedVersionId);
  }, [onSelectAlgoVersion, selectedAlgo.id, selectedVersionId, userId]);

  useEffect(() => {
    if (!selectedVersion) {
      dispatch(fetchAlgoVersions(selectedAlgo.id));
    }
  }, [selectedAlgo.id, dispatch, selectedVersion]);

  useEffect(() => {
    if (!selectedVersion && Object.values(versions).length > 0) {
      const [firstVersion] = Object.values(versions);
      setSelectedVersionId(firstVersion.id);
    }

    if (!isAlgoSelected && isAlgoFromThisUserSelected && !isVersionSelected && selectedVersionId) {
      onSelectAlgoVersion(true, userId, selectedAlgoId, selectedVersionId);
    }
  }, [
    isAlgoFromThisUserSelected, isAlgoSelected, isVersionSelected, onSelectAlgoVersion, selectedAlgo.id,
    selectedAlgoId, selectedVersion, selectedVersionId, versions, selectedAlgos, userId,
  ]);

  return (
    <div className={styles.opponent}>
      <div className={styles.playerInfo}>
        <Avatar size="small" userId={userId} />
        <div className={styles.opponentName}>{user?.name}</div>
      </div>

      <div className={styles.dropdowns}>
        <Dropdown
          icon="Code"
          className={styles.dropdown}
          name="Algorithm"
          items={Object.keys(algosByUser)
            .reduce((acc, algoId) => ({
              ...acc,
              [algoId]: {
                name: algosByUser[Number(algoId)].name,
                icon: LANGUAGES[algosByUser[Number(algoId)].language].icon,
              },
            }), {})}
          selectedIndex={selectedAlgo.id.toString()}
          onSelect={handleSelectAlgoId}
        />

        <Dropdown
          icon="Version"
          className={styles.dropdown}
          name="Version"
          items={versions && Object.values(versions).reduce((acc, version) => ({
            ...acc,
            [version.id]: {
              name: version.version,
            },
          }), {})}
          selectedIndex={selectedVersionId?.toString()}
          onSelect={handleSelectVersionId}
        />
      </div>

      <Checkbox
        checked={!selectedVersion?.isLoading && isAlgoSelected}
        className={styles.checkbox}
        index={selectedAlgo.id}
        onToggle={handleToggleCheckbox}
        isLoading={!selectedVersion || selectedVersion.isLoading}
      />
    </div>
  );
}
