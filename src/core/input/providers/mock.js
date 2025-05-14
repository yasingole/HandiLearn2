// src/core/input/providers/mock.js
// UPDATED MOCK PROVIDER WITH 3D POINTING DIRECTIONS

/**
 * Mock Input Provider
 * Simulates hand tracking for testing without a camera
 * Provides predictable hand data for testing interactions
 */
class MockInputProvider {
  constructor() {
    this.isInitialized = false;
    this.isTracking = false;
    this.handUpdateCallbacks = [];
    this.gestureCallbacks = [];
    this.animationFrameId = null;
    this.videoElement = null;

    // Simulated hand landmarks (23 points per hand)
    this.simulatedHands = {
      right: this.generateHandLandmarks('Right'),
      left: this.generateHandLandmarks('Left'),
    };

    // Supported gestures for simulation - now includes directional pointing
    this.gestures = [
      { name: 'point', direction: 'forward', handedness: 'Right', duration: 2000 },
      { name: 'point', direction: 'right', handedness: 'Right', duration: 2000 },
      { name: 'point', direction: 'left', handedness: 'Right', duration: 2000 },
      { name: 'point', direction: 'up', handedness: 'Right', duration: 2000 },
      { name: 'point', direction: 'down', handedness: 'Right', duration: 2000 },
      { name: 'open', handedness: 'Right', duration: 2000 },
      { name: 'grab', handedness: 'Right', duration: 2000 },
      { name: 'wave', handedness: 'Right', duration: 2000 },
    ];

    // Current gesture index for cycling through gestures
    this.currentGestureIndex = 0;
    this.lastGestureTime = 0;
  }

  /**
   * Initialize the mock provider
   * @returns {Promise} - Resolves when initialized
   */
  async initialize() {
    this.isInitialized = true;
    console.log('Mock input provider initialized');
    return Promise.resolve(true);
  }

  /**
   * Set video element (for consistency with other providers, not used)
   * @param {HTMLVideoElement} videoElement - The video element
   */
  setVideoElement(videoElement) {
    this.videoElement = videoElement;

    // Create a canvas to draw simulated hand data
    if (videoElement) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 640;
      this.canvas.height = 480;
      this.ctx = this.canvas.getContext('2d');

      // Replace video source with canvas for visualization
      this.videoElement.srcObject = this.canvas.captureStream();
    }
  }

  /**
   * Start simulating hand tracking
   * @returns {Promise} - Resolves when tracking has started
   */
  async startTracking() {
    if (!this.isInitialized) {
      throw new Error('Mock provider not initialized');
    }

    if (this.isTracking) return; // Already tracking

    this.isTracking = true;
    this.simulateTracking();
    console.log('Mock hand tracking started');
    return Promise.resolve(true);
  }

  /**
   * Stop simulating hand tracking
   * @returns {Promise} - Resolves when tracking has stopped
   */
  async stopTracking() {
    if (!this.isTracking) return;

    this.isTracking = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    console.log('Mock hand tracking stopped');
    return Promise.resolve(true);
  }

  /**
   * Register callback for hand updates
   * @param {Function} callback - Function to call with hand data
   * @returns {Function} - Function to unregister the callback
   */
  onHandUpdate(callback) {
    this.handUpdateCallbacks.push(callback);
    return () => {
      this.handUpdateCallbacks = this.handUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Register callback for gesture recognition
   * @param {Function} callback - Function to call with gesture data
   * @returns {Function} - Function to unregister the callback
   */
  onGestureDetected(callback) {
    this.gestureCallbacks.push(callback);
    return () => {
      this.gestureCallbacks = this.gestureCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Simulate hand tracking and generate updates
   */
  simulateTracking() {
    if (!this.isTracking) return;

    // Update hand positions based on time
    this.updateHandPositions();

    // Generate fake results similar to MediaPipe structure
    const results = {
      multiHandLandmarks: [this.simulatedHands.right],
      multiHandedness: [{ label: 'Right', score: 0.95 }]
    };

    // Notify all hand update callbacks
    if (this.handUpdateCallbacks.length > 0) {
      this.handUpdateCallbacks.forEach(callback => callback(results));
    }

    // Simulate gesture detection
    this.simulateGestures(results);

    // Draw visualization if video element exists
    if (this.ctx) {
      this.drawVisualization(results);
    }

    // Continue simulation loop
    this.animationFrameId = requestAnimationFrame(() => this.simulateTracking());
  }

  /**
   * Update hand landmark positions to simulate movement
   */
  updateHandPositions() {
    const now = Date.now();
    const time = now / 1000; // time in seconds

    // Move the hands in a circular pattern
    const radius = 0.1;
    const centerX = 0.5;
    const centerY = 0.5;

    // Different animation for each hand
    this.simulatedHands.right.forEach(point => {
      // Add a circular motion to the hand
      point.x = centerX + radius * Math.cos(time);
      point.y = centerY + radius * Math.sin(time);

      // Add some noise to make it more realistic
      point.x += (Math.random() - 0.5) * 0.01;
      point.y += (Math.random() - 0.5) * 0.01;
    });

    // Simulate different finger positions based on current gesture
    const currentGesture = this.gestures[this.currentGestureIndex];

    // Check if it's time to switch to the next gesture
    if (now - this.lastGestureTime > currentGesture.duration) {
      this.currentGestureIndex = (this.currentGestureIndex + 1) % this.gestures.length;
      this.lastGestureTime = now;

      // Notify about the gesture change
      if (this.gestureCallbacks.length > 0) {
        const newGesture = this.gestures[this.currentGestureIndex];
        this.gestureCallbacks.forEach(callback => {
          // For point gestures, include direction
          if (newGesture.name === 'point') {
            callback(
              { name: newGesture.name, direction: newGesture.direction, confidence: 0.9 },
              newGesture.handedness,
              this.simulatedHands[newGesture.handedness.toLowerCase()]
            );
          } else {
            callback(
              { name: newGesture.name, confidence: 0.9 },
              newGesture.handedness,
              this.simulatedHands[newGesture.handedness.toLowerCase()]
            );
          }
        });
      }
    }

    // Adjust finger positions based on current gesture
    this.updateFingerPositions(this.simulatedHands.right, currentGesture);
  }

  /**
   * Update finger positions to simulate specific gestures
   * @param {Array} landmarks - Hand landmarks to update
   * @param {Object} gesture - Gesture info to simulate
   */
  updateFingerPositions(landmarks, gesture) {
    // Finger indices:
    // Thumb: 1-4
    // Index: 5-8
    // Middle: 9-12
    // Ring: 13-16
    // Pinky: 17-20

    const wrist = landmarks[0];

    switch (gesture.name) {
      case 'point': {
        // Extend index finger, curl others
        this.extendFinger(landmarks, 1, wrist, gesture.direction);
        this.curlFinger(landmarks, 2, wrist);
        this.curlFinger(landmarks, 3, wrist);
        this.curlFinger(landmarks, 4, wrist);

        // If pointing forward/backward, adjust z coordinates
        if (gesture.direction === 'forward' || gesture.direction === 'backward') {
          // Get index finger joints
          const indexMcp = landmarks[5]; // Base of index finger
          const indexPip = landmarks[6]; // First joint of index finger
          const indexDip = landmarks[7]; // Second joint of index finger
          const indexTip = landmarks[8]; // Tip of index finger

          // Direction factor (negative for forward, positive for backward)
          const dirFactor = gesture.direction === 'forward' ? -0.2 : 0.2;

          // Adjust z values to create pointing toward/away from screen
          indexMcp.z = wrist.z + dirFactor * 0.2;
          indexPip.z = wrist.z + dirFactor * 0.4;
          indexDip.z = wrist.z + dirFactor * 0.6;
          indexTip.z = wrist.z + dirFactor * 0.8;
        }
        break;
      }

      case 'open':
        // All fingers extended
        this.extendFinger(landmarks, 1, wrist, 'up');
        this.extendFinger(landmarks, 2, wrist, 'up');
        this.extendFinger(landmarks, 3, wrist, 'up');
        this.extendFinger(landmarks, 4, wrist, 'up');
        break;

      case 'grab':
        // All fingers curled
        this.curlFinger(landmarks, 1, wrist);
        this.curlFinger(landmarks, 2, wrist);
        this.curlFinger(landmarks, 3, wrist);
        this.curlFinger(landmarks, 4, wrist);
        break;

      case 'wave':
        // Similar to open hand but with more side-to-side movement
        this.extendFinger(landmarks, 1, wrist, 'up');
        this.extendFinger(landmarks, 2, wrist, 'up');
        this.extendFinger(landmarks, 3, wrist, 'up');
        this.extendFinger(landmarks, 4, wrist, 'up');

        // Add side-to-side motion
        const time = Date.now() / 200;
        const sideOffset = Math.sin(time) * 0.1;
        landmarks.forEach(point => {
          point.x += sideOffset;
        });
        break;
    }
  }

  /**
   * Extend a finger in the simulated hand in a specific direction
   * @param {Array} landmarks - Hand landmarks
   * @param {Number} fingerIndex - Index of the finger (1=index, 2=middle, 3=ring, 4=pinky)
   * @param {Object} wrist - Wrist landmark
   * @param {String} direction - Direction to point (up, down, left, right, forward, backward)
   */
  extendFinger(landmarks, fingerIndex, wrist, direction = 'up') {
    // Base of the finger
    const mcpIndex = fingerIndex * 4 + 1;
    // Joints
    const pipIndex = fingerIndex * 4 + 2;
    const dipIndex = fingerIndex * 4 + 3;
    // Tip of the finger
    const tipIndex = fingerIndex * 4 + 4;

    // Default is to point upward
    let angleX = 0;
    let angleY = Math.PI * 0.5; // Point up

    // Adjust angles based on direction
    switch (direction) {
      case 'right':
        angleX = 0;
        angleY = 0; // Point right
        break;
      case 'left':
        angleX = 0;
        angleY = Math.PI; // Point left
        break;
      case 'down':
        angleX = 0;
        angleY = -Math.PI * 0.5; // Point down
        break;
      case 'up':
      default:
        // Default is already up
        break;
    }

    // Direction factor for finger spread
    const direction2 = fingerIndex - 2.5; // Spread fingers apart
    const fingerAngle = Math.PI * (0.5 + direction2 * 0.1); // Angle between fingers

    // Calculate lengths for joints
    const mcpLength = 0.05;
    const pipLength = 0.03;
    const dipLength = 0.02;
    const tipLength = 0.02;

    // If we're pointing up or down, spread fingers apart horizontally
    // If pointing left or right, spread fingers apart vertically
    if (direction === 'up' || direction === 'down') {
      // Set joint positions to create extended finger with horizontal spread
      landmarks[mcpIndex].x = wrist.x + Math.cos(fingerAngle) * mcpLength;
      landmarks[mcpIndex].y = wrist.y - Math.sin(angleY) * mcpLength;

      landmarks[pipIndex].x = landmarks[mcpIndex].x + Math.cos(fingerAngle) * pipLength * 0.3;
      landmarks[pipIndex].y = landmarks[mcpIndex].y - Math.sin(angleY) * pipLength;

      landmarks[dipIndex].x = landmarks[pipIndex].x + Math.cos(fingerAngle) * dipLength * 0.2;
      landmarks[dipIndex].y = landmarks[pipIndex].y - Math.sin(angleY) * dipLength;

      landmarks[tipIndex].x = landmarks[dipIndex].x + Math.cos(fingerAngle) * tipLength * 0.1;
      landmarks[tipIndex].y = landmarks[dipIndex].y - Math.sin(angleY) * tipLength;
    } else {
      // Set joint positions for left/right pointing with vertical spread
      landmarks[mcpIndex].x = wrist.x + Math.cos(angleY) * mcpLength;
      landmarks[mcpIndex].y = wrist.y + Math.sin(fingerAngle) * mcpLength * 0.3;

      landmarks[pipIndex].x = landmarks[mcpIndex].x + Math.cos(angleY) * pipLength;
      landmarks[pipIndex].y = landmarks[mcpIndex].y + Math.sin(fingerAngle) * pipLength * 0.2;

      landmarks[dipIndex].x = landmarks[pipIndex].x + Math.cos(angleY) * dipLength;
      landmarks[dipIndex].y = landmarks[pipIndex].y + Math.sin(fingerAngle) * dipLength * 0.1;

      landmarks[tipIndex].x = landmarks[dipIndex].x + Math.cos(angleY) * tipLength;
      landmarks[tipIndex].y = landmarks[dipIndex].y + Math.sin(fingerAngle) * tipLength * 0.05;
    }

    // Forward/backward is handled separately in updateFingerPositions by adjusting z values
  }

  /**
   * Curl a finger in the simulated hand
   * @param {Array} landmarks - Hand landmarks
   * @param {Number} fingerIndex - Index of the finger (1=index, 2=middle, 3=ring, 4=pinky)
   * @param {Object} wrist - Wrist landmark
   */
  curlFinger(landmarks, fingerIndex, wrist) {
    // Base of the finger
    const mcpIndex = fingerIndex * 4 + 1;
    // Joints
    const pipIndex = fingerIndex * 4 + 2;
    const dipIndex = fingerIndex * 4 + 3;
    // Tip of the finger
    const tipIndex = fingerIndex * 4 + 4;

    // Position finger joints to create a curled finger
    const direction = fingerIndex - 2.5; // Spread fingers apart
    const angle = Math.PI * (0.5 + direction * 0.1); // Angle from wrist

    // Set joint positions with a curve toward palm
    landmarks[mcpIndex].x = wrist.x + Math.cos(angle) * 0.03;
    landmarks[mcpIndex].y = wrist.y - Math.sin(angle) * 0.03;

    // PIP joint bends inward
    landmarks[pipIndex].x = landmarks[mcpIndex].x + Math.cos(angle) * 0.02;
    landmarks[pipIndex].y = landmarks[mcpIndex].y - Math.sin(angle) * 0.02;

    // DIP joint curls further
    landmarks[dipIndex].x = landmarks[pipIndex].x + Math.cos(angle + 0.3) * 0.015;
    landmarks[dipIndex].y = landmarks[pipIndex].y - Math.sin(angle - 0.3) * 0.015;

    // Tip bends all the way toward palm
    landmarks[tipIndex].x = landmarks[dipIndex].x + Math.cos(angle + 0.6) * 0.01;
    landmarks[tipIndex].y = landmarks[dipIndex].y - Math.sin(angle - 0.6) * 0.01;
  }

  /**
   * Draw visualization of the hand landmarks on canvas
   * @param {Object} results - Hand tracking results
   */
  drawVisualization(results) {
    if (!this.ctx) return;

    const { width, height } = this.canvas;

    // Clear canvas
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(0, 0, width, height);

    // Draw a placeholder rectangle
    this.ctx.fillStyle = '#555';
    this.ctx.fillRect(width * 0.1, height * 0.1, width * 0.8, height * 0.8);

    // Get current gesture
    const currentGesture = this.gestures[this.currentGestureIndex];

    // Draw text showing current gesture with direction for pointing
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px Arial';

    if (currentGesture.name === 'point') {
      this.ctx.fillText(`Mock Hand: ${currentGesture.name} ${currentGesture.direction}`, 20, 30);
    } else {
      this.ctx.fillText(`Mock Hand: ${currentGesture.name}`, 20, 30);
    }

    // Draw hand landmarks if available
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      results.multiHandLandmarks.forEach(landmarks => {
        // Draw hand connections
        this.drawHandConnections(landmarks, width, height);

        // Draw landmarks
        landmarks.forEach(landmark => {
          this.ctx.fillStyle = '#00ff00';
          this.ctx.beginPath();
          this.ctx.arc(
            landmark.x * width,
            landmark.y * height,
            5,
            0,
            2 * Math.PI
          );
          this.ctx.fill();
        });
      });
    }
  }

  /**
   * Draw connections between hand landmarks to visualize hand structure
   * @param {Array} landmarks - Hand landmarks
   * @param {Number} width - Canvas width
   * @param {Number} height - Canvas height
   */
  drawHandConnections(landmarks, width, height) {
    if (!landmarks || landmarks.length < 21) return;

    // Define hand connections (pairs of landmark indices that should be connected)
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

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;

    connections.forEach(([i, j]) => {
      this.ctx.beginPath();
      this.ctx.moveTo(
        landmarks[i].x * width,
        landmarks[i].y * height
      );
      this.ctx.lineTo(
        landmarks[j].x * width,
        landmarks[j].y * height
      );
      this.ctx.stroke();
    });
  }

  /**
   * Generate initial hand landmarks
   * @param {String} handedness - 'Left' or 'Right'
   * @returns {Array} - Array of 21 landmarks
   */
  generateHandLandmarks(handedness) {
    // Create 21 landmarks for a hand
    const landmarks = [];

    // Basic hand shape centered in the frame
    const centerX = 0.5;
    const centerY = 0.5;

    // Wrist position (landmark 0)
    landmarks.push({ x: centerX, y: centerY + 0.1, z: 0 });

    // Generate thumb landmarks (1-4)
    for (let i = 0; i < 4; i++) {
      landmarks.push({
        x: centerX - 0.05 + (i * 0.01),
        y: centerY + 0.08 - (i * 0.02),
        z: 0
      });
    }

    // Generate finger landmarks (each finger has 4 landmarks)
    for (let finger = 0; finger < 4; finger++) {
      const angle = Math.PI / 2 - (finger - 1.5) * 0.2; // Spread fingers
      const startX = centerX + (finger - 1.5) * 0.02;

      for (let joint = 0; joint < 4; joint++) {
        landmarks.push({
          x: startX,
          y: centerY + 0.05 - (joint * 0.025),
          z: 0
        });
      }
    }

    return landmarks;
  }

  /**
   * Simulate specific gestures for testing
   * @param {Object} results - Hand tracking results
   */
  simulateGestures(results) {
    // Already handled in updateHandPositions
  }
}

export default MockInputProvider;
