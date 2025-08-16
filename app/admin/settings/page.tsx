"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage platform settings and configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure your platform preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platformName">Platform Name</Label>
            <Input id="platformName" defaultValue="SEO Reporting Platform" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminEmail">Admin Email</Label>
            <Input id="adminEmail" type="email" defaultValue="johanlcilliers@gmail.com" disabled />
          </div>
          <Button>Save Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>Manage API keys and integrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Google APIs</p>
                <p className="text-sm text-gray-500">Search Console & Analytics</p>
              </div>
              <span className="text-green-600">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">PageSpeed Insights</p>
                <p className="text-sm text-gray-500">Core Web Vitals monitoring</p>
              </div>
              <span className="text-green-600">Active</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}