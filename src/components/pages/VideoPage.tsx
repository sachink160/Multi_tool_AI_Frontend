import React, { useState, useEffect } from 'react';
import { Upload, Video, Music, Download, Clock, FileVideo, Headphones } from 'lucide-react';
import { apiService } from '../../services/api';
import { VideoFile, ProcessedFile } from '../../types';

const VideoPage: React.FC = () => {
  const [uploadedVideos, setUploadedVideos] = useState<VideoFile[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const [uploaded, processed] = await Promise.all([
        apiService.getUploadedVideos(),
        apiService.getProcessedFiles(),
      ]);
      setUploadedVideos(uploaded);
      setProcessedFiles(processed);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await apiService.uploadVideo(file);
      await fetchFiles(); // Refresh the file lists
      event.target.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const userId = 'current'; // You might want to get this from auth context
      const blob = await apiService.downloadProcessedFile(userId, filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const videoFiles = processedFiles.filter(f => f.type === 'video');
  const audioFiles = processedFiles.filter(f => f.type === 'audio');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Processing</h1>
        <p className="text-gray-600">Upload videos to extract audio and create 720p versions</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Upload Video</h2>
          <Video className="h-6 w-6 text-blue-600" />
        </div>
        
        <div className="relative">
          <input
            type="file"
            accept="video/mp4,video/mov,video/avi,video/mkv"
            onChange={handleVideoUpload}
            className="hidden"
            id="video-upload"
          />
          <label
            htmlFor="video-upload"
            className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Click to upload video file</p>
              <p className="text-xs text-gray-500">MP4, MOV, AVI, MKV</p>
            </div>
          </label>
        </div>

        {isUploading && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-600">Uploading and processing video...</span>
            </div>
            <p className="text-xs text-blue-500 mt-1">This may take a few minutes depending on file size</p>
          </div>
        )}
      </div>

      {/* File Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Uploaded Videos */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FileVideo className="h-5 w-5 mr-2 text-blue-600" />
            Uploaded Videos
          </h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p>Loading...</p>
              </div>
            ) : uploadedVideos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileVideo className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No videos uploaded yet</p>
              </div>
            ) : (
              uploadedVideos.map((video, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileVideo className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{video.filename}</p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(video.upload_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">{formatFileSize(video.size)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Processed Videos */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Video className="h-5 w-5 mr-2 text-green-600" />
            Processed Videos (720p)
          </h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {videoFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Video className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No processed videos yet</p>
              </div>
            ) : (
              videoFiles.map((video, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Video className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{video.filename}</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(video.processed_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">{formatFileSize(video.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(video.filename)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Extracted Audio */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Music className="h-5 w-5 mr-2 text-purple-600" />
            Extracted Audio
          </h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {audioFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Headphones className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No audio files yet</p>
              </div>
            ) : (
              audioFiles.map((audio, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Music className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{audio.filename}</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(audio.processed_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">{formatFileSize(audio.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(audio.filename)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage;