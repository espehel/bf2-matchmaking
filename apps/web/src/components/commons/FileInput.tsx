'use client';
import { ChangeEventHandler, useCallback } from 'react';
import { assertObj } from '@bf2-matchmaking/utils';
import { AsyncFileReader } from '@/lib/files/AsyncFileReader';

interface Props {
  onFileChange: (text: string) => void;
}

export default function FileInput({ onFileChange }: Props) {
  const handleOnChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    async (event) => {
      const file = event.target.files?.item(0);
      assertObj(file, 'Failed to read file');

      const result = await AsyncFileReader.read(file);
      onFileChange(result);
    },
    []
  );
  return (
    <input
      type="file"
      className="file-input file-input-bordered file-input-secondary w-full max-w-xs"
      onChange={handleOnChange}
      multiple={false}
    />
  );
}
