import React, { createContext, useContext, useState, ReactNode } from 'react';
import SafetyAlertPopup from '../components/SafetyAlertPopup';
import ToastNotification from '../components/ToastNotification';

export interface SafetyAlert {
  id: string;
  type: 'red_zone_entry' | 'red_zone_exit' | 'sos_triggered' | 'permission_required';
  message: string;
  severity: 'warning' | 'danger' | 'info' | 'success';
  zoneName?: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export interface ToastAlert {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface NotificationContextType {
  showSafetyAlert: (alert: Omit<SafetyAlert, 'id'>) => void;
  hideSafetyAlert: (id: string) => void;
  clearAllAlerts: () => void;
  showToast: (toast: Omit<ToastAlert, 'id'>) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  const showSafetyAlert = (alertData: Omit<SafetyAlert, 'id'>) => {
    const id = `alert-${Date.now()}-${Math.random()}`;
    const newAlert: SafetyAlert = {
      ...alertData,
      id,
      autoClose: alertData.autoClose ?? false,
      autoCloseDelay: alertData.autoCloseDelay ?? 5000
    };

    setAlerts(prev => [...prev, newAlert]);

    // Auto-close if enabled
    if (newAlert.autoClose) {
      setTimeout(() => {
        hideSafetyAlert(id);
      }, newAlert.autoCloseDelay);
    }
  };

  const hideSafetyAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const showToast = (toastData: Omit<ToastAlert, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastAlert = {
      ...toastData,
      id,
      duration: toastData.duration ?? 4000
    };

    setToasts(prev => [...prev, newToast]);
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  const value: NotificationContextType = {
    showSafetyAlert,
    hideSafetyAlert,
    clearAllAlerts,
    showToast,
    hideToast,
    clearAllToasts
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Render all active safety alerts */}
      {alerts.map(alert => (
        <SafetyAlertPopup
          key={alert.id}
          isOpen={true}
          onClose={() => hideSafetyAlert(alert.id)}
          alertType={alert.type}
          message={alert.message}
          severity={alert.severity}
          zoneName={alert.zoneName}
        />
      ))}
      
      {/* Render all active toast notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <ToastNotification
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={hideToast}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
