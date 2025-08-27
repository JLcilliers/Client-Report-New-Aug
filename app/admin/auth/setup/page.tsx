"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Key, CheckCircle, XCircle } from "lucide-react"
import { signIn } from "next-auth/react"

export default function AdminAuthSetupPage() {
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState<any>(null)

  const checkAuthStatus = async () => {
    setChecking(true)
    try {
      const response = await fetch("/api/test/verify-search-console")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      
      setStatus({ error: "Failed to check authentication status" })
    } finally {
      setChecking(false)
    }
  }

  const initiateOAuth = () => {
    // Use NextAuth signIn with Google provider
    signIn('google')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Authentication Setup</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Google OAuth Setup
            </CardTitle>
            <CardDescription>
              Connect your Google account to access Search Console and Analytics data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={checkAuthStatus} disabled={checking}>
                {checking ? "Checking..." : "Check Auth Status"}
              </Button>
              <Button onClick={initiateOAuth} variant="default">
                Connect Google Account
              </Button>
              <Button 
                onClick={() => window.location.href = "/api/auth/simple-admin?action=start"} 
                variant="outline"
              >
                Simple Auth (Alternative)
              </Button>
            </div>

            {status && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Authentication Status:</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {status.adminUser?.hasRefreshToken ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>
                      Admin User: {status.adminUser?.email || "Not found"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {status.adminUser?.hasRefreshToken ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>
                      Refresh Token: {status.adminUser?.hasRefreshToken ? "Present" : "Missing"}
                    </span>
                  </div>

                  {status.searchConsole && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>
                        Search Console Sites: {status.searchConsole.siteCount || 0}
                      </span>
                    </div>
                  )}

                  {status.error && (
                    <div className="mt-2 p-2 bg-red-50 text-red-700 rounded">
                      Error: {status.error}
                    </div>
                  )}
                </div>

                {status.searchConsole?.sites && status.searchConsole.sites.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Connected Sites:</h4>
                    <ul className="space-y-1">
                      {status.searchConsole.sites.map((site: any) => (
                        <li key={site.siteUrl} className="text-sm text-gray-600">
                          • {site.siteUrl}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Click "Check Auth Status" to see current authentication state</li>
              <li>If refresh token is missing, click "Connect Google Account"</li>
              <li>Sign in with your Google account that has access to Search Console and Analytics</li>
              <li>Grant the necessary permissions</li>
              <li>You'll be redirected back here once authentication is complete</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}