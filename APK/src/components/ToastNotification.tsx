import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import './ToastNotification.css';

interface ToastNotificationProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  id,
  type,
  message,
  duration = 4000,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertCircle size={20} />;
      case 'info':
        return <Info size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Info';
      default:
        return 'Notification';
    }
  };

  return (
    <div className={`toast-notification toast-${type}`}>
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-content">
        <h4 className="toast-title">{getTitle()}</h4>
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close" onClick={() => onClose(id)}>
        <X size={16} />
      </button>
    </div>
  );
};

export default ToastNotification;
