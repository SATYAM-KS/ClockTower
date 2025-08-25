import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, MapPin, Users, Bell, Shield, Zap } from 'lucide-react';
import Header from '../components/Header';
import './Alerts.css';

interface Alert {
  id: string;
  title: string;
  message: string;
  location: string;
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'emergency' | 'safety' | 'weather' | 'traffic' | 'community';
  isActive: boolean;
  helpRequests?: number;
}

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'emergency' | 'help'>('all');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAlerts([
        {
          id: '1',
          title: 'Emergency Help Request',
          message: 'Someone pressed the help button near Downtown Area. Emergency services have been notified.',
          location: 'Downtown Commercial District',
          timestamp: '2024-01-16T14:30:00Z',
          severity: 'critical',
          type: 'emergency',
          isActive: true,
          helpRequests: 1
        },
        {
          id: '2',
          title: 'High Crime Activity Alert',
          message: 'Increased criminal activity reported in the area. Avoid if possible and stay alert.',
          location: 'Industrial District, 5th Street',
          timestamp: '2024-01-16T13:15:00Z',
          severity: 'high',
          type: 'safety',
          isActive: true
        },
        {
          id: '3',
          title: 'Community Safety Alert',
          message: 'Multiple residents reported suspicious activity. Police patrol increased in the area.',
          location: 'Residential Area, Oak Avenue',
          timestamp: '2024-01-16T11:45:00Z',
          severity: 'medium',
          type: 'community',
          isActive: true,
          helpRequests: 3
        },
        {
          id: '4',
          title: 'Weather Safety Warning',
          message: 'Heavy fog reducing visibility. Drive carefully and use headlights.',
          location: 'Citywide',
          timestamp: '2024-01-16T09:20:00Z',
          severity: 'medium',
          type: 'weather',
          isActive: false
        },
        {
          id: '5',
          title: 'Traffic Safety Alert',
          message: 'Road closure due to accident. Use alternate routes.',
          location: 'Main Street & 2nd Avenue',
          timestamp: '2024-01-16T08:10:00Z',
          severity: 'low',
          type: 'traffic',
          isActive: false
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency': return <Shield className="text-red-500" size={20} />;
      case 'safety': return <AlertTriangle className="text-orange-500" size={20} />;
      case 'weather': return <Zap className="text-blue-500" size={20} />;
      case 'traffic': return <MapPin className="text-purple-500" size={20} />;
      case 'community': return <Users className="text-green-500" size={20} />;
      default: return <Bell className="text-gray-500" size={20} />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'active': return alert.isActive;
      case 'emergency': return alert.type === 'emergency';
      case 'help': return alert.helpRequests && alert.helpRequests > 0;
      default: return true;
    }
  });

  if (loading) {
    return (
      <div className="alerts-page">
        <Header title="Alerts" />
        <div className="alerts-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="alerts-page">
      <Header title="Safety Alerts" />
      {/* Filter Tabs */}
      <div className="alerts-filter-tabs">
        {['all', 'active', 'emergency', 'help'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType as any)}
            className={`alerts-filter-btn${filter === filterType ? ' alerts-filter-btn-active' : ''}`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>
      {/* Active Emergency Alert */}
      {alerts.some(a => a.isActive && a.severity === 'critical') && (
        <div className="alerts-banner">
          <div className="alerts-banner-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="alerts-banner-content">
            <h3>CRITICAL ALERT ACTIVE</h3>
            <p>Emergency help requests in progress</p>
          </div>
        </div>
      )}
      {/* Alert Statistics */}
      <div className="alerts-stats">
        <div className="alerts-stats-grid">
          <div className="alerts-stats-item">
            <div className="alerts-stats-value alerts-stats-red">{alerts.filter(a => a.isActive).length}</div>
            <div className="alerts-stats-label">Active Alerts</div>
          </div>
          <div className="alerts-stats-item">
            <div className="alerts-stats-value alerts-stats-orange">{alerts.filter(a => a.type === 'emergency').length}</div>
            <div className="alerts-stats-label">Emergency</div>
          </div>
          <div className="alerts-stats-item">
            <div className="alerts-stats-value alerts-stats-blue">{alerts.reduce((sum, a) => sum + (a.helpRequests || 0), 0)}</div>
            <div className="alerts-stats-label">Help Requests</div>
          </div>
        </div>
      </div>
      {/* Alerts List */}
      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="alerts-card alerts-card-empty">
            <Bell size={48} className="alerts-empty-icon" />
            <h3 className="alerts-title">No Alerts Found</h3>
            <p className="alerts-message">No alerts match your current filter.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div key={alert.id} className={`alerts-card${alert.isActive ? ' alerts-card-active' : ''}`}> 
              <div className="alerts-card-header">
                <span className={`alerts-type-icon`}>{getTypeIcon(alert.type)}</span>
                <span className={`alerts-severity alerts-severity-${alert.severity}`}>{alert.severity.toUpperCase()}</span>
                {alert.isActive && (
                  <span className="alerts-badge alerts-badge-active">ACTIVE</span>
                )}
                {alert.helpRequests && alert.helpRequests > 0 && (
                  <span className="alerts-badge alerts-badge-help">{alert.helpRequests} HELP</span>
                )}
              </div>
              <h4 className="alerts-title">{alert.title}</h4>
              <p className="alerts-message">{alert.message}</p>
              <div className="alerts-meta">
                <div className="alerts-meta-item"><MapPin size={16} /> {alert.location}</div>
                <div className="alerts-meta-item"><Clock size={16} /> {formatTimestamp(alert.timestamp)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;