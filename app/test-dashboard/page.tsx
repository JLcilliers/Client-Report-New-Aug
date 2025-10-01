'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';

export default function TestDashboard() {
  const [testResults, setTestResults] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const testEndpoint = async (name: string, url: string, method = 'GET', body?: any) => {
    try {
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const status = response.status;
      const isOk = response.ok;
      
      let data = null;
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }

      return {
        name,
        status,
        success: isOk,
        data,
        error: isOk ? null : data
      };
    } catch (error: any) {
      return {
        name,
        status: 0,
        success: false,
        error: error.message
      };
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setTestResults({});

    const tests = [
      // Test report data endpoint
      {
        name: 'Report Data API',
        url: '/api/public/report/test-slug/data',
        method: 'GET'
      },
      // Test agency updates endpoint
      {
        name: 'Agency Updates API',
        url: '/api/reports/agency-updates?reportId=test-id',
        method: 'GET'
      },
      // Test SEO data save endpoint
      {
        name: 'Save SEO Data API',
        url: '/api/reports/save-seo-data',
        method: 'POST',
        body: {
          reportId: 'test-id',
          dataType: 'test',
          data: { test: true }
        }
      },
      // Test SEO data get endpoint
      {
        name: 'Get SEO Data API',
        url: '/api/reports/get-seo-data?reportId=test-id&dataType=technical_seo',
        method: 'GET'
      },
      // Test admin reports endpoint
      {
        name: 'Admin Reports API',
        url: '/api/admin/reports',
        method: 'GET'
      }
    ];

    const results: any = {};
    
    for (const test of tests) {
      const result = await testEndpoint(test.name, test.url, test.method, test.body);
      results[test.name] = result;
      setTestResults({ ...results });
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setTesting(false);
  };

  const getStatusBadge = (result: any) => {
    if (!result) return null;
    
    if (result.success) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          {result.status} OK
        </Badge>
      );
    } else if (result.status === 404) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          {result.status} Not Found
        </Badge>
      );
    } else if (result.status >= 500) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          {result.status} Error
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          {result.status || 'No Response'}
        </Badge>
      );
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>API Endpoint Test Dashboard</CardTitle>
            <CardDescription>
              Test all API endpoints to verify they're working correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runAllTests} 
              disabled={testing}
              className="w-full"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {Object.keys(testResults).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(testResults).map(([name, result]: [string, any]) => (
                  <div key={name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{name}</h3>
                      {getStatusBadge(result)}
                    </div>
                    
                    {result.error && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                        <strong>Error:</strong> {JSON.stringify(result.error)}
                      </div>
                    )}

                    {result.success && result.data && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                        <strong>Response:</strong>
                        <pre className="mt-1 text-xs overflow-auto">
                          {JSON.stringify(result.data, null, 2).slice(0, 200)}...
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Expected Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span><strong>200 OK:</strong> Endpoint is working correctly</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span><strong>404 Not Found:</strong> Expected for test data that doesn't exist</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span><strong>500 Error:</strong> Server error - needs fixing</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-frost rounded">
              <p className="text-sm text-harbor">
                <strong>Note:</strong> All endpoints should return either 200 OK or 404 Not Found.
                Any 500 errors indicate a problem that needs to be fixed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}