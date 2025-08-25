import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Shield } from 'lucide-react';

export const AuthStatus: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
          <Shield className="w-4 h-4 text-red-600" />
        </div>
        <div className="text-sm">
          <p className="font-medium text-gray-900">
            {user.user_metadata?.username || user.email?.split('@')[0] || 'User'}
          </p>
          <p className="text-xs text-gray-500">Authenticated</p>
        </div>
      </div>
      
      <button
        onClick={handleSignOut}
        className="ml-auto p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        title="Sign Out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
};
