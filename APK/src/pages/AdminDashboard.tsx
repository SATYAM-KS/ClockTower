import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SOSService, { SOSAlert } from '../utils/sosService';
import { supabase, adminStatusCache, clearAdminStatusCache, checkAdminStatusByEmail } from '../utils/supabaseClient';
import AdminDebugger from '../components/AdminDebugger';
import SimpleSafetyMonitor from '../components/SimpleSafetyMonitor';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CheckCircle, 
  XCircle,
  Eye,
  MessageSquare,
  Calendar,
  Shield,
  BarChart3,
  Activity,
  Users as UsersIcon,
  Settings
} from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'acknowledged' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sosService] = useState(() => new SOSService());
  
  // Admin dashboard statistics
  const [stats, setStats] = useState({
    totalAlerts: 0,
    pendingAlerts: 0,
    resolvedAlerts: 0,
    activeUsers: 0,
    systemStatus: 'operational'
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchSOSAlerts();
      fetchDashboardStats();
    }
  }, [isAdmin]);

  const checkAdminStatus = useCallback(async () => {
    try {
      setLoading(true);
      
      // First check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        alert('Error verifying authentication. Please try again.');
        navigate('/home');
        return;
      }

      if (!session?.user) {
        console.log('No active session found');
        alert('Please sign in to access the admin dashboard.');
        navigate('/home');
        return;
      }

      // Check cache first for admin status
      const cachedAdminStatus = adminStatusCache.get(session.user.email);
      if (cachedAdminStatus !== null) {
        setIsAdmin(cachedAdminStatus);
        console.log('✅ Admin status from cache for:', session.user.email);
        if (!cachedAdminStatus) {
          alert('Access denied. Admin privileges required.');
          navigate('/home');
          return;
        }
        return;
      }

      // User is authenticated, now check admin status
      await sosService.initialize();
      
      const adminStatus = await sosService.isCurrentUserAdmin();
      setIsAdmin(adminStatus);
      
      console.log('🔍 AdminDashboard - Admin check result:', {
        userEmail: session.user.email,
        isAdmin: adminStatus,
        isAuthenticated: true
      });
      
      if (!adminStatus) {
        console.log('❌ Access denied: User is not an admin');
        alert('Access denied. Admin privileges required. Only users in the admin_users table can access this dashboard.');
        navigate('/home');
        return;
      }
      
      console.log('✅ Admin access granted for:', session.user.email);
      
    } catch (error) {
      console.error('Error checking admin status:', error);
      alert('Error verifying admin status. Please try again.');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchSOSAlerts = async () => {
    try {
      setLoading(true);
      const alerts = await sosService.getAllSOSAlerts();
      setSosAlerts(alerts);
    } catch (error) {
      console.error('Error fetching SOS alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // Fetch statistics from database
      const { data: alertsData, error: alertsError } = await supabase
        .from('sos_alerts')
        .select('status, created_at');

      if (alertsError) {
        console.error('Error fetching alerts:', alertsError);
      }

      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      const totalAlerts = alertsData?.length || 0;
      const pendingAlerts = alertsData?.filter(a => a.status === 'pending').length || 0;
      const resolvedAlerts = alertsData?.filter(a => a.status === 'resolved').length || 0;
      
      // Get total user count (simplified - no last_active tracking)
      const totalUsers = usersData?.length || 0;

      setStats({
        totalAlerts,
        pendingAlerts,
        resolvedAlerts,
        activeUsers: totalUsers, // Assuming totalUsers is the active user count
        systemStatus: 'operational'
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set default stats on error
      setStats({
        totalAlerts: 0,
        pendingAlerts: 0,
        resolvedAlerts: 0,
        activeUsers: 0,
        systemStatus: 'error'
      });
    }
  };

  const updateAlertStatus = async (alertId: string, status: 'acknowledged' | 'resolved') => {
    try {
      const result = await sosService.updateSOSAlertStatus(alertId, status, adminNotes);
      
      if (result.success) {
        // Update local state
        setSosAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status, admin_notes: adminNotes }
            : alert
        ));
        
        setSelectedAlert(null);
        setAdminNotes('');
        alert(`Alert ${status} successfully`);
        
        // Refresh stats
        fetchDashboardStats();
      } else {
        alert(`Failed to update alert: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating alert status:', error);
      alert('Failed to update alert status');
    }
  };

  const openMap = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredAlerts = sosAlerts.filter(alert => {
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      alert.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.alert_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.location_address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🛡️ Admin Dashboard</h1>
        <p>Monitor and manage safety alerts and system status</p>
      </div>

      {/* Dashboard Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Alerts</h3>
            <p className="stat-number">{stats.totalAlerts}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>Pending</h3>
            <p className="stat-number">{stats.pendingAlerts}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon resolved">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Resolved</h3>
            <p className="stat-number">{stats.resolvedAlerts}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon users">
            <UsersIcon size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.activeUsers}</p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="system-status">
        <div className="status-header">
          <Activity size={20} />
          <span>System Status</span>
        </div>
        <div className="status-indicator operational">
          <span className="status-dot"></span>
          {stats.systemStatus}
        </div>
      </div>

            {/* Simple Safety Monitor Component */}
      <div className="safety-monitoring-section">
        <SimpleSafetyMonitor
          isInRedZone={false}
          currentLocation={null}
        />
      </div>

      {/* Admin Debugger Component */}
      <AdminDebugger />

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search alerts by user, type, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="status-filters">
          <button
            onClick={() => setFilterStatus('all')}
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('acknowledged')}
            className={`filter-btn ${filterStatus === 'acknowledged' ? 'active' : ''}`}
          >
            Acknowledged
          </button>
          <button
            onClick={() => setFilterStatus('resolved')}
            className={`filter-btn ${filterStatus === 'resolved' ? 'active' : ''}`}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* SOS Alerts List */}
      <div className="alerts-section">
        <h2>🚨 Safety Alerts</h2>
        
        {loading ? (
          <div className="loading">Loading alerts...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="no-alerts">
            <Shield size={48} />
            <p>No alerts found</p>
          </div>
        ) : (
          <div className="alerts-list">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className={`alert-card ${alert.status}`}>
                <div className="alert-header">
                  <div className="alert-type">
                    <AlertTriangle size={16} />
                    {alert.alert_type?.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="alert-status">
                    <span className={`status-badge ${alert.status}`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
                
                <div className="alert-body">
                  <div className="alert-info">
                    <div className="info-row">
                      <User size={16} />
                      <span>{alert.user_email || 'Unknown User'}</span>
                    </div>
                    <div className="info-row">
                      <MapPin size={16} />
                      <span>{alert.location_address || 'Location not available'}</span>
                    </div>
                    <div className="info-row">
                      <Clock size={16} />
                      <span>{formatDate(alert.created_at || '')}</span>
                    </div>
                    {alert.user_message && (
                      <div className="info-row">
                        <MessageSquare size={16} />
                        <span>{alert.user_message}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="alert-actions">
                  <button
                    onClick={() => openMap(alert.latitude, alert.longitude)}
                    className="action-btn map-btn"
                  >
                    <MapPin size={16} />
                    View Map
                  </button>
                  
                  {alert.status === 'pending' && (
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="action-btn acknowledge-btn"
                    >
                      <Eye size={16} />
                      Acknowledge
                    </button>
                  )}
                  
                  {alert.status === 'acknowledged' && (
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="action-btn resolve-btn"
                    >
                      <CheckCircle size={16} />
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for updating alert status */}
      {selectedAlert && (
        <div className="modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Alert Status</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedAlert(null)}
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="alert-summary">
                <p><strong>User:</strong> {selectedAlert.user_email}</p>
                <p><strong>Location:</strong> {selectedAlert.location_address}</p>
                <p><strong>Type:</strong> {selectedAlert.alert_type}</p>
                <p><strong>Time:</strong> {formatDate(selectedAlert.created_at || '')}</p>
              </div>
              
              <div className="notes-section">
                <label htmlFor="adminNotes">Admin Notes:</label>
                <textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this alert..."
                  rows={4}
                />
              </div>
            </div>
            
            <div className="modal-actions">
              {selectedAlert.status === 'pending' && (
                <button
                  onClick={() => updateAlertStatus(selectedAlert.id!, 'acknowledged')}
                  className="btn acknowledge-btn"
                >
                  <Eye size={16} />
                  Acknowledge
                </button>
              )}
              
              {selectedAlert.status === 'acknowledged' && (
                <button
                  onClick={() => updateAlertStatus(selectedAlert.id!, 'resolved')}
                  className="btn resolve-btn"
                >
                  <CheckCircle size={16} />
                  Resolve
                </button>
              )}
              
              <button
                onClick={() => setSelectedAlert(null)}
                className="btn cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
