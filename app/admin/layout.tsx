"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase, isAdmin } from "@/lib/db/supabase"
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
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Check if user has valid session via our API
      const response = await fetch('/api/auth/check-session')
      const data = await response.json()
      
      if (!data.authenticated) {
        router.push("/")
        return
      }

      setUserEmail(data.email || 'Admin')
    } catch (error) {
      
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
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
    { name: "Connections", href: "/admin/connections", icon: Link2 },
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
              <p className="text-sm text-gray-600 mt-1">{userEmail}</p>
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