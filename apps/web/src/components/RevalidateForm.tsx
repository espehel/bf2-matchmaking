import React from 'react';
import { revalidatePath } from 'next/cache';
import RefreshButton from '@/components/RefreshButton';

interface Props {
  path: string;
}

export default function RevalidateForm({ path }: Props) {
  async function revalidate() {
    'use server';
    revalidatePath(path);
  }

  return (
    <form action={revalidate}>
      <RefreshButton />
    </form>
  );
}
