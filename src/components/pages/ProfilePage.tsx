import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Settings, Activity, FileText, MessageSquare, Video, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    documents: 0,
    hrDocuments: 0,
    videos: 0,
    chats: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const [documents, hrDocuments, videos, chatHistory] = await Promise.all([
          apiService.getDocuments().catch(() => []),
          apiService.getHRDocuments().catch(() => []),
          apiService.getUploadedVideos().catch(() => []),
          apiService.getChatHistory().catch(() => []),
        ]);

        setStats({
          documents: documents.length,
          hrDocuments: hrDocuments.length,
          videos: videos.length,
          chats: chatHistory.length,
        });
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const activityItems = [
    {
      icon: FileText,
      label: 'Documents Uploaded',
      value: stats.documents,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Users,
      label: 'HR Documents',
      value: stats.hrDocuments,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Video,
      label: 'Videos Processed',
      value: stats.videos,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: MessageSquare,
      label: 'Chat Sessions',
      value: stats.chats,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account and view your activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              <Settings className="h-5 w-5 text-gray-400" />
            </div>

            <div className="space-y-6">
              {/* Profile Picture and Basic Info */}
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {/* {user?.username.charAt(0).toUpperCase()} */}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{user?.username}</h3>
                  <p className="text-gray-600">{user?.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Member since {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Detailed Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Username</p>
                      <p className="text-sm text-gray-600">{user?.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Created</p>
                      <p className="text-sm text-gray-600">
                        {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Activity className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Updated</p>
                      <p className="text-sm text-gray-600">
                        {user?.updated_at ? formatDate(user.updated_at) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Activity Summary</h2>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Loading stats...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activityItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${item.bgColor}`}>
                      <Icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Settings className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Account Settings</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <Activity className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-900">Activity Log</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Mail className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">Email Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;