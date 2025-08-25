import React, { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import FloatingButton from './FloatingButton';
import Header from './Header';
import Sidebar from './sidebar'; // import your sidebar component
import './Layout.css';

const Layout: React.FC = () => {
  const location = useLocation();
  const showFloatingButton = location.pathname === '/home';

  // State to control sidebar open/close
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sidebar toggle handler
  const toggleSidebar = () => {
    console.log('Sidebar toggle clicked, current state:', isSidebarOpen);
    console.log('Setting sidebar to:', !isSidebarOpen);
    setIsSidebarOpen(prev => {
      const newState = !prev;
      console.log('Sidebar state changed to:', newState);
      return newState;
    });
  };

  const usesFixedHeader = location.pathname !== '/home';

  return (
    <div className="layout">
      {/* Pass toggle handler to Header */}
      <Header title="App Title" onHamburgerClick={toggleSidebar} />

      {/* Sidebar component controlled by isSidebarOpen, only visible on desktop */}
      <div className="sidebar-desktop-only">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>

      <main className={`layout-main ${usesFixedHeader ? 'with-header-padding' : ''}`}>
        <Outlet />
      </main>

      {showFloatingButton && <FloatingButton />}
      <div className="layout-bottom-nav">
        <BottomNavigation />
      </div>
    </div>
  );
};

export default Layout;
