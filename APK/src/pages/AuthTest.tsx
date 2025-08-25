import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthStatus } from '../components/AuthStatus';
import { Shield, User, Mail, Calendar } from 'lucide-react';

const AuthTest: React.FC = () => {
  const { user, session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we verify your authentication.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">You must be logged in to view this page</p>
            <button 
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              onClick={() => window.location.href = '/login'}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Authentication Test Page</h1>
          <p className="text-gray-600">This page verifies that the authentication system is working correctly.</p>
        </div>

        {/* Auth Status Component */}
        <div className="mb-6">
          <AuthStatus />
        </div>

        {/* User Information */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-red-600" />
              User Information
            </h3>
            <p className="text-gray-600">Details about the currently authenticated user</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">User ID</p>
                  <p className="text-sm text-gray-600 font-mono">{user.id}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Username</p>
                  <p className="text-sm text-gray-600">
                    {user.user_metadata?.username || user.user_metadata?.name || 'Not set'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Created At</p>
                  <p className="text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Session Information */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Session Information
            </h3>
            <p className="text-gray-600">Current session details and tokens</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-2">Session Expires</p>
                <p className="text-sm text-gray-600">
                  {session ? new Date(session.expires_at * 1000).toLocaleString() : 'No active session'}
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-2">Provider</p>
                <p className="text-sm text-gray-600">
                  {user.app_metadata?.provider || 'email'}
                </p>
              </div>
            </div>
            
            {session && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-2">Access Token (truncated)</p>
                <p className="text-sm text-gray-600 font-mono">
                  {session.access_token.substring(0, 20)}...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Test Actions</h3>
            <p className="text-gray-600">Test various authentication features</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap gap-4">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => window.location.href = '/home'}
              >
                Go to Home
              </button>
              
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => window.location.href = '/profile'}
              >
                Go to Profile
              </button>
              
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => window.location.href = '/admin'}
              >
                Go to Admin Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;
