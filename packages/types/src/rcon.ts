export interface RconResponse {
  readyState: string;
}
export interface RconSuccessResponse<T> extends RconResponse {
  data: T;
  error: null;
}

export interface RconErrorResponse extends RconResponse {
  error: { message: string };
  data: null;
}

export type RconResult<T = string> = RconSuccessResponse<T> | RconErrorResponse;
