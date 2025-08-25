import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, AlertTriangle, Eye, FileText } from 'lucide-react';
import Header from '../components/Header';
import './Reports.css';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

interface Report {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  date: string;
  status: 'pending' | 'investigating' | 'resolved';
  type: 'theft' | 'assault' | 'vandalism' | 'other';
  severity: 'low' | 'medium' | 'high';
}

interface RedZone {
  id: string;
  latitude: number;
  longitude: number;
  incident_count: number;
  last_incident: string;
  // Add other fields as needed
}

interface Incident {
  id: string;
  red_zone_id: string;
  description: string;
  latitude: number;
  longitude: number;
  created_at: string;
  // Add other fields as needed
}

const reportCrime = async (description: string) => {
  navigator.geolocation.getCurrentPosition(async (position) => {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    const { data: redZones, error } = await supabase
      .from('red_zones')
      .select('*');
    if (error || !redZones) {
      alert('Failed to fetch red zones');
      return;
    }
    // Explicitly type redZones as RedZone[]
    const typedRedZones: RedZone[] = (redZones as RedZone[]) || [];
    function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }
    let nearestZone: RedZone | null = null;
    let minDistance = Infinity;
    for (const zone of typedRedZones) {
      const dist = haversineDistance(userLat, userLng, zone.latitude, zone.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearestZone = zone;
      }
    }
    const now = new Date().toISOString();
    if (nearestZone !== null && minDistance <= 10) {
      if (nearestZone.id && typeof nearestZone.incident_count === 'number') {
        console.log('Updating red zone:', nearestZone.id, 'with incident_count:', (nearestZone.incident_count || 0) + 1);
        const { error: updateError } = await supabase.from('red_zones').update({
          incident_count: (nearestZone.incident_count || 0) + 1,
          last_incident: now
        }).eq('id', nearestZone.id);
        if (updateError) {
          console.log('Error updating red zone:', updateError);
        }
        const { error: incidentError } = await supabase.from('incidents').insert([{
          red_zone_id: nearestZone.id,
          description,
          latitude: userLat,
          longitude: userLng,
          created_at: now
        }]);
        if (incidentError) {
          console.log('Error inserting incident:', incidentError);
        } else {
          console.log('Incident inserted for red zone:', nearestZone.id);
        }
        alert('Crime reported under existing red zone!');
      }
    } else {
      const { data: newZone, error: newZoneError } = await supabase.from('red_zones').insert([{
        latitude: userLat,
        longitude: userLng,
        incident_count: 1,
        last_incident: now
      }]).select().single();
      if (newZoneError || !newZone) {
        console.log('Error inserting new red zone:', newZoneError);
        alert('Failed to create new red zone');
        return;
      }
      const typedNewZone = newZone as RedZone;
      if (typedNewZone.id) {
        console.log('New red zone created:', typedNewZone.id);
        const { error: incidentError } = await supabase.from('incidents').insert([{
          red_zone_id: typedNewZone.id,
          description,
          latitude: userLat,
          longitude: userLng,
          created_at: now
        }]);
        if (incidentError) {
          console.log('Error inserting incident:', incidentError);
        } else {
          console.log('Incident inserted for new red zone:', typedNewZone.id);
        }
        alert('Crime reported and new red zone created!');
      }
    }
  }, (error) => {
    alert('Could not get location');
  });
};

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'investigating' | 'resolved'>('all');
  const location = useLocation();
  const showBack = location.state?.fromHome;

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setReports([]);
        setLoading(false);
        return;
      }
      // Fetch reports for this user
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        setReports([]);
      } else {
        setReports(data || []);
      }
      setLoading(false);
    }
    fetchReports();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredReports = reports.filter(report => 
    filter === 'all' || report.status === filter
  );

  if (loading) {
    return (
      <div className="reports-page">
        <Header title="Reports" showBack={showBack} />
        <div className="reports-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <Header title="Reports" showBack={showBack} />
      {/* Filter Tabs */}
      <div className="reports-filter-tabs">
        {['all', 'pending', 'investigating', 'resolved'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`reports-filter-btn${filter === status ? ' reports-filter-btn-active' : ''}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>
      {/* Reports List */}
      <div className="reports-list">
        {filteredReports.length === 0 ? (
          <div className="reports-card reports-card-empty">
            <FileText size={48} className="reports-empty-icon" />
            <h3 className="reports-title">No Reports Found</h3>
            <p className="reports-description">No reports match your current filter.</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div key={report.id} className="reports-card">
              <div className="reports-card-header">
                <h4 className="reports-title">{report.title}</h4>
                <div className="reports-status-group">
                  <span className={`reports-status reports-status-${report.status}`}>{report.status}</span>
                  <AlertTriangle size={16} className={`reports-severity reports-severity-${report.severity}`} />
                </div>
              </div>
              <p className="reports-description">{report.description}</p>
              <div className="reports-meta">
                <div className="reports-meta-item"><MapPin size={16} /> {report.latitude}, {report.longitude}</div>
                <div className="reports-meta-item"><Calendar size={16} /> {report.date ? new Date(report.date).toLocaleString() : 'N/A'}</div>
              </div>
              <div className="reports-divider"></div>
              <button className="reports-view-btn">
                <Eye size={16} />
                <span>View Details</span>
              </button>
            </div>
          ))
        )}
      </div>
      {/* Statistics */}
      <div className="reports-stats">
        <h3 className="reports-stats-title">Report Statistics</h3>
        <div className="reports-stats-grid">
          <div className="reports-stats-item">
            <div className="reports-stats-value reports-stats-yellow">{reports.filter(r => r.status === 'pending').length}</div>
            <div className="reports-stats-label">Pending</div>
          </div>
          <div className="reports-stats-item">
            <div className="reports-stats-value reports-stats-blue">{reports.filter(r => r.status === 'investigating').length}</div>
            <div className="reports-stats-label">Investigating</div>
          </div>
          <div className="reports-stats-item">
            <div className="reports-stats-value reports-stats-green">{reports.filter(r => r.status === 'resolved').length}</div>
            <div className="reports-stats-label">Resolved</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;