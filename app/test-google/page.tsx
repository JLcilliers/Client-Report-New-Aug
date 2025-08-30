'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function TestGoogle() {
  const { data: session, status } = useSession();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchAccounts();
    }
  }, [session]);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/google-accounts');
      const data = await res.json();
      if (res.ok) {
        setAccounts(data.accounts || []);
      } else {
        setError(data.error || 'Failed to fetch accounts');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (accountId: string) => {
    try {
      const res = await fetch(`/api/google-accounts?id=${accountId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchAccounts(); // Refresh the list
      }
    } catch (err) {
      console.error('Failed to delete account:', err);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Google Account Test Page</h1>
        
        {!session ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="mb-4">You are not signed in</p>
            <button 
              onClick={() => signIn('google')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Session Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Email:</span> {session.user?.email}</p>
                <p><span className="font-medium">Name:</span> {session.user?.name}</p>
                <p><span className="font-medium">User ID:</span> {session.user?.id}</p>
              </div>
              <button 
                onClick={() => signOut()}
                className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Sign out
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Saved Google Accounts</h2>
                <button
                  onClick={fetchAccounts}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                >
                  Refresh
                </button>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              {loading ? (
                <p>Loading accounts...</p>
              ) : accounts.length > 0 ? (
                <div className="space-y-3">
                  {accounts.map((acc) => (
                    <div key={acc.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{acc.email}</p>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(acc.createdAt).toLocaleDateString()}
                        </p>
                        {acc.expiresAt && (
                          <p className="text-sm text-gray-500">
                            Token expires: {new Date(acc.expiresAt * 1000).toLocaleString()}
                          </p>
                        )}
                        {acc.scope && (
                          <p className="text-xs text-gray-400 mt-1">
                            Scopes: {acc.scope.split(' ').slice(0, 3).join(', ')}...
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteAccount(acc.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No Google accounts saved yet. Sign in to add one.</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">API Endpoint Test</h3>
              <p className="text-sm text-blue-700">
                The /api/google-accounts endpoint is {accounts.length > 0 ? 'working' : 'accessible'}.
                {accounts.length > 0 && ` Found ${accounts.length} account(s).`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}