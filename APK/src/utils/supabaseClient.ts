import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://shqfvfjsxtdeknqncjfa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNocWZ2ZmpzeHRkZWtucW5jamZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MDgzNzMsImV4cCI6MjA2ODQ4NDM3M30.enzNuGiPvfMZLUPLPeDPBlMsHBOP9foFOjbGjQhLsnc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Admin status cache for performance
export const adminStatusCache = new Map<string, boolean>();

// Helper function to check if user is admin by email
export const checkAdminStatusByEmail = async (userEmail: string): Promise<boolean> => {
  try {
    // Check cache first
    if (adminStatusCache.has(userEmail)) {
      return adminStatusCache.get(userEmail)!;
    }

    // Query admin_users table
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', userEmail)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error checking admin status by email:', error);
      adminStatusCache.set(userEmail, false);
      return false;
    }

    const isAdmin = !!data;
    adminStatusCache.set(userEmail, isAdmin);
    console.log(`Admin status for ${userEmail}: ${isAdmin}`);
    return isAdmin;
  } catch (error) {
    console.error('Error in checkAdminStatusByEmail:', error);
    adminStatusCache.set(userEmail, false);
    return false;
  }
};

// Helper function to check if user is admin by user ID
export const checkAdminStatusByUserId = async (userId: string): Promise<boolean> => {
  try {
    // Query admin_users table
    const { data, error } = await supabase
      .from('admin_users')
      .select('is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error checking admin status by user ID:', error);
      return false;
    }

    // Cache the result by user ID as well
    adminStatusCache.set(userId, !!data?.is_active);
    console.log(`Admin status for user ID ${userId}: ${!!data?.is_active}`);
    return !!data?.is_active;
  } catch (error) {
    console.error('Error in checkAdminStatusByUserId:', error);
    return false;
  }
};

// Clear admin status cache for a specific user
export const clearAdminStatusCache = (userEmail: string) => {
  adminStatusCache.delete(userEmail);
  console.log(`Cleared admin status cache for: ${userEmail}`);
};
