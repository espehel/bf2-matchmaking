interface FetchSuccess<T> {
  data: T;
  error: null;
}

export interface FetchError {
  error: unknown;
  data: null;
}
export const getJSON = async <T>(url: string): Promise<FetchSuccess<T> | FetchError> => {
  const headers = {
    'Content-Type': 'application/json',
  };
  try {
    const res = await fetch(url, {
      headers,
      method: 'GET',
    });
    if (res.ok) {
      const data: T = await res.json();
      return { data, error: null };
    } else {
      const error = await res.text();
      return { data: null, error };
    }
  } catch (error) {
    return { data: null, error };
  }
};

export const postJSON = async <Result>(
  url: string,
  body: unknown
): Promise<FetchSuccess<Result> | FetchError> => {
  const headers = {
    'Content-Type': 'application/json',
  };
  try {
    const res = await fetch(url, {
      headers,
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data: Result = await res.json();
      return { data, error: null };
    } else {
      const error = await res.text();
      return { data: null, error };
    }
  } catch (error) {
    return { data: null, error };
  }
};
