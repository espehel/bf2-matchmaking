export interface FetchResponse {
  status: number;
  statusText: string;
}
export interface FetchSuccessResponse<T> extends FetchResponse {
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
