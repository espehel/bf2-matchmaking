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

export interface DnsRecordWithoutPriority {
  type: 'A';
  name: string;
  content: string;
  ttl: number;
  proxied?: boolean | undefined;
}
