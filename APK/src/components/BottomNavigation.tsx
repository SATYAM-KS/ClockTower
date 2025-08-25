import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, FileText, Calendar, AlertTriangle, Users, Shield } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import './BottomNavigation.css';

export const navItems = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/news', icon: FileText, label: 'News' },
  { path: '/events', icon: Calendar, label: 'Events' },
  { path: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { path: '/community', icon: Users, label: 'Community' }
];

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        console.log('No user session found');
        setIsAdmin(false);
        return;
      }

      // Use centralized admin checking method
      const { checkAdminStatusByEmail } = await import('../utils/supabaseClient');
      const adminStatus = await checkAdminStatusByEmail(session.user.email);
      setIsAdmin(adminStatus);
      
      console.log(`BottomNavigation - Admin status for ${session.user.email}: ${adminStatus}`);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  // Create navigation items array based on admin status
  const getNavItems = () => {
    const items = [...navItems];
    if (isAdmin) {
      // Add admin button for admin users only
      items.push({ path: '/admin', icon: Shield, label: 'Admin' });
    }
    return items;
  };

  if (loading) {
    return null; // Don't show navigation while checking admin status
  }

  const currentNavItems = getNavItems();

  return (
    <nav className="bottom-nav md:hidden">
      <div className="bottom-nav-inner">
        {currentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`bottom-nav-link ${isActive ? 'bottom-nav-link-active' : 'bottom-nav-link-inactive'}`}
            >
              <Icon
                size={22}
                className="bottom-nav-icon"
                color={isActive ? '#fff' : '#9ca3af'}
              />
              <span className="bottom-nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;