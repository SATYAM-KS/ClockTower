import { supabase, adminStatusCache } from './supabaseClient';

export interface SOSAlert {
  id?: string;
  user_id?: string;
  user_email?: string;
  user_phone?: string;
  latitude: number;
  longitude: number;
  location_address?: string;
  alert_type: 'stationary_user' | 'facial_recognition' | 'manual_sos' | 'voice_keyword' | 'voice_level' | 'speed_accident' | 'acceleration' | 'deceleration';
  status: 'pending' | 'acknowledged' | 'resolved';
  user_message?: string;
  stationary_duration_minutes?: number;
  last_movement_time?: string;
  created_at?: string;
  resolved_at?: string;
  admin_notes?: string;
  red_zone_id?: number;
}

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
}

class SOSService {
  private currentUser: any = null;
  private isInitialized = false;

  constructor() {
    // Don't initialize immediately - wait for explicit initialization
    // this.initializeUser();
  }

  private async initializeUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting user:', error);
        this.currentUser = null;
        return;
      }
      
      if (!user) {
        console.warn('No authenticated user found');
        this.currentUser = null;
        return;
      }
      
      this.currentUser = user;
      this.isInitialized = true;
      console.log('SOS Service initialized for user:', user.id);
    } catch (error) {
      console.error('Failed to initialize SOS service:', error);
      this.currentUser = null;
    }
  }

  /**
   * Explicitly initialize the service when needed
   */
  public async initialize(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeUser();
    }
  }

  /**
   * Send SOS alert for stationary user
   */
  public async sendStationaryUserAlert(
    location: { lat: number; lng: number },
    durationMinutes: number,
    userMessage?: string
  ): Promise<{ success: boolean; alertId?: string; error?: string }> {
    try {
      // Ensure user is authenticated
      if (!this.currentUser || !this.isInitialized) {
        await this.initializeUser();
      }

      // Check if user is still not authenticated after initialization
      if (!this.currentUser?.id) {
        console.error('Cannot send SOS alert: User not authenticated');
        return { 
          success: false, 
          error: 'User not authenticated. Please log in again.' 
        };
      }

      console.log('Sending SOS alert for user:', this.currentUser.id);

      // Get user profile data from app_users table
      const { data: profile, error: profileError } = await supabase
        .from('app_users')
        .select('email, phone')
        .eq('id', this.currentUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Continue with basic user info if profile fetch fails
      }

      // Get location address (simplified to avoid CORS issues)
      const locationAddress = this.getSimpleLocationAddress(location.lat, location.lng);

      // Determine alert type based on message content
      let alertType: SOSAlert['alert_type'] = 'stationary_user';
      if (userMessage && userMessage.includes('keyword')) {
        alertType = 'voice_keyword';
      } else if (userMessage && userMessage.includes('voice level')) {
        alertType = 'voice_level';
      } else if (userMessage && userMessage.includes('acceleration') || userMessage.includes('deceleration')) {
        alertType = 'speed_accident';
      }

      const sosAlert: SOSAlert = {
        user_id: this.currentUser?.id,
        user_email: profile?.email || this.currentUser?.email,
        user_phone: profile?.phone,
        latitude: location.lat,
        longitude: location.lng,
        location_address: locationAddress,
        alert_type: alertType,
        status: 'pending',
        user_message: userMessage || `User has been stationary for ${durationMinutes} minutes in red zone`,
        stationary_duration_minutes: durationMinutes,
        last_movement_time: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('sos_alerts')
        .insert([sosAlert])
        .select()
        .single();

      if (error) {
        console.error('Error sending SOS alert:', error);
        return { success: false, error: error.message };
      }

      // Notify admin users
      await this.notifyAdmins(data);

      return { success: true, alertId: data.id };
    } catch (error) {
      console.error('Error sending stationary user alert:', error);
      return { success: false, error: 'Failed to send alert' };
    }
  }

  /**
   * Get address from coordinates (simplified to avoid CORS issues)
   */
  private async getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
    try {
      // For now, return a simple location string to avoid CORS issues
      // You can integrate with a backend geocoding service later
      return `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      
      // Alternative: Use a CORS proxy (not recommended for production)
      // const response = await fetch(
      //   `https://cors-anywhere.herokuapp.com/https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      // );
      
      // if (response.ok) {
      //   const data = await response.json();
      //   return data.display_name || `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      // }
    } catch (error) {
      console.warn('Geocoding failed:', error);
    }
    
    return `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  /**
   * Simplified location address for stationary user alerts
   */
  private getSimpleLocationAddress(lat: number, lng: number): string {
    return `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  /**
   * Notify admin users about new SOS alert
   */
  private async notifyAdmins(alert: SOSAlert): Promise<void> {
    try {
      // Get all active admin users
      const { data: admins } = await supabase
        .from('admin_users')
        .select('*')
        .eq('is_active', true);

      if (admins && admins.length > 0) {
        // Here you can implement:
        // 1. Push notifications
        // 2. Email notifications
        // 3. SMS notifications
        // 4. In-app notifications
        
        console.log(`Notifying ${admins.length} admin users about SOS alert:`, alert.id);
        
        // For now, just log. You can implement actual notifications later
        admins.forEach(admin => {
          console.log(`Admin ${admin.email} notified about SOS alert from user at ${alert.location_address}`);
        });
      }
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  }

  /**
   * Get all SOS alerts for current user
   */
  public async getUserSOSAlerts(): Promise<SOSAlert[]> {
    try {
      if (!this.currentUser || !this.isInitialized) {
        await this.initializeUser();
      }

      if (!this.currentUser?.id) {
        console.error('Cannot fetch SOS alerts: User not authenticated');
        return [];
      }

      const { data, error } = await supabase
        .from('sos_alerts')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user SOS alerts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching SOS alerts:', error);
      return [];
    }
  }

  /**
   * Check if user is authenticated and service is ready
   */
  public isAuthenticated(): boolean {
    return !!(this.currentUser?.id && this.isInitialized);
  }

  /**
   * Get current user ID
   */
  public getCurrentUserId(): string | null {
    return this.currentUser?.id || null;
  }

  /**
   * Force re-authentication check
   */
  public async reAuthenticate(): Promise<boolean> {
    try {
      await this.initializeUser();
      return this.isAuthenticated();
    } catch (error) {
      console.error('Re-authentication failed:', error);
      return false;
    }
  }

  /**
   * Check if current user is admin
   */
  public async isCurrentUserAdmin(): Promise<boolean> {
    try {
      if (!this.currentUser || !this.isInitialized) {
        await this.initializeUser();
      }

      if (!this.currentUser?.id) {
        console.error('Cannot check admin status: User not authenticated');
        return false;
      }

      // Use the centralized admin checking method
      const { checkAdminStatusByUserId } = await import('./supabaseClient');
      return await checkAdminStatusByUserId(this.currentUser.id);
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Get all SOS alerts (admin only)
   */
  public async getAllSOSAlerts(): Promise<SOSAlert[]> {
    try {
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      const { data, error } = await supabase
        .from('sos_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all SOS alerts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching all SOS alerts:', error);
      return [];
    }
  }

  /**
   * Update SOS alert status (admin only)
   */
  public async updateSOSAlertStatus(
    alertId: string,
    status: 'acknowledged' | 'resolved',
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      const updateData: any = { status };
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }
      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from('sos_alerts')
        .update(updateData)
        .eq('id', alertId);

      if (error) {
        console.error('Error updating SOS alert status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating SOS alert status:', error);
      return { success: false, error: 'Failed to update alert status' };
    }
  }

  /**
   * Get authentication status and debug information
   */
  public getAuthStatus(): any {
    return {
      isAuthenticated: this.isAuthenticated(),
      isInitialized: this.isInitialized,
      hasUser: !!this.currentUser,
      userId: this.currentUser?.id || null,
      userEmail: this.currentUser?.email || null,
      session: this.currentUser ? {
        id: this.currentUser.id,
        email: this.currentUser.email,
        created_at: this.currentUser.created_at,
        last_sign_in_at: this.currentUser.last_sign_in_at
      } : null
    };
  }

  /**
   * Send SOS alert for speed and movement detection
   */
  public async sendSpeedAlert(
    location: { lat: number; lng: number },
    alertType: 'acceleration' | 'deceleration' | 'speed_accident',
    accelerationData?: number,
    speedData?: number
  ): Promise<{ success: boolean; alertId?: string; error?: string }> {
    try {
      if (!this.currentUser || !this.isInitialized) {
        await this.initialize();
      }

      if (!this.currentUser?.id) {
        return { 
          success: false, 
          error: 'User not authenticated. Please log in again.' 
        };
      }

      console.log('Sending speed alert for user:', this.currentUser.id);

      // Get user profile data
      const { data: profile } = await supabase
        .from('app_users')
        .select('email, phone')
        .eq('id', this.currentUser.id)
        .single();

      const locationAddress = this.getSimpleLocationAddress(location.lat, location.lng);

      let alertMessage = '';
      switch (alertType) {
        case 'acceleration':
          alertMessage = `Sudden acceleration detected: ${accelerationData?.toFixed(2) || 'unknown'} m/s²`;
          break;
        case 'deceleration':
          alertMessage = `Sudden deceleration detected: ${accelerationData?.toFixed(2) || 'unknown'} m/s²`;
          break;
        case 'speed_accident':
          alertMessage = `High speed detected: ${speedData?.toFixed(2) || 'unknown'} m/s`;
          break;
      }

      const sosAlert: SOSAlert = {
        user_id: this.currentUser.id,
        user_email: profile?.email || this.currentUser.email,
        user_phone: profile?.phone,
        latitude: location.lat,
        longitude: location.lng,
        location_address: locationAddress,
        alert_type: alertType,
        status: 'pending',
        user_message: alertMessage,
      };

      const { data, error } = await supabase
        .from('sos_alerts')
        .insert([sosAlert])
        .select()
        .single();

      if (error) {
        console.error('Error sending speed alert:', error);
        return { success: false, error: error.message };
      }

      // Notify admin users
      await this.notifyAdmins(data);

      return { success: true, alertId: data.id };
    } catch (error) {
      console.error('Error sending speed alert:', error);
      return { success: false, error: 'Failed to send alert' };
    }
  }

  /**
   * Send SOS alert for voice level detection
   */
  public async sendVoiceLevelAlert(
    location: { lat: number; lng: number },
    voiceLevel: number
  ): Promise<{ success: boolean; alertId?: string; error?: string }> {
    try {
      if (!this.currentUser || !this.isInitialized) {
        await this.initialize();
      }

      if (!this.currentUser?.id) {
        return { 
          success: false, 
          error: 'User not authenticated. Please log in again.' 
        };
      }

      const { data: profile } = await supabase
        .from('app_users')
        .select('email, phone')
        .eq('id', this.currentUser.id)
        .single();

      const locationAddress = this.getSimpleLocationAddress(location.lat, location.lng);

      const sosAlert: SOSAlert = {
        user_id: this.currentUser.id,
        user_email: profile?.email || this.currentUser.email,
        user_phone: profile?.phone,
        latitude: location.lat,
        longitude: location.lng,
        location_address: locationAddress,
        alert_type: 'voice_level',
        status: 'pending',
        user_message: `High voice level detected: ${voiceLevel.toFixed(2)} dB`,
      };

      const { data, error } = await supabase
        .from('sos_alerts')
        .insert([sosAlert])
        .select()
        .single();

      if (error) {
        console.error('Error sending voice level alert:', error);
        return { success: false, error: error.message };
      }

      // Notify admin users
      await this.notifyAdmins(data);

      return { success: true, alertId: data.id };
    } catch (error) {
      console.error('Error sending voice level alert:', error);
      return { success: false, error: 'Failed to send alert' };
    }
  }

  /**
   * Debug method to log current state
   */
  public debugAuth(): void {
    console.log('🔍 === SOS Service Auth Debug ===');
    console.log('🔍 Authentication Status:', this.getAuthStatus());
    
    if (this.currentUser) {
      console.log('🔍 Current User:', this.currentUser);
    } else {
      console.log('🔍 No authenticated user');
    }
    
    console.log('🔍 === End Auth Debug ===');
  }
}

export default SOSService;
