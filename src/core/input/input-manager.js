/**
 * Input Manager
 * An abstraction layer that handles different input methods through providers.
 * Standardizes interaction between input systems and the rest of the application.
 */
class InputManager {
  constructor(providerName = 'mediapipe') {
    this.provider = null;
    this.isInitialized = false;
    this.onReadyCallbacks = [];
    this.loadProvider(providerName);
  }

  /**
   * Dynamically load an input provider
   * @param {string} providerName - Name of the provider to load ('mediapipe' or 'mock')
   * @returns {Promise} - Resolves when the provider is loaded and initialized
   */
  async loadProvider(providerName) {
    try {
      // Dynamic import of the specified provider
      const module = await import(`./providers/${providerName}.js`);
      this.provider = new module.default();

      // Initialize the provider
      await this.provider.initialize();
      this.isInitialized = true;

      // Notify any waiting callbacks that the input manager is ready
      this.onReadyCallbacks.forEach(callback => callback());
      this.onReadyCallbacks = [];

      console.log(`Input provider '${providerName}' loaded successfully`);
    } catch (error) {
      console.error(`Failed to load input provider '${providerName}':`, error);

      // If MediaPipe fails, try falling back to mock provider
      if (providerName === 'mediapipe') {
        console.warn('Falling back to mock input provider');
        await this.loadProvider('mock');
      }
    }
  }

  /**
   * Register a callback for when the input manager is ready
   * @param {Function} callback - Function to call when ready
   */
  onReady(callback) {
    if (this.isInitialized) {
      callback();
    } else {
      this.onReadyCallbacks.push(callback);
    }
  }

  /**
   * Start tracking hand movements
   * @returns {Promise} - Resolves when tracking has started
   */
  startTracking() {
    if (!this.isInitialized) {
      throw new Error('Input manager not initialized');
    }
    return this.provider.startTracking();
  }

  /**
   * Stop tracking hand movements
   * @returns {Promise} - Resolves when tracking has stopped
   */
  stopTracking() {
    if (!this.isInitialized) {
      throw new Error('Input manager not initialized');
    }
    return this.provider.stopTracking();
  }

  /**
   * Set video element to use for tracking
   * @param {HTMLVideoElement} videoElement - The video element to use
   */
  setVideoElement(videoElement) {
    if (!this.isInitialized) {
      throw new Error('Input manager not initialized');
    }
    return this.provider.setVideoElement(videoElement);
  }

  /**
   * Register callback for hand updates
   * @param {Function} callback - Function to call with hand data
   * @returns {Function} - Function to unregister the callback
   */
  onHandUpdate(callback) {
    if (!this.isInitialized) {
      throw new Error('Input manager not initialized');
    }
    return this.provider.onHandUpdate(callback);
  }

  /**
   * Register callback for gesture recognition
   * @param {Function} callback - Function to call with gesture data
   * @returns {Function} - Function to unregister the callback
   */
  onGestureDetected(callback) {
    if (!this.isInitialized) {
      throw new Error('Input manager not initialized');
    }
    return this.provider.onGestureDetected(callback);
  }
}

export default InputManager;
