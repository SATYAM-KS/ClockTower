import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import SafetyMonitor, { SafetyData, AccidentDetectionResult } from '../utils/safetyMonitor';
import SOSService from '../utils/sosService';
import { useNotification } from './NotificationContext';
import { supabase } from '../utils/supabaseClient'; 

// Haversine formula to compute distance between two geo points
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Context type
const ZoneContext = createContext({
  currentZone: null as any,
  isSafe: true,
  userLocation: null as { lat: number; lng: number } | null,
  zones: [] as any[],
  safetyData: null as SafetyData | null,
  isSafetyMonitoring: false,
  showSafetyPopup: false,
  accidentDetails: null as AccidentDetectionResult | null,
  startSafetyMonitoring: () => {},
  stopSafetyMonitoring: () => {},
  onSafetyConfirmed: (isSafe: boolean) => {},
  getSystemStatus: () => {},
  resetSystem: () => {},
});

export const ZoneProvider = ({ children }: { children: ReactNode }) => {
  const [zones, setZones] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentZone, setCurrentZone] = useState<any>(null);
  const [alertShown, setAlertShown] = useState(false);
  const [safetyData, setSafetyData] = useState<SafetyData | null>(null);
  const [isSafetyMonitoring, setIsSafetyMonitoring] = useState(false);
  const [showSafetyPopup, setShowSafetyPopup] = useState(false);
  const [accidentDetails, setAccidentDetails] = useState<AccidentDetectionResult | null>(null);

  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [safetyMonitor] = useState(() => new SafetyMonitor(
    // Permission request callback
    (type: 'microphone' | 'motion', granted: boolean) => {
      if (!granted) {
        showSafetyAlert({
          type: 'permission_required',
          message: `${type === 'microphone' ? 'Microphone' : 'Motion sensor'} access is required for safety monitoring.`,
          severity: 'info',
          autoClose: true,
          autoCloseDelay: 8000
        });
      }
    },

  ));
  const [sosService] = useState(() => new SOSService());
  
  // Use notification context
  const { showSafetyAlert } = useNotification();

  // Initialize SOSService when user is authenticated
  useEffect(() => {
    const initializeSOSService = async () => {
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await sosService.initialize();
        }
      } catch (error) {
        console.log('SOS Service not initialized - user not authenticated yet');
      }
    };

    initializeSOSService();
  }, [sosService]);

  // Track user interaction to enable vibration API
  useEffect(() => {
    const handleUserInteraction = () => {
      setHasUserInteracted(true);
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  // Safe vibration function that checks user interaction
  const safeVibrate = (pattern: number | number[]) => {
    if (hasUserInteracted && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
        console.log('✅ Vibration triggered:', pattern);
      } catch (error) {
        console.log('❌ Vibration failed:', error);
      }
    } else if (!hasUserInteracted) {
      console.log('⏸️  Vibration skipped - user has not interacted with page yet (Chrome intervention prevention)');
    } else {
      console.log('❌ Vibration not supported in this browser');
    }
  };

  // Fetch red zones from Supabase
  useEffect(() => {
    async function fetchZones() {
      const { data, error } = await supabase.from('red_zones').select('*');
      if (error) {
        console.error('Error fetching zones:', error);
      } else {
        setZones(data || []);
      }
    }
    fetchZones();
  }, []);

  // Track user location in real-time
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (err) => {
          console.error('Geolocation error:', err);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 10000,
        }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Detect if user is inside any red zone
  useEffect(() => {
    if (userLocation && zones.length > 0) {
      const foundZone = zones.find((zone) => {
        const dist = haversineDistance(
          userLocation.lat,
          userLocation.lng,
          parseFloat(zone.latitude),
          parseFloat(zone.longitude)
        );
        return dist < 500; // zone radius threshold
      });

      setCurrentZone(foundZone || null);
    }
  }, [userLocation, zones]);

  // Effect to handle red zone entry/exit
  useEffect(() => {
    if (currentZone && !isSafetyMonitoring) {
      console.log('🚨 Entered red zone - starting safety monitoring');
      
      // Show red zone entry alert
      const zoneName = currentZone.name || 'a Red Zone';
      showSafetyAlert({
        type: 'red_zone_entry',
        message: `You have entered ${zoneName}. Safety monitoring has been activated.`,
        severity: 'warning',
        zoneName: zoneName,
        autoClose: true,
        autoCloseDelay: 3000
      });

      safeVibrate([300, 100, 300]);
      
      startSafetyMonitoring();
    } else if (!currentZone && isSafetyMonitoring) {
      console.log('✅ Left red zone - stopping safety monitoring');
      
      // Show red zone exit alert
      showSafetyAlert({
        type: 'red_zone_exit',
        message: 'You have left the red zone. Safety monitoring deactivated.',
        severity: 'success',
        autoClose: true,
        autoCloseDelay: 3000
      });
      
      stopSafetyMonitoring();
    }
  }, [currentZone, isSafetyMonitoring]);

  const startSafetyMonitoring = () => {
    if (!isSafetyMonitoring) {
      console.log('🎤 Starting safety monitoring with speech recognition...');
      safetyMonitor.startMonitoring(
        (accidentResult: AccidentDetectionResult) => {
          // Accident detected - show safety popup
          setAccidentDetails(accidentResult);
          setShowSafetyPopup(true);
          
          // Send SOS alert to admin based on accident type
          if (accidentResult.isPotentialAccident) {
            const currentData = safetyMonitor.getCurrentSafetyData();
            if (currentData && currentData.lastLocation) {
              sosService.sendStationaryUserAlert(
                currentData.lastLocation,
                0,
                `${accidentResult.reason} (${accidentResult.triggerType} trigger)`
              );
            }
          }
          
          // Show SOS popup instead of browser alert
          showSafetyAlert({
            type: 'sos_triggered',
            message: `Safety alert: ${accidentResult.reason}`,
            severity: 'danger',
            autoClose: true,
            autoCloseDelay: 8000
          });
          
          // Vibrate to alert user
          safeVibrate([200, 100, 200, 100, 200]);
        },
        (safetyData: SafetyData) => {
          // Update safety data with red zone status
          setSafetyData({
            ...safetyData,
            isInRedZone: !!currentZone
          });
        },
        // Stationary user detection callback
        async (location: { lat: number; lng: number }, durationMinutes: number) => {
          console.log(`Stationary user detected at ${location.lat}, ${location.lng} for ${durationMinutes} minutes`);
          
          // Send SOS alert to admin
          const result = await sosService.sendStationaryUserAlert(location, durationMinutes);
          
          if (result.success) {
            console.log('SOS alert sent successfully:', result.alertId);
            // Show popup instead of browser alert
            showSafetyAlert({
              type: 'sos_triggered',
              message: `You have been stationary for ${durationMinutes} minutes. Admin has been notified.`,
              severity: 'danger',
              autoClose: true,
              autoCloseDelay: 10000
            });
          } else {
            console.error('Failed to send SOS alert:', result.error);
            showSafetyAlert({
              type: 'sos_triggered',
              message: 'Failed to send SOS alert. Please check your connection.',
              severity: 'warning',
              autoClose: true,
              autoCloseDelay: 5000
            });
          }
        },
        // Voice keyword detection callback
        async (location: { lat: number; lng: number }, keyword: string) => {
          console.log(`Emergency keyword "${keyword}" detected at ${location.lat}, ${location.lng}`);
          
          // Send SOS alert to admin for keyword detection
          const result = await sosService.sendStationaryUserAlert(location, 0, `Emergency keyword "${keyword}" detected`);
          
          if (result.success) {
            console.log('Keyword SOS alert sent successfully:', result.alertId);
            // Show popup instead of browser alert
            showSafetyAlert({
              type: 'sos_triggered',
              message: `Emergency keyword "${keyword}" detected! Admin has been notified.`,
              severity: 'danger',
              autoClose: true,
              autoCloseDelay: 8000
            });
          } else {
            console.error('Failed to send keyword SOS alert:', result.error);
            showSafetyAlert({
              type: 'sos_triggered',
              message: 'Failed to send keyword SOS alert. Please check your connection.',
              severity: 'warning',
              autoClose: true,
              autoCloseDelay: 5000
            });
          }
        }
      );
      setIsSafetyMonitoring(true);
    }
  };

  const stopSafetyMonitoring = () => {
    if (isSafetyMonitoring) {
      console.log('🛑 Stopping safety monitoring and speech recognition...');
      safetyMonitor.stopMonitoring();
      // Explicitly stop speech recognition when leaving red zone
      safetyMonitor.stopListeningWhenLeavingRedZone();
      setIsSafetyMonitoring(false);
    }
  };

  const onSafetyConfirmed = (isSafe: boolean) => {
    setShowSafetyPopup(false);
    setAccidentDetails(null);
    
    if (isSafe) {
      // User confirmed they are safe
      console.log('User confirmed safety');
    } else {
      // User needs help - could trigger emergency contacts or SOS
      console.log('User needs help - triggering emergency protocols');
      // TODO: Implement emergency protocols
    }
  };

  const getSystemStatus = () => {
    if (safetyMonitor) {
      return safetyMonitor.getSystemStatus();
    }
    return null;
  };

  const resetSystem = () => {
    if (safetyMonitor) {
      console.log('🔄 Resetting safety monitoring system...');
      safetyMonitor.resetSystem();
    }
  };

  return (
    <ZoneContext.Provider
      value={{
        currentZone,
        isSafe: !currentZone,
        userLocation,
        zones,
        safetyData,
        isSafetyMonitoring,
        showSafetyPopup,
        accidentDetails,
        startSafetyMonitoring,
        stopSafetyMonitoring,
        onSafetyConfirmed,
        getSystemStatus,
        resetSystem,
      }}
    >
      {children}
    </ZoneContext.Provider>
  );
};

// Hook for accessing red zone context in any component
export function useZone() {
  return useContext(ZoneContext);
}
