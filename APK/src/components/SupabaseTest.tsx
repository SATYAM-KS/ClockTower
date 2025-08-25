import React, { useState, useEffect } from 'react';
import { supabase, checkAdminStatus } from '../utils/supabaseClient';

const SupabaseTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      // Test 1: Basic connection
      addResult('🔍 Testing Supabase connection...');
      const { data, error } = await supabase.from('red_zones').select('count').limit(1);
      
      if (error) {
        addResult(`❌ Connection failed: ${error.message}`);
      } else {
        addResult('✅ Connection successful!');
      }

      // Test 2: Authentication
      addResult('🔍 Testing authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        addResult(`❌ Auth error: ${authError.message}`);
      } else if (user) {
        addResult(`✅ User authenticated: ${user.email}`);
        
        // Test 3: app_users table access
        addResult('🔍 Testing app_users table...');
        const { data: profileData, error: profileError } = await supabase
          .from('app_users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          addResult(`❌ Profile query error: ${profileError.message}`);
        } else if (profileData) {
          addResult(`✅ Profile data found: ${profileData.username || 'No username'}`);
        } else {
          addResult('⚠️ No profile data found');
        }

        // Test 4: Admin status check
        addResult('🔍 Testing admin status...');
        const isAdmin = await checkAdminStatus(user.email!);
        addResult(`ℹ️ Admin status: ${isAdmin ? 'Admin' : 'Regular User'}`);
        
      } else {
        addResult('ℹ️ No user currently authenticated');
      }

      // Test 5: Red zones table
      addResult('🔍 Testing red_zones table...');
      const { data: zones, error: zonesError } = await supabase
        .from('red_zones')
        .select('*')
        .limit(3);
      
      if (zonesError) {
        addResult(`❌ Red zones error: ${zonesError.message}`);
      } else {
        addResult(`✅ Red zones accessible. Found ${zones?.length || 0} zones`);
      }

    } catch (err) {
      addResult(`❌ Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🔍 Supabase Integration Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runTests} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Running Tests...' : 'Run Tests'}
        </button>
        
        <button 
          onClick={clearResults}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Clear Results
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '5px',
        border: '1px solid #dee2e6'
      }}>
        <h3>Test Results:</h3>
        {testResults.length === 0 ? (
          <p style={{ color: '#6c757d' }}>Click "Run Tests" to start testing...</p>
        ) : (
          <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            {testResults.map((result, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupabaseTest;
