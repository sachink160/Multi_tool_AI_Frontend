import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { CrmMetrics } from '../../types';

const CRMPage: React.FC = () => {
  const { user } = useAuth();
  const [guardMessage, setGuardMessage] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<CrmMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simple client-side guard: only allow admins (user_type === 'admin')
    if (user && user.user_type && user.user_type.toLowerCase() !== 'admin') {
      setGuardMessage('You do not have permission to access the CRM module.');
    } else {
      setGuardMessage(null);
    }
  }, [user]);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (guardMessage) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await apiService.getCrmMetrics();
        setMetrics(data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load CRM metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardMessage]);

  if (guardMessage) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-300" role="alert">
          {guardMessage}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="p-4 text-sm text-gray-700 bg-gray-100 rounded-lg dark:bg-gray-800 dark:text-gray-300">Loading CRM metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-300">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">CRM</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Key subscription and usage metrics.</p>
      </div>

      {metrics && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Total Users</h2>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{metrics.users.total}</p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Admins: {metrics.users.admins}</p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Free: {metrics.users.free_users} • Paid: {metrics.users.paid_users}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Active Subscriptions</h2>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{metrics.subscriptions.active}</p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Expiring 7d: {metrics.subscriptions.expiring_7_days}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Churn (30d)</h2>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{metrics.subscriptions.churned_30_days}</p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">New 7d: {metrics.users.new_last_7_days}</p>
            </div>
          </div>

          {metrics.subscriptions.plans && (
            <div className="rounded-xl bg-white/80 dark:bg-gray-800/80 shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Plans (active)</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(metrics.subscriptions.plans).map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700/40 px-3 py-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl bg-white/80 dark:bg-gray-800/80 shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Usage ({metrics.usage_month})</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Chats</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{metrics.usage.chats_used}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Documents</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{metrics.usage.documents_uploaded}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">HR Docs</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{metrics.usage.hr_documents_uploaded}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Videos</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{metrics.usage.video_uploads}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Dyn. Prompt Docs</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{metrics.usage.dynamic_prompt_documents_uploaded}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white/80 dark:bg-gray-800/80 shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Top Users (by chats)</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Username</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Chats</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {metrics.top_users.map((u) => (
                    <tr key={u.user_id}>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-200">{u.username}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-200">{u.chats_used}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-200">{u.documents_uploaded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(metrics.daily_signups || metrics.content_totals) && (
            <div className="grid gap-6 md:grid-cols-2">
              {metrics.daily_signups && (
                <div className="rounded-xl bg-white/80 dark:bg-gray-800/80 shadow p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Daily Signups (7d)</h3>
                  <div className="mt-3 space-y-2">
                    {metrics.daily_signups.map((d) => (
                      <div key={d.date} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{d.date}</span>
                        <span className="text-gray-900 dark:text-white font-medium">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {metrics.content_totals && (
                <div className="rounded-xl bg-white/80 dark:bg-gray-800/80 shadow p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Content Totals</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 px-3 py-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Documents</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">{metrics.content_totals.documents}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 px-3 py-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">HR Docs</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">{metrics.content_totals.hr_documents}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 px-3 py-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Dyn. Prompt Docs</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">{metrics.content_totals.dynamic_prompt_documents}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default CRMPage;

