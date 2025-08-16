"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface GoogleAuthButtonProps {
  clientId: string
  onSuccess?: () => void
}

export default function GoogleAuthButton({ clientId, onSuccess }: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleGoogleAuth = async () => {
    setLoading(true)
    
    try {
      // Build OAuth URL
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "998982098952-et4jamotfaitvlp5d1mim3ve144dbm2s.apps.googleusercontent.com",
        redirect_uri: `${window.location.origin}/api/auth/google/callback`,
        response_type: "code",
        scope: [
          "https://www.googleapis.com/auth/webmasters.readonly",
          "https://www.googleapis.com/auth/analytics.readonly",
        ].join(" "),
        access_type: "offline",
        prompt: "consent",
        state: clientId, // Pass client ID in state
      })

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
      
      // Open in new window
      const authWindow = window.open(
        authUrl,
        "Google Authorization",
        "width=500,height=600,left=100,top=100"
      )

      // Check for window close
      const checkInterval = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkInterval)
          setLoading(false)
          
          // Check if auth was successful (would need to implement a check)
          if (onSuccess) {
            onSuccess()
          }
        }
      }, 1000)
      
    } catch (error: any) {
      console.error("OAuth error:", error)
      toast({
        title: "Error",
        description: "Failed to initiate Google authorization",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleGoogleAuth}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Connecting..." : "Connect Google Account"}
      </Button>
      <p className="text-sm text-gray-500">
        This will grant access to Google Search Console and Analytics data for this client.
      </p>
    </div>
  )
}