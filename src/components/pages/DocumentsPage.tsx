import React, { useState, useEffect } from 'react';
import { Upload, FileText, Search, Download, Trash2, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import { Document } from '../../types';

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [question, setQuestion] = useState('');
  const [queryType, setQueryType] = useState('question');
  const [response, setResponse] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);

  const queryTypes = [
    { value: 'question', label: 'Ask Question', icon: MessageSquare },
    { value: 'summarize', label: 'Summarize', icon: FileText },
    { value: 'action_items', label: 'Action Items', icon: AlertCircle },
    { value: 'legal_issues', label: 'Legal Issues', icon: Search },
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await apiService.getDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const newDocument = await apiService.uploadDocument(file);
      setDocuments([...documents, newDocument]);
      event.target.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!selectedDocument || !question.trim()) return;

    setIsAsking(true);
    try {
      const result = await apiService.askDocument(selectedDocument.id, question, queryType);
      setResponse(result.answer);
    } catch (error) {
      console.error('Failed to ask question:', error);
      setResponse('Failed to get response. Please try again.');
    } finally {
      setIsAsking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Q&A</h1>
        <p className="text-gray-600">Upload documents and ask questions using AI-powered analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Documents List */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </label>
              </div>
            </div>

            {isUploading && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-600">Uploading...</span>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p>Loading documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No documents uploaded yet</p>
                  <p className="text-sm">Upload your first document to get started</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocument(doc)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedDocument?.id === doc.id
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.filename.replace(/^[^_]+_/, '')}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(doc.upload_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Q&A Interface */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 h-full">
            {selectedDocument ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Ask Questions</h2>
                    <p className="text-sm text-gray-600">Selected: {selectedDocument.filename}</p>
                  </div>
                </div>

                {/* Query Type Selection */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {queryTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setQueryType(type.value)}
                        className={`p-3 rounded-lg border transition-colors ${
                          queryType === type.value
                            ? 'bg-blue-100 border-blue-500 text-blue-700'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-4 w-4 mx-auto mb-1" />
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Question Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Your Question
                  </label>
                  <div className="relative">
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`${
                        queryType === 'question' ? 'Ask a question about the document...' :
                        queryType === 'summarize' ? 'Click "Ask" to get a summary...' :
                        queryType === 'action_items' ? 'Click "Ask" to extract action items...' :
                        'Click "Ask" to identify legal issues...'
                      }`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                    <button
                      onClick={handleAskQuestion}
                      disabled={isAsking || !question.trim()}
                      className="absolute bottom-2 right-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isAsking ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Asking...</span>
                        </div>
                      ) : (
                        'Ask'
                      )}
                    </button>
                  </div>
                </div>

                {/* Response */}
                {response && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Response
                    </label>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-gray-800 whitespace-pre-wrap">{response}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Select a document to start asking questions</p>
                  <p className="text-sm">Upload a document first, then select it to begin the Q&A session</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;