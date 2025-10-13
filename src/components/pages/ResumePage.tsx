import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/api';
import { ResumeItem, JobRequirementItem, ResumeMatchItem } from '../../types';
import { Upload, FileText, Sparkles, ShieldCheck } from 'lucide-react';

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Resume Matching</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Upload resumes, define requirements, and get ranked matches.</p>
          </div>
        </div>
        {loading && (
          <span className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
            <svg className="animate-spin h-4 w-4 mr-2 text-indigo-600" viewBox="0 0 24 24"></svg>
            Working...
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload resumes */}
        <div className="col-span-1 p-5 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow ring-1 ring-gray-100 dark:ring-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="h-5 w-5 text-blue-600" />
            <h2 className="font-medium text-gray-800 dark:text-gray-200">Upload Resumes</h2>
          </div>
          <label className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-dashed cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
            <FileText className="h-4 w-4" />
            <span>Select files</span>
            <input type="file" className="hidden" accept=".pdf,.docx,.txt" multiple onChange={handleUpload} disabled={loading} />
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Accepted: .pdf, .docx, .txt</p>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" /> Uploads respect your subscription limits
          </div>
        </div>

        {/* Create requirement */}
        <form className="col-span-1 p-5 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow ring-1 ring-gray-100 dark:ring-gray-700 space-y-3" onSubmit={handleCreateOrUpdate}>
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-gray-800 dark:text-gray-200">{isEditing ? 'Edit Requirement' : 'Create Requirement'}</h2>
            {isEditing && (
              <button type="button" className="text-sm text-gray-600 dark:text-gray-300 hover:underline" onClick={cancelEdit}>Cancel</button>
            )}
          </div>
          <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Job Title" className="w-full p-2 rounded-md border dark:bg-gray-700" required />
          <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Description (optional)" className="w-full p-2 rounded-md border dark:bg-gray-700" />
          <textarea value={formJson} onChange={(e) => setFormJson(e.target.value)} placeholder='Requirement JSON, e.g. {"skills":["React","SQL"], "min_years":2}' className="w-full p-2 rounded-md border dark:bg-gray-700 h-28" required />
          <input value={formModel} onChange={(e) => setFormModel(e.target.value)} placeholder="gpt-4o-mini" className="w-full p-2 rounded-md border dark:bg-gray-700" />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition" disabled={loading}>{isEditing ? 'Save' : 'Create'}</button>
            <button type="button" className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:underline" onClick={() => refresh()}>Refresh</button>
          </div>
        </form>

        {/* Select requirement and match */}
        <div className="col-span-1 p-5 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow ring-1 ring-gray-100 dark:ring-gray-700 space-y-3">
          <h2 className="font-medium text-gray-800 dark:text-gray-200">Match Resumes</h2>
          <select className="w-full p-2 rounded-md border dark:bg-gray-700" value={selectedRequirementId} onChange={(e) => setSelectedRequirementId(e.target.value)}>
            {requirements.length === 0 && <option value="">Create a requirement first</option>}
            {requirements.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={handleMatch} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition disabled:opacity-60" disabled={loading || !selectedRequirementId || selectedCount === 0}>
              Match {selectedCount > 0 ? `(${selectedCount})` : ''}
            </button>
            <button onClick={startEditSelected} disabled={!selectedRequirementId} className="px-3 py-2 text-sm border rounded-md dark:border-gray-600 disabled:opacity-60">Edit selected</button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Select resumes below to enable matching.</p>
        </div>
      </div>

      {/* Resumes list */}
      <div className="p-5 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow ring-1 ring-gray-100 dark:ring-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-gray-800 dark:text-gray-200">Your Resumes</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">Selected: {selectedCount}</span>
        </div>
        {resumes.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No resumes yet. Upload files to get started.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((r) => (
              <label key={r.id} className={`p-3 rounded-lg border cursor-pointer transition dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedResumeIds.includes(r.id) ? 'ring-2 ring-indigo-500' : ''}`}>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" checked={selectedResumeIds.includes(r.id)} onChange={() => toggleResume(r.id)} />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{r.original_filename}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(r.created_at).toLocaleString()} • {r.file_type}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Matches table */}
      {matches.length > 0 && (
        <div className="p-5 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow ring-1 ring-gray-100 dark:ring-gray-700">
          <h2 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Matches</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-300">
                  <th className="p-2">Resume</th>
                  <th className="p-2 w-48">Score</th>
                  <th className="p-2">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  const res = resumes.find((r) => r.id === m.resume_id);
                  const score = Math.round(m.score || 0);
                  return (
                    <tr key={m.id} className="border-t dark:border-gray-700">
                      <td className="p-2 text-gray-900 dark:text-gray-100">{res?.original_filename || m.resume_id}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded">
                            <div className="h-2 bg-indigo-600 rounded" style={{ width: `${Math.min(100, Math.max(0, score))}%` }}></div>
                          </div>
                          <span className="w-10 text-right text-gray-900 dark:text-gray-100 font-medium">{score}</span>
                        </div>
                      </td>
                      <td className="p-2 text-gray-700 dark:text-gray-300">{m.rationale || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History */}
      <div className="p-5 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow ring-1 ring-gray-100 dark:ring-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-gray-800 dark:text-gray-200">Match History</h2>
          <div className="text-xs text-gray-500 dark:text-gray-400">{history.length} items{selectedRequirementId ? ' • filtered by selected requirement' : ''}</div>
        </div>
        {history.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No history yet. Run a match to see records here.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-300">
                  <th className="p-2">When</th>
                  <th className="p-2">Requirement</th>
                  <th className="p-2">Resume</th>
                  <th className="p-2 w-32">Score</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const res = resumes.find((r) => r.id === h.resume_id);
                  const req = requirements.find((r) => r.id === h.requirement_id);
                  const score = Math.round(h.score || 0);
                  return (
                    <tr key={h.id} className="border-t dark:border-gray-700">
                      <td className="p-2 text-gray-700 dark:text-gray-300">{new Date(h.created_at).toLocaleString()}</td>
                      <td className="p-2 text-gray-900 dark:text-gray-100">{req?.title || h.requirement_id}</td>
                      <td className="p-2 text-gray-900 dark:text-gray-100">{res?.original_filename || h.resume_id}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded">
                            <div className="h-2 bg-indigo-600 rounded" style={{ width: `${Math.min(100, Math.max(0, score))}%` }}></div>
                          </div>
                          <span className="w-10 text-right text-gray-900 dark:text-gray-100 font-medium">{score}</span>
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

