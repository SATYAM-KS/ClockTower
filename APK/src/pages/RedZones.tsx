import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import { AlertTriangle, Users, Calendar, Navigation } from 'lucide-react';
import Header from '../components/Header';
import 'leaflet/dist/leaflet.css';
import './RedZones.css';
import L from 'leaflet';
import { Marker, Popup, Circle } from 'react-leaflet';
import { useLocation, useNavigate } from 'react-router-dom';
import SafetyConfirmationPopup from '../components/SafetyConfirmationPopup';
import { useZone } from '../context/ZoneContext';
import { supabase } from '../utils/supabaseClient';

// Map Controller Component to handle map operations
const MapController: React.FC<{ userLocation: { lat: number, lng: number } | null }> = ({ userLocation }) => {
  const map = useMap();
  
  // Expose map instance globally for the focus button
  useEffect(() => {
    if (map) {
      (window as any).currentMap = map;
    }
    return () => {
      delete (window as any).currentMap;
    };
  }, [map]);

  return null;
};

interface RedZone {
  id: string;
  name: string;
  coordinates: [number, number];
  crimeRate: number;
  incidentCount: number;
  lastIncident: string;
  risk_level: 'high' | 'medium' | 'low'; // use snake_case to match backend
  radius: number; // meters
}

interface Incident {
  id: string;
  latitude: number;
  longitude: number;
  red_zone_id?: string;
  // ... other fields ...
}

const RedZones: React.FC = () => {
  const [redZones, setRedZones] = useState<RedZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const showBack = location.state?.fromHome;
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [inZone, setInZone] = useState<RedZone | null>(null);
  const [hasNotified, setHasNotified] = useState(false);
  const navigate = useNavigate();
  
  // Get safety monitoring data from ZoneContext
  const { 
    showSafetyPopup, 
    accidentDetails, 
    onSafetyConfirmed 
  } = useZone();

  // Haversine distance in meters
  function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000;
    const toRad = (x: number) => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Validate coordinates
  function isValidCoordinate(lat: any, lng: any): boolean {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    return !isNaN(latNum) && !isNaN(lngNum) && 
           latNum >= -90 && latNum <= 90 && 
           lngNum >= -180 && lngNum <= 180;
  }

  useEffect(() => {
    let watchId: number | null = null;
    
    const handleLocationSuccess = (pos: GeolocationPosition) => {
      const newLocation = { 
        lat: pos.coords.latitude, 
        lng: pos.coords.longitude 
      };
      console.log('📍 User location updated:', newLocation);
      setUserLocation(newLocation);
    };

    const handleLocationError = (error: GeolocationPositionError) => {
      console.warn('Geolocation error:', error.message);
      // Set a default location (Pune) if geolocation fails
      if (!userLocation) {
        setUserLocation({ lat: 18.5204, lng: 73.8567 });
      }
    };

    if (navigator.geolocation) {
      // First, try to get current position immediately
      navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError,
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 30000 
        }
      );

      // Then start watching for position updates
      watchId = navigator.geolocation.watchPosition(
        handleLocationSuccess,
        handleLocationError,
        { 
          enableHighAccuracy: true, 
          maximumAge: 10000, 
          timeout: 20000 
        }
      );
    } else {
      console.warn('Geolocation not supported');
      // Set default location if geolocation is not supported
      setUserLocation({ lat: 18.5204, lng: 73.8567 });
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function fetchRedZones() {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('red_zones')
          .select('*');

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }

        if (!data || data.length === 0) {
          setRedZones([]);
          setLoading(false);
          return;
        }

        // Transform and validate data
        const zones = data
          .filter(zone => zone && zone.name && zone.latitude && zone.longitude)
          .map(zone => ({
            ...zone,
            coordinates: [parseFloat(zone.latitude), parseFloat(zone.longitude)] as [number, number],
            risk_level: zone.risk_level || 'low',
            incidentCount: parseInt(zone.incident_count) || 0,
            crimeRate: parseFloat(zone.crime_rate) || 0,
            lastIncident: zone.last_incident || 'Unknown',
          }))
          .filter(zone => zone !== null);

        setRedZones(zones);
        setLoading(false);

        // Debug logging
        console.log('🗺️ Red zones loaded:', zones.length);
        console.log('🗺️ Displayable zones:', zones.filter(zone => 
          zone && 
          zone.coordinates && 
          zone.coordinates.length === 2 &&
          zone.risk_level &&
          !isNaN(zone.coordinates[0]) &&
          !isNaN(zone.coordinates[1])
        ).length);
        console.log('🗺️ High activity zones:', zones.filter(zone => 
          zone && 
          zone.coordinates && 
          zone.coordinates.length === 2 &&
          zone.risk_level &&
          !isNaN(zone.coordinates[0]) &&
          !isNaN(zone.coordinates[1]) &&
          zone.incidentCount > INCIDENT_THRESHOLD
        ).length);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch red zones');
        setLoading(false);
      }
    }
    
    fetchRedZones(); // Initial fetch

    intervalId = setInterval(fetchRedZones, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      // Fetch all incidents and red zones
      const { data: incidents, error: incError } = await supabase.from('incidents').select('*');
      const { data: redZones, error: rzError } = await supabase.from('red_zones').select('*');
      if (!incidents || !redZones) return;

      for (const incident of incidents) {
        let foundZone = null;
        for (const zone of redZones) {
          const dist = haversineDistance(
            parseFloat(incident.latitude),
            parseFloat(incident.longitude),
            parseFloat(zone.latitude),
            parseFloat(zone.longitude)
          );
          console.log(`Incident ${incident.id} (${incident.latitude}, ${incident.longitude}) vs Zone ${zone.id} (${zone.latitude}, ${zone.longitude}) - Distance: ${dist}m, Assignment Radius: ${ASSIGNMENT_RADIUS}`);
          if (dist <= ASSIGNMENT_RADIUS) {
            foundZone = zone;
            break;
          }
        }
        if (foundZone) {
          // If not already assigned, update red zone and incident
          if (incident.red_zone_id !== foundZone.id) {
            console.log(`Assigning incident ${incident.id} to zone ${foundZone.id}`);
            const { error: updateError } = await supabase.from('red_zones').update({
              incident_count: (foundZone.incident_count || 0) + 1,
              last_incident: new Date().toISOString()
            }).eq('id', foundZone.id);
            if (updateError) console.error('Update error:', updateError);
            const { error: incUpdateError } = await supabase.from('incidents').update({
              red_zone_id: foundZone.id
            }).eq('id', incident.id);
            if (incUpdateError) console.error('Incident update error:', incUpdateError);
          } else {
            console.log(`Incident ${incident.id} already assigned to zone ${foundZone.id}`);
          }
        } else {
          // Create new red zone for this incident
          console.log(`Creating new red zone for incident ${incident.id} at (${incident.latitude}, ${incident.longitude})`);
          const { data: newZone, error: newZoneError } = await supabase.from('red_zones').insert([{
            latitude: incident.latitude,
            longitude: incident.longitude,
            incident_count: 1,
            last_incident: new Date().toISOString(),
            radius: 500, // default radius in meters
            name: incident.title || `Zone at (${Number(incident.latitude).toFixed(4)}, ${Number(incident.longitude).toFixed(4)})`
          }]).select().single();
          if (newZone && newZone.id) {
            const { error: incUpdateError } = await supabase.from('incidents').update({
              red_zone_id: newZone.id
            }).eq('id', incident.id);
            if (incUpdateError) console.error('Incident update error:', incUpdateError);
          }
          if (newZoneError) console.error('New zone insert error:', newZoneError);
        }
      }
    }, 30000); // every 30 seconds
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (userLocation && redZones.length) {
      // Find the first zone the user is inside
      const foundZone = redZones.find(zone => {
        if (!zone.coordinates || zone.coordinates.length !== 2) return false;
        
        const dist = haversineDistance(
          userLocation.lat, 
          userLocation.lng, 
          zone.coordinates[0], 
          zone.coordinates[1]
        );
        return dist < 500; // Use 500 for user's location
      });

      setInZone(foundZone || null);

      if (foundZone && !hasNotified) {
        if (window.Notification && Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Red Zone Alert', {
                body: `You are currently inside the ${foundZone.name}!`,
                icon: '/favicon.ico'
              });
              setHasNotified(true);
            }
          });
        }
      }

      if (!foundZone && hasNotified) {
        setHasNotified(false);
      }
    }
  }, [userLocation, redZones, hasNotified]);

  function getIncidentColor(incidentCount: number) {
    if (incidentCount >= 40) return '#dc2626'; // red
    if (incidentCount >= 20) return '#f59e0b'; // orange/yellow
    return '#16a34a'; // green
  }

  const getPulseClass = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'radar-pulse-high';
      case 'medium': return 'radar-pulse-medium';
      case 'low': return 'radar-pulse-low';
      default: return '';
    }
  };

  const INCIDENT_THRESHOLD = 10;
  const ASSIGNMENT_RADIUS = 100000; // 1km for assignment logic

  // Filter zones that should be displayed
  const displayableZones = redZones.filter(zone => 
    zone && 
    zone.coordinates && 
    zone.coordinates.length === 2 &&
    zone.risk_level &&
    !isNaN(zone.coordinates[0]) &&
    !isNaN(zone.coordinates[1])
  );

  const highActivityZones = displayableZones.filter(zone => 
    zone.incidentCount > INCIDENT_THRESHOLD
  );

  // Sort displayableZones by incidentCount descending (red/high at top, green/low at bottom)
  const sortedZones = [...displayableZones].sort((a, b) => b.incidentCount - a.incidentCount);

  if (loading) {
    return (
      <div className="redzones-page page-with-header">
        <Header title="Red Zones" showBack={showBack} />
        <div className="redzones-loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="redzones-page page-with-header">
        <Header title="Red Zones" showBack={showBack} />
        <div style={{
          background: '#fee2e2',
          color: '#dc2626',
          padding: '1rem',
          borderRadius: '1rem',
          margin: '1rem',
          textAlign: 'center'
        }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="redzones-page page-with-header">
      <Header title="Red Zones" showBack={showBack} />
      
      {inZone && (
        <div style={{
          background: '#dc2626',
          color: '#fff',
          padding: '1rem',
          borderRadius: '1rem',
          margin: '1rem',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          You are currently inside the {inZone.name}!
        </div>
      )}

      {/* Map Container */}
      <div className="redzones-map-section">
        <div className="redzones-map-container">
          <MapContainer
            center={userLocation ? [userLocation.lat, userLocation.lng] : [18.5204, 73.8567]}
            zoom={12}
            className="redzones-leaflet-map"
          >
            <MapController userLocation={userLocation} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {displayableZones.map((zone) => (
              <React.Fragment key={zone.id}>
                <Circle
                  center={zone.coordinates}
                  radius={500}
                  pathOptions={{
                    color: getIncidentColor(zone.incidentCount),
                    fillColor: getIncidentColor(zone.incidentCount),
                    fillOpacity: 0.2,
                    weight: 2
                  }}
                />
                <Marker
                  position={zone.coordinates}
                  icon={L.divIcon({
                    className: '',
                    html: `
                      <div class="radar-pulse-marker">
                        <div class="radar-pulse" style="background:${getIncidentColor(zone.incidentCount)};opacity:0.7;"></div>
                        <div class="radar-pulse-dot" style="background:${getIncidentColor(zone.incidentCount)};"></div>
                      </div>
                    `,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                  })}
                >
                  <Popup>
                    <div className="redzones-popup">
                      <h3 className="redzones-card-title">{zone.name}</h3>
                      <p className="redzones-card-detail-label">Crime Rate: {zone.crimeRate}</p>
                      <p className="redzones-card-detail-label">Incidents: {zone.incidentCount}</p>
                      <p className="redzones-card-detail-label">Last: {zone.lastIncident}</p>
                      <p className="redzones-card-detail-label">Radius: 500m</p>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}
            
            {/* Debug info - show when no zones are displayed */}
            {displayableZones.length === 0 && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '1rem',
                borderRadius: '0.5rem',
                zIndex: 1000,
                textAlign: 'center'
              }}>
                <p>No red zones to display</p>
                <p style={{fontSize: '0.8rem', marginTop: '0.5rem'}}>
                  Total zones: {redZones.length}<br/>
                  Valid coordinates: {redZones.filter(z => z.coordinates && z.coordinates.length === 2).length}
                </p>
              </div>
            )}
            
            {/* User live location marker */}
            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={L.divIcon({
                  className: 'user-location-marker',
                  html: `<div style="background:#2563eb;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px #2563eb;"></div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                })}
              >
                <Popup>You are here</Popup>
              </Marker>
            )}
          </MapContainer>
          
          {/* Focus on My Location Button */}
          {userLocation && (
            <button
              className="focus-location-btn"
              onClick={() => {
                const map = (window as any).currentMap;
                if (map && userLocation) {
                  // Get current live location
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const currentLocation = {
                          lat: position.coords.latitude,
                          lng: position.coords.longitude
                        };
                        console.log('📍 Focusing on current live location:', currentLocation);
                        map.setView([currentLocation.lat, currentLocation.lng], 15);
                        // Update user location state with current position
                        setUserLocation(currentLocation);
                      },
                      (error) => {
                        console.warn('Error getting current location:', error.message);
                        // Fallback to stored location
                        map.setView([userLocation.lat, userLocation.lng], 15);
                      },
                      { 
                        enableHighAccuracy: true, 
                        timeout: 5000, 
                        maximumAge: 0 
                      }
                    );
                  } else {
                    // Fallback to stored location
                    map.setView([userLocation.lat, userLocation.lng], 15);
                  }
                }
              }}
              title="Focus on my current location"
            >
              <Navigation size={20} />
            </button>
          )}
        </div>
      </div>

      <button className="analyzer"
        onClick={() => navigate('/route-analyzer')}
      >
        Route Analyzer
      </button>

      {/* Legend */}
      <div className="redzones-legend-section">
        <div className="redzones-legend-card">
          <h3 className="redzones-legend-title">Risk Levels</h3>
          <div className="redzones-legend-list">
            <div className="redzones-legend-item">
              <div className="redzones-legend-dot redzones-legend-dot-high"></div>
              <span className="redzones-legend-label">High Risk</span>
            </div>
            <div className="redzones-legend-item">
              <div className="redzones-legend-dot redzones-legend-dot-medium"></div>
              <span className="redzones-legend-label">Medium Risk</span>
            </div>
            <div className="redzones-legend-item">
              <div className="redzones-legend-dot redzones-legend-dot-low"></div>
              <span className="redzones-legend-label">Low Risk</span>
            </div>
          </div>
        </div>
      </div>

            {/* Red Zone Details List */}
      <div className="redzones-list-section">
        <h3 className="redzones-list-title">Red Zone Details</h3>
        {displayableZones.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#6b7280'
          }}>
            No red zones available at this time.
          </div>
        ) : (
          <div className="redzones-list">
            {sortedZones.map((zone) => (
              <div key={zone.id} className="redzones-card redzones-card-relative">
                <div className="redzones-card-header redzones-card-header-flex">
                  <h4 className="redzones-card-title">{zone.name}</h4>
                </div>
                <span
                  className="redzones-card-badge redzones-badge-pill redzones-badge-absolute"
                  style={{ background: getIncidentColor(zone.incidentCount) }}
                >
                  {zone.incidentCount >= 40 ? 'HIGH' : zone.incidentCount >= 20 ? 'MEDIUM' : 'LOW'}
                </span>
                <div className="redzones-card-details">
                  <div className="redzones-card-detail">
                    <AlertTriangle size={16} className="redzones-card-detail-icon" />
                    <div>
                      <div className="redzones-card-detail-label">Crime Rate</div>
                      <div className="redzones-card-detail-value">{zone.crimeRate}</div>
                    </div>
                  </div>
                  <div className="redzones-card-detail">
                    <Users size={16} className="redzones-card-detail-icon" />
                    <div>
                      <div className="redzones-card-detail-label">Incidents</div>
                      <div className="redzones-card-detail-value" style={{ color: getIncidentColor(zone.incidentCount) }}>{zone.incidentCount}</div>
                    </div>
                  </div>
                  <div className="redzones-card-detail">
                    <Calendar size={16} className="redzones-card-detail-icon" />
                    <div>
                      <div className="redzones-card-detail-label">Last</div>
                      <div className="redzones-card-detail-value">{zone.lastIncident && zone.lastIncident.slice(0, 10)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

export default RedZones;

