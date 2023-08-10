import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

export const verifyResult = <T>({ data, error }: PostgrestResponse<T>) => {
  if (error) {
    throw error;
  }
  return data;
};

export const verifySingleResult = <T>({ data, error }: PostgrestSingleResponse<T>) => {
  if (error) {
    throw error;
  }
  return data;
};

export const hasError = (result: PostgrestSingleResponse<unknown>) =>
  Boolean(result.error);
