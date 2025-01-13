import {
  FetchError,
  FetchErrorResponse,
  FetchResult,
  FetchSuccessResponse,
  isDefined,
} from '@bf2-matchmaking/types';
import { assertString } from './assert';

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
async function parseResponse<T>(
  res: Response
): Promise<FetchSuccessResponse<T> | FetchErrorResponse> {
  const { status, statusText } = res;

  if (!res.ok) {
    const error = await res.text();
    return { data: null, error: parseError(error), status, statusText };
  }

  if (status === 204 || status === 202) {
    return { data: {} as T, error: null, status, statusText };
  }

  try {
    const data = await res.json();
    return { data, error: null, status, statusText };
  } catch (e) {
    return { data: {} as T, error: null, status, statusText };
  }
}
export const getText = async (
  url: string,
  options: Partial<RequestInit> & { next?: any } = {}
): Promise<FetchResult<string>> => {
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
        const data = await res.text();
        return { data, error: null, status, statusText };
      } catch (e) {
        return { data: null, error: parseError(e), status, statusText };
      }
    } else {
      const error = await res.text();
      return { data: null, error: parseError(error), status, statusText };
    }
  } catch (error) {
    return { data: null, error: parseError(error), status: -1, statusText: '' };
  }
};
export const getJSON = async <T>(
  url: string,
  options: Partial<RequestInit> & { next?: any } = {}
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
    return parseResponse<T>(res);
  } catch (error) {
    return { data: null, error: parseError(error), status: -1, statusText: '' };
  }
};

export const deleteJSON = async <T>(
  url: string,
  options: Partial<RequestInit> & { next?: any } = {}
): Promise<FetchResult<T>> => {
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    const res = await fetch(url, {
      headers,
      method: 'DELETE',
      ...options,
    });
    return parseResponse<T>(res);
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
    ...options.headers,
  };
  const bodyInit = isDefined(body) ? JSON.stringify(body) : undefined;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      method: 'POST',
      body: bodyInit,
      cache: 'no-store',
    });

    return parseResponse<T>(res);
  } catch (error) {
    return { data: null, error: parseError(error), status: -1, statusText: '' };
  }
};

export const postWithApiKeyJSON = async <T>(
  url: string,
  body: unknown,
  options: Partial<RequestInit> = {}
): Promise<FetchSuccessResponse<T> | FetchErrorResponse> =>
  postJSON<T>(url, body, {
    ...options,
    headers: { ...options.headers, 'X-API-Key': process.env.API_KEY || '' },
  });

export const verify = <T>(result: FetchResult<T>): T => {
  if (result.error) {
    throw new Error(
      `Message: ${result.error.message}, status: ${result.status} ${result.statusText}`
    );
  }
  return result.data as T;
};
