/**
 * 🕰️ Image Time Machine Service
 * 
 * Stores all images with timestamps and provides time travel functionality
 * to navigate through historical images by date and timespan.
 */

export interface TimeMachineImage {
  url: string;
  timestamp: number;
  eventId?: string;
  eventData?: any;
  correctCategory?: string;
  category?: string;
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface TimeMachineConfig {
  maxStoredImages: number;
  timeSliceMinutes: number;
  storageKey: string;
  defaultWindowMinutes: number;
}

export class TimeMachineService {
  private images: TimeMachineImage[] = [];
  private config: TimeMachineConfig;
  private currentTimeRange: TimeRange;
  private updateCallbacks: ((images: TimeMachineImage[], timeRange: TimeRange) => void)[] = [];
  private isUserControlledWindow: boolean = false; // Track if user has manually set window

  constructor(config: Partial<TimeMachineConfig> = {}) {
    this.config = {
      maxStoredImages: 10000, // Store up to 10,000 images
      timeSliceMinutes: 60, // Default 1-hour time slices
      storageKey: 'time-machine-images',
      defaultWindowMinutes: 60, // Default 1-hour window
      ...config
    };

    // Initialize with current time using default window size
    const now = Date.now();
    this.currentTimeRange = {
      start: now - (this.config.defaultWindowMinutes * 60 * 1000),
      end: now
    };

    // Load stored images and previous window settings
    this.loadFromStorage();

    // No auto-reload - user controls timeline manually
  }

  /**
   * Add a new image to the time machine
   */
  addImage(image: Omit<TimeMachineImage, 'timestamp'> & { timestamp?: number }): void {
    const timestampedImage: TimeMachineImage = {
      ...image,
      timestamp: image.timestamp || Date.now()
    };

    // Add to front of array (newest first)
    this.images.unshift(timestampedImage);

    // Maintain size limit
    if (this.images.length > this.config.maxStoredImages) {
      this.images = this.images.slice(0, this.config.maxStoredImages);
    }

    // Save to storage
    this.saveToStorage();

    // Don't auto-update the display - user must manually navigate timeline
    // The timeline will extend to show new images are available

    console.log(`🕰️ Added image to time machine. Total: ${this.images.length}`);
  }

  /**
   * Get images for a specific time range
   */
  getImagesForTimeRange(timeRange: TimeRange): TimeMachineImage[] {
    return this.images.filter(img => 
      img.timestamp >= timeRange.start && img.timestamp <= timeRange.end
    ).sort((a, b) => b.timestamp - a.timestamp); // Newest first
  }

  /**
   * Get images for current time range
   */
  getCurrentImages(): TimeMachineImage[] {
    return this.getImagesForTimeRange(this.currentTimeRange);
  }

  /**
   * Travel to a specific time range
   */
  travelToTimeRange(timeRange: TimeRange): TimeMachineImage[] {
    this.currentTimeRange = timeRange;
    this.isUserControlledWindow = true; // Mark as user-controlled
    const images = this.getCurrentImages();
    this.notifyCallbacks();
    
    // Save the user's window settings
    this.saveWindowSettings();
    
    console.log(`🕰️ Time traveled to ${new Date(timeRange.start).toLocaleString()} - ${new Date(timeRange.end).toLocaleString()}`);
    console.log(`📸 Found ${images.length} images in this time period`);
    
    return images;
  }

  /**
   * Travel to a specific date (with configurable timespan)
   */
  travelToDate(date: Date, timespanMinutes: number = this.config.timeSliceMinutes): TimeMachineImage[] {
    const timestamp = date.getTime();
    const timeRange: TimeRange = {
      start: timestamp - (timespanMinutes * 60 * 1000 / 2), // Half before
      end: timestamp + (timespanMinutes * 60 * 1000 / 2)    // Half after
    };
    
    return this.travelToTimeRange(timeRange);
  }

  /**
   * Travel backwards in time by specified minutes
   */
  travelBackwards(minutes: number): TimeMachineImage[] {
    const offset = minutes * 60 * 1000;
    const newTimeRange: TimeRange = {
      start: this.currentTimeRange.start - offset,
      end: this.currentTimeRange.end - offset
    };
    
    return this.travelToTimeRange(newTimeRange);
  }

  /**
   * Travel forwards in time by specified minutes
   */
  travelForwards(minutes: number): TimeMachineImage[] {
    const offset = minutes * 60 * 1000;
    const newTimeRange: TimeRange = {
      start: this.currentTimeRange.start + offset,
      end: this.currentTimeRange.end + offset
    };
    
    return this.travelToTimeRange(newTimeRange);
  }

  /**
   * Jump to "now" (latest images) - Keep user's window size if they set one
   */
  jumpToNow(): TimeMachineImage[] {
    const now = Date.now();
    
    // If user has set a custom window, maintain that size
    const windowDuration = this.isUserControlledWindow 
      ? (this.currentTimeRange.end - this.currentTimeRange.start)
      : (this.config.defaultWindowMinutes * 60 * 1000);
    
    const newTimeRange: TimeRange = {
      start: now - windowDuration,
      end: now
    };
    
    // Don't mark as user-controlled when jumping to now
    this.currentTimeRange = newTimeRange;
    this.notifyCallbacks();
    
    console.log(`🕰️ Jumped to NOW with ${windowDuration / (60 * 1000)}min window`);
    
    return this.getCurrentImages();
  }

  /**
   * Get available time periods with image counts - Always extend to "now"
   */
  getTimePeriods(periodMinutes: number = 60): Array<{
    start: number;
    end: number;
    count: number;
    label: string;
  }> {
    const now = Date.now();
    
    if (this.images.length === 0) {
      // If no images, return a period covering the last hour
      return [{
        start: now - (periodMinutes * 60 * 1000),
        end: now,
        count: 0,
        label: 'No images yet'
      }];
    }

    const oldestImage = this.images[this.images.length - 1];
    const newestImage = this.images[0];
    const periodMs = periodMinutes * 60 * 1000;
    
    const periods: Array<{start: number, end: number, count: number, label: string}> = [];
    
    // Create periods from oldest image to "now" (always extend to current time)
    let currentStart = Math.floor(oldestImage.timestamp / periodMs) * periodMs;
    const endTime = Math.max(newestImage.timestamp, now); // Always extend to current time
    
    while (currentStart < endTime) {
      const currentEnd = currentStart + periodMs;
      const imagesInPeriod = this.images.filter(img => 
        img.timestamp >= currentStart && img.timestamp < currentEnd
      );
      
      // Always include periods, even if empty (to show the full timeline to "now")
      const startDate = new Date(currentStart);
      const endDate = new Date(Math.min(currentEnd, now));
      
      periods.push({
        start: currentStart,
        end: Math.min(currentEnd, now),
        count: imagesInPeriod.length,
        label: this.formatTimePeriodLabel(startDate, endDate)
      });
      
      currentStart = currentEnd;
    }
    
    return periods.reverse(); // Newest first
  }

  /**
   * Get current time range
   */
  getCurrentTimeRange(): TimeRange {
    return { ...this.currentTimeRange };
  }

  /**
   * Subscribe to time machine updates
   */
  subscribe(callback: (images: TimeMachineImage[], timeRange: TimeRange) => void): void {
    this.updateCallbacks.push(callback);
  }

  /**
   * Get total number of stored images
   */
  getTotalImageCount(): number {
    return this.images.length;
  }

  /**
   * Find an image by event ID across all stored images
   */
  findImageByEventId(eventId: string): TimeMachineImage | null {
    return this.images.find(img => img.eventId === eventId) || null;
  }

  /**
   * Get all stored images (for searching)
   */
  getAllImages(): TimeMachineImage[] {
    return [...this.images];
  }

  /**
   * Get oldest and newest timestamps
   */
  getTimeRange(): { oldest: number, newest: number } | null {
    if (this.images.length === 0) return null;
    
    return {
      oldest: this.images[this.images.length - 1].timestamp,
      newest: this.images[0].timestamp
    };
  }

  /**
   * Clear all stored images
   */
  clearHistory(): void {
    this.images = [];
    this.saveToStorage();
    this.notifyCallbacks();
    console.log('🕰️ Time machine history cleared');
  }


  /**
   * Check if image is in current time range
   */
  private isImageInCurrentRange(image: TimeMachineImage): boolean {
    return image.timestamp >= this.currentTimeRange.start && 
           image.timestamp <= this.currentTimeRange.end;
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(): void {
    const currentImages = this.getCurrentImages();
    this.updateCallbacks.forEach(callback => {
      try {
        callback(currentImages, this.currentTimeRange);
      } catch (error) {
        console.error('Error in time machine callback:', error);
      }
    });
  }

  /**
   * Format time period label
   */
  private formatTimePeriodLabel(start: Date, end: Date): string {
    const now = new Date();
    const isToday = start.toDateString() === now.toDateString();
    const isYesterday = start.toDateString() === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
    
    if (isToday) {
      return `Today ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isYesterday) {
      return `Yesterday ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  }

  /**
   * Save window settings separately
   */
  private saveWindowSettings(): void {
    try {
      const windowData = {
        currentTimeRange: this.currentTimeRange,
        isUserControlledWindow: this.isUserControlledWindow,
        timestamp: Date.now()
      };
      
      const file = Bun.file(`${this.config.storageKey}-window.json`);
      Bun.write(file, JSON.stringify(windowData, null, 2));
    } catch (error) {
      console.error('Error saving window settings:', error);
    }
  }

  /**
   * Save images to storage
   */
  private saveToStorage(): void {
    try {
      // Only save recent images to avoid storage bloat (last 1000)
      const imagesToSave = this.images.slice(0, 1000);
      const data = {
        images: imagesToSave,
        timestamp: Date.now()
      };
      
      const file = Bun.file(`${this.config.storageKey}.json`);
      Bun.write(file, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving time machine data:', error);
    }
  }

  /**
   * Load images and window settings from storage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      // Load images
      const file = Bun.file(`${this.config.storageKey}.json`);
      if (await file.exists()) {
        const data = await file.json();
        if (data && Array.isArray(data.images)) {
          this.images = data.images;
          console.log(`🕰️ Loaded ${this.images.length} images from time machine storage`);
        }
      }
      
      // Load window settings
      const windowFile = Bun.file(`${this.config.storageKey}-window.json`);
      if (await windowFile.exists()) {
        const windowData = await windowFile.json();
        if (windowData && windowData.currentTimeRange) {
          this.currentTimeRange = windowData.currentTimeRange;
          this.isUserControlledWindow = windowData.isUserControlledWindow || false;
          console.log(`🕰️ Restored window settings: ${this.isUserControlledWindow ? 'User-controlled' : 'Auto'} window`);
        }
      }
    } catch (error) {
      console.error('Error loading time machine data:', error);
      this.images = [];
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.updateCallbacks = [];
    this.saveToStorage();
  }
}

// Singleton instance for server use
export const timeMachine = new TimeMachineService();
