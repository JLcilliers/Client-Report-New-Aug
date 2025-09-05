"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Globe,
  BarChart3,
  Settings,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

interface GoogleAccount {
  id: string
  account_email: string
  account_name?: string
  is_active: boolean
  created_at: string
  updated_at: string
  token_expiry?: string
  search_console_properties?: any[]
  analytics_properties?: any[]
  propertiesLoading?: boolean
  propertiesError?: string
}

export default function GoogleAccountsPage() {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [fetchingProperties, setFetchingProperties] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Check for OAuth callback parameters
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    const success = params.get('success')
    
    if (error) {
      console.error('[Frontend] OAuth callback error detected:', error);
      toast({
        title: "Authentication Error",
        description: error === 'callback_failed' 
          ? "Failed to complete authentication. Please try again." 
          : `Error: ${error}`,
        variant: "destructive"
      })
      // Clean up URL
      window.history.replaceState({}, '', '/admin/google-accounts')
    } else if (success) {
      console.log('[Frontend] OAuth callback success detected');
      toast({
        title: "Success",
        description: "Google account connected successfully!",
      })
      // Clean up URL
      window.history.replaceState({}, '', '/admin/google-accounts')
    }
    
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    console.log('[Frontend] Fetching Google accounts...');
    try {
      const response = await fetch('/api/admin/google-accounts')
      console.log('[Frontend] Fetch response status:', response.status);
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Frontend] Accounts data received:', data);
        console.log('[Frontend] Number of accounts:', data.accounts?.length || 0);
        const accountsData = data.accounts || [];
        
        // Auto-refresh expired tokens
        for (const account of accountsData) {
          if (account.token_expiry) {
            const expiryDate = new Date(account.token_expiry);
            const now = new Date();
            
            // If token is expired or will expire in next 5 minutes
            if (expiryDate <= new Date(now.getTime() + 5 * 60000)) {
              console.log(`[Frontend] Token expired/expiring for account ${account.id}, auto-refreshing...`);
              try {
                const refreshResponse = await fetch(`/api/admin/google-accounts/${account.id}/refresh`, {
                  method: 'POST'
                });
                
                if (refreshResponse.ok) {
                  const refreshData = await refreshResponse.json();
                  console.log(`[Frontend] Token refreshed successfully for account ${account.id}`);
                  // Update the account with new expiry
                  account.token_expiry = new Date(refreshData.expires_at * 1000).toISOString();
                  account.is_active = true;
                }
              } catch (refreshError) {
                console.error(`[Frontend] Failed to auto-refresh token for account ${account.id}:`, refreshError);
              }
            }
          }
        }
        
        setAccounts(accountsData)
        
        // Fetch properties for each account
        if (accountsData.length > 0) {
          fetchAllProperties(accountsData);
        }
      } else {
        const errorText = await response.text();
        console.error('[Frontend] Failed to fetch accounts!');
        console.error('  - Status:', response.status);
        console.error('  - Response:', errorText);
        throw new Error('Failed to fetch accounts')
      }
    } catch (error: any) {
      console.error('[Frontend] Error fetching accounts:', error);
      console.error('  - Message:', error.message);
      console.error('  - Stack:', error.stack);
      
      toast({
        title: "Error",
        description: "Failed to load Google accounts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addNewAccount = () => {
    console.log('[Frontend] Adding new account...');
    console.log('[Frontend] Redirecting to OAuth flow: /api/auth/google/add-account');
    // Redirect to OAuth flow
    window.location.href = '/api/auth/google/add-account'
  }

  const fetchAllProperties = async (accountsList: GoogleAccount[]) => {
    console.log('[Frontend] Fetching properties for all accounts...');
    try {
      const response = await fetch('/api/google/fetch-properties');
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Frontend] Properties data:', data);
        
        // Update accounts with properties
        const updatedAccounts = accountsList.map(account => {
          const propertyData = data.accounts?.find((p: any) => p.accountId === account.id);
          if (propertyData) {
            return {
              ...account,
              search_console_properties: propertyData.searchConsole || [],
              analytics_properties: propertyData.analytics || [],
              propertiesError: propertyData.error
            };
          }
          return account;
        });
        
        setAccounts(updatedAccounts);
      }
    } catch (error) {
      console.error('[Frontend] Error fetching properties:', error);
    }
  }

  const fetchPropertiesForAccount = async (accountId: string) => {
    setFetchingProperties(accountId);
    console.log('[Frontend] Fetching properties for account:', accountId);
    
    try {
      const response = await fetch(`/api/google/fetch-properties?accountId=${accountId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Frontend] Properties for account:', data);
        
        // Update the specific account with properties
        setAccounts(prevAccounts => 
          prevAccounts.map(account => {
            if (account.id === accountId) {
              return {
                ...account,
                search_console_properties: data.properties?.searchConsole || [],
                analytics_properties: data.properties?.analytics || []
              };
            }
            return account;
          })
        );
        
        toast({
          title: "Success",
          description: "Properties fetched successfully"
        });
      } else {
        throw new Error('Failed to fetch properties');
      }
    } catch (error) {
      console.error('[Frontend] Error fetching properties:', error);
      toast({
        title: "Error",
        description: "Failed to fetch properties",
        variant: "destructive"
      });
    } finally {
      setFetchingProperties(null);
    }
  }

  const refreshAccount = async (accountId: string) => {
    setRefreshing(accountId)
    try {
      const response = await fetch(`/api/admin/google-accounts/${accountId}/refresh`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Account refreshed successfully"
        })
        // After refresh, fetch properties again
        await fetchPropertiesForAccount(accountId);
        fetchAccounts()
      } else {
        throw new Error('Failed to refresh account')
      }
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to refresh account",
        variant: "destructive"
      })
    } finally {
      setRefreshing(null)
    }
  }

  const deleteAccount = async (accountId: string) => {
    console.log('[Frontend] Delete account requested for ID:', accountId);
    
    if (!confirm('Are you sure you want to remove this Google account?')) {
      console.log('[Frontend] Delete cancelled by user');
      return
    }

    console.log('[Frontend] Sending DELETE request...');
    try {
      const response = await fetch(`/api/admin/google-accounts/${accountId}`, {
        method: 'DELETE'
      })
      
      console.log('[Frontend] Delete response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Frontend] Delete response data:', data);
        
        toast({
          title: "Success",
          description: "Account removed successfully"
        })
        fetchAccounts()
      } else {
        const errorText = await response.text();
        console.error('[Frontend] Delete failed!');
        console.error('  - Status:', response.status);
        console.error('  - Response:', errorText);
        throw new Error('Failed to delete account')
      }
    } catch (error: any) {
      console.error('[Frontend] Error deleting account:', error);
      console.error('  - Message:', error.message);
      console.error('  - Stack:', error.stack);
      
      toast({
        title: "Error",
        description: "Failed to remove account",
        variant: "destructive"
      })
    }
  }

  const getTokenStatus = (expiry?: string) => {
    if (!expiry) return 'unknown'
    const expiryDate = new Date(expiry)
    const now = new Date()
    return expiryDate > now ? 'valid' : 'expired'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Google Accounts</h1>
            <p className="text-gray-600">Manage connected Google accounts for data access</p>
          </div>
        </div>
        <Button onClick={addNewAccount}>
          <Plus className="h-4 w-4 mr-2" />
          Add Google Account
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">Loading accounts...</div>
          </CardContent>
        </Card>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No Google accounts connected</p>
              <p className="text-sm text-gray-400 mb-6">
                Add Google accounts to access Search Console and Analytics data
              </p>
              <Button onClick={addNewAccount}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Account
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => {
            const tokenStatus = getTokenStatus(account.token_expiry)
            return (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {account.account_email}
                          {account.is_active ? (
                            <Badge variant="default" className="text-xs">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                        </CardTitle>
                        {account.account_name && (
                          <p className="text-sm text-gray-500">{account.account_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchPropertiesForAccount(account.id)}
                        disabled={fetchingProperties === account.id}
                        title="Fetch properties"
                      >
                        {fetchingProperties === account.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Globe className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshAccount(account.id)}
                        disabled={refreshing === account.id}
                        title="Refresh token"
                      >
                        {refreshing === account.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAccount(account.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Token Status</p>
                      <div className="flex items-center gap-2">
                        {tokenStatus === 'valid' ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">Valid</span>
                          </>
                        ) : tokenStatus === 'expired' ? (
                          <>
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-red-600">Expired</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-400">Unknown</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 mb-1">Search Console Properties</p>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                        <span>{account.search_console_properties?.length || 0} properties</span>
                        {fetchingProperties === account.id && (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        )}
                      </div>
                      {account.search_console_properties && account.search_console_properties.length > 0 && (
                        <div className="mt-1 text-xs text-gray-400">
                          {account.search_console_properties.slice(0, 2).map((prop: any, idx: number) => (
                            <div key={idx} className="truncate">
                              {prop.siteUrl || prop}
                            </div>
                          ))}
                          {account.search_console_properties.length > 2 && (
                            <div>+{account.search_console_properties.length - 2} more</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-gray-500 mb-1">Analytics Properties</p>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                        <span>{account.analytics_properties?.length || 0} properties</span>
                        {fetchingProperties === account.id && (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        )}
                      </div>
                      {account.analytics_properties && account.analytics_properties.length > 0 && (
                        <div className="mt-1 text-xs text-gray-400">
                          {account.analytics_properties.slice(0, 2).map((prop: any, idx: number) => (
                            <div key={idx} className="truncate">
                              {prop.displayName || prop.propertyId || prop}
                            </div>
                          ))}
                          {account.analytics_properties.length > 2 && (
                            <div>+{account.analytics_properties.length - 2} more</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      Added: {new Date(account.created_at).toLocaleDateString()}
                      {account.updated_at !== account.created_at && (
                        <span> • Updated: {new Date(account.updated_at).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Click "Add Google Account" to connect a new Google account</li>
            <li>Authorize access to Search Console and Analytics</li>
            <li>The account will appear here with available properties</li>
            <li>When creating reports, select which account's data to use</li>
            <li>Each report can use data from different Google accounts</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}