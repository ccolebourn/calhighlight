export interface ChatRequest {
  message: string;
  conversationHistory?: ConversationMessage[];
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  message?: string;
  error?: string;
  details?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
