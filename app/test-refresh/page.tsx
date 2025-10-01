'use client';

import { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

export default function TestRefreshPage() {
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const [forceRender, setForceRender] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const clearRefreshingState = useCallback(() => {
    console.log('🧹 Clearing refreshing state using multiple methods');
    
    // Method 1: Direct state update
    setRefreshing(false);
    
    // Method 2: Use ref to track state
    refreshingRef.current = false;
    
    // Method 3: Force re-render to ensure UI updates
    setForceRender(prev => prev + 1);
    
    // Method 4: Delayed state clear as failsafe
    setTimeout(() => {
      console.log('🔄 Failsafe state clear');
      setRefreshing(false);
      refreshingRef.current = false;
    }, 100);
  }, []);

  const simulateRefresh = async () => {
    // Prevent multiple simultaneous refresh calls using both state and ref
    if (refreshing || refreshingRef.current) {
      console.log('🚫 Already refreshing, skipping duplicate request');
      return;
    }
    
    // Set both state and ref
    console.log('🔄 Starting refresh process');
    setRefreshing(true);
    refreshingRef.current = true;
    
    // Set multiple failsafe timeouts to always clear refreshing state
    const failsafeTimeout1 = setTimeout(() => {
      console.warn('⚠️ Primary failsafe timeout triggered - clearing refreshing state');
      clearRefreshingState();
    }, 30000); // 30 second failsafe
    
    const failsafeTimeout2 = setTimeout(() => {
      console.warn('⚠️ Secondary failsafe timeout triggered - force clearing state');
      setRefreshing(false);
      refreshingRef.current = false;
      setForceRender(prev => prev + 1);
    }, 35000); // 35 second backup failsafe

    try {
      console.log('📡 Simulating API call...');
      
      // Simulate API call with random delay (1-5 seconds)
      const delay = Math.random() * 4000 + 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Simulate random success/failure
      if (Math.random() > 0.2) {
        console.log('✅ Refresh completed successfully');
        setLastRefresh(new Date());
      } else {
        throw new Error('Simulated API error');
      }
    } catch (error: any) {
      console.error('❌ Refresh failed:', error.message);
    } finally {
      // Clear failsafe timeouts
      clearTimeout(failsafeTimeout1);
      clearTimeout(failsafeTimeout2);
      
      // Always clear the refreshing state using our comprehensive method
      clearRefreshingState();
      console.log('🏁 Refresh process completed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-8">Refresh Button Test</h1>
        
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Last refresh: {lastRefresh ? lastRefresh.toLocaleString() : 'Never'}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {(refreshing || refreshingRef.current) ? '🔄 Refreshing...' : '✅ Ready'}
            </p>
          </div>

          <button
            onClick={simulateRefresh}
            disabled={refreshing || refreshingRef.current}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              refreshing || refreshingRef.current
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-marine hover:bg-harbor text-white hover:shadow-md'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${(refreshing || refreshingRef.current) ? 'animate-spin' : ''}`} />
            {(refreshing || refreshingRef.current) ? 'Refreshing...' : 'Test Refresh'}
          </button>

          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-800 mb-2">Debug Info:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>State refreshing: {refreshing ? 'true' : 'false'}</p>
              <p>Ref refreshing: {refreshingRef.current ? 'true' : 'false'}</p>
              <p>Force render count: {forceRender}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-800 mb-2">Fix Details:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Multiple state clearing methods</li>
              <li>✅ useRef backup for state tracking</li>
              <li>✅ Force re-render mechanism</li>
              <li>✅ Multiple failsafe timeouts</li>
              <li>✅ Production build compatible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}