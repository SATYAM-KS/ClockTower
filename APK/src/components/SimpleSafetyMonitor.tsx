import React from 'react';

interface SimpleSafetyMonitorProps {
  isInRedZone: boolean;
  currentLocation: { lat: number; lng: number } | null;
}

const SimpleSafetyMonitor: React.FC<SimpleSafetyMonitorProps> = ({
  isInRedZone,
  currentLocation
}) => {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      margin: '20px 0'
    }}>
      <h3>🛡️ Simple Safety Monitor</h3>
      <div style={{ marginBottom: '15px' }}>
        <p><strong>Red Zone Status:</strong> {isInRedZone ? '⚠️ In Red Zone' : '✅ Safe Zone'}</p>
        <p><strong>Location:</strong> {currentLocation ? `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}` : 'Not available'}</p>
      </div>
      <div style={{ fontSize: '14px', color: '#666' }}>
        <p>💡 This is a simplified safety monitoring component for testing purposes.</p>
        <p>🔄 The full EnhancedSafetyMonitoring component will be re-enabled once import issues are resolved.</p>
      </div>
    </div>
  );
};

export default SimpleSafetyMonitor;
