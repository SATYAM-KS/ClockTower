import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import './RouteAnalyzer.css'; // Ensure ripple CSS is here

// Haversine distance
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getRiskLevel = (
  segment: { lat: number; lng: number },
  redZones: { lat: number; lng: number }[]
): 'low' | 'medium' | 'high' => {
  const thresholdHigh = 0.3;
  const thresholdMedium = 0.6;

  let minDist = Infinity;
  redZones.forEach(zone => {
    const dist = getDistance(segment.lat, segment.lng, zone.lat, zone.lng);
    if (dist < minDist) minDist = dist;
  });

  if (minDist < thresholdHigh) return 'high';
  if (minDist < thresholdMedium) return 'medium';
  return 'low';
};

const getColor = (risk: 'low' | 'medium' | 'high') => {
  switch (risk) {
    case 'low':
      return 'green';
    case 'medium':
      return 'orange';
    case 'high':
      return 'red';
  }
};

// ✅ Define your custom icon ONCE
const customIcon = L.icon({
  iconUrl: '/custom-pin.png', // ✅ Your custom pin in public/
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const RouteMap = ({
  waypoints,
  redZones,
  onRouteFound,
}: {
  waypoints: L.LatLng[];
  redZones: { lat: number; lng: number; name?: string }[];
  onRouteFound: (coords: { lat: number; lng: number }[]) => void;
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map || waypoints.length < 2) return;

    const control = L.Routing.control({
      waypoints,
      routeWhileDragging: false,
      show: false,
      addWaypoints: false,
      router: new L.Routing.OSRMv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
      }),
    }).addTo(map);

    // ✅ Use custom marker icon
    control.getPlan().options.createMarker = (i: number, wp: any) => {
      return L.marker(wp.latLng, { icon: customIcon });
    };

    control.on('routesfound', function (e: any) {
      const route = e.routes[0];
      if (route && route.coordinates) {
        const coords = route.coordinates.map((coord: any) => ({
          lat: coord.lat,
          lng: coord.lng,
        }));
        onRouteFound(coords);

        // Draw colored segments
        for (let i = 0; i < coords.length - 1; i++) {
          const segmentStart = coords[i];
          const segmentEnd = coords[i + 1];

          const midPoint = {
            lat: (segmentStart.lat + segmentEnd.lat) / 2,
            lng: (segmentStart.lng + segmentEnd.lng) / 2,
          };

          const risk = getRiskLevel(midPoint, redZones);
          const color = getColor(risk);

          L.polyline([segmentStart, segmentEnd], {
            color,
            weight: 5,
            opacity: 0.8,
          }).addTo(map);

          // Ripple effect for high risk
          if (risk === 'high') {
            const rippleIcon = L.divIcon({
              className: '',
              html: `<div class="ripple-marker"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });

            L.marker([midPoint.lat, midPoint.lng], {
              icon: rippleIcon,
            })
              .addTo(map)
              .bindTooltip('⚠️ High Risk Zone', {
                permanent: false,
                direction: 'top',
              });
          }
        }
      }
    });

    // Add red zone markers
    redZones.forEach(zone => {
      if (isFinite(zone.lat) && isFinite(zone.lng)) {
        const marker = L.circleMarker([zone.lat, zone.lng], {
          color: 'red',
          radius: 6,
        }).addTo(map);
        marker.bindPopup(zone.name || 'Red Zone');
      }
    });

    return () => {
      try {
        map.removeControl(control);
      } catch (e) {
        console.warn('Failed to remove control:', e);
      }
    };
  }, [map, waypoints, redZones, onRouteFound]);

  return null;
};

export default RouteMap;
