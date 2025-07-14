export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Document {
  id: string;
  filename: string;
  upload_date: string;
  user_id: string;
  file_path: string;
}

export interface HRDocument {
  id: string;
  filename: string;
  upload_date: string;
  user_id: string;
  file_path: string;
  is_active: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  type?: 'text' | 'tool_response';
  tool_used?: string;
}

// Backend chat history format
export interface BackendChatHistory {
  message: string;
  response: string;
  tool_used: string;
  timestamp: string;
}

export interface ChatHistory {
  id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface VideoFile {
  filename: string;
  upload_date: string;
  size: number;
}

export interface ProcessedFile {
  filename: string;
  type: 'video' | 'audio';
  size: number;
  processed_date: string;
}

export interface APIResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}