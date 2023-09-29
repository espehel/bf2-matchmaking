import { isDefined } from '@bf2-matchmaking/types';

interface FetchResponse {
  status: number;
  statusText: string;
}
interface FetchSuccessResponse<T> extends FetchResponse {
  data: T;
  error: null;
}

export interface FetchError {
  message: string;
}
export interface FetchErrorResponse extends FetchResponse {
  error: FetchError;
  data: null;
}

export type FetchResult<T> = FetchSuccessResponse<T> | FetchErrorResponse;

const parseError = (error: any): FetchError => {
  if (!error) {
    return { message: 'Unkown fetch error' };
  }

  if (typeof error === 'string') {
    return { message: error };
  } else if (typeof error?.message === 'string') {
    return { message: error.message };
  }
  return { message: JSON.stringify(error) };
};
export const getJSON = async <T>(
  url: string,
  options: Partial<RequestInit> = {}
): Promise<FetchResult<T>> => {
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    const res = await fetch(url, {
      headers,
      method: 'GET',
      ...options,
    });
    const { status, statusText } = res;
    if (res.ok) {
      try {
        const data: T = await res.json();
        return { data, error: null, status, statusText };
      } catch (e) {
        return { data: {} as T, error: null, status, statusText };
      }
    } else {
      const error = await res.text();
      return { data: null, error: parseError(error), status, statusText };
    }
  } catch (error) {
    return { data: null, error: parseError(error), status: -1, statusText: '' };
  }
};

export const postJSON = async <T>(
  url: string,
  body: unknown,
  options: Partial<RequestInit> = {}
): Promise<FetchSuccessResponse<T> | FetchErrorResponse> => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const bodyInit = isDefined(body) ? JSON.stringify(body) : undefined;

  try {
    const res = await fetch(url, {
      headers,
      method: 'POST',
      body: bodyInit,
      cache: 'no-store',
    });
    const { status, statusText } = res;
    if (status === 204 || status === 202) {
      return { data: {} as T, error: null, status, statusText };
    } else if (res.ok) {
      const data: T = await res.json();
      return { data, error: null, status, statusText };
    } else {
      const error = await res.text();
      return { data: null, error: parseError(error), status, statusText };
    }
  } catch (error) {
    return { data: null, error: parseError(error), status: -1, statusText: '' };
  }
};

export const verify = <T>(result: FetchResult<T>): T => {
  if (result.error) {
    throw new Error(
      `Message: ${result.error.message}, status: ${result.status} ${result.statusText}`
    );
  }
  return result.data as T;
};
