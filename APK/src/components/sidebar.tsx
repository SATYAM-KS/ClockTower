import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { navItems } from './BottomNavigation';
import { supabase } from '../utils/supabaseClient';
import { Shield } from 'lucide-react';
import './sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
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
      
      console.log(`Sidebar - Admin status for ${session.user.email}: ${adminStatus}`);
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
    return null; // Don't show sidebar while checking admin status
  }

  const currentNavItems = getNavItems();

  return (
    <aside className={`sidebar${isOpen ? ' slide-in' : ''}`}>
      <button className="sidebar-close" onClick={onClose}>×</button>
      <nav className="sidebar-nav">
        <ul>
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link${isActive ? ' active' : ''}`
                  }
                  onClick={onClose}
                >
                  <Icon size={22} />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
