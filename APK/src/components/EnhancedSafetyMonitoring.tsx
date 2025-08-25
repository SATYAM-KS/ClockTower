import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, AlertTriangle, MapPin, Gauge, Activity, Bell, X } from 'lucide-react';
import SOSService from '../utils/sosService';
import './EnhancedSafetyMonitoring.css';

interface EnhancedSafetyMonitoringProps {
  isInRedZone: boolean;
  currentLocation: { lat: number; lng: number } | null;
}

const EnhancedSafetyMonitoring: React.FC<EnhancedSafetyMonitoringProps> = ({
  isInRedZone,
  currentLocation
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [liveSoundLevel, setLiveSoundLevel] = useState<number | null>(null);
  const [isSafetyMonitoring, setIsSafetyMonitoring] = useState(false);
  const [hasKeywordDetected, setHasKeywordDetected] = useState(false);
  const [speedData, setSpeedData] = useState<{ current: number; max: number; acceleration: number } | null>(null);
  const [isAccelerating, setIsAccelerating] = useState(false);
  const [isDecelerating, setIsDecelerating] = useState(false);
  const [isSuddenStop, setIsSuddenStop] = useState(false);
  const [isSuddenStart, setIsSuddenStart] = useState(false);
  
  // New continuous safety monitoring states
  const [showSafetyCheck, setShowSafetyCheck] = useState(false);
  const [safetyCheckCount, setSafetyCheckCount] = useState(0);
  const [isBeeping, setIsBeeping] = useState(false);
  const [userResponded, setUserResponded] = useState(false);
  const [audioBaseline, setAudioBaseline] = useState<number | null>(null);
  const [noiseAnomaly, setNoiseAnomaly] = useState(false);
  
  const sosService = useRef(new SOSService());
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const microphone = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrame = useRef<number | null>(null);
  const beepInterval = useRef<NodeJS.Timeout | null>(null);
  const safetyCheckInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeSOSService();
    return () => {
      cleanupVoiceRecognition();
      cleanupAudioMonitoring();
      cleanupSafetyMonitoring();
    };
  }, []);

  useEffect(() => {
    if (isInRedZone) {
      startContinuousVoiceMonitoring();
      startSpeedMonitoring();
      startContinuousSafetyMonitoring();
    } else {
      stopContinuousVoiceMonitoring();
      stopSpeedMonitoring();
      stopContinuousSafetyMonitoring();
    }
  }, [isInRedZone]);

  // Cleanup function for safety monitoring
  const cleanupSafetyMonitoring = () => {
    if (beepInterval.current) {
      clearInterval(beepInterval.current);
    }
    if (safetyCheckInterval.current) {
      clearInterval(safetyCheckInterval.current);
    }
    setIsBeeping(false);
    setShowSafetyCheck(false);
  };

  const initializeSOSService = async () => {
    try {
      await sosService.current.initialize();
    } catch (error) {
      console.error('Failed to initialize SOS service:', error);
    }
  };

  // Continuous Safety Monitoring System
  const startContinuousSafetyMonitoring = () => {
    if (isInRedZone) {
      // Start periodic safety checks every 2 minutes
      safetyCheckInterval.current = setInterval(() => {
        if (!userResponded) {
          setSafetyCheckCount(prev => prev + 1);
          setShowSafetyCheck(true);
          startBeeping();
          
          // Escalate after 3 checks
          if (safetyCheckCount >= 2) {
            console.log('🚨 Safety check escalation - user not responding');
            triggerEmergencyResponse();
          }
        }
      }, 120000); // 2 minutes
    }
  };

  const stopContinuousSafetyMonitoring = () => {
    if (safetyCheckInterval.current) {
      clearInterval(safetyCheckInterval.current);
    }
    stopBeeping();
    setShowSafetyCheck(false);
    setUserResponded(false);
    setSafetyCheckCount(0);
  };

  // Beeping Alert System
  const startBeeping = () => {
    setIsBeeping(true);
    // Create beeping sound using Web Audio API
    beepInterval.current = setInterval(() => {
      playBeepSound();
    }, 1000); // Beep every second
  };

  const stopBeeping = () => {
    setIsBeeping(false);
    if (beepInterval.current) {
      clearInterval(beepInterval.current);
    }
  };

  const playBeepSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Beep sound played');
    }
  };

  // Safety Check Response Handler
  const handleSafetyResponse = (isOkay: boolean) => {
    setUserResponded(true);
    setShowSafetyCheck(false);
    stopBeeping();
    
    if (!isOkay) {
      console.log('🚨 User reported NOT okay - triggering emergency response');
      triggerEmergencyResponse();
    } else {
      console.log('✅ User confirmed safety');
      // Reset for next check
      setTimeout(() => {
        setUserResponded(false);
      }, 60000); // Wait 1 minute before next check
    }
  };

  // Voice Recognition System
  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const newRecognition = new SpeechRecognition();
      
      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      newRecognition.lang = 'en-US';
      
      newRecognition.onstart = () => {
        console.log('🎤 Voice recognition started - listening for keywords...');
        setIsListening(true);
        setTranscript('');
      };
      
      newRecognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript + interimTranscript);
        
        if (finalTranscript) {
          const lowerTranscript = finalTranscript.toLowerCase();
          console.log('🎯 Final transcript:', finalTranscript);
          
          // Check for emergency keywords
          if (lowerTranscript.includes('help') || lowerTranscript.includes('emergency') || 
              lowerTranscript.includes('sos') || lowerTranscript.includes('danger') ||
              lowerTranscript.includes('not okay') || lowerTranscript.includes('unsafe')) {
            console.log('🚨 Emergency keyword detected!');
            setHasKeywordDetected(true);
            triggerEmergencyResponse();
          }
          
          // Check for safety confirmations
          if (lowerTranscript.includes('okay') || lowerTranscript.includes('safe') || 
              lowerTranscript.includes('fine') || lowerTranscript.includes('good')) {
            console.log('✅ Safety confirmation via voice');
            handleSafetyResponse(true);
          }
        }
      };
      
      newRecognition.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error);
        setIsListening(false);
      };
      
      newRecognition.onend = () => {
        console.log('Voice recognition ended');
        setIsListening(false);
        // Restart if in red zone
        if (isInRedZone) {
          setTimeout(() => startVoiceRecognition(), 1000);
        }
      };
      
      setRecognition(newRecognition);
      newRecognition.start();
      
    } catch (error) {
      console.error('Error starting voice recognition:', error);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const cleanupVoiceRecognition = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  // Continuous Voice Monitoring in Red Zones
  const startContinuousVoiceMonitoring = () => {
    if (isInRedZone) {
      startVoiceRecognition();
      startAudioLevelMonitoring();
    }
  };

  const stopContinuousVoiceMonitoring = () => {
    stopVoiceRecognition();
    stopAudioLevelMonitoring();
  };

  // Enhanced Audio Level Monitoring with Baseline Comparison
  const startAudioLevelMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser.current = audioContext.current.createAnalyser();
      microphone.current = audioContext.current.createMediaStreamSource(stream);
      
      analyser.current.fftSize = 256;
      const bufferLength = analyser.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      microphone.current.connect(analyser.current);
      
      // Establish audio baseline (first 5 seconds)
      let baselineReadings: number[] = [];
      let baselineEstablished = false;
      
      const updateAudioLevel = () => {
        if (analyser.current && isInRedZone) {
          analyser.current.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          setLiveSoundLevel(average);
          
          // Establish baseline
          if (!baselineEstablished && baselineReadings.length < 50) {
            baselineReadings.push(average);
            if (baselineReadings.length === 50) {
              const baseline = baselineReadings.reduce((a, b) => a + b, 0) / baselineReadings.length;
              setAudioBaseline(baseline);
              baselineEstablished = true;
              console.log('🎵 Audio baseline established:', baseline);
            }
          }
          
          // Check for anomalies after baseline is established
          if (baselineEstablished && audioBaseline !== null) {
            const threshold = audioBaseline * 2; // 2x baseline
            const silenceThreshold = audioBaseline * 0.3; // 30% of baseline
            
            // Check for sudden loud sounds
            if (average > threshold) {
              console.log('🚨 Loud sound detected!', average, 'vs baseline', audioBaseline);
              setNoiseAnomaly(true);
              triggerEmergencyResponse();
              setTimeout(() => setNoiseAnomaly(false), 5000);
            }
            
            // Check for sudden silence (potential danger)
            if (average < silenceThreshold && audioBaseline > 50) {
              console.log('🔇 Sudden silence detected!', average, 'vs baseline', audioBaseline);
              setNoiseAnomaly(true);
              setTimeout(() => setNoiseAnomaly(false), 5000);
            }
          }
          
          // Legacy loud sound detection
          if (average > 150) {
            console.log('🚨 Loud sound detected!');
            triggerEmergencyResponse();
          }
          
          animationFrame.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error starting audio monitoring:', error);
    }
  };

  const stopAudioLevelMonitoring = () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    if (microphone.current) {
      microphone.current.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioContext.current) {
      audioContext.current.close();
    }
    setLiveSoundLevel(null);
    setAudioBaseline(null);
    setNoiseAnomaly(false);
  };

  const cleanupAudioMonitoring = () => {
    stopAudioLevelMonitoring();
  };

  // Enhanced Speed and Movement Monitoring
  const startSpeedMonitoring = () => {
    if ('DeviceMotionEvent' in window) {
      let lastAcceleration = { x: 0, y: 0, z: 0 };
      let lastTime = Date.now();
      let accelerationHistory: number[] = [];
      
      const handleMotion = (event: DeviceMotionEvent) => {
        if (event.accelerationIncludingGravity) {
          const { x, y, z } = event.accelerationIncludingGravity;
          const currentTime = Date.now();
          const timeDelta = currentTime - lastTime;
          
          if (x && y && z && timeDelta > 0) {
            const acceleration = Math.sqrt(x * x + y * y + z * z);
            const speed = acceleration * timeDelta / 1000; // Convert to m/s
            
            // Store acceleration history for pattern analysis
            accelerationHistory.push(acceleration);
            if (accelerationHistory.length > 10) {
              accelerationHistory.shift();
            }
            
            setSpeedData({
              current: speed,
              max: Math.max(speed, speedData?.max || 0),
              acceleration: acceleration
            });
            
            // Enhanced acceleration/deceleration detection
            const avgAcceleration = accelerationHistory.reduce((a, b) => a + b, 0) / accelerationHistory.length;
            
            // Detect sudden acceleration (car crash, fall, etc.)
            if (acceleration > 25 && lastAcceleration.x < 15) {
              setIsAccelerating(true);
              console.log('🚨 Sudden acceleration detected:', acceleration);
              setTimeout(() => setIsAccelerating(false), 3000);
              
              // Trigger safety check for sudden acceleration
              if (isInRedZone) {
                setShowSafetyCheck(true);
                startBeeping();
              }
            }
            
            // Detect sudden deceleration (braking, collision)
            if (acceleration < 3 && lastAcceleration.x > 20) {
              setIsDecelerating(true);
              console.log('🛑 Sudden deceleration detected:', acceleration);
              setTimeout(() => setIsDecelerating(false), 3000);
              
              // Trigger safety check for sudden deceleration
              if (isInRedZone) {
                setShowSafetyCheck(true);
                startBeeping();
              }
            }
            
            // Detect sudden stops
            if (acceleration < 1 && lastAcceleration.x > 10) {
              setIsSuddenStop(true);
              console.log('⛔ Sudden stop detected');
              setTimeout(() => setIsSuddenStop(false), 3000);
            }
            
            // Detect sudden starts
            if (acceleration > 20 && lastAcceleration.x < 2) {
              setIsSuddenStart(true);
              console.log('🚀 Sudden start detected');
              setTimeout(() => setIsSuddenStart(false), 3000);
            }
            
            lastAcceleration = { x: x, y: y, z: z };
            lastTime = currentTime;
          }
        }
      };
      
      window.addEventListener('devicemotion', handleMotion);
      
      return () => {
        window.removeEventListener('devicemotion', handleMotion);
      };
    }
  };

  const stopSpeedMonitoring = () => {
    setSpeedData(null);
    setIsAccelerating(false);
    setIsDecelerating(false);
    setIsSuddenStop(false);
    setIsSuddenStart(false);
  };

  // Emergency Response
  const triggerEmergencyResponse = async () => {
    try {
      if (currentLocation) {
        const result = await sosService.current.sendStationaryUserAlert(
          currentLocation,
          0,
          'Emergency detected via enhanced monitoring'
        );
        
        if (result.success) {
          console.log('🚨 Emergency SOS alert sent successfully');
          alert('🚨 Emergency alert sent! Help is on the way.');
        } else {
          console.error('Failed to send emergency alert:', result.error);
        }
      }
    } catch (error) {
      console.error('Error triggering emergency response:', error);
    }
  };

  // Manual Safety Monitoring Toggle
  const toggleSafetyMonitoring = () => {
    if (isSafetyMonitoring) {
      stopVoiceRecognition();
      stopAudioLevelMonitoring();
      setIsSafetyMonitoring(false);
    } else {
      startVoiceRecognition();
      startAudioLevelMonitoring();
      setIsSafetyMonitoring(true);
    }
  };

  return (
    <div className="enhanced-safety-monitoring">
      {/* Safety Check Popup */}
      {showSafetyCheck && (
        <div className="safety-check-overlay">
          <div className="safety-check-popup">
            <div className="popup-header">
              <AlertTriangle size={24} className="alert-icon" />
              <h3>🚨 Safety Check Required</h3>
              <button 
                className="close-btn"
                onClick={() => handleSafetyResponse(true)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="popup-content">
              <p className="safety-question">Are you okay?</p>
              <p className="safety-subtitle">
                {safetyCheckCount > 1 ? '⚠️ This is your final warning!' : 'Please confirm your safety status'}
              </p>
              <div className="safety-buttons">
                <button 
                  className="safety-btn safe"
                  onClick={() => handleSafetyResponse(true)}
                >
                  ✅ I'm Safe
                </button>
                <button 
                  className="safety-btn danger"
                  onClick={() => handleSafetyResponse(false)}
                >
                  🚨 I Need Help
                </button>
              </div>
            </div>
            {isBeeping && (
              <div className="beeping-indicator">
                🔊 Emergency Alert Active - Respond Required
              </div>
            )}
          </div>
        </div>
      )}

      <div className="safety-header">
        <h3>🛡️ Enhanced Safety Monitoring</h3>
        <div className="safety-status">
          {isInRedZone && <span className="redzone-indicator">🚨 IN RED ZONE</span>}
          {isBeeping && <span className="beeping-status">🔊 ALERTING</span>}
        </div>
      </div>

      {/* Voice Recognition Controls */}
      <div className="safety-section">
        <div className="section-header">
          <Mic size={20} />
          <span>Voice Recognition</span>
        </div>
        <div className="controls">
          <button
            onClick={toggleSafetyMonitoring}
            className={`control-btn ${isSafetyMonitoring ? 'active' : ''}`}
          >
            {isSafetyMonitoring ? <MicOff size={16} /> : <Mic size={16} />}
            {isSafetyMonitoring ? 'Stop' : 'Start'} Monitoring
          </button>
          {isListening && <span className="status-indicator listening">🎤 Listening...</span>}
        </div>
        {transcript && (
          <div className="transcript-display">
            <strong>Transcript:</strong> {transcript}
          </div>
        )}
        {hasKeywordDetected && (
          <div className="keyword-alert">
            🚨 Emergency keyword detected! SOS alert sent.
          </div>
        )}
      </div>

      {/* Enhanced Audio Level Monitoring */}
      {isInRedZone && (
        <div className="safety-section">
          <div className="section-header">
            <Volume2 size={20} />
            <span>Enhanced Audio Monitoring</span>
          </div>
          {liveSoundLevel !== null && (
            <div className="audio-level">
              <div className="level-bar">
                <div 
                  className="level-fill" 
                  style={{ width: `${(liveSoundLevel / 255) * 100}%` }}
                ></div>
              </div>
              <span className="level-value">{liveSoundLevel}</span>
              {audioBaseline && (
                <span className="baseline-info">
                  Baseline: {audioBaseline.toFixed(0)}
                </span>
              )}
            </div>
          )}
          {noiseAnomaly && (
            <div className="noise-anomaly-alert">
              🚨 Audio anomaly detected!
            </div>
          )}
        </div>
      )}

      {/* Enhanced Speed and Movement Monitoring */}
      {isInRedZone && (
        <div className="safety-section">
          <div className="section-header">
            <Gauge size={20} />
            <span>Movement Monitoring</span>
          </div>
          {speedData && (
            <div className="speed-data">
              <div className="data-item">
                <span>Current Speed:</span>
                <span className="value">{speedData.current.toFixed(2)} m/s</span>
              </div>
              <div className="data-item">
                <span>Max Speed:</span>
                <span className="value">{speedData.max.toFixed(2)} m/s</span>
              </div>
              <div className="data-item">
                <span>Acceleration:</span>
                <span className="value">{speedData.acceleration.toFixed(2)} m/s²</span>
              </div>
            </div>
          )}
          
          {/* Enhanced Movement Alerts */}
          <div className="movement-alerts">
            {isAccelerating && <div className="alert accelerating">🚀 Sudden Acceleration</div>}
            {isDecelerating && <div className="alert decelerating">🛑 Sudden Deceleration</div>}
            {isSuddenStop && <div className="alert sudden-stop">⛔ Sudden Stop</div>}
            {isSuddenStart && <div className="alert sudden-start">🚀 Sudden Start</div>}
          </div>
        </div>
      )}

      {/* Continuous Safety Monitoring Status */}
      <div className="safety-section">
        <div className="section-header">
          <Bell size={20} />
          <span>Continuous Safety Monitoring</span>
        </div>
        <div className="monitoring-status">
          <div className="status-item">
            <span>Safety Checks:</span>
            <span className="value">{safetyCheckCount}</span>
          </div>
          <div className="status-item">
            <span>Last Response:</span>
            <span className="value">{userResponded ? '✅ Responded' : '⏳ Waiting'}</span>
          </div>
          {isBeeping && (
            <div className="beeping-status-display">
              🔊 Emergency Alert Active
            </div>
          )}
        </div>
      </div>

      {/* Location Display */}
      <div className="safety-section">
        <div className="section-header">
          <MapPin size={20} />
          <span>Current Location</span>
        </div>
        {currentLocation ? (
          <div className="location-display">
            <span>Lat: {currentLocation.lat.toFixed(6)}</span>
            <span>Lng: {currentLocation.lng.toFixed(6)}</span>
          </div>
        ) : (
          <span className="no-location">Location not available</span>
        )}
      </div>

      {/* Safety Tips */}
      <div className="safety-tips">
        <h4>💡 Safety Tips</h4>
        <ul>
          <li>Respond to safety check popups promptly</li>
          <li>Speak clearly when using voice commands</li>
          <li>Stay alert in red zones</li>
          <li>Report any suspicious activity</li>
          <li>Keep your phone charged for emergency alerts</li>
          <li>Listen for beeping alerts and respond immediately</li>
        </ul>
      </div>
    </div>
  );
};

export default EnhancedSafetyMonitoring;
