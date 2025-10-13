import { AuthTokens, User, Document, HRDocument, ChatMessage, VideoFile, ProcessedFile, BackendChatHistory, UserProfile, SubscriptionPlan, UserSubscription, UsageInfo, DynamicPrompt, DynamicPromptCreate, DynamicPromptUpdate, ProcessedDocument, DocumentProcessResult, CrmMetrics, ResumeItem, JobRequirementItem, ResumeMatchItem } from '../types';

// const API_BASE_URL = 'https://9b3fe599ffc6.ngrok-free.app/';
const API_BASE_URL = 'http://localhost:8000';

class APIService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (response.status === 401) {
      // Token expired, try to refresh
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry the request with new token
        config.headers = {
          ...config.headers,
          ...this.getAuthHeaders(),
        };
        return this.request(endpoint, options);
      } else {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async register(
    username: string,
    fullname: string,
    email: string,
    phone: string,
    user_type: string,
    password: string
  ): Promise<{ message: string }> {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify({ username, fullname, email, phone, user_type, password }),
    });
  }

  async login(username: string, password: string): Promise<AuthTokens> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const tokens = await response.json();
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    return tokens;
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      if (response.ok) {
        const tokens = await response.json();
        localStorage.setItem('access_token', tokens.access_token);
        localStorage.setItem('refresh_token', tokens.refresh_token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  // Document RAG endpoints
  async uploadDocument(file: File): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  }

  async getDocuments(): Promise<Document[]> {
    return this.request('/documents');
  }

  async askDocument(documentId: string, question: string, queryType: string = 'question'): Promise<{ response: string }> {
    return this.request('/ask', {
      method: 'POST',
      body: JSON.stringify({
        document_id: documentId,
        question,
        query_type: queryType,
      }),
    });
  }

  // HR endpoints
  async uploadHRDocument(file: File): Promise<HRDocument> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/hr/upload`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'HR upload failed');
    }

    return response.json();
  }

  async getHRDocuments(): Promise<HRDocument[]> {
    return this.request('/hr/documents');
  }

  async activateHRDocument(docId: string): Promise<{ message: string }> {
    return this.request(`/hr/documents/${docId}/activate`, {
      method: 'POST',
    });
  }

  async deactivateHRDocument(docId: string): Promise<{ message: string }> {
    return this.request(`/hr/documents/${docId}/deactivate`, {
      method: 'POST',
    });
  }

  async askHR(question: string): Promise<{ response: string }> {
    return this.request('/hr/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }

  // Chat endpoints
  async chat(message: string): Promise<{ response: string }> {
    const params = new URLSearchParams({ query: message });
    return this.request(`/chat?${params.toString()}`, {
      method: 'POST',
    });
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    const backendHistory: BackendChatHistory[] = await this.request('/chat/history');
    
    // Transform backend format to frontend format
    const chatMessages: ChatMessage[] = [];
    backendHistory.forEach((item, index) => {
      // Add user message
      chatMessages.push({
        id: `user_${index}`,
        content: item.message,
        sender: 'user',
        timestamp: item.timestamp
      });
      
      // Add assistant response, including tool_used
      chatMessages.push({
        id: `assistant_${index}`,
        content: item.response,
        sender: 'assistant',
        timestamp: item.timestamp,
        tool_used: item.tool_used
      });
    });
    
    // Reverse the array so the oldest messages are at the top, newest at the bottom
    return chatMessages.reverse();
  }

  // Video processing endpoints
  async uploadVideo(file: File): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/video-to-audio/upload`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Video upload failed');
    }

    return response.json();
  }

  async getUploadedVideos(): Promise<VideoFile[]> {
  const res = await this.request<{ uploads?: string[] }>('/video-to-audio/uploads');
  // res.uploads is an array of filenames
    // We'll fake the upload_date and size since backend doesn't provide them
    return (res.uploads || []).map((filename: string) => ({
      filename,
      upload_date: new Date().toISOString(), // Placeholder
      size: 0, // Placeholder
    }));
  }

  async getProcessedFiles(): Promise<ProcessedFile[]> {
  const res = await this.request<{ processed?: string[] }>('/video-to-audio/processed');
  // res.processed is an array of filenames
    // We'll infer type from extension and fake processed_date/size
    return (res.processed || []).map((filename: string) => ({
      filename,
      type: filename.endsWith('.mp3') ? 'audio' : 'video',
      size: 0, // Placeholder
      processed_date: new Date().toISOString(), // Placeholder
    }));
  }

  async downloadProcessedFile(userId: string, filename: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/video-to-audio/download/${userId}/${filename}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  }

  // User profile
  async getCurrentUser(): Promise<User> {
    return this.request('/profile');
  }

  async getUserProfile(): Promise<UserProfile> {
    return this.request('/profile');
  }

  async updateUserProfile(profileData: {
    fullname?: string;
    email?: string;
    phone?: string;
    password?: string;
  }): Promise<{ message: string }> {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Subscription endpoints
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return this.request('/plans');
  }

  async getUserSubscription(): Promise<UserSubscription> {
    return this.request('/user/subscription');
  }

  async getUserSubscriptionHistory(): Promise<UserSubscription[]> {
    return this.request('/user/subscription/history');
  }

  async getUserUsage(): Promise<UsageInfo> {
    return this.request('/user/usage');
  }

  async subscribeToPlan(planId: string): Promise<{ message: string; plan_name: string; end_date: string; features: string }> {
    return this.request('/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });
  }

  async cancelSubscription(): Promise<{ message: string }> {
    return this.request('/cancel', {
      method: 'POST',
    });
  }

  // Dynamic Prompt endpoints
  async createDynamicPrompt(promptData: DynamicPromptCreate): Promise<DynamicPrompt> {
    return this.request('/dynamic-prompts/', {
      method: 'POST',
      body: JSON.stringify(promptData),
    });
  }

  async getDynamicPrompts(): Promise<DynamicPrompt[]> {
    return this.request('/dynamic-prompts/');
  }

  async getDynamicPrompt(promptId: string): Promise<DynamicPrompt> {
    return this.request(`/dynamic-prompts/${promptId}`);
  }

  async updateDynamicPrompt(promptId: string, promptData: DynamicPromptUpdate): Promise<DynamicPrompt> {
    return this.request(`/dynamic-prompts/${promptId}`, {
      method: 'PUT',
      body: JSON.stringify(promptData),
    });
  }

  async deleteDynamicPrompt(promptId: string): Promise<{ message: string }> {
    return this.request(`/dynamic-prompts/${promptId}`, {
      method: 'DELETE',
    });
  }

  async uploadDocumentWithPrompt(file: File, promptId: string): Promise<{ message: string; processed_document_id: string; status: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('prompt_id', promptId);

    const response = await fetch(`${API_BASE_URL}/dynamic-prompts/upload-document`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Document upload failed');
    }

    return response.json();
  }

  async getProcessedDocuments(): Promise<ProcessedDocument[]> {
    return this.request('/dynamic-prompts/processed-documents/');
  }

  async getProcessedDocument(documentId: string): Promise<ProcessedDocument> {
    return this.request(`/dynamic-prompts/processed-documents/${documentId}`);
  }

  async getProcessingResult(documentId: string): Promise<DocumentProcessResult> {
    return this.request(`/dynamic-prompts/processed-documents/${documentId}/result`);
  }

  // CRM endpoints
  async getCrmMetrics(): Promise<CrmMetrics> {
    return this.request('/crm/metrics');
  }

  // Resume matching endpoints
  async uploadResume(file: File): Promise<ResumeItem> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/resumes/upload`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Resume upload failed');
    }

    return response.json();
  }

  async listResumes(): Promise<ResumeItem[]> {
    return this.request('/resumes/resumes');
  }

  async createRequirement(payload: { title: string; description?: string; requirement_json: string; gpt_model?: string; }): Promise<JobRequirementItem> {
    return this.request('/resumes/requirements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async listRequirements(): Promise<JobRequirementItem[]> {
    return this.request('/resumes/requirements');
  }

  async updateRequirement(id: string, payload: { title?: string; description?: string; requirement_json?: string; gpt_model?: string; is_active?: boolean; }): Promise<JobRequirementItem> {
    return this.request(`/resumes/requirements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async matchResumes(requirementId: string, resumeIds: string[]): Promise<ResumeMatchItem[]> {
    const form = new FormData();
    form.append('requirement_id', requirementId);
    form.append('resume_ids', resumeIds.join(','));

    const response = await fetch(`${API_BASE_URL}/resumes/match`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: form,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Matching failed');
    }

    return response.json();
  }

  async listMatches(requirementId?: string): Promise<ResumeMatchItem[]> {
    const params = new URLSearchParams();
    if (requirementId) params.set('requirement_id', requirementId);
    const qs = params.toString();
    const endpoint = `/resumes/matches${qs ? `?${qs}` : ''}`;
    return this.request(endpoint);
  }
}

export const apiService = new APIService();