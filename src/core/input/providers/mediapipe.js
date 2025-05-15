// src/core/input/providers/mediapipe.js
// ENHANCED VERSION WITH DIAGONAL DIRECTIONS AND PINCH GESTURE

/**
 * MediaPipe Provider
 * Uses MediaPipe Hands API to track hand landmarks and detect gestures
 */
import { Hands } from '@mediapipe/hands';

class MediaPipeProvider {
  constructor() {
    this.hands = null;
    this.videoElement = null;
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

    // Debug mode - set to true to enable console logging
    this.debugMode = false;
  }

  /**
   * Initialize the MediaPipe Hands API
   * @returns {Promise} - Resolves when initialized
   */
  async initialize() {
    try {
      this.hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      // Configure MediaPipe Hands
      await this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1, // 0: Light, 1: Full
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      // Set up result handler
      this.hands.onResults(results => this.handleResults(results));

      this.isInitialized = true;
      console.log('MediaPipe Hands initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MediaPipe Hands:', error);
      throw error;
    }
  }

  /**
   * Set video element to use for tracking
   * @param {HTMLVideoElement} videoElement - The video element
   */
  setVideoElement(videoElement) {
    this.videoElement = videoElement;
  }

  /**
   * Start tracking hand movements
   * @returns {Promise} - Resolves when tracking has started
   */
  async startTracking() {
    if (!this.isInitialized) {
      throw new Error('MediaPipe provider not initialized');
    }

    if (this.isTracking) {
      return; // Already tracking
    }

    try {
      if (!this.videoElement) {
        throw new Error('Video element not set. Call setVideoElement() first.');
      }

      // Start the camera feed
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        });

        this.videoElement.srcObject = stream;
        this.videoElement.play();

        // Wait for video to be ready
        await new Promise(resolve => {
          this.videoElement.onloadedmetadata = () => resolve();
          // If video is already loaded, resolve immediately
          if (this.videoElement.readyState >= 2) resolve();
        });

        // Create a function to process each frame
        const processFrame = async () => {
          if (!this.isTracking) return;

          await this.hands.send({ image: this.videoElement });
          requestAnimationFrame(processFrame);
        };

        this.isTracking = true;
        processFrame();

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

        console.log('MediaPipe hand tracking started');
        return true;
      } else {
        throw new Error('getUserMedia not supported in this browser');
      }
    } catch (error) {
      console.error('Failed to start hand tracking:', error);
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

      // Stop all video tracks
      if (this.videoElement && this.videoElement.srcObject) {
        const tracks = this.videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        this.videoElement.srcObject = null;
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

      console.log('MediaPipe hand tracking stopped');
      return true;
    } catch (error) {
      console.error('Error stopping hand tracking:', error);
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
   * Handle results from MediaPipe Hands
   * @param {Object} results - Results from MediaPipe Hands
   */
  handleResults(results) {
    if (!results || !results.multiHandLandmarks) return;

    const { multiHandLandmarks, multiHandedness } = results;

    // Notify all hand update callbacks
    if (this.handUpdateCallbacks.length > 0) {
      this.handUpdateCallbacks.forEach(callback => callback(results));
    }

    // Process gestures
    if (this.gestureCallbacks.length > 0 && multiHandLandmarks.length > 0) {
      multiHandLandmarks.forEach((landmarks, handIndex) => {
        const handedness = multiHandedness[handIndex].label; // 'Left' or 'Right'
        const handId = `${handedness}_${handIndex}`;

        // First detect static gestures (point, open, grab, pinch)
        const staticGesture = this.detectStaticGesture(landmarks, handedness, handId);

        // Detect wave gesture (temporal pattern)
        this.detectWaveGesture(landmarks[0], handId, handedness);

        // Detect swipe gesture (temporal pattern)
        this.detectSwipeGesture(landmarks[0], handId, handedness);

        // Report static gesture if detected and different from last time
        if (staticGesture &&
            (this.lastGesture[handId] !== staticGesture.name ||
             Date.now() - this.lastGestureTime[handId] > 500)) {

          this.notifyGesture(staticGesture, handedness, landmarks);
          this.lastGesture[handId] = staticGesture.name;
          this.lastGestureTime[handId] = Date.now();
        }
      });
    }
  }

  /**
   * Notify gesture callbacks about a detected gesture
   * @param {Object} gesture - The detected gesture
   * @param {String} handedness - 'Left' or 'Right'
   * @param {Array} landmarks - Hand landmarks
   */
  notifyGesture(gesture, handedness, landmarks) {
    if (this.gestureCallbacks.length > 0) {
      this.gestureCallbacks.forEach(callback => {
        callback(gesture, handedness, landmarks);
      });
    }
  }

  /**
   * Detect back-and-forth wave gesture
   * @param {Object} wrist - Wrist landmark
   * @param {String} handId - Unique hand identifier
   * @param {String} handedness - 'Left' or 'Right'
   */
  detectWaveGesture(wrist, handId, handedness) {
    const now = Date.now();

    // Initialize wave detection state for this hand if needed
    if (!this.wavePositions[handId]) {
      this.wavePositions[handId] = [];
      this.waveDirectionChanges[handId] = 0;
      this.waveStartTime[handId] = now;
      this.waveLastDirection[handId] = null;
    }

    // Add current position to history
    this.wavePositions[handId].push({
      x: wrist.x,
      y: wrist.y,
      time: now
    });

    // Keep only recent positions (last 2 seconds)
    while (this.wavePositions[handId].length > 0 &&
           now - this.wavePositions[handId][0].time > 2000) {
      this.wavePositions[handId].shift();
    }

    // Need at least 3 positions to detect direction changes
    if (this.wavePositions[handId].length < 3) return;

    // Check if we should reset wave detection (it's been too long)
    if (now - this.waveStartTime[handId] > 3000) {
      this.waveDirectionChanges[handId] = 0;
      this.waveStartTime[handId] = now;
      this.waveLastDirection[handId] = null;
    }

    // Get the most recent positions
    const positions = this.wavePositions[handId];
    const current = positions[positions.length - 1];
    const previous = positions[positions.length - 3]; // Skip one position to reduce noise

    // Calculate horizontal movement
    const deltaX = current.x - previous.x;

    // Skip if movement is too small
    if (Math.abs(deltaX) < 0.03) return;

    // Determine direction (simplify to left/right)
    const direction = deltaX > 0 ? 'right' : 'left';

    // Check for direction change
    if (this.waveLastDirection[handId] !== null &&
        this.waveLastDirection[handId] !== direction) {

      // Increment direction change counter
      this.waveDirectionChanges[handId]++;

      // If we've detected enough direction changes in the time window, it's a wave
      if (this.waveDirectionChanges[handId] >= 2 &&
          now - this.waveStartTime[handId] < 2000) {

        // Notify about wave gesture
        this.notifyGesture({ name: 'wave', confidence: 0.9 }, handedness, null);

        // Reset wave detection after successful detection
        this.waveDirectionChanges[handId] = 0;
        this.waveStartTime[handId] = now + 1000; // Add cooldown
      }
    }

    // Update last direction
    this.waveLastDirection[handId] = direction;
  }

  /**
   * Detect swipe gestures in different directions
   * @param {Object} wrist - Wrist landmark
   * @param {String} handId - Unique hand identifier
   * @param {String} handedness - 'Left' or 'Right'
   */
  detectSwipeGesture(wrist, handId, handedness) {
    const now = Date.now();

    // Initialize swipe detection state for this hand if needed
    if (!this.swipePositions[handId]) {
      this.swipePositions[handId] = [];
      this.swipeStartTime[handId] = now;
      this.swipeLastPosition[handId] = { x: wrist.x, y: wrist.y, time: now };
      this.swipeVelocity[handId] = { x: 0, y: 0 };
      this.lastSwipeTime[handId] = 0;
    }

    // Check if enough time has passed since last swipe detection
    // to prevent multiple swipe detections for the same gesture
    if (now - this.lastSwipeTime[handId] < 1000) {
      return;
    }

    // Add current position to history
    this.swipePositions[handId].push({
      x: wrist.x,
      y: wrist.y,
      time: now
    });

    // Keep only recent positions (last 0.5 seconds)
    while (this.swipePositions[handId].length > 0 &&
           now - this.swipePositions[handId][0].time > 500) {
      this.swipePositions[handId].shift();
    }

    // Need at least 5 positions to detect a smooth swipe
    if (this.swipePositions[handId].length < 5) return;

    // Get the first and last positions for overall movement
    const positions = this.swipePositions[handId];
    const first = positions[0];
    const last = positions[positions.length - 1];

    // Calculate time difference
    const timeDiff = (last.time - first.time) / 1000; // in seconds

    // Calculate total displacement
    const deltaX = last.x - first.x;
    const deltaY = last.y - first.y;

    // Calculate velocity (units per second)
    const velocityX = deltaX / timeDiff;
    const velocityY = deltaY / timeDiff;

    // Only detect swipes with significant movement and velocity
    const SWIPE_THRESHOLD = 0.15; // Minimum displacement
    const VELOCITY_THRESHOLD = 0.5; // Minimum velocity

    // Calculate absolute values for comparisons
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const absVelocityX = Math.abs(velocityX);
    const absVelocityY = Math.abs(velocityY);

    // Check if the movement is significant enough to be a swipe
    if ((absDeltaX > SWIPE_THRESHOLD || absDeltaY > SWIPE_THRESHOLD) &&
        (absVelocityX > VELOCITY_THRESHOLD || absVelocityY > VELOCITY_THRESHOLD)) {

      // Determine swipe direction
      let swipeDirection = '';

      // Check if movement is more horizontal or vertical
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        swipeDirection = deltaX > 0 ? 'right' : 'left';
      } else {
        // Vertical swipe
        swipeDirection = deltaY > 0 ? 'down' : 'up';
      }

      // Create swipe gesture with direction and speed info
      const swipeGesture = {
        name: 'swipe',
        direction: swipeDirection,
        speed: Math.sqrt(velocityX*velocityX + velocityY*velocityY),
        confidence: 0.9
      };

      // Notify about swipe gesture
      this.notifyGesture(swipeGesture, handedness, null);

      // Update last swipe time to prevent rapid consecutive detections
      this.lastSwipeTime[handId] = now;

      // Reset swipe tracking for new detection
      this.swipePositions[handId] = [];
      this.swipeStartTime[handId] = now;
    }
  }

  /**
   * Detect static gestures (point, open, grab, pinch) with direction information
   * @param {Array} landmarks - Hand landmarks from MediaPipe
   * @param {String} handedness - 'Left' or 'Right'
   * @param {String} handId - Unique identifier for this hand
   * @returns {Object|null} - Detected gesture or null
   */
  detectStaticGesture(landmarks, handedness, handId) {
    // Enhanced finger extension detection specifically for pointing gestures
    const indexFingerExtended = this.isFingerExtendedImproved(landmarks, 1);
    const middleFingerExtended = this.isFingerExtendedImproved(landmarks, 2);
    const ringFingerExtended = this.isFingerExtendedImproved(landmarks, 3);
    const pinkyFingerExtended = this.isFingerExtendedImproved(landmarks, 4);

    // Get the wrist and important finger landmarks
    const wrist = landmarks[0];
    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];

    // PINCH gesture - thumb and index finger close together
    const thumbIndexDistance = this.distance3D(thumbTip, indexTip);

    // Initialize pinch detection state for this hand if needed
    if (this.lastPinchDistance[handId] === undefined) {
      this.lastPinchDistance[handId] = thumbIndexDistance;
      this.isPinching[handId] = false;
      this.pinchStartTime[handId] = 0;
    }

    // Pinch thresholds
    const PINCH_DISTANCE_THRESHOLD = 0.05; // How close thumb and index need to be to detect pinch
    const PINCH_STATE_CHANGE_THRESHOLD = 0.02; // How much distance needs to change to switch pinch state

    // Detect pinch gesture
    const wasPinching = this.isPinching[handId];
    const distanceDelta = this.lastPinchDistance[handId] - thumbIndexDistance;

    // Check for significant distance change to avoid flickering
    if (!wasPinching && thumbIndexDistance < PINCH_DISTANCE_THRESHOLD) {
      // Start pinching
      this.isPinching[handId] = true;
      this.pinchStartTime[handId] = Date.now();
    } else if (wasPinching && thumbIndexDistance > PINCH_DISTANCE_THRESHOLD + PINCH_STATE_CHANGE_THRESHOLD) {
      // Stop pinching when fingers move significantly apart
      this.isPinching[handId] = false;
    }

    // Update last distance
    this.lastPinchDistance[handId] = thumbIndexDistance;

    // If pinching, return pinch gesture
    if (this.isPinching[handId]) {
      const pinchDuration = Date.now() - this.pinchStartTime[handId];

      return {
        name: 'pinch',
        strength: Math.max(0, 1 - thumbIndexDistance / PINCH_DISTANCE_THRESHOLD),
        duration: pinchDuration,
        confidence: 0.9
      };
    }

    // POINT gesture - only index finger extended
    if (indexFingerExtended &&
        !middleFingerExtended &&
        !ringFingerExtended &&
        !pinkyFingerExtended) {

      // Calculate pointing direction (relative to wrist)
      const dx = indexTip.x - wrist.x;
      const dy = indexTip.y - wrist.y;
      const dz = indexTip.z - wrist.z;

      // Log coordinates for debugging if enabled
      if (this.debugMode) {
        console.log(`Point vector: dx=${dx.toFixed(3)}, dy=${dy.toFixed(3)}, dz=${dz.toFixed(3)}`);
      }

      // Calculate magnitudes in different planes
      const horizontalMag = Math.abs(dx);
      const verticalMag = Math.abs(dy);
      const depthMag = Math.abs(dz);

      // For pointing direction detection
      let pointingDirection = null;

      // Forward detection is most important - reduce threshold to make it easier to detect
      // For improved forward detection, check if z-component is significant
      if (depthMag > 0.05 && depthMag > horizontalMag * 0.5 && depthMag > verticalMag * 0.5) {
        // Pointing toward or away from the camera
        pointingDirection = dz < 0 ? 'forward' : 'backward';

        if (this.debugMode) {
          console.log(`Detected ${pointingDirection} pointing with z=${dz.toFixed(3)}`);
        }
      }
      // If not pointing forward/backward, check for diagonal directions
      else {
        // Determine if movement is more horizontal, vertical, or diagonal
        const isSignificantHorizontal = horizontalMag > 0.03;
        const isSignificantVertical = verticalMag > 0.03;

        // For diagonal detection, need significant components in both directions
        if (isSignificantHorizontal && isSignificantVertical) {
          // It's a diagonal direction - determine which quadrant
          if (dx > 0 && dy < 0) {
            pointingDirection = 'top-right';
          } else if (dx < 0 && dy < 0) {
            pointingDirection = 'top-left';
          } else if (dx > 0 && dy > 0) {
            pointingDirection = 'bottom-right';
          } else if (dx < 0 && dy > 0) {
            pointingDirection = 'bottom-left';
          }
        }
        // If not diagonal, determine if it's a cardinal direction
        else if (horizontalMag > verticalMag) {
          // Pointing horizontally
          pointingDirection = dx > 0 ? 'right' : 'left';
        } else {
          // Pointing vertically
          pointingDirection = dy > 0 ? 'down' : 'up';
        }
      }

      return {
        name: 'point',
        direction: pointingDirection,
        confidence: 0.9,
        vector: { dx, dy, dz } // Include vector for debugging
      };
    }

    // OPEN hand gesture - all fingers extended
    if (indexFingerExtended &&
        middleFingerExtended &&
        ringFingerExtended &&
        pinkyFingerExtended) {
      return { name: 'open', confidence: 0.9 };
    }

    // GRAB gesture - no fingers extended
    if (!indexFingerExtended &&
        !middleFingerExtended &&
        !ringFingerExtended &&
        !pinkyFingerExtended) {
      return { name: 'grab', confidence: 0.9 };
    }

    // No recognized gesture
    return null;
  }

  /**
   * Significantly improved finger extension detection that works in all directions
   * @param {Array} landmarks - Hand landmarks from MediaPipe
   * @param {Number} fingerIndex - Index of the finger (1=index, 2=middle, 3=ring, 4=pinky)
   * @returns {Boolean} - True if the finger is extended
   */
  isFingerExtendedImproved(landmarks, fingerIndex) {
    // Index mapping for different finger joints
    const mcpIndex = fingerIndex * 4 + 1;  // Base joint (metacarpophalangeal)
    const pipIndex = fingerIndex * 4 + 2;  // Middle joint (proximal interphalangeal)
    const dipIndex = fingerIndex * 4 + 3;  // End joint (distal interphalangeal)
    const tipIndex = fingerIndex * 4 + 4;  // Finger tip

    // Get the landmarks
    const wrist = landmarks[0];
    const mcp = landmarks[mcpIndex];
    const pip = landmarks[pipIndex];
    const dip = landmarks[dipIndex];
    const tip = landmarks[tipIndex];

    // METHOD 1: Distance-based approach
    // In a curled finger, the tip is close to the base of the palm
    // In an extended finger, the tip is far from the base
    const tipToWristDist = this.distance3D(tip, wrist);
    const mcpToWristDist = this.distance3D(mcp, wrist);

    // Extended fingers have tips further from wrist than MCP joints
    const distanceRatio = tipToWristDist / mcpToWristDist;

    // METHOD 2: Straightness-based approach
    // In a curled finger, there's significant bending at the joints
    // In an extended finger, the joints form a relatively straight line

    // Calculate vectors between joints
    const wristToMcp = this.vectorBetween(wrist, mcp);
    const mcpToPip = this.vectorBetween(mcp, pip);
    const pipToDip = this.vectorBetween(pip, dip);
    const dipToTip = this.vectorBetween(dip, tip);

    // Normalize vectors
    const wristToMcpNorm = this.normalizeVector(wristToMcp);
    const mcpToPipNorm = this.normalizeVector(mcpToPip);
    const pipToDipNorm = this.normalizeVector(pipToDip);
    const dipToTipNorm = this.normalizeVector(dipToTip);

    // Calculate angles between segments (dot product of normalized vectors)
    // Values close to 1 mean segments are aligned (straight finger)
    // Values close to 0 or negative mean segments are at an angle (bent finger)
    const alignmentMcpPip = this.dotProduct(wristToMcpNorm, mcpToPipNorm);
    const alignmentPipDip = this.dotProduct(mcpToPipNorm, pipToDipNorm);
    const alignmentDipTip = this.dotProduct(pipToDipNorm, dipToTipNorm);

    // METHOD 3: Position-based method specially for index finger
    // In certain hand orientations, the above methods can be unreliable
    // For index finger particularly, check if it's clearly separated from other fingers

    // For index finger (fingerIndex = 1), check separation from middle finger
    let isSeparatedFromOthers = false;
    if (fingerIndex === 1) {
      const middleTip = landmarks[12]; // Middle finger tip
      const indexToMiddleDist = this.distance3D(tip, middleTip);
      const mcpToMiddleDist = this.distance3D(mcp, middleTip);

      // If index tip is far from middle tip, it's separated/extended
      isSeparatedFromOthers = indexToMiddleDist > mcpToMiddleDist * 0.7;
    }

    // COMBINED DECISION
    // Different thresholds for index finger vs. other fingers
    // Index finger is considered extended more liberally
    if (fingerIndex === 1) {
      // For index finger: looser criteria because pointing is important
      return (
        (distanceRatio > 1.1) || // Distance method - extended
        (alignmentMcpPip > 0.5 && alignmentPipDip > 0.5) || // Alignment method - somewhat straight
        isSeparatedFromOthers // Separation method - clearly separated
      );
    } else {
      // For other fingers: stricter criteria
      return (
        (distanceRatio > 1.2) && // Distance method - clearly extended
        (alignmentMcpPip > 0.7 && alignmentPipDip > 0.7) // Alignment method - very straight
      );
    }
  }

  /**
   * Calculate vector between two points
   * @param {Object} a - First point with x,y,z coordinates
   * @param {Object} b - Second point with x,y,z coordinates
   * @returns {Object} - Vector from a to b
   */
  vectorBetween(a, b) {
    return {
      x: b.x - a.x,
      y: b.y - a.y,
      z: b.z - a.z
    };
  }

  /**
   * Normalize vector to unit length
   * @param {Object} v - Vector with x,y,z components
   * @returns {Object} - Normalized vector
   */
  normalizeVector(v) {
    const length = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
    if (length === 0) return { x: 0, y: 0, z: 0 };

    return {
      x: v.x / length,
      y: v.y / length,
      z: v.z / length
    };
  }

  /**
   * Calculate dot product of two vectors
   * @param {Object} a - First vector with x,y,z components
   * @param {Object} b - Second vector with x,y,z components
   * @returns {Number} - Dot product of vectors
   */
  dotProduct(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  /**
   * Calculate 3D distance between two points
   * @param {Object} a - First point with x,y,z coordinates
   * @param {Object} b - Second point with x,y,z coordinates
   * @returns {Number} - Distance between points
   */
  distance3D(a, b) {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) +
      Math.pow(a.y - b.y, 2) +
      Math.pow(a.z - b.z, 2)
    );
  }
}

export default MediaPipeProvider;
