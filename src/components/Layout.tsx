import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Home, 
  FileText, 
  MessageSquare, 
  Users, 
  Video, 
  User, 
  LogOut,
  Bot,
  CreditCard,
  Zap,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const baseNavigation = [
    { name: 'Dashboard', id: 'dashboard', icon: Home },
    { name: 'Document Q&A', id: 'documents', icon: FileText },
    { name: 'AI Chatbot', id: 'chatbot', icon: Bot },
    { name: 'Dynamic Prompts', id: 'dynamic-prompts', icon: Zap },
    { name: 'AI Images', id: 'ai-images', icon: ImageIcon },
    { name: 'Resume Matching', id: 'resume', icon: Users },
    { name: 'HR Tools', id: 'hr', icon: Users },
    { name: 'Video Processing', id: 'video', icon: Video },
    { name: 'Subscription', id: 'subscription', icon: CreditCard },
    { name: 'Profile', id: 'profile', icon: User },
  ];

  const navigation = [
    ...baseNavigation.slice(0, 1),
    // Insert CRM after Dashboard for admins
    ...(user?.user_type && user.user_type.toLowerCase() === 'admin' ? [{ name: 'CRM', id: 'crm', icon: MessageSquare }] : []),
    ...baseNavigation.slice(1),
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Multi-Tool AI</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-8 flex-1 space-y-2 px-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-xl">
          <div className="flex items-center h-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700">
            <Bot className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">Multi-Tool AI</span>
          </div>
          <nav className="mt-8 flex-1 space-y-2 px-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 flex items-center justify-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Multi-Tool AI</h1>
          </div>
          <div className="px-4">
            <ThemeToggle />
          </div>
        </div>
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;