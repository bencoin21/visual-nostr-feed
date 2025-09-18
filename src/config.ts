/**
 * 🎛️ Global Configuration for Visual Nostr Feed
 * 
 * Central place to configure all timing, speeds, and behavior settings.
 * Modify these values to adjust the entire application behavior.
 */

export interface AppConfig {
  // Image Display Timing
  imageDisplayTime: number;
  cachedImageDisplayTime: number;
  imageLoadTimeout: number;
  maxRetries: number;
  
  // System Health & Monitoring
  stuckDetectionTime: number;
  heartbeatInterval: number;
  rotationInterval: number;
  maxImageAge: number;
  
  // Slider Mode Settings
  sliderSpeed: number;
  autoScrollSpeed: number;
  scrollSensitivity: number;
  sliderLoadSpeed: number;
  manualScrollSpeed: number;
  
  // Layout & UI
  maxBackgroundImages: number;
  maxSliderImages: number;
  
  // Cache & Performance
  maxCacheSize: number;
  duplicateTimeWindow: number;
  
  // Batch Processing
  batchSize: number;
  batchDelay: number;
  
  // Animation Timings
  fadeInDuration: number;
  scaleAnimationDuration: number;
  clickFeedbackDuration: number;
}

/**
 * 🎯 Default Configuration
 * 
 * These values are optimized for good user experience.
 * Adjust based on your needs:
 * - Increase values for slower, more relaxed experience
 * - Decrease values for faster, more dynamic experience
 */
export const DEFAULT_CONFIG: AppConfig = {
  // ⏱️ Image Display Timing (milliseconds)
  imageDisplayTime: 4000,              // 4 seconds per image in fullscreen
  cachedImageDisplayTime: 1000,        // 1 second for cached images
  imageLoadTimeout: 10000,             // 10 seconds timeout for image loading
  maxRetries: 3,                       // Maximum retry attempts for failed images
  
  // 🔍 System Health & Monitoring
  stuckDetectionTime: 15000,           // 15 seconds without activity = stuck
  heartbeatInterval: 5000,             // 5 seconds between health checks
  rotationInterval: 30000,             // 30 seconds between rotation checks
  maxImageAge: 30000000,                 // 500 minutes maximum age for images
  
  // 🎞️ Slider Mode Settings
  sliderSpeed: 8,                      // Pixels per scroll step (lower = slower)
  autoScrollSpeed: 4000,               // 4 seconds between auto-scroll steps
  scrollSensitivity: 0.4,              // Mouse scroll sensitivity (0-1)
  sliderLoadSpeed: 1000,               // 1 second between new images in slider
  manualScrollSpeed: 12,               // Pixels per manual scroll step
  
  // 📐 Layout & UI Limits
  maxBackgroundImages: 150,            // Maximum images in fullscreen mode
  maxSliderImages: 60,                 // Maximum images in slider
  
  // 💾 Cache & Performance
  maxCacheSize: 400,                   // Maximum cached images on server
  duplicateTimeWindow: 1800000,        // 30 minutes window for duplicate detection
  
  // 📦 Batch Processing
  batchSize: 8,                        // Images per batch when loading
  batchDelay: 1000,                    // 1 second between batches
  
  // ✨ Animation Timings
  fadeInDuration: 300,                 // Fade in animation duration
  scaleAnimationDuration: 150,         // Scale animation duration
  clickFeedbackDuration: 100,          // Click feedback animation delay
};

/**
 * 🚀 Performance Profiles
 * 
 * Pre-configured settings for different use cases
 */
export const PERFORMANCE_PROFILES = {
  // 🐌 Relaxed: Slow, peaceful browsing
  relaxed: {
    ...DEFAULT_CONFIG,
    imageDisplayTime: 6000,
    sliderLoadSpeed: 2000,
    autoScrollSpeed: 6000,
    sliderSpeed: 4,
  },
  
  // ⚡ Fast: Quick, dynamic experience
  fast: {
    ...DEFAULT_CONFIG,
    imageDisplayTime: 2000,
    sliderLoadSpeed: 500,
    autoScrollSpeed: 2000,
    sliderSpeed: 16,
  },
  
  // 🎯 Demo: Optimized for presentations
  demo: {
    ...DEFAULT_CONFIG,
    imageDisplayTime: 3000,
    sliderLoadSpeed: 800,
    autoScrollSpeed: 3000,
    maxBackgroundImages: 100,
  }
};

/**
 * 🎛️ Active Configuration
 * 
 * Change this to switch between profiles or use custom config
 */
export const CONFIG: AppConfig = DEFAULT_CONFIG;

// Alternative: Use a performance profile
// export const CONFIG: AppConfig = PERFORMANCE_PROFILES.relaxed;

/**
 * 🔧 Configuration Helpers
 */
export const ConfigHelpers = {
  /**
   * Get timing for different loading scenarios
   */
  getLoadingDelay: (mode: 'fullscreen' | 'slider', index: number, cachedCount: number = 0): number => {
    if (mode === 'slider') {
      return (cachedCount * CONFIG.sliderLoadSpeed) + (index * 1500);
    }
    return (cachedCount * 100) + (index * 200);
  },
  
  /**
   * Get batch timing for image processing
   */
  getBatchDelay: (batchIndex: number): number => {
    return batchIndex * CONFIG.batchDelay;
  },
  
  /**
   * Check if image is too old
   */
  isImageExpired: (timestamp: number): boolean => {
    return (Date.now() - timestamp) > CONFIG.maxImageAge;
  }
};
