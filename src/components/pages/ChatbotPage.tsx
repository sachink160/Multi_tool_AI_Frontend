import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, History, Trash2, MessageSquare, Upload, FileText, CheckCircle2, XCircle, Loader2, Trash } from 'lucide-react';
import { apiService } from '../../services/api';
import { ChatMessage, ChatDocumentItem } from '../../types';

const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatDocs, setChatDocs] = useState<ChatDocumentItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatHistory();
    fetchChatDocuments();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      const history = await apiService.getChatHistory();
      setMessages(history);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatDocuments = async () => {
    try {
      const docs = await apiService.listChatDocuments();
      setChatDocs(docs);
    } catch (e) {
      console.error('Failed to load chat documents', e);
    }
  };

  const handleUploadChatDoc = async (file?: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      await apiService.uploadChatDocument(file);
      await fetchChatDocuments();
    } catch (e) {
      console.error('Failed to upload chat document', e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleActivateDoc = async (id: string) => {
    try {
      await apiService.activateChatDocument(id);
      await fetchChatDocuments();
    } catch (e) {
      console.error('Failed to activate document', e);
    }
  };

  const handleDeactivateDoc = async (id: string) => {
    try {
      await apiService.deactivateChatDocument(id);
      await fetchChatDocuments();
    } catch (e) {
      console.error('Failed to deactivate document', e);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await apiService.deleteChatDocument(id);
      await fetchChatDocuments();
    } catch (e) {
      console.error('Failed to delete document', e);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await apiService.chat(inputMessage);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Chatbot</h1>
            <p className="text-gray-600 dark:text-gray-300">Chat with our AI assistant with access to various tools and knowledge</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Documents Section */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat Documents</h2>
            {chatDocs.length > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({chatDocs.filter(d => d.is_active).length} active)
              </span>
            )}
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="text-sm font-medium">{isUploading ? 'Uploading...' : 'Upload Document'}</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.txt,.doc,.docx,.md,.rtf,.csv,.json,.html"
              onChange={(e) => handleUploadChatDoc(e.target.files?.[0])}
            />
          </label>
        </div>

        {/* Chat Docs List */}
        {chatDocs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm">No chat documents uploaded yet.</p>
            <p className="text-xs mt-1">Upload documents to enable context-aware responses.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {chatDocs.map((doc) => (
              <div 
                key={doc.id} 
                className={`group flex items-center justify-between p-3 rounded-lg border transition-all ${
                  doc.is_active 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400' 
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {doc.is_active ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  )}
                  <span className={`text-sm font-medium truncate ${
                    doc.is_active 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {doc.filename}
                  </span>
                  {doc.is_active && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3">
                  {doc.is_active ? (
                    <button 
                      onClick={() => handleDeactivateDoc(doc.id)} 
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleActivateDoc(doc.id)} 
                      className="px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                    >
                      Activate
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteDoc(doc.id)} 
                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Delete document"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Interface */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20 flex flex-col h-[600px]">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg font-medium">Start a conversation</p>
                <p className="text-sm">Ask me anything! I have access to search, weather, trip planning, and more.</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-blue-600 dark:bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.sender === 'assistant' && (
                      <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    )}
                    {message.sender === 'user' && (
                      <User className="h-5 w-5 text-blue-100 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.sender === 'assistant' && message.tool_used && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">Tool used: {message.tool_used}</span>
                      )}
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-700">
                <div className="flex items-center space-x-2">
                  <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send className="h-5 w-5" />
              )}
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;

