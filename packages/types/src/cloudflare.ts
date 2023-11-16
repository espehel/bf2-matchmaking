interface ResponseMessageObject {
  code: number;
  message: string;
}
export interface ResponseObject<T> {
  success: boolean;
  errors: ResponseMessageObject[];
  messages: ResponseMessageObject[];
  result: T;
}
