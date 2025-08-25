import React from 'react';
import { MapPin, Phone, FileText, Shield, Bell, User } from 'lucide-react';
import FeatureCard from '../components/FeatureCard';
import { useZone } from '../context/ZoneContext';
import SafetyConfirmationPopup from '../components/SafetyConfirmationPopup';
import './Home.css';

const Home: React.FC = () => {
  const { 
    isSafe, 
    currentZone, 
    showSafetyPopup, 
    accidentDetails, 
    onSafetyConfirmed,
    isSafetyMonitoring,
    safetyData
  } = useZone();

  return (
    <div className="homepage">
      {/* Geo-Fencing Alert */}
      {!isSafe && (
        <div className="geo-alert-banner">
          ⚠ You are in a Red Zone: <strong>{(currentZone as any)?.name || 'Unnamed Area'}</strong>
          <div className="safety-status">
            🛡️ Safety monitoring is active
          </div>
        </div>
      )}

      {/* Home Title and Subtitle */}
      <header className="home-header">
        <div className="header-container">
          <div className="home-header-center">
            <h1 className="home-title">RED ZONE</h1>
            <p className="home-subtitle">Every street. Every step. Safer.</p>
          </div>
        </div>
      </header>

      {/* Feature Cards */}
      <section className="feature-grid">
        <FeatureCard title="Live Map" icon={MapPin} to="/redzones" state={{ fromHome: true }} className="feature-card pink" />
        <FeatureCard title="Emergency" icon={Phone} to="/emergency" state={{ fromHome: true }} className="feature-card blue" />
        <FeatureCard title="My Reports" icon={FileText} to="/reports" state={{ fromHome: true }} className="feature-card yellow" />
        <FeatureCard title="S.O.S" icon={Shield} to="/sos" state={{ fromHome: true }} className="feature-card red" />
        <FeatureCard title="Notification" icon={Bell} to="/notification" state={{ fromHome: true }} className="feature-card red" />
        <FeatureCard title="Profile" icon={User} to="/profile" state={{ fromHome: true }} className="feature-card blue" />
      </section>

      {/* Safety Tips */}
      <section className="tips-section">
        <h2 className="tips-title">Safety Tips</h2>
        <div className="tips-list-container">
          <ul className="tips-list">
            <li className="tip-item"><span className="tip-dot">•</span> Stay aware of your surroundings at all times</li>
            <li className="tip-item"><span className="tip-dot">•</span> Avoid poorly lit or isolated areas</li>
            <li className="tip-item"><span className="tip-dot">•</span> Keep your emergency contacts up-to-date</li>
            <li className="tip-item"><span className="tip-dot">•</span> Use the app to report suspicious activity</li>
            <li className="tip-item"><span className="tip-dot">•</span> Use the SOS button for immediate emergency alerts</li>
            <li className="tip-item"><span className="tip-dot">•</span> Check the Live Map for red zone information</li>
            <li className="tip-item"><span className="tip-dot">•</span> Report incidents to help keep others safe</li>
            <li className="tip-item"><span className="tip-dot">•</span> Keep your location services enabled for accurate alerts</li>
          </ul>
        </div>
      </section>

      {/* Safety Confirmation Popup */}
      <SafetyConfirmationPopup
        isOpen={showSafetyPopup}
        onClose={() => onSafetyConfirmed(false)}
        onSafetyConfirmed={onSafetyConfirmed}
        accidentDetails={accidentDetails}
      />
    </div>
  );
};

export default Home;
