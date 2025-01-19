'use server';
import { AdminRolesRow } from '@bf2-matchmaking/types';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getValue } from '@bf2-matchmaking/utils/src/form-data';
import { toAsyncError } from '@bf2-matchmaking/utils';

export async function setAdminRole(
  role: keyof Omit<AdminRolesRow, 'created_at' & 'user_id' & 'updated_at'>,
  user: string,
  value: boolean
) {
  const res = await supabase(cookies).updateAdminRole(user, {
    [role]: value,
  });
  if (res.error) {
    return toAsyncError(res.error);
  }
  revalidatePath('/admin/roles');
  return { data: 'Admin role updated', error: null };
}

export async function deleteAdminRole(formData: FormData) {
  const user = getValue(formData, 'user_id');
  const res = await supabase(cookies).deleteAdminRole(user);
  if (res.error) {
    return toAsyncError(res.error);
  }
  revalidatePath('/admin/roles');
  return { data: 'Admin deleted', error: null };
}

export async function insertAdminRole(form: FormData) {
  const user = getValue(form, 'player[user_id]');
  const res = await supabase(cookies).insertAdminRole({ user_id: user });
  if (res.error) {
    return toAsyncError(res.error);
  }
  revalidatePath('/admin/roles');
  return { data: 'Admin created', error: null };
}