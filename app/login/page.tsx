"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'invalid_client_credentials':
        return 'Invalid OAuth credentials. Please check Google Cloud Console configuration.'
      case 'session_failed':
        return 'Failed to establish session. Please try logging in again.'
      case 'session_check_failed':
        return 'Session verification failed. Please try logging in again.'
      case 'auth_required':
        return 'Authentication required. Please sign in to continue.'
      case 'no_code':
        return 'OAuth authorization failed. No authorization code received.'
      default:
        return error ? `Authentication error: ${error}` : null
    }
  }

  const errorMessage = getErrorMessage(error)

  const handleGoogleLogin = () => {
    setLoading(true)
    // Use direct OAuth flow with forced consent to get refresh token
    window.location.href = '/api/auth/google/add-account'
  }

  const handleSimpleAdminLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      const data = await response.json()

      if (data.success) {
        // Use window.location for hard redirect to ensure cookies are set
        window.location.href = data.redirectUrl || "/admin"
      } else {
        console.error("Demo login failed:", data.error)
      }
    } catch (err) {
      console.error("Login error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-frost to-glacier">
      <div className="w-full max-w-md">
        {/* Back to home link */}
        <div className="mb-6 text-center">
          <Link href="/" className="text-marine hover:text-harbor text-sm">
            ← Back to home
          </Link>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Sign In</CardTitle>
            <CardDescription className="text-lg mt-2">
              Access your Search Insights Hub dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-3">
              <Button 
                onClick={handleGoogleLogin}
                type="button"
                className="w-full h-12 text-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button 
                onClick={handleSimpleAdminLogin}
                className="w-full h-12 text-lg"
                variant="outline"
                disabled={loading}
              >
                Quick Admin Access (Demo)
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600 mt-6">
              <p>
                By signing in, you agree to our{" "}
                <Link href="/legal/terms" className="text-marine hover:text-harbor">
                  terms of service
                </Link>{" "}
                and{" "}
                <Link href="/legal/privacy" className="text-marine hover:text-harbor">
                  privacy policy
                </Link>
              </p>
            </div>

            <div className="bg-frost border border-glacier rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-harbor mb-2">What you get:</h3>
              <ul className="text-sm text-marine space-y-1">
                <li>✓ Google Analytics Integration</li>
                <li>✓ Search Console Data</li>
                <li>✓ PageSpeed Insights</li>
                <li>✓ Custom Client Reports</li>
                <li>✓ SEO Technical Audits</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}