import React, { useState, useEffect } from 'react';
import { Upload, FileText, Users, MessageSquare, ToggleLeft as Toggle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import { HRDocument } from '../../types';

const HRPage: React.FC = () => {
  const [documents, setDocuments] = useState<HRDocument[]>([]);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [activeDocuments, setActiveDocuments] = useState<HRDocument[]>([]);

  useEffect(() => {
    fetchHRDocuments();
  }, []);

  useEffect(() => {
    setActiveDocuments(documents.filter(doc => doc.is_active));
  }, [documents]);

  const fetchHRDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await apiService.getHRDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch HR documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const newDocument = await apiService.uploadHRDocument(file);
      setDocuments([...documents, newDocument]);
      event.target.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleDocument = async (doc: HRDocument) => {
    try {
      if (doc.is_active) {
        await apiService.deactivateHRDocument(doc.id);
      } else {
        await apiService.activateHRDocument(doc.id);
      }
      
      setDocuments(docs =>
        docs.map(d =>
          d.id === doc.id ? { ...d, is_active: !d.is_active } : d
        )
      );
    } catch (error) {
      console.error('Failed to toggle document:', error);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setIsAsking(true);
    try {
      const result = await apiService.askHR(question);
      setResponse(result.answer);
    } catch (error) {
      console.error('Failed to ask HR question:', error);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">HR Tools</h1>
        <p className="text-gray-600">Manage HR documents and get AI-powered insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Management */}
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Upload HR Document</h2>
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="hr-file-upload"
              />
              <label
                htmlFor="hr-file-upload"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload HR document</p>
                  <p className="text-xs text-gray-500">PDF, TXT, DOC, DOCX</p>
                </div>
              </label>
            </div>

            {isUploading && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-600">Uploading...</span>
                </div>
              </div>
            )}
          </div>

          {/* Document List */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">HR Documents</h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p>Loading documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No HR documents uploaded yet</p>
                  <p className="text-sm">Upload your first HR document to get started</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${doc.is_active ? 'bg-green-100' : 'bg-gray-200'}`}>
                        <FileText className={`h-5 w-5 ${doc.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.filename.replace(/^[^_]+_/, '')}</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(doc.upload_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleDocument(doc)}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        doc.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {doc.is_active ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Q&A Interface */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Ask HR Questions</h2>
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>

          {/* Active Documents Status */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">
              Active Documents: {activeDocuments.length}
            </p>
            {activeDocuments.length > 0 && (
              <div className="mt-2 space-y-1">
                {activeDocuments.map((doc) => (
                  <p key={doc.id} className="text-xs text-blue-700 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {doc.filename.replace(/^[^_]+_/, '')}
                  </p>
                ))}
              </div>
            )}
          </div>

          {activeDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No active HR documents</p>
              <p className="text-sm">Upload and activate HR documents to start asking questions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Question Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Your HR Question
                </label>
                <div className="relative">
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about HR policies, procedures, benefits, etc..."
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
                    HR Response
                  </label>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-gray-800 whitespace-pre-wrap">{response}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRPage;