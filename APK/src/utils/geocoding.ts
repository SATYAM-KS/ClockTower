/**
 * utils/geocoding.ts
 * Robust Nominatim geocoder with Pune fallback.
 */

import L from 'leaflet';

export interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
  [key: string]: any;
}

/**
 * Always returns an array. If no results, returns [].
 */
export const geocodeAddress = async (address: string): Promise<GeocodeResult[]> => {
  // ✅ Add fallback: always include Pune if not mentioned
  const safeAddress = address.toLowerCase().includes('pune') ? address : `${address} Pune`;

  const isDev = import.meta.env.DEV;
  const baseUrl = isDev ? 'http://localhost:5000' : 'https://redzone-y2yb.onrender.com';
  const url = `${baseUrl}/api/geocode?q=${encodeURIComponent(safeAddress)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      console.error('Nominatim request failed:', response.status, response.statusText);
      return [];
    }

    const results = await response.json();

    if (!Array.isArray(results)) {
      console.error('Nominatim did not return an array:', results);
      return [];
    }

    if (results.length === 0) {
      console.warn('Geocoding returned no results for:', safeAddress);
      return [];
    }

    return results;
  } catch (error) {
    console.error('Geocoding failed:', error);
    return [];
  }
};

/**
 * Picks the closest result to Pune.
 * Returns null if none.
 */
export const geocodeClosestMatch = async (address: string): Promise<L.LatLng | null> => {
  const reference = { lat: 18.5204, lon: 73.8567 };

  const results = await geocodeAddress(address);

  if (results.length === 0) {
    console.warn('No valid geocoding results for:', address);
    return null;
  }

  results.sort((a, b) => {
    const distA = Math.hypot(Number(a.lat) - reference.lat, Number(a.lon) - reference.lon);
    const distB = Math.hypot(Number(b.lat) - reference.lat, Number(b.lon) - reference.lon);
    return distA - distB;
  });

  const best = results[0];
  return L.latLng(Number(best.lat), Number(best.lon));
};
