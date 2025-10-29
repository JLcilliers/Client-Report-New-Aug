'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react'

export default function DebugGoogleAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<string | null>(null)

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/google-accounts')
      if (!response.ok) throw new Error('Failed to fetch accounts')
      
      const data = await response.json()
      setAccounts(data.accounts || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = async (accountId: string) => {
    try {
      setRefreshing(accountId)
      const response = await fetch(`/api/admin/google-accounts/${accountId}/refresh`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to refresh token')
      await fetchAccounts()
    } catch (err: any) {
      } finally {
      setRefreshing(null)
    }
  }

  const deleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return
    
    try {
      const response = await fetch(`/api/admin/google-accounts/${accountId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete account')
      await fetchAccounts()
    } catch (err: any) {
      }
  }

  const addAccount = () => {
    window.location.href = '/api/auth/google/add-account'
  }

  useEffect(() => {
    fetchAccounts()
    // Refresh every 30 seconds
    const interval = setInterval(fetchAccounts, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="p-8">Loading accounts...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Debug: Google Accounts ({accounts.length})</span>
            <div className="space-x-2">
              <Button onClick={fetchAccounts} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={addAccount} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No Google accounts connected. Click "Add Account" to connect one.
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold">{account.providerAccountId}</div>
                      <div className="text-sm text-gray-500">
                        ID: {account.id}
                      </div>
                      <div className="text-sm mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <span>Status:</span>
                          {account.is_active ? (
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center text-red-600">
                              <XCircle className="h-4 w-4 mr-1" />
                              Expired
                            </span>
                          )}
                        </div>
                        <div>Token Expires: {account.expires_at ? new Date(account.expires_at * 1000).toLocaleString() : 'Unknown'}</div>
                        <div>Has Refresh Token: {account.refresh_token ? 'Yes' : 'No'}</div>
                        <div>Scope: {account.scope ? account.scope.split(' ').length + ' permissions' : 'Unknown'}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => refreshToken(account.id)}
                        disabled={refreshing === account.id || !account.refresh_token}
                        variant="outline"
                        size="sm"
                      >
                        {refreshing === account.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => deleteAccount(account.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Information:</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify({ 
            totalAccounts: accounts.length,
            accounts: accounts.map(a => ({
              id: a.id,
              email: a.providerAccountId,
              active: a.is_active,
              hasRefreshToken: !!a.refresh_token
            }))
          }, null, 2)}
        </pre>
      </div>
    </div>
  )
}