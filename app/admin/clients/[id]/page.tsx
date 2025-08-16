"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/clients">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Client Details</h1>
      </div>
      
      <div className="grid gap-4">
        <p>Client ID: {clientId}</p>
        
        <div className="flex space-x-4">
          <Link href={`/admin/clients/${clientId}/connections`}>
            <Button>Manage Connections</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}