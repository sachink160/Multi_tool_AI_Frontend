import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Trash2, CheckCircle, XCircle, Save, X, Eye, EyeOff } from 'lucide-react';
import { apiService } from '../../services/api';
import { MasterSettings, MasterSettingsCreate, MasterSettingsUpdate } from '../../types';

// Common API key suggestions
const COMMON_API_KEYS = [
  'OPENAI_API_KEY',
  'HF_TOKEN',
  'ANTHROPIC_API_KEY',
  'GOOGLE_API_KEY',
  'AZURE_OPENAI_API_KEY',
  'COHERE_API_KEY',
  'PALM_API_KEY',
  'GEMINI_API_KEY',
  'CLAUDE_API_KEY',
  'STABILITY_API_KEY',
  'REPLICATE_API_TOKEN',
  'TOGETHER_API_KEY',
];

const MasterSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<MasterSettings[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSetting, setEditingSetting] = useState<MasterSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState<MasterSettingsCreate>({
    name: '',
    value: '',
    is_active: true,
  });

  useEffect(() => {
    fetchSettings();
  }, [includeInactive]);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getMasterSettings(includeInactive);
      setSettings(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch settings');
      console.error('Failed to fetch settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.value.trim()) {
      setError('Name and value are required');
      return;
    }

    setError(null);
    try {
      const newSetting = await apiService.createMasterSetting(formData);
      setSettings([...settings, newSetting]);
      setFormData({ name: '', value: '', is_active: true });
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to create setting');
      console.error('Failed to create setting:', err);
    }
  };

  const handleUpdate = async () => {
    if (!editingSetting) return;

    const update: MasterSettingsUpdate = {
      value: formData.value,
      is_active: formData.is_active,
    };

    setError(null);
    try {
      const updated = await apiService.updateMasterSetting(editingSetting.name, update);
      setSettings(settings.map(s => s.id === updated.id ? updated : s));
      setEditingSetting(null);
      setFormData({ name: '', value: '', is_active: true });
    } catch (err: any) {
      setError(err?.message || 'Failed to update setting');
      console.error('Failed to update setting:', err);
    }
  };

  const handleDelete = async (settingName: string) => {
    if (!confirm(`Are you sure you want to delete the setting "${settingName}"?`)) {
      return;
    }

    setError(null);
    try {
      await apiService.deleteMasterSetting(settingName);
      setSettings(settings.filter(s => s.name !== settingName));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete setting');
      console.error('Failed to delete setting:', err);
    }
  };

  const handleActivate = async (settingName: string) => {
    setError(null);
    try {
      const updated = await apiService.activateMasterSetting(settingName);
      setSettings(settings.map(s => s.id === updated.id ? updated : s));
    } catch (err: any) {
      setError(err?.message || 'Failed to activate setting');
      console.error('Failed to activate setting:', err);
    }
  };

  const startEdit = (setting: MasterSettings) => {
    setEditingSetting(setting);
    setFormData({
      name: setting.name,
      value: setting.value,
      is_active: setting.is_active,
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingSetting(null);
    setFormData({ name: '', value: '', is_active: true });
    setShowCreateForm(false);
  };

  const toggleValueVisibility = (settingId: string) => {
    setShowValues(prev => ({
      ...prev,
      [settingId]: !prev[settingId],
    }));
  };

  const maskValue = (value: string): string => {
    if (value.length <= 4) return '****';
    return value.substring(0, 2) + '****' + value.substring(value.length - 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Master Settings</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage your API keys and configuration settings</p>
          </div>
          <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Show inactive settings</span>
            </label>
          </div>
          <button
            onClick={() => {
              cancelEdit();
              setShowCreateForm(!showCreateForm);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>New Setting</span>
          </button>
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingSetting) && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingSetting ? 'Edit Setting' : 'Create New Setting'}
            </h3>
            <div className="space-y-4">
              {!editingSetting && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    list="api-key-suggestions"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., OPENAI_API_KEY"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="api-key-suggestions">
                    {COMMON_API_KEYS.map((key) => (
                      <option key={key} value={key} />
                    ))}
                  </datalist>
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick select:</p>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_API_KEYS.map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormData({ ...formData, name: key })}
                          className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {editingSetting && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name (read-only)
                  </label>
                  <input
                    type="text"
                    value={editingSetting.name}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Value
                </label>
                <textarea
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="Enter setting value"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={editingSetting ? handleUpdate : handleCreate}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingSetting ? 'Update' : 'Create'}</span>
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings List */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Settings</h2>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading settings...</p>
          </div>
        ) : settings.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No settings found. Create your first setting to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className={`p-4 rounded-lg border ${
                  setting.is_active
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {setting.name}
                      </h3>
                      {setting.is_active ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          setting.is_active
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {setting.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Value:</span>
                      <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {showValues[setting.id]
                          ? setting.value
                          : maskValue(setting.value)}
                      </code>
                      <button
                        onClick={() => toggleValueVisibility(setting.id)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showValues[setting.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Created: {new Date(setting.created_at).toLocaleString()} | Updated:{' '}
                      {new Date(setting.updated_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!setting.is_active && (
                      <button
                        onClick={() => handleActivate(setting.name)}
                        className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        title="Activate"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(setting)}
                      className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(setting.name)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterSettingsPage;

