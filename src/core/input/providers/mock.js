// src/core/input/providers/mock.js
// ENHANCED VERSION WITH DIAGONAL DIRECTIONS AND PINCH GESTURE

/**
 * Mock Provider
 * Simulates MediaPipe hand tracking for testing without a camera
 */
class MockProvider {
  constructor() {
    this.isInitialized = false;
    this.isTracking = false;
    this.handUpdateCallbacks = [];
    this.gestureCallbacks = [];

    // For gesture detection
    this.lastGesture = {};
    this.lastGestureTime = {};
    this.gestureConfidence = {};

    // For wave detection
    this.wavePositions = {};
    this.waveDirectionChanges = {};
    this.waveStartTime = {};
    this.waveLastDirection = {};

    // For pinch detection
    this.lastPinchDistance = {};
    this.isPinching = {};
    this.pinchStartTime = {};

    // For swipe detection
    this.swipePositions = {};
    this.swipeStartTime = {};
    this.swipeLastPosition = {};
    this.swipeVelocity = {};
    this.lastSwipeTime = {};

    // Animation frame request
    this.animationFrameId = null;

    // Current simulated gesture
    this.currentGesture = 'point';
    this.currentDirection = 'up';
    this.gestureCycleInterval = null;
    this.gestureChangeTime = Date.now();

    // Debug mode - set to true to enable console logging
    this.debugMode = false;
  }

  /**
   * Initialize the mock provider
   * @returns {Promise} - Resolves when initialized
   */
  async initialize() {
    try {
      this.isInitialized = true;
      console.log('Mock hand tracking provider initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize mock provider:', error);
      throw error;
    }
  }

  /**
   * Set video element (not used in mock provider but kept for API compatibility)
   * @param {HTMLVideoElement} videoElement - The video element
   */
  setVideoElement(videoElement) {
    // Not used in mock provider, but kept for API compatibility
  }

  /**
   * Start tracking hand movements
   * @returns {Promise} - Resolves when tracking has started
   */
  async startTracking() {
    if (!this.isInitialized) {
      throw new Error('Mock provider not initialized');
    }

    if (this.isTracking) {
      return; // Already tracking
    }

    try {
      this.isTracking = true;

      // Reset gesture detection state
      this.lastGesture = {};
      this.lastGestureTime = {};
      this.gestureConfidence = {};
      this.wavePositions = {};
      this.waveDirectionChanges = {};
      this.waveStartTime = {};
      this.waveLastDirection = {};
      this.lastPinchDistance = {};
      this.isPinching = {};
      this.pinchStartTime = {};
      this.swipePositions = {};
      this.swipeStartTime = {};
      this.swipeLastPosition = {};
      this.swipeVelocity = {};
      this.lastSwipeTime = {};

      // Start animation loop to simulate hand movements
      this.startAnimationLoop();

      // Set up gesture cycling
      this.startGestureCycling();

      console.log('Mock hand tracking started');
      return true;
    } catch (error) {
      console.error('Failed to start mock hand tracking:', error);
      this.isTracking = false;
      throw error;
    }
  }

  /**
   * Stop tracking hand movements
   * @returns {Promise} - Resolves when tracking has stopped
   */
  async stopTracking() {
    if (!this.isTracking) return;

    try {
      this.isTracking = false;

      // Stop animation loop
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      // Stop gesture cycling
      if (this.gestureCycleInterval) {
        clearInterval(this.gestureCycleInterval);
        this.gestureCycleInterval = null;
      }

      // Reset gesture detection state
      this.lastGesture = {};
      this.lastGestureTime = {};
      this.gestureConfidence = {};
      this.wavePositions = {};
      this.waveDirectionChanges = {};
      this.waveStartTime = {};
      this.waveLastDirection = {};
      this.lastPinchDistance = {};
      this.isPinching = {};
      this.pinchStartTime = {};
      this.swipePositions = {};
      this.swipeStartTime = {};
      this.swipeLastPosition = {};
      this.swipeVelocity = {};
      this.lastSwipeTime = {};

      console.log('Mock hand tracking stopped');
      return true;
    } catch (error) {
      console.error('Error stopping mock hand tracking:', error);
      throw error;
    }
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
   * Start animation loop to simulate hand movements
   */
  startAnimationLoop() {
    const animateFrame = () => {
      if (!this.isTracking) return;

      // Generate simulated hand landmarks
      const landmarks = this.generateHandLandmarks();

      // Create simulated MediaPipe results
      const results = {
        multiHandLandmarks: [landmarks],
        multiHandedness: [{ label: 'Right', score: 0.95 }]
      };

      // Notify hand update callbacks
      if (this.handUpdateCallbacks.length > 0) {
        this.handUpdateCallbacks.forEach(callback => callback(results));
      }

      // Detect and notify about gestures
      if (this.gestureCallbacks.length > 0) {
        // Generate the appropriate gesture based on current state
        let gesture = this.getSimulatedGesture(landmarks);

        // Notify gesture callbacks if gesture exists and enough time has passed
        if (gesture && Date.now() - this.gestureChangeTime > 500) {
          this.gestureCallbacks.forEach(callback => {
            callback(gesture, 'Right', landmarks);
          });
        }
      }

      // Continue animation
      this.animationFrameId = requestAnimationFrame(animateFrame);
    };

    // Start animation loop
    this.animationFrameId = requestAnimationFrame(animateFrame);
  }

  /**
   * Start cycling through different gestures
   */
  startGestureCycling() {
    // Define the gesture cycle sequence
    const gestureCycle = [
      { gesture: 'point', direction: 'up' },
      { gesture: 'point', direction: 'right' },
      { gesture: 'point', direction: 'down' },
      { gesture: 'point', direction: 'left' },
      { gesture: 'point', direction: 'forward' },
      { gesture: 'point', direction: 'backward' },
      { gesture: 'point', direction: 'top-left' },
      { gesture: 'point', direction: 'top-right' },
      { gesture: 'point', direction: 'bottom-left' },
      { gesture: 'point', direction: 'bottom-right' },
      { gesture: 'open' },
      { gesture: 'grab' },
      { gesture: 'pinch' },
      { gesture: 'wave' },
      { gesture: 'swipe', direction: 'right' },
      { gesture: 'swipe', direction: 'left' },
      { gesture: 'swipe', direction: 'up' },
      { gesture: 'swipe', direction: 'down' }
    ];

    let cycleIndex = 0;

    // Set up interval to cycle through gestures
    this.gestureCycleInterval = setInterval(() => {
      if (!this.isTracking) return;

      // Get next gesture in cycle
      const nextGesture = gestureCycle[cycleIndex];
      this.currentGesture = nextGesture.gesture;
      this.currentDirection = nextGesture.direction || null;

      // Record the time of gesture change
      this.gestureChangeTime = Date.now();

      // Move to next gesture in cycle
      cycleIndex = (cycleIndex + 1) % gestureCycle.length;

      if (this.debugMode) {
        console.log(`Changed to ${this.currentGesture} ${this.currentDirection || ''}`);
      }
    }, 3000); // Change gesture every 3 seconds
  }

  /**
   * Generate hand landmarks based on current gesture
   * @returns {Array} - Simulated hand landmarks
   */
  generateHandLandmarks() {
    // Create a basic hand shape
    const landmarks = [];

    // Wrist (landmark 0)
    landmarks.push({ x: 0.5, y: 0.8, z: 0 });

    // Add landmarks for different fingers and joints
    // 21 landmarks total (1 wrist + 4 landmarks for each of the 5 fingers)

    // Base positions for each finger
    const thumbBase = { x: 0.4, y: 0.75, z: 0 };
    const indexBase = { x: 0.45, y: 0.65, z: 0 };
    const middleBase = { x: 0.5, y: 0.65, z: 0 };
    const ringBase = { x: 0.55, y: 0.65, z: 0 };
    const pinkyBase = { x: 0.6, y: 0.65, z: 0 };

    // Modify the hand shape based on the current gesture
    switch (this.currentGesture) {
      case 'point':
        // Add thumb (4 landmarks)
        landmarks.push(
          { x: thumbBase.x, y: thumbBase.y, z: 0 },
          { x: thumbBase.x - 0.03, y: thumbBase.y - 0.03, z: 0 },
          { x: thumbBase.x - 0.06, y: thumbBase.y - 0.06, z: 0 },
          { x: thumbBase.x - 0.09, y: thumbBase.y - 0.09, z: 0 }
        );

        // Add index finger (4 landmarks) - extended based on direction
        this.addPointingFinger(landmarks, indexBase, this.currentDirection);

        // Add middle finger (4 landmarks) - curled
        landmarks.push(
          { x: middleBase.x, y: middleBase.y, z: 0 },
          { x: middleBase.x, y: middleBase.y + 0.05, z: 0 },
          { x: middleBase.x, y: middleBase.y + 0.08, z: 0 },
          { x: middleBase.x, y: middleBase.y + 0.1, z: 0 }
        );

        // Add ring finger (4 landmarks) - curled
        landmarks.push(
          { x: ringBase.x, y: ringBase.y, z: 0 },
          { x: ringBase.x, y: ringBase.y + 0.05, z: 0 },
          { x: ringBase.x, y: ringBase.y + 0.08, z: 0 },
          { x: ringBase.x, y: ringBase.y + 0.1, z: 0 }
        );

        // Add pinky finger (4 landmarks) - curled
        landmarks.push(
          { x: pinkyBase.x, y: pinkyBase.y, z: 0 },
          { x: pinkyBase.x, y: pinkyBase.y + 0.05, z: 0 },
          { x: pinkyBase.x, y: pinkyBase.y + 0.08, z: 0 },
          { x: pinkyBase.x, y: pinkyBase.y + 0.1, z: 0 }
        );
        break;

      case 'open':
        // Add thumb (4 landmarks) - extended
        landmarks.push(
          { x: thumbBase.x, y: thumbBase.y, z: 0 },
          { x: thumbBase.x - 0.05, y: thumbBase.y - 0.05, z: 0 },
          { x: thumbBase.x - 0.1, y: thumbBase.y - 0.05, z: 0 },
          { x: thumbBase.x - 0.15, y: thumbBase.y - 0.05, z: 0 }
        );

        // Add index finger (4 landmarks) - extended
        landmarks.push(
          { x: indexBase.x, y: indexBase.y, z: 0 },
          { x: indexBase.x, y: indexBase.y - 0.1, z: 0 },
          { x: indexBase.x, y: indexBase.y - 0.2, z: 0 },
          { x: indexBase.x, y: indexBase.y - 0.3, z: 0 }
        );

        // Add middle finger (4 landmarks) - extended
        landmarks.push(
          { x: middleBase.x, y: middleBase.y, z: 0 },
          { x: middleBase.x, y: middleBase.y - 0.1, z: 0 },
          { x: middleBase.x, y: middleBase.y - 0.2, z: 0 },
          { x: middleBase.x, y: middleBase.y - 0.3, z: 0 }
        );

        // Add ring finger (4 landmarks) - extended
        landmarks.push(
          { x: ringBase.x, y: ringBase.y, z: 0 },
          { x: ringBase.x, y: ringBase.y - 0.1, z: 0 },
          { x: ringBase.x, y: ringBase.y - 0.2, z: 0 },
          { x: ringBase.x, y: ringBase.y - 0.3, z: 0 }
        );

        // Add pinky finger (4 landmarks) - extended
        landmarks.push(
          { x: pinkyBase.x, y: pinkyBase.y, z: 0 },
          { x: pinkyBase.x, y: pinkyBase.y - 0.1, z: 0 },
          { x: pinkyBase.x, y: pinkyBase.y - 0.2, z: 0 },
          { x: pinkyBase.x, y: pinkyBase.y - 0.3, z: 0 }
        );
        break;

      case 'grab':
        // All fingers curled
        // Add thumb (4 landmarks) - curled
        landmarks.push(
          { x: thumbBase.x, y: thumbBase.y, z: 0 },
          { x: thumbBase.x + 0.03, y: thumbBase.y, z: 0 },
          { x: thumbBase.x + 0.06, y: thumbBase.y + 0.02, z: 0 },
          { x: thumbBase.x + 0.08, y: thumbBase.y + 0.05, z: 0 }
        );

        // Add index finger (4 landmarks) - curled
        landmarks.push(
          { x: indexBase.x, y: indexBase.y, z: 0 },
          { x: indexBase.x, y: indexBase.y + 0.05, z: 0 },
          { x: indexBase.x, y: indexBase.y + 0.1, z: 0 },
          { x: indexBase.x, y: indexBase.y + 0.12, z: 0 }
        );

        // Add middle finger (4 landmarks) - curled
        landmarks.push(
          { x: middleBase.x, y: middleBase.y, z: 0 },
          { x: middleBase.x, y: middleBase.y + 0.05, z: 0 },
          { x: middleBase.x, y: middleBase.y + 0.1, z: 0 },
          { x: middleBase.x, y: middleBase.y + 0.12, z: 0 }
        );

        // Add ring finger (4 landmarks) - curled
        landmarks.push(
          { x: ringBase.x, y: ringBase.y, z: 0 },
          { x: ringBase.x, y: ringBase.y + 0.05, z: 0 },
          { x: ringBase.x, y: ringBase.y + 0.1, z: 0 },
          { x: ringBase.x, y: ringBase.y + 0.12, z: 0 }
        );

        // Add pinky finger (4 landmarks) - curled
        landmarks.push(
          { x: pinkyBase.x, y: pinkyBase.y, z: 0 },
          { x: pinkyBase.x, y: pinkyBase.y + 0.05, z: 0 },
          { x: pinkyBase.x, y: pinkyBase.y + 0.1, z: 0 },
          { x: pinkyBase.x, y: pinkyBase.y + 0.12, z: 0 }
        );
        break;

      case 'pinch':
        // Add thumb (4 landmarks) - pointing toward index
        landmarks.push(
          { x: thumbBase.x, y: thumbBase.y, z: 0 },
          { x: thumbBase.x + 0.02, y: thumbBase.y - 0.05, z: 0 },
          { x: thumbBase.x + 0.04, y: thumbBase.y - 0.1, z: 0 },
          { x: indexBase.x, y: indexBase.y - 0.15, z: 0 } // Thumb tip meets index tip
        );

        // Add index finger (4 landmarks) - pointing toward thumb
        landmarks.push(
          { x: indexBase.x, y: indexBase.y, z: 0 },
          { x: indexBase.x, y: indexBase.y - 0.05, z: 0 },
          { x: indexBase.x, y: indexBase.y - 0.1, z: 0 },
          { x: indexBase.x, y: indexBase.y - 0.15, z: 0 } // Index tip meets thumb tip
        );

        // Add middle finger (4 landmarks) - extended
        landmarks.push(
          { x: middleBase.x, y: middleBase.y, z: 0 },
          { x: middleBase.x, y: middleBase.y - 0.1, z: 0 },
          { x: middleBase.x, y: middleBase.y - 0.2, z: 0 },
          { x: middleBase.x, y: middleBase.y - 0.3, z: 0 }
        );

        // Add ring finger (4 landmarks) - extended
        landmarks.push(
          { x: ringBase.x, y: ringBase.y, z: 0 },
          { x: ringBase.x, y: ringBase.y - 0.1, z: 0 },
          { x: ringBase.x, y: ringBase.y - 0.2, z: 0 },
          { x: ringBase.x, y: ringBase.y - 0.3, z: 0 }
        );

        // Add pinky finger (4 landmarks) - extended
        landmarks.push(
          { x: pinkyBase.x, y: pinkyBase.y, z: 0 },
          { x: pinkyBase.x, y: pinkyBase.y - 0.1, z: 0 },
          { x: pinkyBase.x, y: pinkyBase.y - 0.2, z: 0 },
          { x: pinkyBase.x, y: pinkyBase.y - 0.3, z: 0 }
        );
        break;

      case 'wave':
        // Similar to open hand but with slight offset for animation
        // Add sine wave movement to simulate waving
        const waveOffset = Math.sin(Date.now() / 150) * 0.1;

        // Add thumb (4 landmarks)
        landmarks.push(
          { x: thumbBase.x + waveOffset, y: thumbBase.y, z: 0 },
          { x: thumbBase.x - 0.05 + waveOffset, y: thumbBase.y - 0.05, z: 0 },
          { x: thumbBase.x - 0.1 + waveOffset, y: thumbBase.y - 0.05, z: 0 },
          { x: thumbBase.x - 0.15 + waveOffset, y: thumbBase.y - 0.05, z: 0 }
        );

        // Add index finger (4 landmarks)
        landmarks.push(
          { x: indexBase.x + waveOffset, y: indexBase.y, z: 0 },
          { x: indexBase.x + waveOffset, y: indexBase.y - 0.1, z: 0 },
          { x: indexBase.x + waveOffset, y: indexBase.y - 0.2, z: 0 },
          { x: indexBase.x + waveOffset, y: indexBase.y - 0.3, z: 0 }
        );

        // Add middle finger (4 landmarks)
        landmarks.push(
          { x: middleBase.x + waveOffset, y: middleBase.y, z: 0 },
          { x: middleBase.x + waveOffset, y: middleBase.y - 0.1, z: 0 },
          { x: middleBase.x + waveOffset, y: middleBase.y - 0.2, z: 0 },
          { x: middleBase.x + waveOffset, y: middleBase.y - 0.3, z: 0 }
        );

        // Add ring finger (4 landmarks)
        landmarks.push(
          { x: ringBase.x + waveOffset, y: ringBase.y, z: 0 },
          { x: ringBase.x + waveOffset, y: ringBase.y - 0.1, z: 0 },
          { x: ringBase.x + waveOffset, y: ringBase.y - 0.2, z: 0 },
          { x: ringBase.x + waveOffset, y: ringBase.y - 0.3, z: 0 }
        );

        // Add pinky finger (4 landmarks)
        landmarks.push(
          { x: pinkyBase.x + waveOffset, y: pinkyBase.y, z: 0 },
          { x: pinkyBase.x + waveOffset, y: pinkyBase.y - 0.1, z: 0 },
          { x: pinkyBase.x + waveOffset, y: pinkyBase.y - 0.2, z: 0 },
          { x: pinkyBase.x + waveOffset, y: pinkyBase.y - 0.3, z: 0 }
        );
        break;

      case 'swipe':
        // Similar to open hand but with movement in specified direction
        const swipeProgress = (Date.now() % 1000) / 1000; // 0 to 1 over 1 second
        let swipeOffsetX = 0;
        let swipeOffsetY = 0;

        // Set offset based on direction
        if (this.currentDirection === 'right') {
          swipeOffsetX = swipeProgress * 0.3;
        } else if (this.currentDirection === 'left') {
          swipeOffsetX = -swipeProgress * 0.3;
        } else if (this.currentDirection === 'up') {
          swipeOffsetY = -swipeProgress * 0.3;
        } else if (this.currentDirection === 'down') {
          swipeOffsetY = swipeProgress * 0.3;
        }

        // Add thumb (4 landmarks)
        landmarks.push(
          { x: thumbBase.x + swipeOffsetX, y: thumbBase.y + swipeOffsetY, z: 0 },
          { x: thumbBase.x - 0.05 + swipeOffsetX, y: thumbBase.y - 0.05 + swipeOffsetY, z: 0 },
          { x: thumbBase.x - 0.1 + swipeOffsetX, y: thumbBase.y - 0.05 + swipeOffsetY, z: 0 },
          { x: thumbBase.x - 0.15 + swipeOffsetX, y: thumbBase.y - 0.05 + swipeOffsetY, z: 0 }
        );

        // Add index finger (4 landmarks)
        landmarks.push(
          { x: indexBase.x + swipeOffsetX, y: indexBase.y + swipeOffsetY, z: 0 },
          { x: indexBase.x + swipeOffsetX, y: indexBase.y - 0.1 + swipeOffsetY, z: 0 },
          { x: indexBase.x + swipeOffsetX, y: indexBase.y - 0.2 + swipeOffsetY, z: 0 },
          { x: indexBase.x + swipeOffsetX, y: indexBase.y - 0.3 + swipeOffsetY, z: 0 }
        );

        // Add middle finger (4 landmarks)
        landmarks.push(
          { x: middleBase.x + swipeOffsetX, y: middleBase.y + swipeOffsetY, z: 0 },
          { x: middleBase.x + swipeOffsetX, y: middleBase.y - 0.1 + swipeOffsetY, z: 0 },
          { x: middleBase.x + swipeOffsetX, y: middleBase.y - 0.2 + swipeOffsetY, z: 0 },
          { x: middleBase.x + swipeOffsetX, y: middleBase.y - 0.3 + swipeOffsetY, z: 0 }
        );

        // Add ring finger (4 landmarks)
        landmarks.push(
          { x: ringBase.x + swipeOffsetX, y: ringBase.y + swipeOffsetY, z: 0 },
          { x: ringBase.x + swipeOffsetX, y: ringBase.y - 0.1 + swipeOffsetY, z: 0 },
          { x: ringBase.x + swipeOffsetX, y: ringBase.y - 0.2 + swipeOffsetY, z: 0 },
          { x: ringBase.x + swipeOffsetX, y: ringBase.y - 0.3 + swipeOffsetY, z: 0 }
        );

        // Add pinky finger (4 landmarks)
        landmarks.push(
          { x: pinkyBase.x + swipeOffsetX, y: pinkyBase.y + swipeOffsetY, z: 0 },
          { x: pinkyBase.x + swipeOffsetX, y: pinkyBase.y - 0.1 + swipeOffsetY, z: 0 },
          { x: pinkyBase.x + swipeOffsetX, y: pinkyBase.y - 0.2 + swipeOffsetY, z: 0 },
          { x: pinkyBase.x + swipeOffsetX, y: pinkyBase.y - 0.3 + swipeOffsetY, z: 0 }
        );
        break;

      default:
        // Default to open hand
        // Add thumb (4 landmarks)
        landmarks.push(
          { x: thumbBase.x, y: thumbBase.y, z: 0 },
          { x: thumbBase.x - 0.05, y: thumbBase.y - 0.05, z: 0 },
          { x: thumbBase.x - 0.1, y: thumbBase.y - 0.05, z: 0 },
          { x: thumbBase.x - 0.15, y: thumbBase.y - 0.05, z: 0 }
        );

        // Add index finger (4 landmarks)
        landmarks.push(
          { x: indexBase.x, y: indexBase.y, z: 0 },
          { x: indexBase.x, y: indexBase.y - 0.1, z: 0 },
          { x: indexBase.x, y: indexBase.y - 0.2, z: 0 },
          { x: indexBase.x, y: indexBase.y - 0.3, z: 0 }
        );

        // Add middle finger (4 landmarks)
        landmarks.push(
          { x: middleBase.x, y: middleBase.y, z: 0 },
          { x: middleBase.x, y: middleBase.y - 0.1, z: 0 },
          { x: middleBase.x, y: middleBase.y - 0.2, z: 0 },
          { x: middleBase.x, y: middleBase.y - 0.3, z: 0 }
        );

        // Add ring finger (4 landmarks)
        landmarks.push(
          { x: ringBase.x, y: ringBase.y, z: 0 },
          { x: ringBase.x, y: ringBase.y - 0.1, z: 0 },
          { x: ringBase.x, y: ringBase.y - 0.2, z: 0 },
          { x: ringBase.x, y: ringBase.y - 0.3, z: 0 }
        );

        // Add pinky finger (4 landmarks)
        landmarks.push(
          { x: pinkyBase.x, y: pinkyBase.y, z: 0 },
          { x: pinkyBase.x, y: pinkyBase.y - 0.1, z: 0 },
          { x: pinkyBase.x, y: pinkyBase.y - 0.2, z: 0 },
          { x: pinkyBase.x, y: pinkyBase.y - 0.3, z: 0 }
        );
        break;
    }

    return landmarks;
  }

/**
   * Add a pointing finger to the landmarks array based on direction
   * @param {Array} landmarks - Array of landmarks to add to
   * @param {Object} base - Base position of the finger
   * @param {String} direction - Direction to point
   */
addPointingFinger(landmarks, base, direction) {
  switch (direction) {
    case 'up':
      landmarks.push(
        { x: base.x, y: base.y, z: 0 },
        { x: base.x, y: base.y - 0.1, z: 0 },
        { x: base.x, y: base.y - 0.2, z: 0 },
        { x: base.x, y: base.y - 0.3, z: 0 }
      );
      break;
    case 'down':
      landmarks.push(
        { x: base.x, y: base.y, z: 0 },
        { x: base.x, y: base.y + 0.1, z: 0 },
        { x: base.x, y: base.y + 0.2, z: 0 },
        { x: base.x, y: base.y + 0.3, z: 0 }
      );
      break;
    case 'left':
      landmarks.push(
        { x: base.x, y: base.y, z: 0 },
        { x: base.x - 0.1, y: base.y, z: 0 },
        { x: base.x - 0.2, y: base.y, z: 0 },
        { x: base.x - 0.3, y: base.y, z: 0 }
      );
      break;
    case 'right':
      landmarks.push(
        { x: base.x, y: base.y, z: 0 },
        { x: base.x + 0.1, y: base.y, z: 0 },
        { x: base.x + 0.2, y: base.y, z: 0 },
        { x: base.x + 0.3, y: base.y, z: 0 }
      );
      break;
    case 'forward':
      landmarks.push(
        { x: base.x, y: base.y, z: 0 },
        { x: base.x, y: base.y - 0.1, z: -0.1 },
        { x: base.x, y: base.y - 0.15, z: -0.2 },
        { x: base.x, y: base.y - 0.2, z: -0.3 }
      );
      break;
    case 'backward':
      landmarks.push(
        { x: base.x, y: base.y, z: 0 },
        { x: base.x, y: base.y - 0.1, z: 0.1 },
        { x: base.x, y: base.y - 0.15, z: 0.2 },
        { x: base.x, y: base.y - 0.2, z: 0.3 }
      );
      break;
    case 'top-left':
      landmarks.push(
        { x: base.x, y: base.y, z: 0 },
        { x: base.x - 0.1, y: base.y - 0.1, z: 0 },
        { x: base.x - 0.2, y: base.y - 0.2, z: 0 },
        { x: base.x - 0.3, y: base.y - 0.3, z: 0 }
      );
      break;
    case 'top-right':
      landmarks.push(
        { x: base.x, y: base.y, z: 0 },
        { x: base.x + 0.1, y: base.y - 0.1, z: 0 },
        { x: base.x + 0.2, y: base.y - 0.2, z: 0 },
        { x: base.x + 0.3, y: base.y - 0.3, z: 0 }
      );
      break;
    case 'bottom-left':
      landmarks.push(
        { x: base.x, y: base.y, z: 0 },
        { x: base.x - 0.1, y: base.y + 0.1, z: 0 },
        { x: base.x - 0.2, y: base.y + 0.2, z: 0 },
        { x: base.x - 0.3, y: base.y + 0.3, z: 0 }
      );
      break;
    case 'bottom-right':
      landmarks.push(
        { x: base.x, y: base.y, z: 0 },
        { x: base.x + 0.1, y: base.y + 0.1, z: 0 },
        { x: base.x + 0.2, y: base.y + 0.2, z: 0 },
        { x: base.x + 0.3, y: base.y + 0.3, z: 0 }
      );
      break;
    default:
      // Default to pointing up
      landmarks.push(
        { x: base.x, y: base.y, z: 0 },
        { x: base.x, y: base.y - 0.1, z: 0 },
        { x: base.x, y: base.y - 0.2, z: 0 },
        { x: base.x, y: base.y - 0.3, z: 0 }
      );
      break;
  }
}

/**
 * Get simulated gesture based on current state
 * @param {Array} landmarks - Hand landmarks
 * @returns {Object|null} - Simulated gesture or null
 */
getSimulatedGesture(landmarks) {
  switch (this.currentGesture) {
    case 'point':
      return {
        name: 'point',
        direction: this.currentDirection || 'up',
        confidence: 0.9,
        vector: {
          dx: this.currentDirection === 'right' ? 0.3 : (this.currentDirection === 'left' ? -0.3 : 0),
          dy: this.currentDirection === 'down' ? 0.3 : (this.currentDirection === 'up' ? -0.3 : 0),
          dz: this.currentDirection === 'backward' ? 0.3 : (this.currentDirection === 'forward' ? -0.3 : 0)
        }
      };
    case 'open':
      return { name: 'open', confidence: 0.9 };
    case 'grab':
      return { name: 'grab', confidence: 0.9 };
    case 'pinch':
      return {
        name: 'pinch',
        strength: 0.9,
        duration: 500, // Simulated duration
        confidence: 0.9
      };
    case 'wave':
      return { name: 'wave', confidence: 0.9 };
    case 'swipe':
      return {
        name: 'swipe',
        direction: this.currentDirection || 'right',
        speed: 0.8,
        confidence: 0.9
      };
    default:
      return null;
  }
}
}

export default MockProvider;
