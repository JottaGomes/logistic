/** One turn of the conversation with the shipment assistant. */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  /** Tools the backend ran to produce an assistant answer, in order. */
  toolsUsed?: string[];
}

export interface ChatReply {
  reply: string;
  toolsUsed: string[];
}
