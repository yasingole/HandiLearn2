// src/ui/HandTrackingTest.jsx
// UPDATED VERSION TO DISPLAY POINTING DIRECTION

import React, { useEffect, useRef, useState } from 'react';
import InputManager from '../core/input/input-manager'; // Fixed import path
import './HandTrackingTest.css';

function HandTrackingTest() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [inputManager, setInputManager] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState('None');
  const [provider, setProvider] = useState('mediapipe');
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize input manager
  useEffect(() => {
    let isMounted = true;
    setIsInitializing(true);

    const initializeManager = async () => {
      try {
        const manager = new InputManager(provider);

        // Use the onReady callback to ensure manager is initialized
        manager.onReady(() => {
          if (isMounted) {
            console.log('Input manager initialized successfully');
            setInputManager(manager);
            setIsInitializing(false);
            setError(null);
          }
        });
      } catch (err) {
        if (isMounted) {
          console.error('Error initializing input manager:', err);
          setError(`Initialization error: ${err.message}`);
          setIsInitializing(false);
        }
      }
    };

    initializeManager();

    // Clean up on unmount
    return () => {
      isMounted = false;
      if (inputManager && inputManager.isInitialized && isTracking) {
        try {
          inputManager.stopTracking();
        } catch (err) {
          console.error('Error stopping tracking on cleanup:', err);
        }
      }
    };
  }, [provider]);

  // Setup canvas for visualization
  useEffect(() => {
    if (!canvasRef.current || !inputManager) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    const updateCanvasSize = () => {
      if (videoRef.current) {
        const { videoWidth, videoHeight } = videoRef.current;
        if (videoWidth && videoHeight) {
          canvas.width = videoWidth;
          canvas.height = videoHeight;
        }
      }
    };

    // Initial size update
    updateCanvasSize();

    // Update size when video dimensions change
    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', updateCanvasSize);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadedmetadata', updateCanvasSize);
      }
    };
  }, [inputManager, videoRef, canvasRef]);

  // Handle starting/stopping tracking
  const toggleTracking = async () => {
    try {
      if (!inputManager) {
        setError("Input manager not initialized yet. Please wait...");
        return;
      }

      if (isTracking) {
        await inputManager.stopTracking();
        setIsTracking(false);
        setDetectedGesture('None');
      } else {
        if (videoRef.current) {
          inputManager.setVideoElement(videoRef.current);

          // Register hand update callback
          inputManager.onHandUpdate(results => {
            drawResults(results);
          });

          // Register gesture detection callback with enhanced display
          inputManager.onGestureDetected((gesture, handedness) => {
            // Format the detected gesture with additional details
            let displayText = `${gesture.name} (${handedness})`;

            // Add direction for pointing gesture
            if (gesture.name === 'point' && gesture.direction) {
              displayText = `${gesture.name} ${gesture.direction} (${handedness})`;
            }

            setDetectedGesture(displayText);
          });

          await inputManager.startTracking();
          setIsTracking(true);
          setError(null);
        }
      }
    } catch (err) {
      console.error('Error toggling tracking:', err);
      setError(`Error: ${err.message}`);
      setIsTracking(false);
    }
  };

  // Change input provider
  const toggleProvider = () => {
    // First stop tracking if active
    if (isTracking && inputManager) {
      try {
        inputManager.stopTracking();
      } catch (error) {
        console.error('Error stopping tracking before provider switch:', error);
      }
    }

    // Toggle provider
    setProvider(prev => prev === 'mediapipe' ? 'mock' : 'mediapipe');
    setIsTracking(false);
    setDetectedGesture('None');
    setError(null);
  };

  // Draw hand tracking results on canvas
  const drawResults = (results) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw hand landmarks if available
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        // Draw connections
        drawHandConnections(ctx, landmarks, width, height);

        // Draw landmarks
        for (const landmark of landmarks) {
          ctx.fillStyle = '#00FF00';
          ctx.beginPath();
          ctx.arc(
            landmark.x * width,
            landmark.y * height,
            5,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }
      }
    }
  };

  // Draw connections between landmarks to show hand structure
  const drawHandConnections = (ctx, landmarks, width, height) => {
    if (!landmarks || landmarks.length < 21) return;

    // Define connections between landmarks (finger joints)
    const connections = [
      // Thumb
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index finger
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Middle finger
      [0, 9], [9, 10], [10, 11], [11, 12],
      // Ring finger
      [0, 13], [13, 14], [14, 15], [15, 16],
      // Pinky
      [0, 17], [17, 18], [18, 19], [19, 20],
      // Palm
      [0, 5], [5, 9], [9, 13], [13, 17]
    ];

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    for (const [i, j] of connections) {
      ctx.beginPath();
      ctx.moveTo(
        landmarks[i].x * width,
        landmarks[i].y * height
      );
      ctx.lineTo(
        landmarks[j].x * width,
        landmarks[j].y * height
      );
      ctx.stroke();
    }
  };

  return (
    <div className="hand-tracking-test">
      <h2>Hand Tracking Test</h2>

      <div className="controls">
        <button onClick={toggleTracking} disabled={isInitializing}>
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </button>
        <button onClick={toggleProvider} disabled={isInitializing}>
          Using: {provider} (Click to switch)
        </button>
      </div>

      {isInitializing && <div className="status">Initializing input manager...</div>}
      {error && <div className="error">{error}</div>}

      <div className="gesture-display">
        <p>Detected Gesture: <strong>{detectedGesture}</strong></p>
      </div>

      <div className="video-container">
        <video
          ref={videoRef}
          className="input-video"
          playsInline
          muted
        ></video>
        <canvas
          ref={canvasRef}
          className="output-canvas"
        ></canvas>
      </div>

      <div className="instructions">
        <h3>Try these gestures:</h3>
        <ul>
          <li><strong>Point:</strong> Extend only your index finger. Now shows direction (up, down, left, right)!</li>
          <li><strong>Open:</strong> Spread all your fingers</li>
          <li><strong>Grab:</strong> Make a fist</li>
          <li><strong>Wave:</strong> Move your open hand side to side</li>
        </ul>
      </div>
    </div>
  );
}

export default HandTrackingTest;
