import React, { useState, useEffect } from 'react';
import { Check, Crown, Star, Zap, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import { SubscriptionPlan, UserSubscription, UsageInfo } from '../../types';

interface SubscriptionPageProps {
  onSubscriptionChange?: () => void;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ onSubscriptionChange }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setError(null);
      const [plansData, usageData] = await Promise.all([
        apiService.getSubscriptionPlans(),
        apiService.getUserUsage()
      ]);
      
      setPlans(plansData);
      setUsage(usageData);
      
      // Try to get current subscription
      try {
        const subscriptionData = await apiService.getUserSubscription();
        setCurrentSubscription(subscriptionData);
      } catch (error) {
        // User might not have a subscription
        setCurrentSubscription(null);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setError('Failed to load subscription data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setSubscribing(true);
    setError(null);
    try {
      const result = await apiService.subscribeToPlan(planId);
      await loadSubscriptionData(); // Reload data
      
      // Show success message
      alert(`Successfully subscribed to ${result.plan_name} plan!`);
      
      // Notify parent component to refresh dashboard
      if (onSubscriptionChange) {
        onSubscriptionChange();
      }
      
      // Optionally redirect to dashboard
      // window.location.href = '/dashboard';
      
    } catch (error: any) {
      console.error('Error subscribing:', error);
      const errorMessage = error.message || 'Failed to subscribe. Please try again.';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }
    
    try {
      setError(null);
      await apiService.cancelSubscription();
      await loadSubscriptionData(); // Reload data
      
      // Show success message
      alert('Subscription cancelled successfully');
      
      // Notify parent component to refresh dashboard
      if (onSubscriptionChange) {
        onSubscriptionChange();
      }
      
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      const errorMessage = error.message || 'Failed to cancel subscription. Please try again.';
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return <Zap className="h-8 w-8 text-blue-600" />;
      case 'pro':
        return <Star className="h-8 w-8 text-purple-600" />;
      case 'enterprise':
        return <Crown className="h-8 w-8 text-yellow-600" />;
      default:
        return <Check className="h-8 w-8 text-green-600" />;
    }
  };

  const formatFeatures = (features: string) => {
    try {
      const parsedFeatures = JSON.parse(features);
      return Array.isArray(parsedFeatures) ? parsedFeatures : [features];
    } catch {
      return [features];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock the full potential of our AI tools with our flexible subscription plans
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Current Usage */}
        {usage && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Current Usage</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{usage.chats_used}</div>
                <div className="text-sm text-gray-600">Chats Used</div>
                <div className="text-xs text-gray-500">/ {usage.max_chats}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{usage.documents_uploaded}</div>
                <div className="text-sm text-gray-600">Documents</div>
                <div className="text-xs text-gray-500">/ {usage.max_documents}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{usage.hr_documents_uploaded}</div>
                <div className="text-sm text-gray-600">HR Documents</div>
                <div className="text-xs text-gray-500">/ {usage.max_hr_documents}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{usage.video_uploads}</div>
                <div className="text-sm text-gray-600">Videos</div>
                <div className="text-xs text-gray-500">/ {usage.max_video_uploads}</div>
              </div>
            </div>
          </div>
        )}

        {/* Current Subscription Status */}
        {currentSubscription && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-2">
                  Current Plan: {currentSubscription.plan_name}
                </h2>
                <p className="text-blue-100">
                  Valid until {new Date(currentSubscription.end_date).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={handleCancelSubscription}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-lg p-8 relative ${
                currentSubscription?.plan_name === plan.name
                  ? 'ring-2 ring-blue-500 scale-105'
                  : 'hover:scale-105 transition-transform'
              }`}
            >
              {currentSubscription?.plan_name === plan.name && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-blue-600 mb-1">
                  ${plan.price}
                </div>
                <div className="text-gray-600">per month</div>
              </div>

              <div className="space-y-4 mb-8">
                {formatFeatures(plan.features).map((feature: string, index: number) => (
                  <div key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {currentSubscription?.plan_name === plan.name ? (
                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-600 py-3 rounded-lg font-medium cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscribing}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {subscribing ? 'Processing...' : 'Subscribe Now'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Free Tier Info */}
        <div className="mt-12 text-center">
          <div className="bg-gray-50 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Free Tier</h3>
            <p className="text-gray-600 mb-6">
              Start with our free tier and experience the power of our AI tools
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">10</div>
                <div className="text-gray-600">AI Chats</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">2</div>
                <div className="text-gray-600">Documents</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">2</div>
                <div className="text-gray-600">HR Documents</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">1</div>
                <div className="text-gray-600">Video</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
