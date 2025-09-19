"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  useEffect(() => {
    // Check if we have a valid session
    const checkSession = async () => {
      try {
        console.log('[Auth Success] Starting session check...')
        const response = await fetch('/api/auth/check-session')
        const data = await response.json()

        console.log('[Auth Success] Session check response:', data)

        if (data.authenticated) {
          // Session is valid, redirect to admin
          console.log('[Auth Success] Session valid, redirecting to admin in 2 seconds')
          setTimeout(() => {
            router.push('/admin')
          }, 2000)
        } else {
          // No valid session, go back to login
          console.error('[Auth Success] Session check failed, redirecting to login')
          router.push('/login?error=session_failed')
        }
      } catch (error) {
        console.error('[Auth Success] Session check failed:', error)
        router.push('/login?error=session_check_failed')
      }
    }

    // Add a small delay to ensure cookies are fully set
    const timeoutId = setTimeout(() => {
      checkSession()
    }, 500) // 500ms delay to allow cookies to settle

    return () => clearTimeout(timeoutId)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-green-700">
            Authentication Successful!
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            {email ? `Welcome back, ${email}` : 'Setting up your session...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Redirecting you to the admin dashboard...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}