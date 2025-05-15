// src/ui/HandTrackingTest.jsx
// UPDATED FOR NEW GESTURES AND DIAGONAL DIRECTIONS

import React, { useEffect, useRef, useState } from 'react';
import InputManager from '../core/input/input-manager';
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

  // Store detailed gesture info
  const [gestureDetails, setGestureDetails] = useState({
    direction: null,
    strength: null,
    speed: null,
    duration: null,
    vector: null
  });

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
        setGestureDetails({
          direction: null,
          strength: null,
          speed: null,
          duration: null,
          vector: null
        });
      } else {
        if (videoRef.current) {
          inputManager.setVideoElement(videoRef.current);

          // Register hand update callback
          inputManager.onHandUpdate(results => {
            drawResults(results);
          });

          // Register gesture detection callback with enhanced details
          inputManager.onGestureDetected((gesture, handedness, landmarks) => {
            // Format the detected gesture with additional details
            let displayText = `${gesture.name} (${handedness})`;

            // Prepare gesture details object
            const details = {
              direction: null,
              strength: null,
              speed: null,
              duration: null,
              vector: null
            };

            // Add direction for pointing gesture
            if (gesture.name === 'point' && gesture.direction) {
              displayText = `${gesture.name} ${gesture.direction} (${handedness})`;
              details.direction = gesture.direction;

              if (gesture.vector) {
                details.vector = gesture.vector;
              }
            }

            // Add details for pinch gesture
            if (gesture.name === 'pinch') {
              if (gesture.strength) {
                details.strength = gesture.strength;
                displayText += ` (strength: ${gesture.strength.toFixed(2)})`;
              }

              if (gesture.duration) {
                details.duration = gesture.duration;
              }
            }

            // Add details for swipe gesture
            if (gesture.name === 'swipe') {
              if (gesture.direction) {
                displayText = `${gesture.name} ${gesture.direction} (${handedness})`;
                details.direction = gesture.direction;
              }

              if (gesture.speed) {
                details.speed = gesture.speed;
                displayText += ` (speed: ${gesture.speed.toFixed(2)})`;
              }
            }

            setDetectedGesture(displayText);
            setGestureDetails(details);
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
    setGestureDetails({
      direction: null,
      strength: null,
      speed: null,
      duration: null,
      vector: null
    });
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

  // Render gesture details as a debug panel
  const renderGestureDetails = () => {
    const hasDetails = Object.values(gestureDetails).some(val => val !== null);

    if (!hasDetails) return null;

    return (
      <div className="gesture-details">
        <h3>Gesture Details</h3>
        <div className="details-grid">
          {gestureDetails.direction && (
            <div className="detail-item">
              <span className="detail-label">Direction:</span>
              <span className="detail-value">{gestureDetails.direction}</span>
            </div>
          )}

          {gestureDetails.strength && (
            <div className="detail-item">
              <span className="detail-label">Strength:</span>
              <span className="detail-value">{gestureDetails.strength.toFixed(2)}</span>
            </div>
          )}

          {gestureDetails.speed && (
            <div className="detail-item">
              <span className="detail-label">Speed:</span>
              <span className="detail-value">{gestureDetails.speed.toFixed(2)}</span>
            </div>
          )}

          {gestureDetails.duration && (
            <div className="detail-item">
              <span className="detail-label">Duration:</span>
              <span className="detail-value">{gestureDetails.duration}ms</span>
            </div>
          )}

          {gestureDetails.vector && (
            <div className="detail-item vector-details">
              <span className="detail-label">Vector:</span>
              <div className="vector-values">
                <div>X: {gestureDetails.vector.dx.toFixed(3)}</div>
                <div>Y: {gestureDetails.vector.dy.toFixed(3)}</div>
                <div>Z: {gestureDetails.vector.dz.toFixed(3)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render a direction diagram for pointing gestures
  const renderDirectionDiagram = () => {
    if (!detectedGesture.includes('point')) return null;

    // Determine which direction is active
    const direction = gestureDetails.direction || 'none';

    // Define a class generator for diagram cells
    const cellClass = (cellDirection) => {
      return `direction-cell ${direction === cellDirection ? 'active' : ''}`;
    };

    return (
      <div className="direction-diagram">
        <h3>Pointing Direction</h3>
        <div className="direction-grid">
          <div className={cellClass('top-left')}>↖</div>
          <div className={cellClass('up')}>↑</div>
          <div className={cellClass('top-right')}>↗</div>
          <div className={cellClass('left')}>←</div>
          <div className={`direction-cell ${direction === 'forward' ? 'active' : ''}`}>⊙</div>
          <div className={cellClass('right')}>→</div>
          <div className={cellClass('bottom-left')}>↙</div>
          <div className={cellClass('down')}>↓</div>
          <div className={cellClass('bottom-right')}>↘</div>
        </div>
        <div className="depth-indicators">
          <div className={`depth-indicator ${direction === 'forward' ? 'active' : ''}`}>Forward</div>
          <div className={`depth-indicator ${direction === 'backward' ? 'active' : ''}`}>Backward</div>
        </div>
      </div>
    );
  };

  return (
    <div className="hand-tracking-test">
      <h2>Hand Tracking Test</h2>

      <div className="controls">
        <button
          onClick={toggleTracking}
          disabled={isInitializing}
          className={isTracking ? "stop-button" : "start-button"}
        >
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </button>
        <button
          onClick={toggleProvider}
          disabled={isInitializing}
          className="provider-button"
        >
          Using: {provider} (Click to switch)
        </button>
      </div>

      {isInitializing && <div className="status">Initializing input manager...</div>}
      {error && <div className="error">{error}</div>}

      <div className="gesture-display">
        <p>Detected Gesture: <strong>{detectedGesture}</strong></p>
      </div>

      <div className="debug-panel">
        {renderGestureDetails()}
        {renderDirectionDiagram()}
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
          <li><strong>Point:</strong> Extend only your index finger. Shows all directions (up, down, left, right, forward, backward, and diagonals)!</li>
          <li><strong>Open:</strong> Spread all your fingers</li>
          <li><strong>Grab:</strong> Make a fist</li>
          <li><strong>Pinch:</strong> Touch your thumb and index finger together</li>
          <li><strong>Wave:</strong> Move your open hand side to side</li>
          <li><strong>Swipe:</strong> Quick hand movement in any direction</li>
        </ul>
      </div>
    </div>
  );
}

export default HandTrackingTest;
