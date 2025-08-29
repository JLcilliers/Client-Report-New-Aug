"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Platform-wide analytics and insights</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>Overall platform performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Analytics functionality coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}