import { ActionFail, ActionSuccess } from '@/lib/types/form';

export function toSuccess(message: string, redirect?: string): ActionSuccess {
  return { success: message, error: null, ok: true, redirect };
}
export function toFail(message: string): ActionFail {
  return { error: message, ok: false, success: null };
}
