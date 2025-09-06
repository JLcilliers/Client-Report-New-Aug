"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { signIn } from "next-auth/react"

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = () => {
    setLoading(true)
    // Use NextAuth signIn with Google provider
    signIn('google', { callbackUrl: '/admin' })
  }

  const handleSimpleAdminLogin = () => {
    setLoading(true)
    // Use simple admin authentication for testing
    fetch("/api/auth/simple-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminKey: "admin123" })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          router.push("/admin")
        }
      })
      .catch(err => console.error("Login error:", err))
      .finally(() => setLoading(false))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Search Insights Hub</CardTitle>
          <CardDescription className="text-lg mt-2">
            Professional SEO & Analytics Reporting Platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <p>By signing in, you agree to our terms of service</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h3 className="font-semibold text-blue-900 mb-2">Features:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
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
  )
}