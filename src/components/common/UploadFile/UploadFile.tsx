import React, { useCallback, useRef, useState } from 'react';
import cn from 'classnames';
import styles from './UploadFile.module.scss';
import Button from '../Button/Button';

import Upload from '../../../assets/icons/Upload.svg';
import verifyFile from '../../../helpers/verifyFile';
import type { GameLibraryInfo } from '../../../types/gameTypes';

type OwnProps = {
  accept: string;
  file: {
    file: Blob;
    info: GameLibraryInfo;
  } | undefined;
  setFile: (data: {
    file: Blob;
    info: GameLibraryInfo;
  } | undefined) => void,
};

export default function UploadFile({
  accept,
  file,
  setFile,
}: OwnProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(undefined);
      const f = await verifyFile(e.currentTarget.files?.[0]);
      if (!f) return;

      setFile(f);
    } catch (err) {
      setError((err as Error).message);
    }
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

    try {
      if (e.dataTransfer.items) {
        setFile(await verifyFile([...e.dataTransfer.items].map((item) => {
          if (item.kind !== 'file') {
            return undefined;
          }

          const f = item.getAsFile();

          if (!f) {
            return undefined;
          }

          return f;
        })[0]));
      } else {
        setFile(await verifyFile([...e.dataTransfer.files].map((f) => {
          return f;
        })[0]));
      }
    } catch (err) {
      setError((err as Error).message);
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
        <Upload />
      </div>

      <h5>Drag & Drop your solution</h5>
      {file && (
        <p>
          {file.info.name} ({file.info.version})
        </p>
      )}
      {error && (
        <p className={styles.error}>
          {error}
        </p>
      )}
      <input type="file" ref={inputRef} accept={accept} onChange={handleChange} className={styles.input} />

      <Button buttonStyle="secondary" className={styles.button} onClick={handleOpenPicker}>
        Upload
      </Button>
    </div>
  );
}
