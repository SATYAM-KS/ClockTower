import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { User, Mail, MapPin, Phone, Shield, Settings, LogOut, Bell, AlertCircle } from "lucide-react";
import './UserProfile.css';
import { supabase } from '../supabaseClient';
import { useZone } from '../context/ZoneContext';
import Header from '../components/Header';

const UserProfile: React.FC = () => {
  const location = useLocation();
  const userId = location.state?.userId || localStorage.getItem('user_id');
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState('');
  const { currentZone, isSafe } = useZone() as { currentZone: any, isSafe: boolean };

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        setError('User not logged in');
        return;
      }
      setProfile({
        username: user.user_metadata?.username || '',
        email: user.email,
        phone: user.user_metadata?.phone || '',
      });
    }
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (error) return <p className="error">{error}</p>;
  if (!profile) return <p>Loading...</p>;

  const incidentsReported = 7;
  const activeAlerts = 3;

  return (
    <>
      {/* HEADER OUTSIDE profile-page */}
      <Header title="Profile" showBack={true} />

      <div className="profile-page">
        {/* User Info */}
        <section className="profile-user-section">
          <div className="profile-avatar">
            <User size={48} />
          </div>
          <div className="profile-details">
            <h3 className="profile-name">{profile.username}</h3>
            <p className="profile-email">
              <Mail size={16} /> {profile.email}
            </p>
            <p className="profile-phone">
              <Phone size={16} /> {profile.phone}
            </p>
            <p className="profile-location">
              <MapPin size={16} /> Pune, India
            </p>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="profile-stats">
          <div className="stat-box">
            <AlertCircle size={20} />
            <div>
              <span className="stat-value">{incidentsReported}</span><br />
              <span className="stat-label">Incidents Reported</span>
            </div>
          </div>
          <div className="stat-box">
            <Bell size={20} />
            <div>
              <span className="stat-value">{activeAlerts}</span><br />
              <span className="stat-label">Active Alerts</span>
            </div>
          </div>
          <div className="stat-box">
            <Shield size={20} />
            <div>
              <span className="stat-value">
                {isSafe ? 'Safe Zone' : `${currentZone?.name} (${(currentZone?.risk_level || '').toUpperCase()} ZONE)`}
              </span><br />
              <span className="stat-label">Current Zone</span>
            </div>
          </div>
        </section>

        {/* Settings & Actions */}
        <section className="profile-actions">
          <button className="profile-btn">
            <Settings size={18} /> Account Settings
          </button>

          <button className="profile-btn">
            <Bell size={18} /> Notification Preferences
          </button>
          <button className="profile-btn">
            <Shield size={18} /> Privacy & Safety
          </button>
          <button className="profile-btn danger" onClick={handleLogout}>
            <LogOut size={18} /> Log Out
          </button>
        </section>
      </div>
    </>
  );
};

export default UserProfile;
