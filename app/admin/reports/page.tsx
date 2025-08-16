"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">View and manage all client reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reports Overview</CardTitle>
          <CardDescription>All client reports and analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Reports functionality coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}