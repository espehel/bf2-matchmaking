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

export interface DnsRecord {
  id: string;
  zone_id: string;
  zone_name: string;
  name: string;
  type: string;
  content: string;
  proxiable: boolean;
  proxied?: boolean | undefined;
  ttl: number;
  locked: boolean;
  meta: {
    auto_added: boolean;
    managed_by_apps: boolean;
    managed_by_argo_tunnel: boolean;
    source: string;
  };
  comment: null | string;
  tags: string[];
  created_on: string;
  modified_on: string;
}
