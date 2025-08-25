import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ZoneProvider } from './context/ZoneContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import AdminRouteGuard from './components/AdminRouteGuard';
import Home from './pages/Home';
import News from './pages/News';
import Events from './pages/Events';
import Alerts from './pages/Alerts';
import Community from './pages/Community';
import RedZones from './pages/RedZones';
import AuthCallback from './pages/AuthCallback';
import AdminDashboard from './pages/AdminDashboard';
import RouteAnalyzer from './pages/RouteAnalyzer';
import Emergency from './pages/Emergency';
import SOS from './pages/SOS';
import UserProfile from './pages/UserProfile';
import Reports from './pages/Reports';
import ReportIncident from './pages/ReportIncident';
import Notification from './pages/Notification';
import AuthTest from './pages/AuthTest';
import BottomNavigation from './components/BottomNavigation';
import FloatingActionButton from './components/FloatingActionButton';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthPage } from '../sign/components/AuthPage';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <ZoneProvider>
            <Router>
              <div className="App">
                <Routes>
                  {/* Public Auth Routes */}
                  <Route path="/login" element={
                    <AuthGuard requireAuth={false}>
                      <AuthPage />
                    </AuthGuard>
                  } />
                  <Route path="/register" element={
                    <AuthGuard requireAuth={false}>
                      <AuthPage />
                    </AuthGuard>
                  } />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  
                  {/* Protected App Routes */}
                  <Route path="/" element={
                    <AuthGuard>
                      <Home />
                    </AuthGuard>
                  } />
                  <Route path="/home" element={
                    <AuthGuard>
                      <Home />
                    </AuthGuard>
                  } />
                  <Route path="/news" element={
                    <AuthGuard>
                      <News />
                    </AuthGuard>
                  } />
                  <Route path="/events" element={
                    <AuthGuard>
                      <Events />
                    </AuthGuard>
                  } />
                  <Route path="/alerts" element={
                    <AuthGuard>
                      <Alerts />
                    </AuthGuard>
                  } />
                  <Route path="/community" element={
                    <AuthGuard>
                      <Community />
                    </AuthGuard>
                  } />
                  <Route path="/redzones" element={
                    <AuthGuard>
                      <RedZones />
                    </AuthGuard>
                  } />
                  <Route path="/admin" element={
                    <AuthGuard>
                      <AdminRouteGuard>
                        <AdminDashboard />
                      </AdminRouteGuard>
                    </AuthGuard>
                  } />
                  <Route path="/route-analyzer" element={
                    <AuthGuard>
                      <RouteAnalyzer />
                    </AuthGuard>
                  } />
                  <Route path="/emergency" element={
                    <AuthGuard>
                      <Emergency />
                    </AuthGuard>
                  } />
                  <Route path="/sos" element={
                    <AuthGuard>
                      <SOS />
                    </AuthGuard>
                  } />
                  <Route path="/profile" element={
                    <AuthGuard>
                      <UserProfile />
                    </AuthGuard>
                  } />
                  <Route path="/reports" element={
                    <AuthGuard>
                      <Reports />
                    </AuthGuard>
                  } />
                  <Route path="/report" element={
                    <AuthGuard>
                      <ReportIncident />
                    </AuthGuard>
                  } />
                  <Route path="/notification" element={
                    <AuthGuard>
                      <Notification />
                    </AuthGuard>
                  } />
                  
                  {/* Test Route */}
                  <Route path="/auth-test" element={
                    <AuthGuard>
                      <AuthTest />
                    </AuthGuard>
                  } />
                </Routes>
                <FloatingActionButton />
                <BottomNavigation />
              </div>
            </Router>
          </ZoneProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;