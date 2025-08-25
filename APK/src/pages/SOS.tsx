import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  MessageCircle,
  MapPin,
  Plus,
  Trash2,
  Shield,
  AlertTriangle,
  Mic,
  MicOff,
  Volume2,
  Gauge,
  Bell,
  X
} from 'lucide-react';
import Header from '../components/Header';
import './SOS.css';
import { useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

interface EmergencyContact {
  id: string | number;
  contact_id?: string;
  relationship?: string;
  contact?: {
    username?: string;
    phone?: string;
  };
}

const SOS: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: ''
  });
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sosContacts, setSosContacts] = useState<any[]>([]);
  
  // Enhanced Safety Monitoring States
  const [isSafetyMonitoring, setIsSafetyMonitoring] = useState(false);
  const [showSafetyCheck, setShowSafetyCheck] = useState(false);
  const [safetyCheckCount, setSafetyCheckCount] = useState(0);
  const [safetyCheckCountdown, setSafetyCheckCountdown] = useState(300); // 5 minutes countdown for safety check
  const [isBeeping, setIsBeeping] = useState(false);
  const [isContinuousBeeping, setIsContinuousBeeping] = useState(false); // New state for continuous beeping
  const [userResponded, setUserResponded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [liveSoundLevel, setLiveSoundLevel] = useState<number | null>(null);
  const [audioBaseline, setAudioBaseline] = useState<number | null>(null);
  const [noiseAnomaly, setNoiseAnomaly] = useState(false);
  const [speedData, setSpeedData] = useState<{ current: number; max: number; acceleration: number } | null>(null);
  const [isAccelerating, setIsAccelerating] = useState(false);
  const [isDecelerating, setIsDecelerating] = useState(false);
  const [isSuddenStop, setIsSuddenStop] = useState(false);
  const [isSuddenStart, setIsSuddenStart] = useState(false);
  
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const safetyCheckCountdownRef = useRef<NodeJS.Timeout | null>(null); // New ref for safety check countdown
  const location = useLocation();
  const userId = 1; // Example user ID
  
  // Enhanced monitoring refs
  const beepInterval = useRef<NodeJS.Timeout | null>(null);
  const safetyCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const microphone = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrame = useRef<number | null>(null);
  const recognition = useRef<any>(null);

  const showBack = location.state?.fromHome;

  useEffect(() => {
    async function fetchContacts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('id, contact_id, relationship, contact:contact_id (username, phone)')
        .eq('user_id', user.id);
      if (!error && data) {
        console.log('Fetched contacts:', data);
        setContacts(data.map(contact => ({
          ...contact,
          contact: Array.isArray(contact.contact) ? contact.contact[0] : contact.contact
        })));
      }
    }
    fetchContacts();
    
    // Automatically start enhanced safety monitoring when component mounts
    // This will run in the background and monitor for safety issues
    startEnhancedSafetyMonitoring();
    
    return () => {
      cleanupEnhancedSafetyMonitoring();
    };
  }, []);

  // Safety Check Countdown Timer
  const startSafetyCheckCountdown = () => {
    setSafetyCheckCountdown(300); // Reset to 5 minutes
    setShowSafetyCheck(true);
    startBeeping(true); // Start continuous beeping
    
    // Start countdown timer
    safetyCheckCountdownRef.current = setInterval(() => {
      setSafetyCheckCountdown((prev) => {
        if (prev <= 1) {
          // Countdown finished - stop beeping and escalate
          console.log('⏰ Safety check countdown finished - escalating to SOS');
          stopBeeping();
          setShowSafetyCheck(false);
          activateSOS(); // Automatically activate SOS
          return 0;
        }
        return prev - 1;
      });
    }, 1000); // Update every second
  };

  const stopSafetyCheckCountdown = () => {
    if (safetyCheckCountdownRef.current) {
      clearInterval(safetyCheckCountdownRef.current);
      safetyCheckCountdownRef.current = null;
    }
    setSafetyCheckCountdown(300);
  };

  // Enhanced Safety Monitoring Functions
  const startEnhancedSafetyMonitoring = () => {
    console.log('🚨 Starting automatic background safety monitoring...');
    
    // Start periodic safety checks every 3 minutes
    safetyCheckInterval.current = setInterval(() => {
      if (!userResponded && !isSOSActive) {
        setSafetyCheckCount(prev => prev + 1);
        startSafetyCheckCountdown(); // Use the new countdown function
        
        // Escalate after 2 checks
        if (safetyCheckCount >= 1) {
          console.log('🚨 Safety check escalation - user not responding');
          activateSOS();
        }
      }
    }, 180000); // 3 minutes

    // Only start voice recognition initially - no audio comparison yet
    startVoiceRecognition();
    startSpeedMonitoring();
    setIsSafetyMonitoring(true);
    
    // Note: Audio comparison will start when SOS is activated
    console.log('🎤 Voice recognition and movement monitoring started');
    console.log('🔊 Audio comparison will activate when SOS is triggered');
  };

  const cleanupEnhancedSafetyMonitoring = () => {
    if (beepInterval.current) {
      clearInterval(beepInterval.current);
    }
    if (safetyCheckInterval.current) {
      clearInterval(safetyCheckInterval.current);
    }
    if (safetyCheckCountdownRef.current) {
      clearInterval(safetyCheckCountdownRef.current);
    }
    stopBeeping();
    stopSafetyCheckCountdown(); // Stop the countdown timer
    stopVoiceRecognition();
    stopAudioLevelMonitoring();
    stopSpeedMonitoring();
  };

  // Beeping Alert System
  const startBeeping = (continuous: boolean = false) => {
    setIsBeeping(true);
    setIsContinuousBeeping(continuous);
    
    if (continuous) {
      // Continuous beeping - beep every 500ms for urgency
      beepInterval.current = setInterval(() => {
        playBeepSound();
      }, 500); // Beep every 500ms for continuous mode
    } else {
      // Regular beeping - beep every second
      beepInterval.current = setInterval(() => {
        playBeepSound();
      }, 1000); // Beep every second
    }
  };

  const stopBeeping = () => {
    setIsBeeping(false);
    setIsContinuousBeeping(false);
    if (beepInterval.current) {
      clearInterval(beepInterval.current);
      beepInterval.current = null;
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
    stopBeeping(); // This will stop both regular and continuous beeping
    stopSafetyCheckCountdown(); // Stop the countdown timer
    
    if (!isOkay) {
      console.log('🚨 User reported NOT okay - activating SOS');
      activateSOS();
    } else {
      console.log('✅ User confirmed safety');
      // Reset for next check
      setTimeout(() => {
        setUserResponded(false);
      }, 120000); // Wait 2 minutes before next check
    }
  };

  // Voice Recognition
  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      let lastTriggerTime = 0; // Track last trigger time
      const TRIGGER_COOLDOWN = 5000; // 5 seconds cooldown

      recognition.onstart = () => {
        console.log('🎤 Voice recognition started');
        setIsListening(true);
        setTranscript(''); // Clear previous transcript
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        // Process both final and interim results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Combine final and interim results for real-time display
        const combinedTranscript = finalTranscript + interimTranscript;
        setTranscript(combinedTranscript);
        
        // Only process final results for keyword detection
        if (finalTranscript) {
          const lowerTranscript = finalTranscript.toLowerCase();
          console.log('🎤 Final transcript:', finalTranscript);
          
          // Stop continuous beeping if user is speaking (providing input)
          if (isContinuousBeeping && finalTranscript.trim().length > 0) {
            console.log('🎤 User speaking - stopping continuous beeping');
            stopBeeping();
            // Also stop the safety check countdown since user is responding
            if (showSafetyCheck) {
              stopSafetyCheckCountdown();
            }
          }
          
          const currentTime = Date.now();
          
          // Only trigger if enough time has passed since last trigger
          if (currentTime - lastTriggerTime > TRIGGER_COOLDOWN) {
            // Check for emergency keywords
            if (lowerTranscript.includes('help') || lowerTranscript.includes('emergency') || 
                lowerTranscript.includes('sos') || lowerTranscript.includes('danger') ||
                lowerTranscript.includes('not okay') || lowerTranscript.includes('unsafe')) {
              console.log('🚨 Emergency keyword detected!');
              
              // Automatically trigger safety check for emergency keywords
              if (!isSOSActive && !showSafetyCheck) {
                setShowSafetyCheck(true);
                startBeeping(true); // Start continuous beeping
                lastTriggerTime = currentTime; // Update trigger time
              }
              
              // Also activate SOS directly
              activateSOS();
            }
            
            // Check for safety confirmations
            if (lowerTranscript.includes('okay') || lowerTranscript.includes('safe') || 
                lowerTranscript.includes('fine') || lowerTranscript.includes('good')) {
              console.log('✅ Safety confirmation via voice');
              handleSafetyResponse(true);
              lastTriggerTime = currentTime; // Update trigger time
            }
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error);
        setIsListening(false);
        setTranscript('Error: ' + event.error);
      };

      recognition.onend = () => {
        console.log('🎤 Voice recognition ended');
        setIsListening(false);
        // Restart after a short delay
        setTimeout(() => {
          if (isSafetyMonitoring) {
            startVoiceRecognition();
          }
        }, 1000);
      };

      recognition.start();
    } else {
      console.log('Voice recognition not supported');
      setTranscript('Voice recognition not supported in this browser');
    }
  };

  const stopVoiceRecognition = () => {
    if (recognition.current) {
      recognition.current.stop();
      setIsListening(false);
    }
  };

  // Audio Level Monitoring
  const startAudioLevelMonitoring = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log('Audio monitoring not supported');
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let audioBaseline: number | null = null;
        let baselineSamples: number[] = [];
        let baselineEstablished = false;
        let lastTriggerTime = 0; // Track last trigger time
        const TRIGGER_COOLDOWN = 5000; // 5 seconds cooldown

        microphone.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);

        const updateAudioLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          
          setLiveSoundLevel(average);

          // Establish baseline in first 3 seconds
          if (!baselineEstablished && baselineSamples.length < 60) { // Increased from 30 to 60 samples
            baselineSamples.push(average);
            if (baselineSamples.length === 60) {
              audioBaseline = baselineSamples.reduce((a, b) => a + b) / baselineSamples.length;
              // Add a minimum baseline to prevent false triggers
              audioBaseline = Math.max(audioBaseline, 80); // Minimum baseline of 80
              setAudioBaseline(audioBaseline);
              baselineEstablished = true;
              console.log('Audio baseline established:', audioBaseline);
            }
          }

          // Check for anomalies after baseline is established
          if (baselineEstablished && audioBaseline !== null) {
            const threshold = audioBaseline * 2.5; // Increased from 2x to 2.5x baseline
            const silenceThreshold = audioBaseline * 0.4; // Increased from 0.3x to 0.4x baseline
            const currentTime = Date.now();
            
            // Only trigger if enough time has passed since last trigger
            if (currentTime - lastTriggerTime > TRIGGER_COOLDOWN) {
              // Check for sudden loud sounds
              if (average > threshold) {
                console.log('🚨 Loud sound detected!', average, 'vs baseline', audioBaseline);
                setNoiseAnomaly(true);
                
                // Automatically trigger safety check for loud sounds
                if (!isSOSActive && !showSafetyCheck) {
                  startSafetyCheckCountdown(); // Use the new countdown function
                  lastTriggerTime = currentTime; // Update trigger time
                }
                
                setTimeout(() => setNoiseAnomaly(false), 5000);
              }
              
              // Check for sudden silence (potential danger)
              if (average < silenceThreshold && audioBaseline > 80) { // Increased minimum baseline check
                console.log('🔇 Sudden silence detected!', average, 'vs baseline', audioBaseline);
                setNoiseAnomaly(true);
                
                // Automatically trigger safety check for sudden silence
                if (!isSOSActive && !showSafetyCheck) {
                  startSafetyCheckCountdown(); // Use the new countdown function
                  lastTriggerTime = currentTime; // Update trigger time
                }
                
                setTimeout(() => setNoiseAnomaly(false), 5000);
              }
            }
          }
          
          // Legacy loud sound detection with automatic safety check and cooldown
          if (average > 200) { // Increased from 150 to 200
            const currentTime = Date.now();
            if (currentTime - lastTriggerTime > TRIGGER_COOLDOWN) {
              console.log('🚨 Loud sound detected!');
              
              // Automatically trigger safety check
              if (!isSOSActive && !showSafetyCheck) {
                startSafetyCheckCountdown(); // Use the new countdown function
                lastTriggerTime = currentTime; // Update trigger time
              }
            }
          }
          
          animationFrame.current = requestAnimationFrame(updateAudioLevel);
        };

        updateAudioLevel();
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
      });
  };

  // Stop Audio Level Monitoring
  const stopAudioLevelMonitoring = () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
    setLiveSoundLevel(null);
    setAudioBaseline(null);
    setNoiseAnomaly(false);
    console.log('🔊 Audio monitoring stopped');
  };

  // Enhanced Speed and Movement Monitoring
  const startSpeedMonitoring = () => {
    if ('DeviceMotionEvent' in window) {
      let lastAcceleration = { x: 0, y: 0, z: 0 };
      let lastTime = Date.now();
      let accelerationHistory: number[] = [];
      let lastMovementTime = Date.now();
      let stationaryTimer: NodeJS.Timeout | null = null;
      let lastTriggerTime = 0; // Track last trigger time
      const TRIGGER_COOLDOWN = 5000; // 5 seconds cooldown
      
      const handleMotion = (event: DeviceMotionEvent) => {
        if (event.accelerationIncludingGravity) {
          const { x, y, z } = event.accelerationIncludingGravity;
          const currentTime = Date.now();
          const timeDelta = currentTime - lastTime;
          
          if (x && y && z && timeDelta > 0) {
            const acceleration = Math.sqrt(x * x + y * y + z * z);
            const speed = acceleration * timeDelta / 1000;
            
            accelerationHistory.push(acceleration);
            if (accelerationHistory.length > 10) {
              accelerationHistory.shift();
            }
            
            setSpeedData({
              current: speed,
              max: Math.max(speed, speedData?.max || 0),
              acceleration: acceleration
            });
            
            // Update last movement time if there's significant movement
            if (acceleration > 5) {
              lastMovementTime = currentTime;
              
              // Clear stationary timer if user is moving
              if (stationaryTimer) {
                clearTimeout(stationaryTimer);
                stationaryTimer = null;
              }
            }
            
            // Detect sudden acceleration/deceleration with cooldown
            if (currentTime - lastTriggerTime > TRIGGER_COOLDOWN) {
              if (acceleration > 25 && lastAcceleration.x < 15) {
                setIsAccelerating(true);
                console.log('🚨 Sudden acceleration detected');
                setTimeout(() => setIsAccelerating(false), 3000);
                
                // Trigger safety check
                if (!isSOSActive && !showSafetyCheck) {
                  startSafetyCheckCountdown(); // Use the new countdown function
                  lastTriggerTime = currentTime; // Update trigger time
                }
              }
              
              if (acceleration < 3 && lastAcceleration.x > 20) {
                setIsDecelerating(true);
                console.log('🛑 Sudden deceleration detected');
                setTimeout(() => setIsDecelerating(false), 3000);
                
                // Trigger safety check
                if (!isSOSActive && !showSafetyCheck) {
                  startSafetyCheckCountdown(); // Use the new countdown function
                  lastTriggerTime = currentTime; // Update trigger time
                }
              }
            }
            
            lastAcceleration = { x: x, y: y, z: z };
            lastTime = currentTime;
          }
        }
      };
      
      // Start stationary user detection
      const checkStationaryUser = () => {
        const timeSinceLastMovement = Date.now() - lastMovementTime;
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        if (timeSinceLastMovement >= fiveMinutes && !stationaryTimer) {
          console.log('🚨 User stationary for 5+ minutes - triggering safety check');
          startSafetyCheckCountdown(); // Use the new countdown function
          
          // Set a flag to prevent multiple triggers
          stationaryTimer = setTimeout(() => {
            stationaryTimer = null;
          }, 60000); // Reset after 1 minute
        }
      };
      
      // Check for stationary user every 30 seconds
      const stationaryCheckInterval = setInterval(checkStationaryUser, 30000);
      
      window.addEventListener('devicemotion', handleMotion);
      
      return () => {
        window.removeEventListener('devicemotion', handleMotion);
        clearInterval(stationaryCheckInterval);
        if (stationaryTimer) {
          clearTimeout(stationaryTimer);
        }
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

  const handleAddContact = async () => {
    if (!newContact.phone) return;
    // Look up user by phone number in app_users
    const { data: users, error } = await supabase
      .from('app_users')
      .select('id')
      .eq('phone', newContact.phone);
    if (error) {
      alert('Error looking up user.');
      return;
    }
    if (!users || users.length === 0) {
      alert('This number is not registered in the app.');
      return;
    }
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be logged in.');
      return;
    }
    // Create request
    const { error: reqError } = await supabase.from('emergency_contact_requests').insert([{
      requester_id: user.id,
      target_id: users[0].id,
      status: 'pending',
      relationship: newContact.relationship
    }]);
    if (reqError) {
      alert('Failed to send request.');
    } else {
      alert('Request sent!');
      setNewContact({ name: '', phone: '', relationship: '' });
    }
  };

  // Delete contact handler
  const handleDeleteContact = async (contactId: string | number) => {
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', contactId);
    if (error) {
      alert('Failed to delete contact.');
    } else {
      setContacts(contacts.filter(contact => contact.id !== contactId));
    }
  };

  const activateSOS = () => {
    // Stop continuous beeping if it's active (user is providing input)
    if (isContinuousBeeping) {
      stopBeeping();
    }
    
    setIsSOSActive(true);
    setCountdown(10);
    
    // Start audio comparison when SOS is activated
    console.log('🔊 Starting audio comparison monitoring for SOS...');
    startAudioLevelMonitoring();
    
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // SOS activated - send alerts
          sendSOSAlerts();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSOS = () => {
    setIsSOSActive(false);
    setCountdown(0);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    // Stop audio monitoring when cancelling SOS
    console.log('🔊 Stopping audio comparison monitoring...');
    stopAudioLevelMonitoring();
  };

  const sendSOSAlerts = () => {
    // Send SOS alerts to emergency contacts
    console.log('🚨 SOS ALERT SENT!');
    // Here you would implement the actual alert sending logic
  };

  return (
    <div className="sos-page page-with-header">
      <Header title="SOS Emergency" showBack={showBack} />
      
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
                {safetyCheckCount > 0 ? '⚠️ This is your final warning!' : 'Please confirm your safety status'}
              </p>
              
              {/* Countdown Timer */}
              <div className="countdown-timer">
                <div className="countdown-label">Response Time Remaining:</div>
                <div className="countdown-display">
                  {Math.floor(safetyCheckCountdown / 60)} : {(safetyCheckCountdown % 60).toString().padStart(2, '0')}
                </div>
                <div className="countdown-warning">
                  ⏰ Auto-SOS will activate when timer expires
                </div>
              </div>
              
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
                {isContinuousBeeping 
                  ? '🔊 CONTINUOUS ALERT - Speak to stop beeping!' 
                  : '🔊 Emergency Alert Active - Respond Required'
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Safety Monitoring Section */}
      <div className="enhanced-safety-section">
        <div className="safety-header">
          <h3>🛡️ Automatic Safety Monitoring</h3>
          <div className="monitoring-status-badge">
            {isSafetyMonitoring ? '🟢 Active' : '🔴 Inactive'}
          </div>
        </div>
        
        <div className="monitoring-features">
          {/* Voice Recognition Status */}
          <div className="monitoring-item">
            <div className="monitoring-header">
              <Mic size={20} />
              <span>Voice Recognition</span>
            </div>
            {isListening && <span className="status-indicator listening">🎤 Listening...</span>}
            
            {/* Real-time Transcript Display */}
            <div className="transcript-container">
              <div className="transcript-header">
                <span>🎯 Live Transcript:</span>
                <button 
                  className="clear-transcript-btn"
                  onClick={() => {
                    setTranscript('');
                    // Stop continuous beeping if it's active (user is providing input)
                    if (isContinuousBeeping) {
                      stopBeeping();
                    }
                    // Also stop the safety check countdown since user is providing input
                    if (showSafetyCheck) {
                      stopSafetyCheckCountdown();
                    }
                  }}
                  title="Clear transcript"
                >
                  🗑️ Clear
                </button>
              </div>
              <div className="transcript-display">
                {transcript ? (
                  <span className="transcript-text">{transcript}</span>
                ) : (
                  <span className="transcript-placeholder">Say something to see transcript...</span>
                )}
              </div>
              {transcript && (
                <div className="transcript-info">
                  <small>Keywords detected: {transcript.toLowerCase().includes('help') || transcript.toLowerCase().includes('emergency') || transcript.toLowerCase().includes('sos') || transcript.toLowerCase().includes('danger') || transcript.toLowerCase().includes('not okay') || transcript.toLowerCase().includes('unsafe') ? '🚨 EMERGENCY' : '✅ Normal'}</small>
                </div>
              )}
            </div>
          </div>

          {/* Audio Level Monitoring */}
          <div className="monitoring-item">
            <div className="monitoring-header">
              <Volume2 size={20} />
              <span>Audio Monitoring</span>
            </div>
            {!isSOSActive ? (
              <div className="audio-status-waiting">
                <span className="status-waiting">⏳ Waiting for SOS activation</span>
                <p className="status-description">
                  Audio comparison will start automatically when SOS is triggered
                </p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Movement Monitoring */}
          <div className="monitoring-item">
            <div className="monitoring-header">
              <Gauge size={20} />
              <span>Movement Monitoring</span>
            </div>
            {speedData && (
              <div className="speed-data">
                <div className="data-item">
                  <span>Acceleration:</span>
                  <span className="value">{speedData.acceleration.toFixed(2)} m/s²</span>
                </div>
              </div>
            )}
            
            <div className="movement-alerts">
              {isAccelerating && <div className="alert accelerating">🚀 Sudden Acceleration</div>}
              {isDecelerating && <div className="alert decelerating">🛑 Sudden Deceleration</div>}
            </div>
          </div>

          {/* Safety Check Status */}
          <div className="monitoring-item">
            <div className="monitoring-header">
              <Bell size={20} />
              <span>Safety Checks</span>
            </div>
            <div className="safety-status-info">
              <span>Checks: {safetyCheckCount}</span>
              <span>Last Response: {userResponded ? '✅ Responded' : '⏳ Waiting'}</span>
            </div>
            {isBeeping && (
              <div className="beeping-status-display">
                {isContinuousBeeping 
                  ? '🔊 CONTINUOUS ALERT - Speak to stop!' 
                  : '🔊 Emergency Alert Active'
                }
              </div>
            )}
            
            {/* Automatic Trigger Indicators */}
            <div className="auto-trigger-indicators">
              <h4>🔄 Automatic Triggers</h4>
              <div className="trigger-list">
                <div className="trigger-item">
                  <span>🚀 Sudden Acceleration</span>
                  <span className="trigger-status">{isAccelerating ? '🔴 Triggered' : '🟢 Normal'}</span>
                </div>
                <div className="trigger-item">
                  <span>🛑 Sudden Deceleration</span>
                  <span className="trigger-status">{isDecelerating ? '🔴 Triggered' : '🟢 Normal'}</span>
                </div>
                <div className="trigger-item">
                  <span>🔇 Audio Anomaly</span>
                  <span className="trigger-status">{noiseAnomaly ? '🔴 Triggered' : '🟢 Normal'}</span>
                </div>
                <div className="trigger-item">
                  <span>🎤 Voice Keywords</span>
                  <span className="trigger-status">{transcript.includes('help') || transcript.includes('emergency') || transcript.includes('sos') ? '🔴 Detected' : '🟢 Normal'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main SOS Section */}
      <div className="sos-main-section">
        <div className="sos-activate-section">
          {!isSOSActive ? (
            <button onClick={activateSOS} className="sos-activate-btn">
              <div className="sos-activate-content">
                <AlertTriangle size={32} className="sos-activate-icon" />
                <div>
                  <div className="sos-activate-label">SOS EMERGENCY</div>
                  <div className="sos-activate-desc">Press to activate</div>
                </div>
              </div>
            </button>
          ) : (
            <div className="sos-countdown-section">
              <div className="sos-countdown-big">{countdown}</div>
              <button onClick={cancelSOS} className="sos-cancel-btn">Cancel SOS</button>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Add Contact */}
      {isModalOpen && (
        <div className="sos-modal-overlay">
          <div className="sos-modal-box">
            <button onClick={() => setIsModalOpen(false)} className="sos-modal-close">&times;</button>
            <h3>Add Emergency Contact</h3>
            <input
              type="text"
              placeholder="Name"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              className="sos-modal-input"
            />
            <input
              type="text"
              placeholder="Phone"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              className="sos-modal-input"
            />
            <input
              type="text"
              placeholder="Relationship"
              value={newContact.relationship}
              onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
              className="sos-modal-input"
            />
            <button className="save-contacts" onClick={handleAddContact}>
              Save Contact
            </button>
          </div>
        </div>
      )}

      {/* Contact List */}
      <div className="sos-contacts-section">
        <div className="sos-contacts-header" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <h3 className="sos-contacts-title">Emergency Contacts</h3>
          <button className="sos-add-contact-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={24} className="sos-add-contact-icon" />
          </button>
        </div>
        {contacts.length === 0 ? (
          <div>No emergency contacts found.</div>
        ) : (
          contacts.map((contact) => (
            <div key={contact.id} className="contact-card">
              <div className="contact-info">
                <div><strong>Name:</strong> {contact.contact?.username || 'N/A'}</div>
                <div><strong>Phone no:</strong> {contact.contact?.phone || 'N/A'}</div>
                <div><strong>Relationship:</strong> {contact.relationship || 'N/A'}</div>
              </div>
              
              <div className="sos-contact-actions">
                <button className="sos-contact-call" onClick={() => window.location.href = `tel:${contact.contact?.phone || ''}`}> <Phone size={16} /> </button>
                <button className="sos-contact-sms" onClick={() => window.location.href = `sms:${contact.contact?.phone || ''}`}> <MessageCircle size={16} /> </button>
                <button className="sos-contact-remove" onClick={() => handleDeleteContact(contact.id)}> <Trash2 size={16} /> </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Features */}
      <div className="sos-features-section">
        <h3 className="sos-features-title">SOS Features</h3>
        <div className="sos-features-list">
          <div className="sos-feature-item">
            <MapPin size={20} />
            <div>
              <h4>Location Sharing</h4>
              <p>Your current location will be shared with emergency contacts</p>
            </div>
          </div>
          <div className="sos-feature-item">
            <MessageCircle size={20} />
            <div>
              <h4>Automatic Messaging</h4>
              <p>Emergency message will be sent to all contacts</p>
            </div>
          </div>
          <div className="sos-feature-item">
            <Phone size={20} />
            <div>
              <h4>Emergency Calls</h4>
              <p>Quickly call emergency services or contacts</p>
            </div>
          </div>
          <div className="sos-feature-item">
            <Shield size={20} />
            <div>
              <h4>Enhanced Safety Monitoring</h4>
              <p>Continuous monitoring with voice, audio, and movement detection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOS;
