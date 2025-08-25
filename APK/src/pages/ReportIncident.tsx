import React, { useState, useEffect } from 'react';
import { MapPin, Camera, Send, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import './ReportIncident.css';
import { supabase } from '../supabaseClient';

const reportCrime = async (description: string, latitude: number, longitude: number) => {
  const { data: redZones, error } = await supabase.from('red_zones').select('*');
  if (error || !redZones) {
    alert('Failed to fetch red zones');
    return;
  }
  function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  let nearestZone = null;
  let minDistance = Infinity;
  redZones.forEach(zone => {
    const dist = haversineDistance(latitude, longitude, zone.latitude, zone.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearestZone = zone;
    }
  });
  const now = new Date().toISOString();
  if (nearestZone && minDistance <= 1) {
    await supabase.from('red_zones').update({
      incident_count: (nearestZone.incident_count || 0) + 1,
      last_reported_date: now
    }).eq('id', nearestZone.id);
  } else {
    await supabase.from('red_zones').insert([{
      latitude,
      longitude,
      incident_count: 1,
      last_reported_date: now
    }]);
  }
};

const ReportIncident: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    latitude: '',
    longitude: '',
    type: 'other',
    severity: 'medium',
    anonymous: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    // Initial check
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    // Cleanup on unmount
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const incidentTypes = [
    { value: 'theft', label: 'Theft' },
    { value: 'assault', label: 'Assault' },
    { value: 'vandalism', label: 'Vandalism' },
    { value: 'suspicious', label: 'Suspicious Activity' },
    { value: 'other', label: 'Other' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-red-600' }
  ];

  // List of known red zone places
  const redZonePlaces = [
    'Swargate & Jedhe Chowk',
    'Pune Railway Station (Camp Area)',
    'Vishrantwadi Chowk',
    'Kothrud Depot / Paud Road',
    'MG Road / Fashion Street (Camp)',
    'Koregaon Park / North Main Road',
    'Hadapsar / Vitthal Junction',
    'Pimpri-Chinchwad BRTS Corridor',
    'Shivajinagar Court / Maharaj Road',
    'Dandekar Bridge to Sinhagad Road'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      setImagePreviews(files.map(file => URL.createObjectURL(file)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert('You must be logged in to submit a report.');
      return;
    }
    setIsSubmitting(true);
    let imageUrls: string[] = [];
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const insertData: any = { ...formData, image_urls: imageUrls };
      if (user?.id) {
        insertData.user_id = user.id;
      }
      // Remove location from insertData
      delete insertData.location;
      // Convert latitude and longitude to numbers
      insertData.latitude = parseFloat(formData.latitude);
      insertData.longitude = parseFloat(formData.longitude);
      // Upload images to Supabase Storage
      for (const file of selectedFiles) {
        const filePath = `${user?.id || 'anonymous'}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('incident-images')
          .upload(filePath, file);
        if (error) throw error;
        // Get a signed URL for private bucket access
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('incident-images')
          .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
        if (signedUrlError) throw signedUrlError;
        imageUrls.push(signedUrlData.signedUrl);
      }
      insertData.image_urls = imageUrls;
      // Insert incident into Supabase
      const { error: insertError } = await supabase
        .from('incidents')
        .insert([insertData]);
      if (insertError) throw insertError;
      // After successful insert, update redzones
      await reportCrime(formData.description, parseFloat(formData.latitude), parseFloat(formData.longitude));
      alert('Report submitted successfully!');
      setFormData({
        title: '',
        description: '',
        latitude: '',
        longitude: '',
        type: 'other',
        severity: 'medium',
        anonymous: false
      });
      setSelectedFiles([]);
      setImagePreviews([]);
    } catch (error: any) {
      alert('Failed to submit report: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            latitude: latitude.toString(),
            longitude: longitude.toString()
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get current location. Please enter manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="reportincident-page">
      <Header title="Report Incident" />
      <div className="reportincident-form-section">
        <form onSubmit={handleSubmit} className="reportincident-form">
          {/* If not logged in, show a message and disable the form */}
          {!isLoggedIn && (
            <div style={{ color: 'red', marginBottom: 16 }}>
              You must be logged in to submit an incident report.
            </div>
          )}
          {/* Title */}
          <div className="reportincident-section">
            <label className="reportincident-label">
              Incident Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of the incident"
              className="reportincident-input"
              required
            />
          </div>
          {/* Type */}
          <div className="reportincident-section">
            <label className="reportincident-label">
              Incident Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="reportincident-select"
            >
              {incidentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          {/* Severity */}
          <div className="reportincident-section">
            <label className="reportincident-label">
              Severity Level *
            </label>
            <div className="reportincident-severity-group">
              {severityLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, severity: level.value }))}
                  className={`reportincident-severity-btn${formData.severity === level.value ? ' reportincident-severity-btn-active' : ''}`}
                >
                  <span className={`reportincident-severity-label reportincident-severity-label-${level.value}`}>{level.label}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Description */}
          <div className="reportincident-section">
            <label className="reportincident-label">
              Detailed Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide as much detail as possible about the incident"
              rows={4}
              className="reportincident-textarea"
              required
            />
          </div>
          {/* Location */}
          <div className="reportincident-section">
            <label className="reportincident-label">
              Latitude & Longitude *
            </label>
            <div className="reportincident-location-group">
              <input
                type="text"
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                placeholder="Latitude"
                className="reportincident-input"
                required
              />
              <input
                type="text"
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                placeholder="Longitude"
                className="reportincident-input"
                required
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                className="reportincident-location-btn"
              >
                <MapPin size={20} />
              </button>
            </div>
          </div>
          {/* Photo Upload */}
          <div className="reportincident-section">
            <label className="reportincident-label">
              Add Photos (Optional)
            </label>
            <div className="reportincident-photo-upload">
              <Camera size={48} className="reportincident-photo-icon" />
              <p className="reportincident-photo-desc">
                Click to upload photos or drag and drop
              </p>
              <p className="reportincident-photo-note">
                PNG, JPG, GIF up to 10MB
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="reportincident-photo-input"
                id="photo-upload"
                onChange={handleFileChange}
              />
              <label
                htmlFor="photo-upload"
                className="reportincident-photo-label"
              >
                Choose Files
              </label>
            </div>
            {/* Optionally show image previews */}
            {imagePreviews.length > 0 && (
              <div className="reportincident-image-previews">
                {imagePreviews.map((src, idx) => (
                  <img key={idx} src={src} alt="preview" style={{ maxWidth: 80, marginRight: 8, borderRadius: 8 }} />
                ))}
              </div>
            )}
          </div>
          {/* Anonymous Option */}
          <div className="reportincident-section">
            <label className="reportincident-anonymous">
              <input
                type="checkbox"
                checked={formData.anonymous}
                onChange={(e) => setFormData(prev => ({ ...prev, anonymous: e.target.checked }))}
                className="reportincident-anonymous-checkbox"
              />
              <span className="reportincident-anonymous-label">
                Submit anonymously
              </span>
            </label>
            <p className="reportincident-anonymous-desc">
              Your identity will not be shared with authorities
            </p>
          </div>
          {/* Warning */}
          <div className="reportincident-warning">
            <div className="reportincident-warning-content">
              <AlertTriangle className="reportincident-warning-icon" size={20} />
              <div>
                <h3 className="reportincident-warning-title">Important Notice</h3>
                <p className="reportincident-warning-desc">
                  If this is an emergency, please call 100 immediately. This report system is for non-emergency incidents.
                </p>
              </div>
            </div>
          </div>
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !isLoggedIn}
            className={`reportincident-submit-btn${isSubmitting || !isLoggedIn ? ' reportincident-submit-btn-disabled' : ''}`}
          >
            {isSubmitting ? (
              <div className="reportincident-submit-content">
                <div className="reportincident-submit-spinner"></div>
                Submitting Report...
              </div>
            ) : (
              <div className="reportincident-submit-content">
                <Send size={20} className="reportincident-submit-icon" />
                Submit Report
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportIncident;