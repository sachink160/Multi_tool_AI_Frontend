import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import { DynamicPrompt, DynamicPromptCreate, ProcessedDocument, DocumentProcessResult } from '../../types';
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle, Download, Eye, Trash2, Edit3, Plus, Zap, Copy, ChevronDown, ChevronRight, Cpu } from 'lucide-react';

// Available GPT models
const AVAILABLE_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and cost-effective', price: 'Low' },
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model', price: 'High' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Balanced performance', price: 'Medium' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient', price: 'Very Low' }
];

// Component to render formatted results
const FormattedResultRenderer: React.FC<{ result: any }> = ({ result }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
  const [expandAll, setExpandAll] = useState(false);

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedSections(new Set());
    } else {
      // Expand all sections
      const allSections = new Set<string>();
      if (result.raw_output) {
        const sections = result.raw_output.split(/##\s+/).filter((section: string) => section.trim());
        sections.forEach((_: string, index: number) => {
          allSections.add(`section-${index}`);
        });
      } else {
        Object.keys(result).forEach(key => {
          allSections.add(key);
        });
      }
      setExpandedSections(allSections);
    }
    setExpandAll(!expandAll);
  };

  const formatRawOutput = (rawOutput: string) => {
    if (!rawOutput) return null;
    
    // Split by sections (## headings)
    const sections = rawOutput.split(/##\s+/).filter(section => section.trim());
    
    return sections.map((section, index) => {
      const lines = section.split('\n').filter(line => line.trim());
      const title = lines[0]?.trim();
      const content = lines.slice(1);
      
      if (!title) return null;
      
      return (
        <div key={index} className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg">
          <button
            onClick={() => toggleSection(`section-${index}`)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-t-lg"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
            {expandedSections.has(`section-${index}`) ? 
              <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" /> : 
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            }
          </button>
          
          {expandedSections.has(`section-${index}`) && (
            <div className="p-4 bg-white dark:bg-gray-800">
              {content.map((line, lineIndex) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return null;
                
                if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                  return (
                    <h4 key={lineIndex} className="font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-2 first:mt-0">
                      {trimmedLine.replace(/\*\*/g, '')}
                    </h4>
                  );
                } else if (trimmedLine.startsWith('- ')) {
                  return (
                    <div key={lineIndex} className="ml-4 mb-2 text-gray-600 dark:text-gray-400 flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                      <span>{trimmedLine.replace(/^- /, '')}</span>
                    </div>
                  );
                } else if (trimmedLine.match(/^\d+\./)) {
                  // Numbered list
                  return (
                    <div key={lineIndex} className="ml-4 mb-2 text-gray-600 dark:text-gray-400 flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2 font-medium">{trimmedLine.match(/^\d+\./)?.[0]}</span>
                      <span>{trimmedLine.replace(/^\d+\.\s*/, '')}</span>
                    </div>
                  );
                } else {
                  return (
                    <p key={lineIndex} className="text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
                      {trimmedLine}
                    </p>
                  );
                }
              })}
            </div>
          )}
        </div>
      );
    });
  };

  const renderFormattedContent = () => {
    if (result.raw_output) {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Document Analysis</h4>
            <button
              onClick={() => copyToClipboard(result.raw_output)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
            >
              <Copy className="h-4 w-4" />
              <span>Copy Text</span>
            </button>
          </div>
          {formatRawOutput(result.raw_output)}
        </div>
      );
    }

    // Handle other structured data
    return Object.entries(result).map(([key, value]) => (
      <div key={key} className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <button
          onClick={() => toggleSection(key)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-t-lg"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 capitalize">{key.replace(/_/g, ' ')}</h3>
          {expandedSections.has(key) ? 
            <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" /> : 
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          }
        </button>
        
        {expandedSections.has(key) && (
          <div className="p-4 bg-white dark:bg-gray-800">
            {typeof value === 'object' ? (
              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">{String(value)}</p>
            )}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('formatted')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'formatted' 
                ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Formatted View
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'raw' 
                ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Raw JSON
          </button>
          {viewMode === 'formatted' && (
            <button
              onClick={toggleExpandAll}
              className="px-3 py-1 rounded-lg text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            >
              {expandAll ? 'Collapse All' : 'Expand All'}
            </button>
          )}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {Object.keys(result).length} top-level keys
        </span>
      </div>

      {viewMode === 'formatted' ? (
        <div className="space-y-4">
          {renderFormattedContent()}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// Dynamic Prompts Page Component
const DynamicPromptsPage: React.FC = () => {
  const [prompts, setPrompts] = useState<DynamicPrompt[]>([]);
  const [processedDocs, setProcessedDocs] = useState<ProcessedDocument[]>([]);
  const [usage, setUsage] = useState<any>(null);
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
    prompt_template: '',
    gpt_model: 'gpt-4o-mini'
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
      const [promptsData, docsData, usageData] = await Promise.all([
        apiService.getDynamicPrompts(),
        apiService.getProcessedDocuments(),
        apiService.getUserUsage().catch(() => null) // Don't fail if usage can't be loaded
      ]);
      setPrompts(promptsData);
      setProcessedDocs(docsData);
      setUsage(usageData);
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
      setFormData({ name: '', description: '', prompt_template: '', gpt_model: 'gpt-4o-mini' });
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
      setFormData({ name: '', description: '', prompt_template: '', gpt_model: 'gpt-4o-mini' });
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
      prompt_template: prompt.prompt_template,
      gpt_model: prompt.gpt_model
    });
  };

  const cancelEdit = () => {
    setEditingPrompt(null);
    setFormData({ name: '', description: '', prompt_template: '', gpt_model: 'gpt-4o-mini' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dynamic Prompts</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('prompts')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'prompts'
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Prompts
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'documents'
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Process Documents
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {success}
            </div>
          )}

          {activeTab === 'prompts' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Your Prompts</h2>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Prompt</span>
                </button>
              </div>

              {showCreateForm && (
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create New Prompt</h3>
                  <form onSubmit={handleCreatePrompt} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Menu Extractor, Invoice Parser"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Brief description of what this prompt does"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        GPT Model *
                      </label>
                      <select
                        value={formData.gpt_model}
                        onChange={(e) => setFormData({ ...formData, gpt_model: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {AVAILABLE_MODELS.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name} - {model.description} ({model.price} cost)
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Choose the GPT model for processing your documents
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Prompt Template *
                      </label>
                      <textarea
                        value={formData.prompt_template}
                        onChange={(e) => setFormData({ ...formData, prompt_template: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 h-40"
                        placeholder="Enter your prompt template. Use {text} placeholder where you want the document text to be inserted."
                        required
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Use <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-gray-800 dark:text-gray-200">{'{text}'}</code> to insert document content
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
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Edit Prompt</h3>
                  <form onSubmit={handleUpdatePrompt} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        GPT Model *
                      </label>
                      <select
                        value={formData.gpt_model}
                        onChange={(e) => setFormData({ ...formData, gpt_model: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {AVAILABLE_MODELS.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name} - {model.description} ({model.price} cost)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Prompt Template *
                      </label>
                      <textarea
                        value={formData.prompt_template}
                        onChange={(e) => setFormData({ ...formData, prompt_template: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 h-40"
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

              <div className="overflow-x-auto">
                <table className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Prompt Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        GPT Model
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {prompts.map((prompt) => (
                      <tr key={prompt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {prompt.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                            {prompt.description || 'No description'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            prompt.is_active 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {prompt.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {AVAILABLE_MODELS.find(m => m.id === prompt.gpt_model)?.name || prompt.gpt_model}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(prompt.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEdit(prompt)}
                              className="flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
                            >
                              <Edit3 className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeletePrompt(prompt.id)}
                              className="flex items-center space-x-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {prompts.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Zap className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-lg font-medium mb-2">No prompts created yet</p>
                  <p className="text-sm">Create your first prompt to start processing documents!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Process Documents</h2>
                
                {/* Usage Information */}
                {usage && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          Dynamic Prompt Document Usage
                        </span>
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        {usage.dynamic_prompt_documents_uploaded || 0} / {usage.max_dynamic_prompt_documents || 5} documents used this month
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, ((usage.dynamic_prompt_documents_uploaded || 0) / (usage.max_dynamic_prompt_documents || 5)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    {(usage.dynamic_prompt_documents_uploaded || 0) >= (usage.max_dynamic_prompt_documents || 5) && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                        You've reached your monthly limit. Upgrade your subscription for more uploads.
                      </div>
                    )}
                  </div>
                )}
                
                {/* File Upload Area */}
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 mb-4">
                  <div
                    className={`relative transition-colors ${
                      dragActive ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
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
                        <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Drop your file here or click to browse
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Supports PDF, DOCX, TXT, and image files (max 50MB)
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{selectedFile.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={clearFile}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prompt Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Processing Prompt
                  </label>
                  <select
                    value={selectedPromptId}
                    onChange={(e) => setSelectedPromptId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing...</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || !selectedPromptId || uploading || (usage && (usage.dynamic_prompt_documents_uploaded || 0) >= (usage.max_dynamic_prompt_documents || 5))}
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
                  <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Processed Documents</h2>
                  <button
                    onClick={loadData}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center space-x-1"
                  >
                    <span>Refresh</span>
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Document
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Processed Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {processedDocs.map((doc) => {
                        const getStatusIcon = () => {
                          switch (doc.processing_status) {
                            case 'completed':
                              return <CheckCircle className="h-4 w-4 text-green-600" />;
                            case 'failed':
                              return <XCircle className="h-4 w-4 text-red-600" />;
                            case 'processing':
                              return <Clock className="h-4 w-4 text-yellow-600" />;
                            default:
                              return <AlertCircle className="h-4 w-4 text-gray-600" />;
                          }
                        };

                        const getStatusColor = () => {
                          switch (doc.processing_status) {
                            case 'completed':
                              return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
                            case 'failed':
                              return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
                            case 'processing':
                              return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
                            default:
                              return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
                          }
                        };

                        return (
                          <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {doc.original_filename}
                                  </div>
                                  {doc.error_message && (
                                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                      Error: {doc.error_message}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {getStatusIcon()}
                                <span className={`ml-2 inline-block px-2 py-1 text-xs rounded-full border ${getStatusColor()}`}>
                                  {doc.processing_status.charAt(0).toUpperCase() + doc.processing_status.slice(1)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900 dark:text-gray-100">
                                {doc.file_type.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(doc.created_at).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {doc.processing_status === 'completed' && (
                                <button
                                  onClick={() => handleViewResult(doc.id)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>View Result</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {processedDocs.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <FileText className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
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
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Processing Result</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <strong>File:</strong> {selectedResult.original_filename}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Status:</strong> 
                    <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                      selectedResult.processing_status === 'completed' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
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
                    className="flex items-center space-x-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-medium"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download JSON</span>
                  </button>
                  <button
                    onClick={() => setShowResult(false)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-6">
                <FormattedResultRenderer result={selectedResult.result} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicPromptsPage;
