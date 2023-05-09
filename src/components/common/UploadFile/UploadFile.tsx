import React, { useCallback, useRef, useState } from 'react';
import cn from 'classnames';
import styles from './UploadFile.module.scss';
import Button from '../Button/Button';

import verifyFile from '../../../helpers/verifyFile';
import useAppDispatch from '../../../hooks/useAppDispatch';
import type { AlgoVersion } from '../../../store/slices/algosSlice';
import { uploadAlgo } from '../../../store/slices/algosSlice';
import type { ApiAlgo } from '../../../api/types';
import Loader from '../Loader/Loader';
import Icon from '../Icon/Icon';

type OwnProps = {
  accept: string;
  file: {
    algo: ApiAlgo;
    algoVersion: AlgoVersion;
  } | undefined;
  setFile: (data: {
    algo: ApiAlgo;
    algoVersion: AlgoVersion;
  } | undefined) => void,
};

export default function UploadFile({
  accept,
  file,
  setFile,
}: OwnProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();

  const [isLoading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleUploadFile = useCallback(async (newFile?: Blob) => {
    try {
      setLoading(true);
      if (!newFile) throw new Error('No file selected');

      const f = await verifyFile(newFile);
      if (!f) throw new Error('Invalid file');

      const result = await dispatch(uploadAlgo(f.file!));
      if (!result.payload) throw new Error('Error uploading file');

      setFile(result.payload);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [dispatch, setFile]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(undefined);
    await handleUploadFile(e.currentTarget.files?.[0]);
  };

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragExit(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent) {
    setIsDragging(false);
    setError(undefined);

    e.preventDefault();

    if (e.dataTransfer.items) {
      await handleUploadFile([...e.dataTransfer.items].map((item) => {
        if (item.kind !== 'file') {
          return undefined;
        }

        const f = item.getAsFile();

        if (!f) {
          return undefined;
        }

        return f;
      }).filter(Boolean)[0]);
    } else {
      await handleUploadFile([...e.dataTransfer.files].filter(Boolean)[0]);
    }
  }

  const handleOpenPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div
      className={cn(
        styles.root,
        isDragging && styles.dragging,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragExit}
      onDrop={handleDrop}
    >
      <div className={styles.icon}>
        {isLoading ? <Loader /> : <Icon name="Upload" />}
      </div>

      <h5>Drag & Drop your .wasm file</h5>
      {file && (
        <p>
          {file.algo.name} ({file.algoVersion.version})
        </p>
      )}
      {error && (
        <p className={styles.error}>
          {error}
        </p>
      )}
      <input
        type="file"
        ref={inputRef}
        accept={accept}
        onChange={handleChange}
        disabled={isLoading}
        className={styles.input}
      />

      <Button buttonStyle="secondary" className={styles.button} onClick={handleOpenPicker} disabled={isLoading}>
        {isLoading ? 'Uploading...' : 'Upload'}
      </Button>
    </div>
  );
}
