"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
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
  Database
} from "lucide-react"
import { cn } from "@/lib/utils/cn"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for our Google OAuth cookies or demo auth first
    const hasGoogleAuth = document.cookie.includes('google_access_token');
    const hasDemoAuth = document.cookie.includes('demo_auth=true');
    const isDevelopment = process.env.NEXT_PUBLIC_DEV_MODE === 'true' || window.location.hostname === 'localhost';
    
    // If we have valid cookie-based auth, allow access regardless of NextAuth status
    if (hasGoogleAuth || hasDemoAuth) {
      setLoading(false);
      return;
    }
    
    // Only check NextAuth if no cookie-based auth is present
    if (status === "loading") {
      setLoading(true)
    } else if (status === "unauthenticated") {
      router.push("/login?auth=required")
    } else {
      setLoading(false)
    }
  }, [status, router])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Allow access if we have Google OAuth cookies, demo auth, or NextAuth session
  const hasGoogleAuth = typeof window !== 'undefined' && document.cookie.includes('google_access_token');
  const hasDemoAuth = typeof window !== 'undefined' && document.cookie.includes('demo_auth=true');
  
  if (!session && !hasGoogleAuth && !hasDemoAuth) {
    return null
  }

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Google Accounts", href: "/admin/google-accounts", icon: Link2 },
    { name: "Properties", href: "/admin/properties", icon: Database },
    { name: "Reports", href: "/admin/reports", icon: FileText },
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
                {session?.user?.email || 
                 (typeof window !== 'undefined' && document.cookie.match(/google_user_email=([^;]+)/)?.[1] ? 
                  decodeURIComponent(document.cookie.match(/google_user_email=([^;]+)/)?.[1] || '') : 
                  (hasDemoAuth ? 'Demo Mode' : 'Admin'))}
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
                            ? "bg-blue-50 text-blue-600"
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