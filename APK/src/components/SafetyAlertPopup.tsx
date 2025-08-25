import React from 'react';
import { AlertTriangle, X, Shield } from 'lucide-react';
import './SafetyAlertPopup.css';

interface SafetyAlertPopupProps {
  isOpen: boolean;
  onClose: () => void;
  zoneName?: string;
  alertType: 'red_zone_entry' | 'red_zone_exit' | 'sos_triggered' | 'permission_required';
  message: string;
  severity: 'warning' | 'danger' | 'info' | 'success';
}

const SafetyAlertPopup: React.FC<SafetyAlertPopupProps> = ({
  isOpen,
  onClose,
  zoneName,
  alertType,
  message,
  severity
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (alertType) {
      case 'red_zone_entry':
        return <AlertTriangle size={24} />;
      case 'red_zone_exit':
        return <Shield size={24} />;
      case 'sos_triggered':
        return <Shield size={24} />;
      case 'permission_required':
        return <AlertTriangle size={24} />;
      default:
        return <AlertTriangle size={24} />;
    }
  };

  const getTitle = () => {
    switch (alertType) {
      case 'red_zone_entry':
        return `⚠ Safety Alert: ${zoneName || 'Red Zone'}`;
      case 'red_zone_exit':
        return '✅ Safety Monitoring Deactivated';
      case 'sos_triggered':
        return '🚨 SOS Alert Triggered';
      case 'permission_required':
        return '🔒 Permission Required';
      default:
        return '⚠ Safety Alert';
    }
  };

  return (
    <div className="safety-alert-overlay">
      <div className={`safety-alert-popup safety-alert-${severity}`}>
        <div className="safety-alert-header">
          <div className="safety-alert-icon">
            {getIcon()}
          </div>
          <h3 className="safety-alert-title">{getTitle()}</h3>
          <button className="safety-alert-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="safety-alert-content">
          <p className="safety-alert-message">{message}</p>
          
          {alertType === 'red_zone_entry' && (
            <div className="safety-alert-info">
              <p>🚨 Safety monitoring has been activated</p>
              <p>📱 All sensors are now active</p>
              <p>🎤 Microphone access requested</p>
            </div>
          )}
          
          {alertType === 'sos_triggered' && (
            <div className="safety-alert-info">
              <p>📍 Your location has been shared with admin</p>
              <p>🆘 Help is on the way</p>
              <p>📞 Stay calm and wait for assistance</p>
            </div>
          )}
          
          {alertType === 'permission_required' && (
            <div className="safety-alert-info">
              <p>🎤 Microphone access is required for voice monitoring</p>
              <p>🔒 Your voice data is processed locally only</p>
              <p>✅ Please allow microphone access when prompted</p>
            </div>
          )}
        </div>
        
        <div className="safety-alert-actions">
          <button 
            className={`safety-alert-button safety-alert-${severity}`}
            onClick={onClose}
          >
            {alertType === 'permission_required' ? 'Request Permission' : 'I Understand'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyAlertPopup;
