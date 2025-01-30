export interface StreamMessageReply {
  id: string;
  message: Record<string, string>;
}

export interface StreamEventReply {
  id: string;
  message: {
    event: string;
    payload: unknown;
    timestamp: string;
  };
}
