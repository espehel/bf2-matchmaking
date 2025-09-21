export interface StreamMessageReply {
  id: string;
  message: Record<string, string>;
}

export interface StreamEventReply<E = string, P = unknown> {
  id: string;
  message: {
    event: E;
    payload: P;
    timestamp: string;
  };
}
