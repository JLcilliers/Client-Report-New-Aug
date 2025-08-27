"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { signIn } from "next-auth/react"

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
      // Use NextAuth signIn
      await signIn('google', { callbackUrl: '/admin' })
      
      if (onSuccess) {
        onSuccess()
      }
      
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