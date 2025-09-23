import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import { DynamicPrompt, DynamicPromptCreate, ProcessedDocument, DocumentProcessResult } from '../../types';
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle, Download, Eye, Trash2, Edit3, Plus, Zap } from 'lucide-react';

// Dynamic Prompts Page Component
const DynamicPromptsPage: React.FC = () => {
  const [prompts, setPrompts] = useState<DynamicPrompt[]>([]);
  const [processedDocs, setProcessedDocs] = useState<ProcessedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'prompts' | 'documents'>('prompts');
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<DynamicPrompt | null>(null);
  const [formData, setFormData] = useState<DynamicPromptCreate>({
    name: '',
    description: '',
    prompt_template: ''
  });
  
  // Document upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Results states
  const [selectedResult, setSelectedResult] = useState<DocumentProcessResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [promptsData, docsData] = await Promise.all([
        apiService.getDynamicPrompts(),
        apiService.getProcessedDocuments()
      ]);
      setPrompts(promptsData);
      setProcessedDocs(docsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const newPrompt = await apiService.createDynamicPrompt(formData);
      setPrompts([newPrompt, ...prompts]);
      setFormData({ name: '', description: '', prompt_template: '' });
      setShowCreateForm(false);
      setSuccess('Prompt created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prompt');
    }
  };

  const handleUpdatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrompt) return;
    
    try {
      setError(null);
      const updatedPrompt = await apiService.updateDynamicPrompt(editingPrompt.id, formData);
      setPrompts(prompts.map(p => p.id === editingPrompt.id ? updatedPrompt : p));
      setEditingPrompt(null);
      setFormData({ name: '', description: '', prompt_template: '' });
      setSuccess('Prompt updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prompt');
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!window.confirm('Are you sure you want to delete this prompt?')) return;
    
    try {
      setError(null);
      await apiService.deleteDynamicPrompt(promptId);
      setPrompts(prompts.filter(p => p.id !== promptId));
      setSuccess('Prompt deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prompt');
    }
  };

  // File validation
  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/jfif',
      'image/bmp',
      'image/tiff',
      'image/tif',
      'image/webp',
      'image/heic'
    ];
    
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported. Please upload PDF, DOCX, TXT, or image files.';
    }
    
    if (file.size > maxSize) {
      return 'File size too large. Please upload files smaller than 50MB.';
    }
    
    return null;
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedPromptId) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);
      
      await apiService.uploadDocumentWithPrompt(selectedFile, selectedPromptId);
      
      setUploadProgress(100);
      clearInterval(progressInterval);
      
      // Reload data after a short delay
      setTimeout(async () => {
        await loadData();
        setSelectedFile(null);
        setSelectedPromptId('');
        setUploadProgress(0);
        setActiveTab('documents');
        setSuccess('Document processed successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }, 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleViewResult = async (docId: string) => {
    try {
      setError(null);
      const result = await apiService.getProcessingResult(docId);
      setSelectedResult(result);
      setShowResult(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load result');
    }
  };

  const startEdit = (prompt: DynamicPrompt) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      description: prompt.description || '',
      prompt_template: prompt.prompt_template
    });
  };

  const cancelEdit = () => {
    setEditingPrompt(null);
    setFormData({ name: '', description: '', prompt_template: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <Zap className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">Dynamic Prompts</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('prompts')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'prompts'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Prompts
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'documents'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Process Documents
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {success}
            </div>
          )}

          {activeTab === 'prompts' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Your Prompts</h2>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Prompt</span>
                </button>
              </div>

              {showCreateForm && (
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-4">Create New Prompt</h3>
                  <form onSubmit={handleCreatePrompt} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Menu Extractor, Invoice Parser"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Brief description of what this prompt does"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prompt Template *
                      </label>
                      <textarea
                        value={formData.prompt_template}
                        onChange={(e) => setFormData({ ...formData, prompt_template: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-40"
                        placeholder="Enter your prompt template. Use {text} placeholder where you want the document text to be inserted."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use <code className="bg-gray-100 px-1 rounded">{'{text}'}</code> to insert document content
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Create Prompt
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {editingPrompt && (
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-4">Edit Prompt</h3>
                  <form onSubmit={handleUpdatePrompt} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prompt Template *
                      </label>
                      <textarea
                        value={formData.prompt_template}
                        onChange={(e) => setFormData({ ...formData, prompt_template: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-40"
                        required
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Update Prompt
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid gap-4">
                {prompts.map((prompt) => (
                  <div key={prompt.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">{prompt.name}</h3>
                        {prompt.description && (
                          <p className="text-gray-600 mt-1">{prompt.description}</p>
                        )}
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            prompt.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {prompt.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Created: {new Date(prompt.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEdit(prompt)}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(prompt.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {prompts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Zap className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-lg font-medium mb-2">No prompts created yet</p>
                  <p className="text-sm">Create your first prompt to start processing documents!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Process Documents</h2>
                
                {/* File Upload Area */}
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 mb-4">
                  <div
                    className={`relative transition-colors ${
                      dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.jfif,.bmp,.tiff,.tif,.webp,.heic"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    {!selectedFile ? (
                      <div className="text-center py-8">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          Drop your file here or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports PDF, DOCX, TXT, and image files (max 50MB)
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">{selectedFile.name}</p>
                            <p className="text-sm text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={clearFile}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prompt Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Processing Prompt
                  </label>
                  <select
                    value={selectedPromptId}
                    onChange={(e) => setSelectedPromptId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a prompt...</option>
                    {prompts.filter(p => p.is_active).map((prompt) => (
                      <option key={prompt.id} value={prompt.id}>
                        {prompt.name} {prompt.description && `- ${prompt.description}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Processing...</span>
                      <span className="text-sm text-gray-500">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || !selectedPromptId || uploading}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Process Document</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-700">Processed Documents</h2>
                  <button
                    onClick={loadData}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                  >
                    <span>Refresh</span>
                  </button>
                </div>
                
                <div className="grid gap-4">
                  {processedDocs.map((doc) => {
                    const getStatusIcon = () => {
                      switch (doc.processing_status) {
                        case 'completed':
                          return <CheckCircle className="h-5 w-5 text-green-600" />;
                        case 'failed':
                          return <XCircle className="h-5 w-5 text-red-600" />;
                        case 'processing':
                          return <Clock className="h-5 w-5 text-yellow-600" />;
                        default:
                          return <AlertCircle className="h-5 w-5 text-gray-600" />;
                      }
                    };

                    const getStatusColor = () => {
                      switch (doc.processing_status) {
                        case 'completed':
                          return 'bg-green-100 text-green-800 border-green-200';
                        case 'failed':
                          return 'bg-red-100 text-red-800 border-red-200';
                        case 'processing':
                          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                        default:
                          return 'bg-gray-100 text-gray-800 border-gray-200';
                      }
                    };

                    return (
                      <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <FileText className="h-6 w-6 text-blue-600" />
                              <h3 className="text-lg font-semibold text-gray-800">{doc.original_filename}</h3>
                            </div>
                            
                            <div className="flex items-center space-x-4 mb-3">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon()}
                                <span className={`inline-block px-3 py-1 text-xs rounded-full border ${getStatusColor()}`}>
                                  {doc.processing_status.charAt(0).toUpperCase() + doc.processing_status.slice(1)}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                Type: {doc.file_type.toUpperCase()}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-500">
                              Processed: {new Date(doc.created_at).toLocaleString()}
                            </p>
                            
                            {doc.error_message && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                <strong>Error:</strong> {doc.error_message}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            {doc.processing_status === 'completed' && (
                              <button
                                onClick={() => handleViewResult(doc.id)}
                                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                              >
                                <Eye className="h-4 w-4" />
                                <span>View Result</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {processedDocs.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium mb-2">No processed documents yet</p>
                    <p className="text-sm">Upload a document and select a prompt to get started!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Result Modal */}
        {showResult && selectedResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-6 border-b">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Processing Result</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>File:</strong> {selectedResult.original_filename}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Status:</strong> 
                    <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                      selectedResult.processing_status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedResult.processing_status}
                    </span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const dataStr = JSON.stringify(selectedResult.result, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${selectedResult.original_filename}_result.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download JSON</span>
                  </button>
                  <button
                    onClick={() => setShowResult(false)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">Structured Data Result</h4>
                    <span className="text-xs text-gray-500">
                      {Object.keys(selectedResult.result).length} top-level keys
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 overflow-x-auto">
                    {JSON.stringify(selectedResult.result, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicPromptsPage;
