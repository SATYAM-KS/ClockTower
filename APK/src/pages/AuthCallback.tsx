// src/pages/AuthCallback.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      try {
        setStatus('loading');
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setErrorMessage('Authentication failed. Please try again.');
          setStatus('error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        if (data.session) {
          // Upsert user after Google login
          const { user } = data.session;
          
          try {
            const { error: upsertError } = await supabase.from('app_users').upsert([{
              id: user.id,
              email: user.email,
              username: user.user_metadata?.name || user.user_metadata?.username || '',
              phone: user.user_metadata?.phone || ''
            }]);
            
            if (upsertError) {
              console.warn('Failed to upsert user data:', upsertError);
              // Continue anyway as the user is authenticated
            }
            
            setStatus('success');
            setTimeout(() => navigate('/home'), 1000);
          } catch (upsertErr) {
            console.error('User data upsert error:', upsertErr);
            // Continue anyway as the user is authenticated
            setStatus('success');
            setTimeout(() => navigate('/home'), 1000);
          }
        } else {
          setErrorMessage('No active session found. Please try logging in again.');
          setStatus('error');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        setErrorMessage('An unexpected error occurred. Please try again.');
        setStatus('error');
        setTimeout(() => navigate('/login'), 3000);
      }
    };
    
    checkSession();
  }, [navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Authenticating...</h2>
          <p className="text-gray-600">Please wait while we complete your sign-in.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Failed</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Successful!</h2>
          <p className="text-gray-600 mb-4">Welcome to RedZone. Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;
