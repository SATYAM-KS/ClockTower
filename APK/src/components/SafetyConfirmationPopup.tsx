import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Volume2, VolumeX } from 'lucide-react';
import './SafetyConfirmationPopup.css';

interface SafetyConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSafetyConfirmed: (isSafe: boolean) => void;
  accidentDetails: {
    confidence: number;
    reason: string;
  } | null;
}

const SafetyConfirmationPopup: React.FC<SafetyConfirmationPopupProps> = ({
  isOpen,
  onClose,
  onSafetyConfirmed,
  accidentDetails
}) => {
  const [isBeeping, setIsBeeping] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const beepIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && !isMuted) {
      startBeeping();
      startCountdown();
    } else {
      stopBeeping();
      stopCountdown();
    }

    return () => {
      stopBeeping();
      stopCountdown();
    };
  }, [isOpen, isMuted]);

  const startBeeping = () => {
    if (isMuted) return;
    
    setIsBeeping(true);
    
    // Create beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800 Hz beep
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    
    // Beep pattern: 0.5s on, 0.5s off
    beepIntervalRef.current = setInterval(() => {
      oscillator.start();
      setTimeout(() => oscillator.stop(), 500);
    }, 1000);
  };

  const stopBeeping = () => {
    setIsBeeping(false);
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }
  };

  const startCountdown = () => {
    countdownIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-close after 5 minutes if no response
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const handleSafetyResponse = (isSafe: boolean) => {
    stopBeeping();
    stopCountdown();
    onSafetyConfirmed(isSafe);
    onClose();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted) {
      startBeeping();
    } else {
      stopBeeping();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="safety-popup-overlay">
      <div className="safety-popup">
        <div className="safety-popup-header">
          <div className="safety-popup-icon">
            <AlertTriangle size={32} color="#dc2626" />
          </div>
          <h2 className="safety-popup-title">Safety Check Required</h2>
          <p className="safety-popup-subtitle">
            We detected unusual movement patterns that might indicate an accident.
          </p>
        </div>

        {accidentDetails && (
          <div className="safety-popup-details">
            <div className="safety-popup-detail">
              <span className="detail-label">Confidence:</span>
              <span className="detail-value">
                {Math.round(accidentDetails.confidence * 100)}%
              </span>
            </div>
            <div className="safety-popup-detail">
              <span className="detail-label">Reason:</span>
              <span className="detail-value">{accidentDetails.reason}</span>
            </div>
          </div>
        )}

        <div className="safety-popup-timer">
          <div className="timer-label">Response Time Remaining:</div>
          <div className="timer-value">{formatTime(timeRemaining)}</div>
        </div>

        <div className="safety-popup-controls">
          <button
            className="safety-popup-button safety-popup-button-safe"
            onClick={() => handleSafetyResponse(true)}
          >
            <CheckCircle size={20} />
            I'm Safe
          </button>
          
          <button
            className="safety-popup-button safety-popup-button-unsafe"
            onClick={() => handleSafetyResponse(false)}
          >
            <XCircle size={20} />
            Need Help
          </button>
        </div>

        <div className="safety-popup-footer">
          <button
            className="safety-popup-mute-button"
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            {isMuted ? "Unmute" : "Mute"}
          </button>
          
          <div className="safety-popup-status">
            {isBeeping && !isMuted && (
              <span className="beeping-indicator">🔊 Beeping...</span>
            )}
          </div>
        </div>

        <button className="safety-popup-close" onClick={onClose}>
          <XCircle size={24} />
        </button>
      </div>
    </div>
  );
};

export default SafetyConfirmationPopup;
