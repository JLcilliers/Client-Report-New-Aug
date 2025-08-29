"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function DebugPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const runTests = async () => {
    setLoading(true)
    const results: any = {}
    
    // Test 1: Health check
    try {
      const res = await fetch('/api/health')
      results.health = await res.json()
    } catch (e: any) {
      results.health = { error: e.message }
    }
    
    // Test 2: Check connection
    try {
      const res = await fetch('/api/debug/check-connection')
      results.connection = await res.json()
    } catch (e: any) {
      results.connection = { error: e.message }
    }
    
    // Test 3: Check token
    try {
      const res = await fetch('/api/debug/check-token')
      results.token = await res.json()
    } catch (e: any) {
      results.token = { error: e.message }
    }
    
    // Test 4: Analytics test
    try {
      const res = await fetch('/api/test/analytics')
      results.analytics = await res.json()
    } catch (e: any) {
      results.analytics = { error: e.message }
    }
    
    setData(results)
    setLoading(false)
  }
  
  useEffect(() => {
    runTests()
  }, [])
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Debug Information</h1>
          <p className="text-gray-600 mt-1">System diagnostics and API tests</p>
        </div>
        <Button onClick={runTests} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {loading && !data && (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-4 text-gray-600">Running tests...</p>
        </div>
      )}
      
      {data && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Check</CardTitle>
              <CardDescription>Basic API functionality</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(data.health, null, 2)}
              </pre>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Google Connection</CardTitle>
              <CardDescription>Database connection status</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(data.connection, null, 2)}
              </pre>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Token Information</CardTitle>
              <CardDescription>OAuth token scopes and validity</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(data.token, null, 2)}
              </pre>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Analytics API Tests</CardTitle>
              <CardDescription>Google Analytics API connectivity</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(data.analytics, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}