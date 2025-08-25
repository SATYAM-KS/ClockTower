import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Shield } from 'lucide-react';
import './SafetyAlertPopup.css';

interface SafetyAlertPopupProps {
  isOpen: boolean;
  onClose: () => void;
  zoneName?: string;
  alertType: 'red_zone_entry' | 'red_zone_exit' | 'sos_triggered' | 'permission_required';
  message: string;
  severity: 'warning' | 'danger' | 'info' | 'success';
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const SafetyAlertPopup: React.FC<SafetyAlertPopupProps> = ({
  isOpen,
  onClose,
  zoneName,
  alertType,
  message,
  severity,
  autoClose = false,
  autoCloseDelay = 3000
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

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

  // Determine if this should be a redzone banner
  const isRedzoneBanner = alertType === 'red_zone_entry' || alertType === 'red_zone_exit';
  const overlayClass = `safety-alert-overlay ${isRedzoneBanner ? 'redzone-banner' : ''} ${isClosing ? 'closing' : ''}`;

  return (
    <div className={overlayClass}>
      <div className={`safety-alert-popup safety-alert-${severity}`}>
        <div className="safety-alert-header">
          <div className="safety-alert-icon">
            {getIcon()}
          </div>
          <h3 className="safety-alert-title">{getTitle()}</h3>
          <button className="safety-alert-close" onClick={handleClose}>
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
            onClick={handleClose}
          >
            {alertType === 'permission_required' ? 'Request Permission' : 'I Understand'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyAlertPopup;
