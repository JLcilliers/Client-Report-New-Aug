"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  FileText,
  BarChart3,
  Link2,
  Database,
  Brain
} from "lucide-react"
import { cn } from "@/lib/utils/cn"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>("")

  useEffect(() => {
    // Custom auth check - no NextAuth dependency
    const checkAuth = async () => {
      try {
        // Check session via our custom endpoint
        const response = await fetch('/api/auth/check-session')
        const data = await response.json()

        if (data.authenticated) {
          setUserEmail(data.email || "Admin")
          setLoading(false)
        } else {
          // No valid session, redirect to login
          router.push("/login?auth=required")
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // Check cookies as fallback
        const hasAuth = document.cookie.includes('session_token') ||
                       document.cookie.includes('google_access_token') ||
                       document.cookie.includes('demo_auth=true')

        if (hasAuth) {
          // Extract email from cookie if available
          const emailMatch = document.cookie.match(/google_user_email=([^;]+)/)
          if (emailMatch) {
            setUserEmail(decodeURIComponent(emailMatch[1]))
          } else {
            setUserEmail("Admin")
          }
          setLoading(false)
        } else {
          router.push("/login?auth=required")
        }
      }
    }

    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    // Clear all auth cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Clients", href: "/admin/clients", icon: Users },
    { name: "Google Accounts", href: "/admin/google-accounts", icon: Link2 },
    { name: "Properties", href: "/admin/properties", icon: Database },
    { name: "Reports", href: "/admin/reports", icon: FileText },
    { name: "AI Visibility", href: "/admin/ai-visibility", icon: Brain },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-md">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">SEO Platform</h2>
              <p className="text-sm text-gray-600 mt-1">
                {userEmail}
              </p>
            </div>

            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href))

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                          isActive
                            ? "bg-frost text-marine"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <div className="p-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}