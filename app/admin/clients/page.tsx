"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import ClientList from "@/components/admin/ClientList"
import ClientForm from "@/components/admin/ClientForm"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ClientsPage() {
  const [showAddClient, setShowAddClient] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleClientAdded = () => {
    setShowAddClient(false)
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Manage your client accounts and reports</p>
        </div>
        <Button onClick={() => setShowAddClient(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <ClientList key={refreshKey} />

      <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Enter the client details to create a new report
            </DialogDescription>
          </DialogHeader>
          <ClientForm onSuccess={handleClientAdded} />
        </DialogContent>
      </Dialog>
    </div>
  )
}