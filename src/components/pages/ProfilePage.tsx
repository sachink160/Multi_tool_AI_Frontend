import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Settings, Activity, FileText, MessageSquare, Video, Users, CreditCard, Crown, Edit3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { UserProfile, UsageInfo } from '../../types';
import EditProfile from './EditProfile';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    documents: 0,
    hrDocuments: 0,
    videos: 0,
    chats: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [profile, documents, hrDocuments, videos, chatHistory] = await Promise.all([
          apiService.getUserProfile().catch(() => null),
          apiService.getDocuments().catch(() => []),
          apiService.getHRDocuments().catch(() => []),
          apiService.getUploadedVideos().catch(() => []),
          apiService.getChatHistory().catch(() => []),
        ]);

        setUserProfile(profile);
        setStats({
          documents: documents.length,
          hrDocuments: hrDocuments.length,
          videos: videos.length,
          chats: chatHistory.length,
        });
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleProfileUpdateSuccess = async () => {
    setShowEditProfile(false);
    // Refresh user data after successful update
    try {
      const profile = await apiService.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const activityItems = [
    {
      icon: FileText,
      label: 'Documents Uploaded',
      value: stats.documents,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      icon: Users,
      label: 'HR Documents',
      value: stats.hrDocuments,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
    },
    {
      icon: Video,
      label: 'Videos Processed',
      value: stats.videos,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    },
    {
      icon: MessageSquare,
      label: 'Chat Sessions',
      value: stats.chats,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/20">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your account and view your activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Information</h2>
              <Settings className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>

            {/* Subscription Status */}
            {userProfile && (
              <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription Status</h3>
                  {userProfile.is_subscribed ? (
                    <span className="flex items-center text-green-600 dark:text-green-400 font-medium">
                      <Crown className="h-5 w-5 mr-2" />
                      Subscribed
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-600 dark:text-gray-400 font-medium">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Free Tier
                    </span>
                  )}
                </div>
                
                {userProfile.is_subscribed && userProfile.subscription_end_date && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Valid until: {formatDate(userProfile.subscription_end_date)}
                  </p>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {userProfile.current_usage.chats_used}/{userProfile.current_usage.max_chats}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">AI Chats</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {userProfile.current_usage.documents_uploaded}/{userProfile.current_usage.max_documents}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Documents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {userProfile.current_usage.hr_documents_uploaded}/{userProfile.current_usage.max_hr_documents}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">HR Documents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {userProfile.current_usage.video_uploads}/{userProfile.current_usage.max_video_uploads}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Videos</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Profile Picture and Basic Info */}
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {/* {user?.username.charAt(0).toUpperCase()} */}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.username}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{user?.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Member since {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Detailed Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Username</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{user?.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Created</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Last Updated</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
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
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Activity Summary</h2>
            <Activity className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
              <p>Loading stats...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activityItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className={`p-2 rounded-full ${item.bgColor}`}>
                      <Icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setShowEditProfile(true)}
            className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <Edit3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Edit Profile</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
            <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Activity Log</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
            <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Email Preferences</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfile
          onClose={() => setShowEditProfile(false)}
          onSuccess={handleProfileUpdateSuccess}
        />
      )}
    </div>
  );
};

export default ProfilePage;