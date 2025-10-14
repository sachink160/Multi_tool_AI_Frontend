import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/api';
import { ResumeItem, JobRequirementItem, ResumeMatchItem } from '../../types';
import { Upload, FileText, Sparkles, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';

const ResumePage: React.FC = () => {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [requirements, setRequirements] = useState<JobRequirementItem[]>([]);
  const [selectedResumeIds, setSelectedResumeIds] = useState<string[]>([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string>('');
  const [matches, setMatches] = useState<ResumeMatchItem[]>([]);
  const [history, setHistory] = useState<ResumeMatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // requirement form state (supports create + edit)
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formJson, setFormJson] = useState('');
  const [formModel, setFormModel] = useState('gpt-4o-mini');

  const selectedCount = useMemo(() => selectedResumeIds.length, [selectedResumeIds]);

  const refresh = async () => {
    setError(null);
    try {
      const [r1, r2] = await Promise.all([
        apiService.listResumes(),
        apiService.listRequirements(),
      ]);
      setResumes(r1);
      setRequirements(r2);
      if (!selectedRequirementId && r2.length > 0) setSelectedRequirementId(r2[0].id);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    // load history whenever requirement changes (or initial load)
    const loadHistory = async () => {
      try {
        const items = await apiService.listMatches(selectedRequirementId || undefined);
        setHistory(items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } catch (e) {
        // ignore silently for now; page already shows general errors on demand
      }
    };
    loadHistory();
  }, [selectedRequirementId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      await Promise.all(Array.from(e.target.files).map((f) => apiService.uploadResume(f)));
      await refresh();
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isEditing && editingId) {
        const updated = await apiService.updateRequirement(editingId, {
          title: formTitle,
          description: formDesc,
          requirement_json: formJson,
          gpt_model: formModel,
        });
        // replace in list
        setRequirements((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setSelectedRequirementId(updated.id);
        setIsEditing(false);
        setEditingId(null);
      } else {
        const created = await apiService.createRequirement({
          title: formTitle,
          description: formDesc,
          requirement_json: formJson,
          gpt_model: formModel || 'gpt-4o-mini',
        });
        setRequirements([created, ...requirements]);
        setSelectedRequirementId(created.id);
      }
      // clear form (optional, keep content if editing finished)
      setFormTitle('');
      setFormDesc('');
      setFormJson('');
      setFormModel('gpt-4o-mini');
    } catch (e: any) {
      setError(e.message || (isEditing ? 'Update requirement failed' : 'Create requirement failed'));
    } finally {
      setLoading(false);
    }
  };

  const startEditSelected = () => {
    if (!selectedRequirementId) return;
    const req = requirements.find((r) => r.id === selectedRequirementId);
    if (!req) return;
    setIsEditing(true);
    setEditingId(req.id);
    setFormTitle(req.title);
    setFormDesc(req.description || '');
    setFormJson(req.requirement_json || '');
    setFormModel(req.gpt_model || 'gpt-4o-mini');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormTitle('');
    setFormDesc('');
    setFormJson('');
    setFormModel('gpt-4o-mini');
  };

  const toggleResume = (id: string) => {
    setSelectedResumeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleMatch = async () => {
    if (!selectedRequirementId || selectedResumeIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.matchResumes(selectedRequirementId, selectedResumeIds);
      setMatches(res.sort((a, b) => b.score - a.score));
    } catch (e: any) {
      setError(e.message || 'Matching failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Matching</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Upload resumes, define requirements, and get ranked matches.</p>
          </div>
        </div>
        {loading && (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <svg className="animate-spin h-4 w-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24"></svg>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Processing...</span>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Resumes Card */}
        <div className="group p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Resumes</h2>
          </div>
          <label className={`flex flex-col items-center justify-center gap-3 px-6 py-8 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-200 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700">
              <FileText className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Select files</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Drag & drop or click to browse</p>
            </div>
            <input type="file" className="hidden" accept=".pdf,.docx,.txt" multiple onChange={handleUpload} disabled={loading} />
          </label>
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Accepted formats:</p>
            <div className="flex flex-wrap gap-1">
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">PDF</span>
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">DOCX</span>
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">TXT</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <ShieldCheck className="h-3 w-3" />
              <span>Respects subscription limits</span>
            </div>
          </div>
        </div>

        {/* Create/Edit Requirement Card */}
        <form className="group p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 space-y-4" onSubmit={handleCreateOrUpdate}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isEditing ? 'Edit Requirement' : 'Create Requirement'}</h2>
            </div>
            {isEditing && (
              <button type="button" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={cancelEdit}>Cancel</button>
            )}
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
              <input 
                value={formTitle} 
                onChange={(e) => setFormTitle(e.target.value)} 
                placeholder="e.g., Senior React Developer" 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
              <input 
                value={formDesc} 
                onChange={(e) => setFormDesc(e.target.value)} 
                placeholder="Brief job description..." 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requirements JSON</label>
              <textarea 
                value={formJson} 
                onChange={(e) => setFormJson(e.target.value)} 
                placeholder='{"skills":["React","SQL"], "min_years":2, "education":"Bachelor"}' 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors h-24 resize-none" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GPT Model</label>
              <input 
                value={formModel} 
                onChange={(e) => setFormModel(e.target.value)} 
                placeholder="gpt-4o-mini" 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button 
              type="submit" 
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={loading}
            >
              {isEditing ? 'Save Changes' : 'Create Requirement'}
            </button>
            <button 
              type="button" 
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" 
              onClick={() => refresh()}
            >
              Refresh
            </button>
          </div>
        </form>

        {/* Match Resumes Card */}
        <div className="group p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Match Resumes</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Requirement</label>
              <select 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors" 
                value={selectedRequirementId} 
                onChange={(e) => setSelectedRequirementId(e.target.value)}
              >
                {requirements.length === 0 && <option value="">Create a requirement first</option>}
                {requirements.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleMatch} 
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={loading || !selectedRequirementId || selectedCount === 0}
              >
                {selectedCount > 0 ? `Match ${selectedCount} Resume${selectedCount > 1 ? 's' : ''}` : 'Match Resumes'}
              </button>
              <button 
                onClick={startEditSelected} 
                disabled={!selectedRequirementId} 
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Edit
              </button>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <p className="font-medium mb-1">Instructions:</p>
              <p>1. Select resumes from the list below</p>
              <p>2. Choose a requirement to match against</p>
              <p>3. Click "Match" to get ranked results</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumes List Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Resumes</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Selected:</span>
            <span className="px-2 py-1 text-sm font-bold text-white bg-blue-600 dark:bg-blue-500 rounded-full">{selectedCount}</span>
          </div>
        </div>
        
        {resumes.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-700 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No resumes uploaded yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Upload your first resume to get started with matching.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((r) => (
              <label 
                key={r.id} 
                className={`group p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedResumeIds.includes(r.id) 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" 
                    checked={selectedResumeIds.includes(r.id)} 
                    onChange={() => toggleResume(r.id)} 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.original_filename}</p>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <p>{new Date(r.created_at).toLocaleString()}</p>
                      <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                        {r.file_type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Matches Results Section */}
      {matches.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Match Results</h2>
            <span className="px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded-full">
              {matches.length} result{matches.length > 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Resume</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-48">Match Score</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {matches.map((m) => {
                  const res = resumes.find((r) => r.id === m.resume_id);
                  const score = Math.round(m.score || 0);
                  const scoreColor = score >= 80 ? 'text-green-600 dark:text-green-400' : 
                                   score >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 
                                   'text-red-600 dark:text-red-400';
                  const bgColor = score >= 80 ? 'bg-green-500' : 
                                 score >= 60 ? 'bg-yellow-500' : 
                                 'bg-red-500';
                  
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                            <FileText className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{res?.original_filename || m.resume_id}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{res?.file_type?.toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-2 ${bgColor} rounded-full transition-all duration-500`} 
                              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                            ></div>
                          </div>
                          <span className={`w-12 text-right text-sm font-bold ${scoreColor}`}>{score}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{m.rationale || 'No rationale provided'}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Match History Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              <FileText className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Match History</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {history.length} item{history.length !== 1 ? 's' : ''}
              {selectedRequirementId && ' • filtered'}
            </span>
          </div>
        </div>
        
        {history.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-700 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No match history yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Run your first match to see results here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Date & Time</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Requirement</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Resume</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 w-32">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {history.map((h) => {
                  const res = resumes.find((r) => r.id === h.resume_id);
                  const req = requirements.find((r) => r.id === h.requirement_id);
                  const score = Math.round(h.score || 0);
                  const scoreColor = score >= 80 ? 'text-green-600 dark:text-green-400' : 
                                   score >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 
                                   'text-red-600 dark:text-red-400';
                  const bgColor = score >= 80 ? 'bg-green-500' : 
                                 score >= 60 ? 'bg-yellow-500' : 
                                 'bg-red-500';
                  
                  return (
                    <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{new Date(h.created_at).toLocaleString()}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{req?.title || h.requirement_id}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{res?.original_filename || h.resume_id}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-2 ${bgColor} rounded-full transition-all duration-500`} 
                              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                            ></div>
                          </div>
                          <span className={`w-10 text-right text-sm font-bold ${scoreColor}`}>{score}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumePage;

