// API utility for Supabase and external services
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://shqfvfjsxtdeknqncjfa.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNocWZ2ZmpzeHRkZWtucW5jamZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MDgzNzMsImV4cCI6MjA2ODQ4NDM3M30.enzNuGiPvfMZLUPLPeDPBlMsHBOP9foFOjbGjQhLsnc';

// Geocoding API (OpenStreetMap via Vite proxy)
export const geocodingApi = {
  async search(query: string) {
    try {
      const response = await fetch(`/nominatim/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5&addressdetails=1`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Geocoding search failed:', error);
      throw error;
    }
  },
  
  async reverse(lat: number, lng: number) {
    try {
      const response = await fetch(`/nominatim/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Geocoding reverse failed:', error);
      throw error;
    }
  }
};

// News API using NewsData.io with specific Crime in Pune query
export const getNews = async () => {
  try {
    const url = 'https://newsdata.io/api/1/latest?apikey=pub_fed29ec234a04bbfa14d718779ea7158&q=Crime%20in%20Pune';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`News API error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('News API call failed:', error);
    throw error;
  }
}; 