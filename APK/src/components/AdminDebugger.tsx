import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const AdminDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    getUserEmail();
  }, []);

  const runDebugCheck = async () => {
    setLoading(true);
    setDebugInfo(null);

    try {
      const results: any = {};

      // 1. Check current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      results.session = {
        hasSession: !!session,
        userEmail: session?.user?.email || null,
        userId: session?.user?.id || null,
        error: sessionError?.message || null
      };

      if (session?.user?.email) {
        // 2. Check admin_users table by email
        const { data: adminByEmail, error: adminEmailError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', session.user.email);

        results.adminByEmail = {
          data: adminByEmail,
          error: adminEmailError?.message || null,
          count: adminByEmail?.length || 0
        };

        // 3. Check admin_users table by user_id
        if (session.user.id) {
          const { data: adminById, error: adminIdError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', session.user.id);

          results.adminById = {
            data: adminById,
            error: adminIdError?.message || null,
            count: adminById?.length || 0
          };
        }

        // 4. Check app_users table
        if (session.user.id) {
          const { data: appUser, error: appUserError } = await supabase
            .from('app_users')
            .select('*')
            .eq('id', session.user.id);

          results.appUser = {
            data: appUser,
            error: appUserError?.message || null
          };
        }

        // 5. Check all admin_users entries
        const { data: allAdmins, error: allAdminsError } = await supabase
          .from('admin_users')
          .select('*')
          .limit(10);

        results.allAdmins = {
          data: allAdmins,
          error: allAdminsError?.message || null,
          count: allAdmins?.length || 0
        };
      }

      setDebugInfo(results);
    } catch (error) {
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      margin: '20px 0'
    }}>
      <h3>🔍 Admin Status Debugger</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Current User Email:</strong> {userEmail || 'Not authenticated'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={runDebugCheck}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? 'Running Debug...' : '🔍 Run Debug Check'}
        </button>
        
        <button
          onClick={clearCache}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🗑️ Clear All Cache & Reload
        </button>
      </div>

      {debugInfo && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '15px', 
          borderRadius: '5px',
          border: '1px solid #dee2e6',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          <h4>Debug Results:</h4>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AdminDebugger;
