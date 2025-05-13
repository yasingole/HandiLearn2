/**
 * MediaPipe Provider
 * Uses MediaPipe Hands API to track hand landmarks and detect gestures
 */
import { Hands } from '@mediapipe/hands';

// Gesture detection thresholds and configurations
const GESTURE_CONFIG = {
  // How far apart fingers need to be to be considered "spread"
  FINGER_SPREAD_THRESHOLD: 0.1,
  // Minimum confidence for a hand detection to be considered valid
  HAND_CONFIDENCE_THRESHOLD: 0.7
};

class MediaPipeProvider {
  constructor() {
    this.hands = null;
    this.camera = null;
    this.videoElement = null;
    this.isInitialized = false;
    this.isTracking = false;
    this.handUpdateCallbacks = [];
    this.gestureCallbacks = [];
    this.lastDetectedHands = null;
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
    this.lastDetectedHands = results;

    // Notify all hand update callbacks
    if (this.handUpdateCallbacks.length > 0) {
      this.handUpdateCallbacks.forEach(callback => callback(results));
    }

    // Process gestures
    if (this.gestureCallbacks.length > 0 && multiHandLandmarks.length > 0) {
      multiHandLandmarks.forEach((landmarks, handIndex) => {
        const handedness = multiHandedness[handIndex].label; // 'Left' or 'Right'
        const gestures = this.detectGestures(landmarks, handedness);

        if (gestures.length > 0) {
          this.gestureCallbacks.forEach(callback => {
            gestures.forEach(gesture => callback(gesture, handedness, landmarks));
          });
        }
      });
    }
  }

  /**
   * Detect gestures from hand landmarks
   * @param {Array} landmarks - Hand landmarks from MediaPipe
   * @param {String} handedness - 'Left' or 'Right'
   * @returns {Array} - Array of detected gestures
   */
  detectGestures(landmarks, handedness) {
    const gestures = [];

    // Get important landmarks for gesture detection
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    // POINTING gesture - index finger extended, others curled
    if (this.isFingerExtended(landmarks, 1) &&
        !this.isFingerExtended(landmarks, 2) &&
        !this.isFingerExtended(landmarks, 3) &&
        !this.isFingerExtended(landmarks, 4)) {
      gestures.push({ name: 'point', confidence: 0.9 });
    }

    // OPEN HAND gesture - all fingers extended
    if (this.isFingerExtended(landmarks, 1) &&
        this.isFingerExtended(landmarks, 2) &&
        this.isFingerExtended(landmarks, 3) &&
        this.isFingerExtended(landmarks, 4)) {
      gestures.push({ name: 'open', confidence: 0.9 });
    }

    // GRAB gesture - no fingers extended (closed fist)
    if (!this.isFingerExtended(landmarks, 1) &&
        !this.isFingerExtended(landmarks, 2) &&
        !this.isFingerExtended(landmarks, 3) &&
        !this.isFingerExtended(landmarks, 4)) {
      gestures.push({ name: 'grab', confidence: 0.9 });
    }

    // WAVE gesture - detect side-to-side motion
    // (This would require tracking hand position over time,
    // which we'll add in a more advanced version)

    return gestures;
  }

  /**
   * Check if a finger is extended
   * @param {Array} landmarks - Hand landmarks from MediaPipe
   * @param {Number} fingerIndex - Index of the finger (1=index, 2=middle, 3=ring, 4=pinky)
   * @returns {Boolean} - True if the finger is extended
   */
  isFingerExtended(landmarks, fingerIndex) {
    // Base of the finger
    const mcpIndex = fingerIndex * 4 + 1;
    // Tip of the finger
    const tipIndex = fingerIndex * 4 + 4;

    // Get the landmarks at the base and tip
    const mcp = landmarks[mcpIndex];
    const tip = landmarks[tipIndex];

    // Check if tip is extended away from palm
    return tip.y < mcp.y;
  }
}

export default MediaPipeProvider;
