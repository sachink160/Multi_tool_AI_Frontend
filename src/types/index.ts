export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
  fullname?: string;
  phone?: string;
  user_type?: string;
  is_subscribed?: boolean;
  subscription_end_date?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Subscription related types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  max_chats_per_month: number;
  max_documents: number;
  max_hr_documents: number;
  max_video_uploads: number;
  features: string;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  plan_name: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_status: string;
  features: string;
}

export interface UsageInfo {
  month_year: string;
  chats_used: number;
  documents_uploaded: number;
  hr_documents_uploaded: number;
  video_uploads: number;
  dynamic_prompt_documents_uploaded: number;
  max_chats: number;
  max_documents: number;
  max_hr_documents: number;
  max_video_uploads: number;
  max_dynamic_prompt_documents: number;
}

export interface UserProfile {
  id: string;
  username: string;
  fullname: string;
  email: string;
  phone: string;
  user_type: string;
  is_subscribed: boolean;
  subscription_end_date?: string;
  current_usage: UsageInfo;
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

// Dynamic Prompt types
export interface DynamicPrompt {
  id: string;
  name: string;
  description?: string;
  prompt_template: string;
  gpt_model: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DynamicPromptCreate {
  name: string;
  description?: string;
  prompt_template: string;
  gpt_model?: string;
}

export interface DynamicPromptUpdate {
  name?: string;
  description?: string;
  prompt_template?: string;
  gpt_model?: string;
  is_active?: boolean;
}

export interface ProcessedDocument {
  id: string;
  prompt_id: string;
  original_filename: string;
  file_type: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_text?: string;
  processed_result?: string;
  error_message?: string;
  created_at: string;
}

export interface DocumentProcessResult {
  document_id: string;
  original_filename: string;
  processing_status: string;
  result: any;
}