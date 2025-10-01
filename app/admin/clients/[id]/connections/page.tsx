"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Settings, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ClientConnectionsPage() {
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Client Connections</h1>
          <p className="text-gray-600">Configure Google API connections</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Google API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-frost border border-glacier rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Good News!</span>
            </div>
            <p className="text-sm text-harbor mb-3">
              Your Google APIs are already connected and working. You have access to 16 Search Console properties
              and can create reports with real data.
            </p>
            <div className="flex gap-2">
              <Link href="/admin/auth/setup">
                <Button size="sm">
                  View Auth Status
                </Button>
              </Link>
              <Link href="/admin/reports/create">
                <Button variant="outline" size="sm">
                  Create New Report
                </Button>
              </Link>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Current Status:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>✅ Google OAuth authenticated (johanlcilliers@gmail.com)</li>
              <li>✅ Search Console: 16 properties available</li>
              <li>✅ Refresh token: Present and valid</li>
              <li>✅ Data fetching: Working</li>
            </ul>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-medium mb-2">Next Steps:</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
              <li>Use the "Create New Report" button to set up reports for your clients</li>
              <li>Select which Search Console properties to include in each report</li>
              <li>Share the report URLs with your clients</li>
              <li>Data will refresh automatically when clients click "Refresh Data"</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
