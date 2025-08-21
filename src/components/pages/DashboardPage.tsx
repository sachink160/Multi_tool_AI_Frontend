import React, { useState, useEffect } from 'react';
import { FileText, MessageSquare, Users, Video, Activity, TrendingUp, Clock, Crown, CreditCard, AlertCircle, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Document, HRDocument, VideoFile, UserProfile } from '../../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    documents: 0,
    hrDocuments: 0,
    videos: 0,
    chats: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setSubscriptionError(null);
        const [profile, documents, hrDocuments, videos, chatHistory] = await Promise.all([
          apiService.getUserProfile().catch((error) => {
            console.error('Failed to fetch user profile:', error);
            setSubscriptionError('Failed to load subscription information');
            return null;
          }),
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

        // Create recent activity
        // const activity = [
        //   ...documents.slice(0, 3).map((doc: Document) => ({
        //     type: 'document',
        //     title: `Uploaded ${doc.filename}`,
        //     time: new Date(doc.upload_date).toLocaleDateString(),
        //     icon: FileText,
        //   })),
        //   ...hrDocuments.slice(0, 2).map((doc: HRDocument) => ({
        //     type: 'hr',
        //     title: `HR Document: ${doc.filename}`,
        //     time: new Date(doc.upload_date).toLocaleDateString(),
        //     icon: Users,
        //   })),
        //   ...videos.slice(0, 2).map((video: VideoFile) => ({
        //     type: 'video',
        //     title: `Processed ${video.filename}`,
        //     time: new Date(video.upload_date).toLocaleDateString(),
        //     icon: Video,
        //   })),
        // ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

        // setRecentActivity(activity);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setSubscriptionError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Documents',
      value: stats.documents,
      icon: FileText,
      color: 'blue',
      description: 'Total documents uploaded',
    },
    {
      title: 'HR Documents',
      value: stats.hrDocuments,
      icon: Users,
      color: 'green',
      description: 'HR documents managed',
    },
    {
      title: 'Videos Processed',
      value: stats.videos,
      icon: Video,
      color: 'purple',
      description: 'Videos processed',
    },
    {
      title: 'Chat Sessions',
      value: stats.chats,
      icon: MessageSquare,
      color: 'orange',
      description: 'AI chat interactions',
    },
  ];

  // Add subscription status card if user profile is available
  if (userProfile) {
    statCards.unshift({
      title: 'Subscription',
      value: userProfile.is_subscribed ? 'Active' : 'Free',
      icon: userProfile.is_subscribed ? Crown : CreditCard,
      color: userProfile.is_subscribed ? 'yellow' : 'gray',
      description: userProfile.is_subscribed ? 'Premium plan active' : 'Free tier limits',
    });
  }

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500 text-blue-600 bg-blue-50',
      green: 'bg-green-500 text-green-600 bg-green-50',
      purple: 'bg-purple-500 text-purple-600 bg-purple-50',
      orange: 'bg-orange-500 text-orange-600 bg-orange-50',
      yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-50',
      gray: 'bg-gray-500 text-gray-600 bg-gray-50',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.username || 'User'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your AI tools today.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-green-600">
            <Activity className="h-5 w-5" />
            <span className="text-sm font-medium">System Online</span>
          </div>
        </div>
      </div>

      {/* Subscription Error Alert */}
      {subscriptionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{subscriptionError}</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colors = getColorClasses(stat.color).split(' ');
          
          return (
            <div
              key={stat.title}
              className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-full ${colors[2]}`}>
                  <Icon className={`h-6 w-6 ${colors[1]}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription Status Card */}
      {userProfile && (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                userProfile.is_subscribed ? 'bg-yellow-500' : 'bg-gray-500'
              }`}>
                {userProfile.is_subscribed ? (
                  <Crown className="h-5 w-5 text-white" />
                ) : (
                  <CreditCard className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Plan Type</p>
                <p className="text-sm text-gray-600">
                  {userProfile.is_subscribed ? 'Premium' : 'Free Tier'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Status</p>
                <p className="text-sm text-gray-600">
                  {userProfile.is_subscribed ? 'Active' : 'Limited'}
                </p>
              </div>
            </div>
            {userProfile.subscription_end_date && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Valid Until</p>
                  <p className="text-sm text-gray-600">
                    {new Date(userProfile.subscription_end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Usage Summary */}
          {userProfile.current_usage && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Current Month Usage</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userProfile.current_usage.chats_used}</div>
                  <div className="text-sm text-gray-600">Chats Used</div>
                  <div className="text-xs text-gray-500">/ {userProfile.current_usage.max_chats}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{userProfile.current_usage.documents_uploaded}</div>
                  <div className="text-sm text-gray-600">Documents</div>
                  <div className="text-xs text-gray-500">/ {userProfile.current_usage.max_documents}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{userProfile.current_usage.hr_documents_uploaded}</div>
                  <div className="text-sm text-gray-600">HR Documents</div>
                  <div className="text-xs text-gray-500">/ {userProfile.current_usage.max_hr_documents}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{userProfile.current_usage.video_uploads}</div>
                  <div className="text-sm text-gray-600">Videos</div>
                  <div className="text-xs text-gray-500">/ {userProfile.current_usage.max_video_uploads}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <button className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-colors">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Upload Document</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-colors">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Start Chat</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg hover:from-purple-100 hover:to-violet-100 transition-colors">
              <Video className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-medium text-gray-900">Process Video</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg hover:from-orange-100 hover:to-amber-100 transition-colors">
              <Users className="h-5 w-5 text-orange-600" />
              <span className="text-sm text-medium text-gray-900">HR Tools</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Profile Summary */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {/* {user?.username.charAt(0).toUpperCase()} */}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Username</p>
              <p className="text-sm text-gray-600">{user?.username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white">@</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Email</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Member Since</p>
              <p className="text-sm text-gray-600">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;