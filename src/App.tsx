import React, { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './components/pages/LoginPage';
import DashboardPage from './components/pages/DashboardPage';
import DocumentsPage from './components/pages/DocumentsPage';
import ChatbotPage from './components/pages/ChatbotPage';
import DynamicPromptsPage from './components/pages/DynamicPromptsPage';
import HRPage from './components/pages/HRPage';
import VideoPage from './components/pages/VideoPage';
import ProfilePage from './components/pages/ProfilePage';
import SubscriptionPage from './components/pages/SubscriptionPage';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to trigger dashboard refresh
  const handleSubscriptionChange = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage key={refreshKey} />;
      case 'documents':
        return <DocumentsPage />;
      case 'chatbot':
        return <ChatbotPage />;
      case 'dynamic-prompts':
        return <DynamicPromptsPage />;
      case 'hr':
        return <HRPage />;
      case 'video':
        return <VideoPage />;
      case 'profile':
        return <ProfilePage />;
      case 'subscription':
        return <SubscriptionPage onSubscriptionChange={handleSubscriptionChange} />;
      default:
        return <DashboardPage key={refreshKey} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderCurrentPage()}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;