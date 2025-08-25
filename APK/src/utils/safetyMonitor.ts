export interface SafetyData {
  isInRedZone: boolean;
  currentSpeed: number;
  acceleration: number;
  isMoving: boolean;
  lastLocation: { lat: number; lng: number } | null;
  timestamp: number;
  voiceLevel?: number; // New: voice level detection
  keywordDetected?: boolean; // New: keyword detection status
}

export interface AccidentDetectionResult {
  isPotentialAccident: boolean;
  confidence: number;
  reason: string;
  triggerType: 'speed' | 'voice' | 'keyword' | 'stationary'; // New: what triggered the alert
}

class SafetyMonitor {
  private isActive = false;
  private sensorData: SafetyData[] = [];
  private maxDataPoints = 50;
  private speedThreshold = 5; // m/s (18 km/h) - threshold for "high speed"
  private decelerationThreshold = -8; // m/s² - sudden deceleration threshold
  private accelerationThreshold = 8; // m/s² - sudden acceleration threshold
  private stationaryThreshold = 10; // minutes - threshold for stationary user detection
  private voiceThreshold = 90; // dB - threshold for voice level detection
  private keywordToDetect = 'help'; // keyword to listen for
  private maxReasonableSpeed = 50; // m/s (180 km/h) - maximum reasonable speed to prevent GPS glitches
  private maxReasonableAcceleration = 20; // m/s² - maximum reasonable acceleration
  private locationUpdateInterval: NodeJS.Timeout | null = null;
  private motionUpdateInterval: NodeJS.Timeout | null = null;
  private voiceUpdateInterval: NodeJS.Timeout | null = null;
  private onAccidentDetected: ((result: AccidentDetectionResult) => void) | null = null;
  private onSafetyDataUpdate: ((data: SafetyData) => void) | null = null;
  private onStationaryUserDetected: ((location: { lat: number; lng: number }, duration: number) => void) | null = null;
  private onVoiceKeywordDetected: ((location: { lat: number; lng: number }, keyword: string) => void) | null = null;
  private onPermissionRequest: ((type: 'microphone' | 'motion', granted: boolean) => void) | null = null;
  
  // Voice recognition components
  private audioContext: AudioContext | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private isListeningForKeyword = false;
  private isManualKeywordListeningEnabled = false; // New: manual control flag
  private recognition: any = null; // SpeechRecognition for keyword detection
  private restartCooldown = false; // Prevent rapid restart cycles
  private restartAttempts = 0; // Track restart attempts
  private maxRestartAttempts = 5; // Maximum restart attempts before longer cooldown
  private totalRestartAttempts = 0; // Track total restart attempts across all cycles
  private maxTotalRestartAttempts = 20; // Maximum total restart attempts before giving up
  private isRestartDisabled = false; // Flag to completely disable restarts if too many failures
  
  // Transcript functionality
  private transcript = '';
  private onTranscriptUpdate: ((transcript: string) => void) | null = null;

  constructor(
    onPermissionRequest?: (type: 'microphone' | 'motion', granted: boolean) => void,
    onTranscriptUpdate?: (transcript: string) => void
  ) {
    this.onPermissionRequest = onPermissionRequest || null;
    this.onTranscriptUpdate = onTranscriptUpdate || null;
    this.requestPermissions();
    this.initializeVoiceRecognition();
    
    // Reset restart counters on construction to ensure fresh start
    this.restartAttempts = 0;
    this.totalRestartAttempts = 0;
    this.isRestartDisabled = false;
    console.log('🎤 SafetyMonitor constructor - restart counters reset');
  }

  private async requestPermissions() {
    // Request microphone permission
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permission.state === 'denied') {
          console.warn('Microphone permission denied');
          if (this.onPermissionRequest) {
            this.onPermissionRequest('microphone', false);
          }
        } else if (permission.state === 'granted') {
          if (this.onPermissionRequest) {
            this.onPermissionRequest('microphone', true);
          }
        }
      } catch (error) {
        console.warn('Could not check microphone permission:', error);
      }
    }

    // Request motion sensors permission (if available)
    if ('DeviceMotionEvent' in window) {
      try {
        // Request permission for iOS devices
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
          const permission = await (DeviceMotionEvent as any).requestPermission();
          if (permission !== 'granted') {
            console.warn('Motion sensor permission denied');
            if (this.onPermissionRequest) {
              this.onPermissionRequest('motion', false);
            }
          } else {
            if (this.onPermissionRequest) {
              this.onPermissionRequest('motion', true);
            }
          }
        }
      } catch (error) {
        console.warn('Could not request motion sensor permission:', error);
      }
    }
  }

  private initializeVoiceRecognition() {
    console.log('🎤 Initializing voice recognition...');
    console.log('🎤 WebkitSpeechRecognition available:', !!('webkitSpeechRecognition' in window));
    console.log('🎤 SpeechRecognition available:', !!('SpeechRecognition' in window));
    console.log('🎤 Window object keys:', Object.keys(window).filter(key => key.toLowerCase().includes('speech')));
    
        // Check network connectivity
        if (!navigator.onLine) {
          console.warn('🌐 Network is offline - speech recognition may not work properly');
        }
        
        // Check if we're on HTTPS (required for speech recognition in production)
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
          console.warn('🔒 Not on HTTPS - speech recognition may not work in production');
        }
        
        // Check for secure context (required for microphone access)
        if (!window.isSecureContext) {
          console.warn('🔒 Not in secure context - microphone access may be limited');
        }
    
    // Initialize Web Speech API for keyword detection
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      console.log('🎤 Using SpeechRecognition constructor:', SpeechRecognition.name);
      console.log('🎤 SpeechRecognition constructor type:', typeof SpeechRecognition);
      
      try {
        console.log('🎤 Creating SpeechRecognition instance...');
        this.recognition = new SpeechRecognition();
        console.log('✅ SpeechRecognition object created successfully');
        console.log('🎤 Recognition object type:', typeof this.recognition);
        console.log('🎤 Recognition object keys:', Object.keys(this.recognition));
        
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        // Add network-friendly settings
        if ('maxAlternatives' in this.recognition) {
          this.recognition.maxAlternatives = 1; // Reduce network load
        }
        
        // Note: serviceURI is not a standard property and can cause network errors
        // The Web Speech API uses the browser's built-in speech recognition service
        
        console.log('🎤 SpeechRecognition settings:');
        console.log('  - Continuous:', this.recognition.continuous);
        console.log('  - Interim results:', this.recognition.interimResults);
        console.log('  - Language:', this.recognition.lang);
        console.log('  - Keyword to detect:', this.keywordToDetect);
        
        this.recognition.onstart = () => {
          console.log('✅ Speech recognition started');
        };
        
        this.recognition.onend = () => {
          console.log('🔄 Speech recognition ended');
          // Only restart if we're still supposed to be listening AND manual listening is enabled AND we're not disabled
          if (this.isListeningForKeyword && this.isManualKeywordListeningEnabled && !this.isRestartDisabled) {
            console.log('🔄 Restarting speech recognition...');
            setTimeout(() => {
              if (this.isListeningForKeyword && this.isManualKeywordListeningEnabled && !this.isRestartDisabled) {
                this.startKeywordListening();
              }
            }, 100);
          }
        };
        
        this.recognition.onresult = (event: any) => {
          console.log('🎤 Speech recognition result received');
          console.log('🎤 Results length:', event.results.length);
          
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
          
          // Update the transcript
          if (finalTranscript) {
            this.transcript += finalTranscript + ' ';
            console.log('🎤 Final transcript:', finalTranscript);
            console.log('🎤 Full transcript:', this.transcript);
            
            // Check for keyword in the final transcript
            if (finalTranscript.toLowerCase().includes(this.keywordToDetect.toLowerCase())) {
              console.log(`🎯 Keyword "${this.keywordToDetect}" detected in transcript!`);
              this.onKeywordDetected();
            }
            
            // Notify transcript update
            if (this.onTranscriptUpdate) {
              this.onTranscriptUpdate(this.transcript.trim());
            }
          }
          
          if (interimTranscript) {
            console.log('🎤 Interim transcript:', interimTranscript);
          }
        };
        
        this.recognition.onerror = (event: any) => {
          console.error('❌ Speech recognition error:', event.error);
          console.error('❌ Error details:', {
            error: event.error,
            message: event.message || 'No message',
            timestamp: new Date().toISOString()
          });
          
          // Only restart for specific errors, not for normal network timeouts
          if (event.error === 'no-speech') {
            // This is normal - just means no speech was detected
            console.log('🎤 No speech detected - this is normal');
            return;
          }
          
          // Handle different error types appropriately
          if (event.error === 'audio-capture' || event.error === 'not-allowed') {
            // Genuine errors that need immediate attention
            console.log('🔄 Restarting due to genuine error:', event.error);
            this.restartAttempts++;
            this.totalRestartAttempts++;
            
            let restartDelay = 2000; // 2 seconds for genuine errors
            if (this.restartAttempts >= this.maxRestartAttempts) {
              restartDelay = 10000; // 10 seconds for excessive attempts
              this.restartAttempts = 0;
              console.log('🔄 Too many restart attempts, using longer cooldown...');
            }
            
            console.log(`🔄 Attempting to restart speech recognition after error (attempt ${this.restartAttempts}/${this.maxRestartAttempts}, total: ${this.totalRestartAttempts}/${this.maxTotalRestartAttempts})...`);
            console.log(`🔄 Restart delay: ${restartDelay}ms`);
            
            setTimeout(() => {
              if (this.isListeningForKeyword && this.isManualKeywordListeningEnabled && !this.isRestartDisabled) {
                this.startKeywordListening();
              }
            }, restartDelay);
          } else if (event.error === 'network') {
            // Network errors - wait longer before retrying
            console.log('🌐 Network error detected - waiting before retry...');
            console.log('🌐 This usually indicates:');
            console.log('   - Poor internet connection');
            console.log('   - Firewall blocking speech recognition service');
            console.log('   - Browser speech recognition service unavailable');
            console.log('   - Network timeout or connectivity issues');
            
            this.restartAttempts++;
            this.totalRestartAttempts++;
            
            // Longer delay for network errors
            let networkRestartDelay = 5000; // 5 seconds for network errors
            if (this.restartAttempts >= this.maxRestartAttempts) {
              networkRestartDelay = 15000; // 15 seconds for excessive network errors
              this.restartAttempts = 0;
              console.log('🔄 Too many network errors, using longer cooldown...');
            }
            
            console.log(`🔄 Attempting to restart after network error (attempt ${this.restartAttempts}/${this.maxRestartAttempts}, total: ${this.totalRestartAttempts}/${this.maxTotalRestartAttempts})...`);
            console.log(`🔄 Restart delay: ${networkRestartDelay}ms`);
            
            // Check if we should disable restarts due to persistent network issues
            if (this.totalRestartAttempts >= this.maxTotalRestartAttempts) {
              console.log('🛑 Too many total network errors - disabling speech recognition restarts');
              this.isRestartDisabled = true;
              return;
            }
            
            setTimeout(() => {
              if (this.isListeningForKeyword && this.isManualKeywordListeningEnabled && !this.isRestartDisabled) {
                this.startKeywordListening();
              }
            }, networkRestartDelay);
          } else if (event.error === 'aborted') {
            // User or system aborted - don't restart
            console.log('🛑 Speech recognition aborted - not restarting');
          } else if (event.error === 'service-not-allowed') {
            // Service not allowed - usually means the speech recognition service is blocked
            console.log('🚫 Speech recognition service not allowed - may be blocked by firewall or network policy');
            console.log('🚫 This often happens in corporate networks or with strict security policies');
            // Don't restart for this error as it's likely a persistent issue
          } else if (event.error === 'bad-grammar') {
            // Bad grammar - usually not a critical issue
            console.log('📝 Grammar error in speech recognition - this is usually not critical');
          } else if (event.error === 'language-not-supported') {
            // Language not supported
            console.log('🌍 Language not supported - current language setting may be incorrect');
            console.log('🌍 Current language setting:', this.recognition.lang);
          } else {
            // Other errors - log but don't restart
            console.log('🎤 Ignoring non-critical error:', event.error);
            console.log('🎤 Error type:', typeof event.error);
            console.log('🎤 Full error object:', event);
          }
        };
        
        this.recognition.onaudiostart = () => {
          console.log('🎤 Audio capture started');
        };
        
        this.recognition.onaudioend = () => {
          console.log('🎤 Audio capture ended');
        };
        
        this.recognition.onsoundstart = () => {
          console.log('🎤 Sound detected');
        };
        
        this.recognition.onsoundend = () => {
          console.log('🎤 Sound ended');
        };
        
        this.recognition.onspeechstart = () => {
          console.log('🎤 Speech detected');
        };
        
        this.recognition.onspeechend = () => {
          console.log('🎤 Speech ended');
        };
        
        console.log('✅ Speech recognition initialization complete');
        
      } catch (error) {
        console.error('❌ Failed to create SpeechRecognition object:', error);
      }
    } else {
      console.error('❌ Speech recognition not supported in this browser');
    }
  }

  public startMonitoring(
    onAccidentDetected: (result: AccidentDetectionResult) => void,
    onSafetyDataUpdate: (data: SafetyData) => void,
    onStationaryUserDetected?: (location: { lat: number; lng: number }, duration: number) => void,
    onVoiceKeywordDetected?: (location: { lat: number; lng: number }, keyword: string) => void
  ) {
    this.onAccidentDetected = onAccidentDetected;
    this.onSafetyDataUpdate = onSafetyDataUpdate;
    this.onStationaryUserDetected = onStationaryUserDetected || null;
    this.onVoiceKeywordDetected = onVoiceKeywordDetected || null;
    this.isActive = true;

    // Start location monitoring
    this.startLocationMonitoring();
    
    // Start motion monitoring
    this.startMotionMonitoring();
    
    // Start stationary user detection
    this.startStationaryDetection();
    
    // Start voice monitoring
    this.startVoiceMonitoring();
  }

  public stopMonitoring() {
    this.isActive = false;
    
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
    
    if (this.motionUpdateInterval) {
      clearInterval(this.motionUpdateInterval);
      this.motionUpdateInterval = null;
    }
    
    if (this.voiceUpdateInterval) {
      clearInterval(this.voiceUpdateInterval);
      this.voiceUpdateInterval = null;
    }
    
    this.stopVoiceRecognition();
  }

  private startLocationMonitoring() {
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation not available');
      return;
    }

    // Cache the last known location to prevent unnecessary changes
    let lastKnownLocation: { lat: number; lng: number } | null = null;
    let locationStabilityCounter = 0;

    this.locationUpdateInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          let { latitude, longitude } = position.coords;
          const timestamp = Date.now();
          
          // Check if location has changed significantly (more than 5 meters)
          if (lastKnownLocation) {
            const distance = this.calculateDistance(
              lastKnownLocation.lat,
              lastKnownLocation.lng,
              latitude,
              longitude
            );
            
            // If location hasn't changed significantly, use the cached location
            if (distance < 5) {
              locationStabilityCounter++;
              if (locationStabilityCounter < 3) {
                // Use cached location for stability
                latitude = lastKnownLocation.lat;
                longitude = lastKnownLocation.lng;
              }
            } else {
              // Location changed significantly, update cache
              lastKnownLocation = { lat: latitude, lng: longitude };
              locationStabilityCounter = 0;
            }
          } else {
            // First location reading
            lastKnownLocation = { lat: latitude, lng: longitude };
          }
          
          // Calculate speed if we have previous location
          let currentSpeed = 0;
          let acceleration = 0;
          
          if (this.sensorData.length > 0) {
            const lastData = this.sensorData[this.sensorData.length - 1];
            if (lastData.lastLocation) {
              const distance = this.calculateDistance(
                lastData.lastLocation.lat,
                lastData.lastLocation.lng,
                latitude,
                longitude
              );
              const timeDiff = (timestamp - lastData.timestamp) / 1000; // seconds
              
              // Only calculate speed if movement is significant (more than 2 meters)
              // This prevents false speed readings from GPS accuracy variations
              if (distance > 2 && timeDiff > 0) {
                currentSpeed = distance / timeDiff;
                
                // Apply reasonable speed limits to prevent GPS glitches
                if (currentSpeed > this.maxReasonableSpeed) {
                  console.warn(`🚨 Unrealistic speed detected: ${currentSpeed.toFixed(2)} m/s - likely GPS glitch, setting to 0`);
                  currentSpeed = 0;
                }
                
                // Calculate acceleration
                acceleration = (currentSpeed - lastData.currentSpeed) / timeDiff;
                
                // Apply reasonable acceleration limits
                if (Math.abs(acceleration) > this.maxReasonableAcceleration) {
                  console.warn(`🚨 Unrealistic acceleration detected: ${acceleration.toFixed(2)} m/s² - likely GPS glitch, setting to 0`);
                  acceleration = 0;
                }
              } else {
                // User is essentially stationary
                currentSpeed = 0;
                acceleration = 0;
              }
            }
          }

          const safetyData: SafetyData = {
            isInRedZone: false, // This will be set by ZoneContext
            currentSpeed: Math.round(currentSpeed * 100) / 100, // Round to 2 decimal places
            acceleration: Math.round(acceleration * 100) / 100, // Round to 2 decimal places
            isMoving: currentSpeed > 0.5, // Consider moving if speed > 0.5 m/s
            lastLocation: { lat: latitude, lng: longitude },
            timestamp
          };

          // Log speed information for debugging
          if (currentSpeed > 0) {
            console.log(`📍 Location update - Speed: ${currentSpeed.toFixed(2)} m/s (${(currentSpeed * 3.6).toFixed(2)} km/h)`);
          } else {
            console.log(`📍 Location update - User is stationary (0 m/s)`);
          }

          this.addSensorData(safetyData);
          
          if (this.onSafetyDataUpdate) {
            this.onSafetyDataUpdate(safetyData);
          }

          // Check for potential accidents
          this.checkForAccidents();
        },
        (error) => {
          console.warn('Geolocation error:', error);
          
          // Handle specific geolocation errors
          if (error.code === 3) { // TIMEOUT
            console.log('Geolocation timeout - this is normal in some environments');
            // Don't stop monitoring, just continue with next attempt
          } else if (error.code === 1) { // PERMISSION_DENIED
            console.error('Geolocation permission denied');
          } else if (error.code === 2) { // POSITION_UNAVAILABLE
            console.warn('Geolocation position unavailable');
          }
        },
        { 
          enableHighAccuracy: false, // Use false for desktop to reduce timeouts
          timeout: 10000, // Increase timeout to 10 seconds
          maximumAge: 30000 // Allow older positions (30 seconds)
        }
      );
    }, 3000); // Update every 3 seconds instead of 2 for better stability
  }

  private startMotionMonitoring() {
    if (!('DeviceMotionEvent' in window)) {
      console.warn('Device motion not available');
      return;
    }

    let lastAcceleration = 0;
    let lastTimestamp = Date.now();

    window.addEventListener('devicemotion', (event) => {
      if (!this.isActive) return;

      const currentTimestamp = Date.now();
      const timeDiff = (currentTimestamp - lastTimestamp) / 1000;

      if (event.accelerationIncludingGravity) {
        const { x, y, z } = event.accelerationIncludingGravity;
        if (x !== null && y !== null && z !== null) {
          const currentAcceleration = Math.sqrt(x * x + y * y + z * z);
          
          // Calculate acceleration change
          const accelerationChange = timeDiff > 0 ? (currentAcceleration - lastAcceleration) / timeDiff : 0;
          
          // Update the latest sensor data with motion information
          if (this.sensorData.length > 0) {
            const latestData = this.sensorData[this.sensorData.length - 1];
            latestData.acceleration = accelerationChange;
            
            if (this.onSafetyDataUpdate) {
              this.onSafetyDataUpdate(latestData);
            }
          }

          lastAcceleration = currentAcceleration;
          lastTimestamp = currentTimestamp;
        }
      }
    });
  }

  private startStationaryDetection() {
    if (!this.onStationaryUserDetected) return;

    let lastLocation: { lat: number; lng: number } | null = null;
    let stationaryStartTime: number | null = null;
    let stationaryCheckInterval: NodeJS.Timeout | null = null;

    // Check every minute for stationary users
    stationaryCheckInterval = setInterval(() => {
      if (!this.isActive) {
        if (stationaryCheckInterval) {
          clearInterval(stationaryCheckInterval);
        }
        return;
      }

      const currentData = this.getCurrentSafetyData();
      if (!currentData || !currentData.lastLocation) return;

      const currentLocation = currentData.lastLocation;
      const isCurrentlyMoving = currentData.isMoving;

      if (!isCurrentlyMoving && currentData.currentSpeed < 0.5) {
        // User is not moving
        if (!lastLocation) {
          // First time detecting stationary
          lastLocation = currentLocation;
          stationaryStartTime = Date.now();
        } else {
          // Check if user is still in the same location (within 10 meters)
          const distance = this.calculateDistance(
            lastLocation.lat,
            lastLocation.lng,
            currentLocation.lat,
            currentLocation.lng
          );

          if (distance < 10) { // Within 10 meters
            const stationaryDuration = Date.now() - (stationaryStartTime || Date.now());
            const durationMinutes = Math.floor(stationaryDuration / (1000 * 60));

            if (durationMinutes >= this.stationaryThreshold) {
              // User has been stationary for threshold time
              if (this.onStationaryUserDetected) {
                this.onStationaryUserDetected(currentLocation, durationMinutes);
              }
              
              // Reset for next detection
              lastLocation = null;
              stationaryStartTime = null;
            }
          } else {
            // User moved, reset stationary detection
            lastLocation = currentLocation;
            stationaryStartTime = Date.now();
          }
        }
      } else {
        // User is moving, reset stationary detection
        lastLocation = null;
        stationaryStartTime = null;
      }
    }, 60000); // Check every minute

    // Cleanup on stop
    this.stopMonitoring = () => {
      if (stationaryCheckInterval) {
        clearInterval(stationaryCheckInterval);
      }
    };
  }

  private addSensorData(data: SafetyData) {
    this.sensorData.push(data);
    
    // Keep only the last N data points
    if (this.sensorData.length > this.maxDataPoints) {
      this.sensorData.shift();
    }
  }

  private checkForAccidents(): AccidentDetectionResult | null {
    if (this.sensorData.length < 3) return null;

    const recentData = this.sensorData.slice(-3);
    const latestData = recentData[recentData.length - 1];
    
    // Check if user was moving at high speed and then stopped suddenly
    let isPotentialAccident = false;
    let confidence = 0;
    let reason = '';
    let triggerType: 'speed' | 'voice' | 'keyword' | 'stationary' = 'speed';

    // Check for sudden deceleration from high speed
    if (recentData.length >= 2) {
      const previousData = recentData[recentData.length - 2];
      
      // If user was moving at high speed (> 5 m/s) and then decelerated rapidly
      if (previousData.currentSpeed > this.speedThreshold && 
          previousData.currentSpeed <= this.maxReasonableSpeed && // Ensure previous speed was reasonable
          latestData.acceleration < this.decelerationThreshold &&
          Math.abs(latestData.acceleration) <= this.maxReasonableAcceleration && // Ensure acceleration is reasonable
          latestData.currentSpeed < 1) { // Almost stopped
        
        isPotentialAccident = true;
        confidence = Math.min(0.8 + Math.abs(latestData.acceleration) / 10, 0.95);
        reason = `Sudden deceleration from ${previousData.currentSpeed.toFixed(1)} m/s to ${latestData.currentSpeed.toFixed(1)} m/s`;
        triggerType = 'speed';
      }
      
      // Check for complete stop after high speed
      if (previousData.currentSpeed > this.speedThreshold && 
          previousData.currentSpeed <= this.maxReasonableSpeed && // Ensure previous speed was reasonable
          latestData.currentSpeed < 0.5 &&
          latestData.isMoving === false) {
        
        isPotentialAccident = true;
        confidence = Math.min(0.7 + previousData.currentSpeed / 10, 0.9);
        reason = `Complete stop after traveling at ${previousData.currentSpeed.toFixed(1)} m/s`;
        triggerType = 'speed';
      }
      
      // Check for sudden acceleration
      if (previousData.currentSpeed < this.speedThreshold && 
          latestData.acceleration > this.accelerationThreshold &&
          latestData.acceleration <= this.maxReasonableAcceleration && // Ensure acceleration is reasonable
          latestData.currentSpeed > this.speedThreshold &&
          latestData.currentSpeed <= this.maxReasonableSpeed) { // Ensure current speed is reasonable
         
        isPotentialAccident = true;
        confidence = Math.min(0.6 + latestData.acceleration / 10, 0.85);
        reason = `Sudden acceleration from ${previousData.currentSpeed.toFixed(1)} m/s to ${latestData.currentSpeed.toFixed(1)} m/s`;
        triggerType = 'speed';
      }
    }

    // Check for voice level threshold
    if (latestData.voiceLevel && latestData.voiceLevel > this.voiceThreshold) {
      isPotentialAccident = true;
      confidence = 0.7;
      reason = `High voice level detected: ${latestData.voiceLevel.toFixed(1)} dB`;
      triggerType = 'voice';
    }

    // Check for keyword detection
    if (latestData.keywordDetected) {
      isPotentialAccident = true;
      confidence = 0.9;
      reason = `Emergency keyword "${this.keywordToDetect}" detected`;
      triggerType = 'keyword';
    }

    if (isPotentialAccident && this.onAccidentDetected) {
      const result: AccidentDetectionResult = { isPotentialAccident, confidence, reason, triggerType };
      this.onAccidentDetected(result);
      return result;
    }

    return null;
  }

  // Voice monitoring methods
  private startVoiceMonitoring() {
    console.log('🎤 startVoiceMonitoring() called');
    console.log('🎤 isActive:', this.isActive);
    
    if (!this.isActive) {
      console.log('❌ Safety monitoring not active, skipping voice monitoring');
      return;
    }
    
    // Start voice level monitoring (DISABLED - focusing on keyword detection only)
    // console.log('🎤 Starting voice level monitoring...');
    // this.startVoiceLevelMonitoring();
    
    // Start keyword listening when in red zone
    console.log('🎤 Starting keyword listening...');
    this.startKeywordListening();
  }

  private startVoiceLevelMonitoring() {
    console.log('🎤 Starting voice level monitoring...');
    console.log('🎤 Navigator mediaDevices available:', !!navigator.mediaDevices);
    console.log('🎤 getUserMedia available:', !!('getUserMedia' in navigator.mediaDevices));
    
    if (!('getUserMedia' in navigator.mediaDevices)) {
      console.warn('❌ Microphone access not supported');
      return;
    }

    console.log('🎤 Requesting microphone permission...');
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        console.log('✅ Microphone permission granted!');
        console.log('🎤 Stream tracks:', stream.getTracks().length);
        console.log('🎤 Stream active:', stream.active);
        
        this.mediaStream = stream;
        
        // Check if AudioContext is supported
        if (!window.AudioContext && !(window as any).webkitAudioContext) {
          console.error('❌ AudioContext not supported');
          return;
        }
        
        // Create AudioContext with fallback
        try {
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          console.log('✅ AudioContext created successfully');
        } catch (error) {
          console.error('❌ Failed to create AudioContext:', error);
          return;
        }
        
        try {
          this.microphone = this.audioContext.createMediaStreamSource(stream);
          console.log('✅ MediaStreamSource created');
        } catch (error) {
          console.error('❌ Failed to create MediaStreamSource:', error);
          return;
        }
        
        try {
          this.analyser = this.audioContext.createAnalyser();
          console.log('✅ Analyser created');
        } catch (error) {
          console.error('❌ Failed to create Analyser:', error);
          return;
        }
        
        this.microphone.connect(this.analyser);
        this.analyser.fftSize = 256;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        console.log('🎤 Starting voice level analysis...');
        console.log('🎤 Buffer length:', bufferLength);
        console.log('🎤 FFT size:', this.analyser.fftSize);
        
        const updateVoiceLevel = () => {
          if (!this.isActive || !this.analyser) {
            console.log('🎤 Voice monitoring stopped - not active or no analyser');
            return;
          }
          
          try {
            this.analyser.getByteFrequencyData(dataArray);
            
            // Calculate average volume level
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            
            // Convert to approximate dB (0-255 range to 0-100 dB)
            const voiceLevel = (average / 255) * 100;
            
            // Log voice level every 50 frames (about once per second)
            if (Math.random() < 0.02) { // 2% chance to log (reduces spam)
              console.log('🎤 Voice level:', voiceLevel.toFixed(2), 'dB (avg:', average.toFixed(2), ')');
            }
            
            // Update the latest safety data with voice level
            if (this.sensorData.length > 0) {
              const latestData = this.sensorData[this.sensorData.length - 1];
              latestData.voiceLevel = voiceLevel;
              
              if (this.onSafetyDataUpdate) {
                this.onSafetyDataUpdate(latestData);
              }
            }
            
            // Continue monitoring
            if (this.isActive) {
              requestAnimationFrame(updateVoiceLevel);
            }
          } catch (error) {
            console.error('❌ Error in voice level analysis:', error);
          }
        };
        
        updateVoiceLevel();
      })
      .catch((error) => {
        console.error('❌ Could not access microphone:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        
        // Log specific error types
        if (error.name === 'NotAllowedError') {
          console.error('❌ Microphone permission denied by user');
        } else if (error.name === 'NotFoundError') {
          console.error('❌ No microphone found');
        } else if (error.name === 'NotReadableError') {
          console.error('❌ Microphone is busy or not accessible');
        } else if (error.name === 'OverconstrainedError') {
          console.error('❌ Microphone constraints not satisfied');
        }
        
        if (this.onPermissionRequest) {
          this.onPermissionRequest('microphone', false);
        }
      });
  }

  private startKeywordListening() {
    console.log('🎤 Starting keyword listening...');
    console.log('🎤 Recognition object exists:', !!this.recognition);
    console.log('🎤 Recognition object type:', typeof this.recognition);
    console.log('🎤 Already listening:', this.isListeningForKeyword);
    console.log('🎤 Manual listening enabled:', this.isManualKeywordListeningEnabled);
    console.log('🎤 Restart disabled:', this.isRestartDisabled);
    console.log('🎤 WebkitSpeechRecognition available:', !!('webkitSpeechRecognition' in window));
    console.log('🎤 SpeechRecognition available:', !!('SpeechRecognition' in window));
    
    // Only start listening if manual listening is enabled
    if (!this.isManualKeywordListeningEnabled) {
      console.log('🎤 Manual keyword listening not enabled - skipping start');
      return;
    }
    
    if (!this.recognition) {
      console.warn('❌ Speech recognition not initialized.');
      console.log('🎤 Attempting to re-initialize speech recognition...');
      this.initializeVoiceRecognition();
      if (!this.recognition) {
        console.error('❌ Failed to initialize speech recognition after retry.');
        return;
      }
    }
    if (this.isListeningForKeyword) {
      console.log('🎤 Keyword listening already active.');
      return;
    }
    if (this.isRestartDisabled) {
      console.warn('❌ Speech recognition restarts are disabled.');
      return;
    }
    
    this.isListeningForKeyword = true;
    try {
      console.log('🎤 Attempting to start speech recognition...');
      this.recognition.start();
      console.log('✅ Speech recognition started for keyword detection.');
    } catch (error) {
      console.error('❌ Error starting speech recognition:', error);
      console.error('❌ Error details:', {
        name: (error as any).name,
        message: (error as any).message,
        stack: (error as any).stack
      });
      this.isListeningForKeyword = false;
    }
  }

  private stopKeywordListening() {
    console.log('🎤 Stopping keyword listening...');
    console.log('🎤 Recognition object exists:', !!this.recognition);
    console.log('🎤 Currently listening:', this.isListeningForKeyword);
    
    if (!this.recognition || !this.isListeningForKeyword) {
      console.log('🎤 Keyword listening not active or not initialized.');
      return;
    }
    this.isListeningForKeyword = false;
    try {
      this.recognition.stop();
      console.log('✅ Speech recognition stopped for keyword detection.');
    } catch (error) {
      console.error('❌ Error stopping speech recognition:', error);
    }
  }

  // New method to stop listening when user leaves red zone
  public stopListeningWhenLeavingRedZone() {
    console.log('🛑 User left red zone - stopping keyword listening');
    this.stopKeywordListening();
  }



  private onKeywordDetected() {
    console.log('🎯 onKeywordDetected() called!');
    
    const currentData = this.getCurrentSafetyData();
    if (!currentData || !currentData.lastLocation) {
      console.log('❌ No current data or location available for keyword detection');
      return;
    }
    
    console.log('✅ Current data and location available for keyword detection');
    console.log('📍 Location:', currentData.lastLocation);
    
    // Mark keyword as detected in current data
    currentData.keywordDetected = true;
    console.log('✅ Keyword marked as detected in current data');
    
    // Trigger keyword detection callback
    if (this.onVoiceKeywordDetected) {
      console.log('✅ Triggering voice keyword detection callback');
      this.onVoiceKeywordDetected(currentData.lastLocation, this.keywordToDetect);
    } else {
      console.log('❌ No voice keyword detection callback available');
    }
    
    // Don't stop listening - continue listening for more keywords
    console.log('🎤 Continuing to listen for more keywords...');
    
    // Reset keyword detection flag after a short delay
    setTimeout(() => {
      if (currentData) {
        currentData.keywordDetected = false;
        console.log('🔄 Reset keyword detection flag');
      }
    }, 5000); // Reset after 5 seconds
  }

  private stopVoiceRecognition() {
    this.stopKeywordListening();
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.microphone = null;
    this.analyser = null;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

  public getCurrentSafetyData(): SafetyData | null {
    return this.sensorData.length > 0 ? this.sensorData[this.sensorData.length - 1] : null;
  }

  public isMonitoring(): boolean {
    return this.isActive;
  }

  // Public method to test voice recognition
  public testVoiceRecognition(): void {
    console.log('Testing voice recognition...');
    console.log('Recognition instance:', this.recognition ? 'Available' : 'Not available');
    console.log('Is listening for keyword:', this.isListeningForKeyword);
    console.log('Keyword to detect:', this.keywordToDetect);
    
    if (this.recognition) {
      try {
        this.recognition.start();
        console.log('Test: Speech recognition started successfully');
        setTimeout(() => {
          try {
            this.recognition.stop();
            console.log('Test: Speech recognition stopped successfully');
          } catch (error) {
            console.error('Test: Error stopping speech recognition:', error);
          }
        }, 3000);
      } catch (error) {
        console.error('Test: Error starting speech recognition:', error);
      }
    }
  }

  // Public method to get microphone status
  public getMicrophoneStatus(): string {
    if (!this.mediaStream) return 'No microphone access';
    if (!this.isListeningForKeyword) return 'Not listening for keywords';
    return 'Listening for keywords';
  }

  // Public method to get current transcript
  public getTranscript(): string {
    return this.transcript.trim();
  }

  // Public method to clear transcript
  public clearTranscript(): void {
    this.transcript = '';
    if (this.onTranscriptUpdate) {
      this.onTranscriptUpdate('');
    }
    console.log('🎤 Transcript cleared');
  }

  // New: Manual keyword listening control methods
  public enableManualKeywordListening(): void {
    console.log('🎤 Enabling manual keyword listening...');
    this.isManualKeywordListeningEnabled = true;
    if (this.isActive) {
      this.startKeywordListening();
    }
  }

  public disableManualKeywordListening(): void {
    console.log('🎤 Disabling manual keyword listening...');
    this.isManualKeywordListeningEnabled = false;
    this.stopKeywordListening();
  }

  public getManualKeywordListeningStatus(): boolean {
    return this.isManualKeywordListeningEnabled;
  }

  public toggleManualKeywordListening(): boolean {
    if (this.isManualKeywordListeningEnabled) {
      this.disableManualKeywordListening();
      return false;
    } else {
      this.enableManualKeywordListening();
      return true;
    }
  }

  // Public method to set transcript update callback
  public setTranscriptCallback(callback: (transcript: string) => void): void {
    this.onTranscriptUpdate = callback;
  }

  // Public method to get GPS and system status
  public getSystemStatus(): any {
    const currentData = this.getCurrentSafetyData();
    return {
      isActive: this.isActive,
      isListeningForKeyword: this.isListeningForKeyword,
      sensorDataCount: this.sensorData.length,
      currentSpeed: currentData?.currentSpeed || 0,
      currentAcceleration: currentData?.acceleration || 0,
      isMoving: currentData?.isMoving || false,
      lastLocation: currentData?.lastLocation || null,
      maxReasonableSpeed: this.maxReasonableSpeed,
      maxReasonableAcceleration: this.maxReasonableAcceleration,
      speedThreshold: this.speedThreshold,
      decelerationThreshold: this.decelerationThreshold,
      accelerationThreshold: this.accelerationThreshold,
      speechRecognitionStatus: {
        isRestartDisabled: this.isRestartDisabled,
        restartAttempts: this.restartAttempts,
        totalRestartAttempts: this.totalRestartAttempts,
        maxRestartAttempts: this.maxRestartAttempts,
        maxTotalRestartAttempts: this.maxTotalRestartAttempts,
        isListeningForKeyword: this.isListeningForKeyword
      }
    };
  }

  // Public method to reset the system and clear false alerts
  public resetSystem(): void {
    console.log('🔄 Resetting safety monitoring system...');
    
    // Clear sensor data to start fresh
    this.sensorData = [];
    
    // Reset restart counters
    this.restartAttempts = 0;
    this.restartCooldown = false;
    
    console.log('✅ System reset complete - sensor data cleared and counters reset');
  }

  // Public method to re-enable speech recognition after it's been disabled
  public reEnableSpeechRecognition(): void {
    if (this.isRestartDisabled) {
      console.log('🔄 Re-enabling speech recognition system...');
      this.isRestartDisabled = false;
      this.totalRestartAttempts = 0;
      this.restartAttempts = 0;
      this.restartCooldown = false;
      
      // Restart keyword listening if the system is active
      if (this.isActive && this.isListeningForKeyword) {
        this.startKeywordListening();
      }
      
      console.log('✅ Speech recognition re-enabled successfully');
    } else {
      console.log('ℹ️ Speech recognition is already enabled');
    }
  }

  // Public method to check speech recognition health and status
  public getSpeechRecognitionHealth(): any {
    const isSecureContext = window.isSecureContext;
    const isOnline = navigator.onLine;
    const isHttps = location.protocol === 'https:' || location.hostname === 'localhost';
    const hasRecognition = !!(window as any).webkitSpeechRecognition || !!(window as any).SpeechRecognition;
    const isRecognitionInitialized = !!this.recognition;
    
    return {
      isSecureContext,
      isOnline,
      isHttps,
      hasRecognition,
      isRecognitionInitialized,
      isListeningForKeyword: this.isListeningForKeyword,
      isManualKeywordListeningEnabled: this.isManualKeywordListeningEnabled,
      isRestartDisabled: this.isRestartDisabled,
      restartAttempts: this.restartAttempts,
      totalRestartAttempts: this.totalRestartAttempts,
      maxRestartAttempts: this.maxRestartAttempts,
      maxTotalRestartAttempts: this.maxTotalRestartAttempts,
      transcript: this.transcript,
      // Add recommendations for common issues
      recommendations: this.getRecommendations(isSecureContext, isOnline, isHttps, hasRecognition, isRecognitionInitialized)
    };
  }

  // Public method to get detailed debug information for console
  public debugSpeechRecognition(): void {
    console.log('🔍 === Speech Recognition Debug Info ===');
    console.log('🔍 System Status:');
    console.log('  - Secure Context:', window.isSecureContext);
    console.log('  - Network Online:', navigator.onLine);
    console.log('  - HTTPS/Localhost:', location.protocol === 'https:' || location.hostname === 'localhost');
    console.log('  - User Agent:', navigator.userAgent);
    console.log('  - Platform:', navigator.platform);
    
    console.log('🔍 Speech Recognition Support:');
    console.log('  - WebkitSpeechRecognition:', !!(window as any).webkitSpeechRecognition);
    console.log('  - SpeechRecognition:', !!(window as any).SpeechRecognition);
    console.log('  - Window speech keys:', Object.keys(window).filter(key => key.toLowerCase().includes('speech')));
    
    console.log('🔍 SafetyMonitor Status:');
    console.log('  - Recognition object:', this.recognition);
    console.log('  - Is listening:', this.isListeningForKeyword);
    console.log('  - Manual listening enabled:', this.isManualKeywordListeningEnabled);
    console.log('  - Restart disabled:', this.isRestartDisabled);
    console.log('  - Restart attempts:', this.restartAttempts);
    console.log('  - Total restart attempts:', this.totalRestartAttempts);
    console.log('  - Current transcript:', this.transcript);
    
    if (this.recognition) {
      console.log('🔍 Recognition Object Details:');
      console.log('  - Type:', typeof this.recognition);
      console.log('  - Constructor:', this.recognition.constructor.name);
      console.log('  - Available properties:', Object.keys(this.recognition));
      console.log('  - Continuous:', this.recognition.continuous);
      console.log('  - Interim results:', this.recognition.interimResults);
      console.log('  - Language:', this.recognition.lang);
    }
    
    console.log('🔍 === End Debug Info ===');
  }

  private getRecommendations(isSecureContext: boolean, isOnline: boolean, isHttps: boolean, hasRecognition: boolean, isRecognitionInitialized: boolean): string[] {
    const recommendations: string[] = [];
    
    if (!isSecureContext) {
      recommendations.push('Ensure the app is running in a secure context (HTTPS or localhost)');
    }
    
    if (!isOnline) {
      recommendations.push('Check your internet connection - speech recognition requires network access');
    }
    
    if (!isHttps && location.hostname !== 'localhost') {
      recommendations.push('Use HTTPS in production - speech recognition may not work on HTTP');
    }
    
    if (!hasRecognition) {
      recommendations.push('Your browser does not support speech recognition - try Chrome, Edge, or Safari');
    }
    
    if (!isRecognitionInitialized) {
      recommendations.push('Speech recognition failed to initialize - check browser console for errors');
    }
    
    if (this.isRestartDisabled) {
      recommendations.push('Speech recognition has been disabled due to repeated failures - use reEnableSpeechRecognition() to reset');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All systems appear to be working correctly');
    }
    
    return recommendations;
  }
}

export default SafetyMonitor;
