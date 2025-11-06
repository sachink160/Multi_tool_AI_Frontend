import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/api';
import { ImageRecord } from '../../types';
import { Download, Image as ImageIcon, Loader2, RefreshCw, Trash2 } from 'lucide-react';

const AIImagesPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [steps, setSteps] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ImageRecord[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const canGenerate = useMemo(() => prompt.trim().length > 0 && !isLoading, [prompt, isLoading]);

  const fetchHistory = async () => {
    const items = await apiService.listImageHistory();
    setHistory(items);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Build preview URLs from authorized downloads whenever history changes
  useEffect(() => {
    let isCancelled = false;

    async function loadPreviews() {
      // revoke existing URLs
      Object.values(imageUrls).forEach((u) => URL.revokeObjectURL(u));
      const next: Record<string, string> = {};
      await Promise.all(
        history.map(async (item) => {
          try {
            const blob = await apiService.downloadImage(item.id);
            if (!isCancelled) next[item.id] = URL.createObjectURL(blob);
          } catch {
            // ignore preview fetch errors
          }
        })
      );
      if (!isCancelled) setImageUrls(next);
    }

    if (history.length > 0) {
      loadPreviews();
    } else {
      // clear
      Object.values(imageUrls).forEach((u) => URL.revokeObjectURL(u));
      setImageUrls({});
    }

    return () => {
      isCancelled = true;
      Object.values(imageUrls).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [history]);

  const onGenerate = async () => {
    if (!canGenerate) return;
    setIsLoading(true);
    try {
      await apiService.generateImage({
        prompt,
        negative_prompt: negativePrompt || undefined,
        width,
        height,
        guidance_scale: guidanceScale,
        num_inference_steps: steps,
      });
      await fetchHistory();
      setPrompt('');
    } catch (e: any) {
      alert(e.message || 'Generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const onDownload = async (image: ImageRecord) => {
    try {
      const blob = await apiService.downloadImage(image.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.output_path.split('/').pop() || 'image.png';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message || 'Download failed');
    }
  };

  const onDelete = async (image: ImageRecord) => {
    const confirmDelete = window.confirm('Delete this image from your history? This cannot be undone.');
    if (!confirmDelete) return;
    try {
      await apiService.deleteImage(image.id);
      // Revoke and remove local preview URL for this image
      const url = imageUrls[image.id];
      if (url) {
        URL.revokeObjectURL(url);
      }
      const { [image.id]: _, ...rest } = imageUrls;
      setImageUrls(rest);
      await fetchHistory();
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-primary" /> AI Images
        </h1>
        <p className="text-secondary">Generate images with FLUX and view your history (3 images/month default).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 card space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="input-field resize-none"
              placeholder="Describe the image you want..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Negative Prompt (optional)</label>
            <input
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="input-field"
              placeholder="cartoon, anime, sketch, painting, 3D render, unrealistic lighting..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-secondary mb-1">Width</label>
              <input 
                type="number" 
                value={width} 
                onChange={(e) => setWidth(parseInt(e.target.value || '0', 10))} 
                className="input-field text-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Height</label>
              <input 
                type="number" 
                value={height} 
                onChange={(e) => setHeight(parseInt(e.target.value || '0', 10))} 
                className="input-field text-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Guidance</label>
              <input 
                type="number" 
                step="0.1" 
                value={guidanceScale} 
                onChange={(e) => setGuidanceScale(parseFloat(e.target.value || '0'))} 
                className="input-field text-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Steps</label>
              <input 
                type="number" 
                value={steps} 
                onChange={(e) => setSteps(parseInt(e.target.value || '0', 10))} 
                className="input-field text-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onGenerate} 
              disabled={!canGenerate} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                canGenerate 
                  ? 'btn-primary' 
                  : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                </span>
              ) : (
                'Generate'
              )}
            </button>
            <button 
              onClick={fetchHistory} 
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold text-primary mb-3">History</h2>
          {history.length === 0 ? (
            <p className="text-secondary">No images yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 transition-colors duration-200"
                >
                  <div className="bg-gray-50 dark:bg-gray-900 p-2 text-xs text-secondary truncate">
                    {item.prompt}
                  </div>
                  <div className="aspect-square bg-gray-100 dark:bg-gray-900/50 flex items-center justify-center">
                    {imageUrls[item.id] ? (
                      <img
                        src={imageUrls[item.id]}
                        alt={item.prompt}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-xs text-muted">Loading...</span>
                    )}
                  </div>
                  <div className="p-2 flex items-center justify-between bg-white dark:bg-gray-800">
                    <span className="text-xs text-secondary">{item.width}×{item.height}</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => onDownload(item)} 
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm transition-colors duration-200"
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>
                      <button 
                        onClick={() => onDelete(item)} 
                        className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIImagesPage;
