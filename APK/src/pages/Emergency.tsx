import React from 'react';
import { Phone, Guitar as Hospital, Shield, Flame, Car, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import './Emergency.css';
import { useLocation } from 'react-router-dom';

interface EmergencyService {
  id: string;
  name: string;
  number: string;
  description: string;
  icon: typeof Phone;
  color: string;
}

const Emergency: React.FC = () => {
  const emergencyServices: EmergencyService[] = [
    {
      id: '1',
      name: 'Police',
      number: '100',
      description: 'For immediate police assistance',
      icon: Shield,
      color: 'bg-blue-500'
    },
    {
      id: '2',
      name: 'Fire Department',
      number: '101',
      description: 'Fire emergencies and rescue',
      icon: Flame,
      color: 'bg-red-500'
    },
    {
      id: '3',
      name: 'Medical Emergency',
      number: '108',
      description: 'Medical emergencies and ambulance',
      icon: Hospital,
      color: 'bg-green-500'
    },
    {
      id: '4',
      name: 'Roadside Assistance',
      number: '1800-222-222',
      description: 'Vehicle breakdown and towing',
      icon: Car,
      color: 'bg-yellow-500'
    },
    {
      id: '5',
      name: 'Poison Control',
      number: '1800-222-366',
      description: '24/7 poison emergency helpline',
      icon: AlertTriangle,
      color: 'bg-purple-500'
    }
  ];

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  const location = useLocation();
  const showBack = location.state?.fromHome;

  return (
    <div className="emergency-page">
      <Header title="Emergency Services" showBack={showBack} />
      {/* Emergency Alert */}
      <div className="emergency-alert-section">
        <div className="emergency-alert-card">
          <div className="emergency-alert-header">
            <AlertTriangle className="emergency-alert-icon" size={24} />
            <div>
              <h3 className="emergency-alert-title">Emergency Alert</h3>
              <p className="emergency-alert-desc">In case of immediate danger, call 100 right away</p>
            </div>
          </div>
        </div>
      </div>
      {/* Quick Call 911 */}
      <div className="emergency-call-section">
        <button onClick={() => handleCall('100')} className="emergency-call-btn">
          <div className="emergency-call-content">
            <Phone size={24} className="emergency-call-icon" />
            <span className="emergency-call-label">CALL 100 NOW</span>
          </div>
        </button>
      </div>
      {/* Emergency Services List */}
      <div className="emergency-services-section">
        <h3 className="emergency-services-title">Emergency Services</h3>
        <div className="emergency-services-list">
          {emergencyServices.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.id} className="emergency-service-card">
                <div className="emergency-service-main">
                  <div className={`emergency-service-icon ${service.color}`}><Icon size={24} className="emergency-service-icon-svg" /></div>
                  <div className="emergency-service-info">
                    <h4 className="emergency-service-name">{service.name}</h4>
                    <p className="emergency-service-desc">{service.description}</p>
                    <p className="emergency-service-number">{service.number}</p>
                  </div>
                </div>
                <button onClick={() => handleCall(service.number)} className="emergency-service-call-btn">
                  <Phone size={20} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {/* Additional Information */}
      <div className="emergency-info-section">
        <div className="emergency-info-card">
          <h3 className="emergency-info-title">Important Information</h3>
          <div className="emergency-info-list">
            <p className="emergency-info-item">• Stay calm and speak clearly when calling emergency services</p>
            <p className="emergency-info-item">• Provide your exact location and nature of emergency</p>
            <p className="emergency-info-item">• Follow the dispatcher's instructions</p>
            <p className="emergency-info-item">• Don't hang up until told to do so</p>
            <p className="emergency-info-item">• Have your location services enabled for accurate positioning</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Emergency;