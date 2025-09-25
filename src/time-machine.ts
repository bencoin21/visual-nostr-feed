/**
 * 🎬 Multi-Media Time Machine Service
 * 
 * Stores all media types (images, videos, audio, documents) with timestamps
 * and provides time travel functionality across all Nostr content.
 */

import type { MediaType, MediaItem } from './image-classifier.js';

export interface TimeMachineMediaItem {
  url: string;
  timestamp: number;
  eventId?: string;
  eventData?: any;
  type: MediaType;
  subtype?: string;
  title?: string;
  thumbnail?: string;
  category?: string; // content category (nature, tech, etc.)
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface TimeMachineConfig {
  maxStoredPerType: number; // 10k cache per media type
  timeSliceMinutes: number;
  storageKey: string;
  defaultWindowMinutes: number;
}

export class TimeMachineService {
  // Separate storage for each media type - 10k cache each
  private images: TimeMachineMediaItem[] = [];
  private videos: TimeMachineMediaItem[] = [];
  private audio: TimeMachineMediaItem[] = [];
  private documents: TimeMachineMediaItem[] = [];
  private links: TimeMachineMediaItem[] = [];
  
  // Duplicate tracking - prevent same URL/eventId combinations
  private seenMediaItems = new Set<string>(); // Track URL+eventId combinations
  private seenEventIds = new Set<string>(); // Track processed event IDs
  
  private config: TimeMachineConfig;
  private currentTimeRange: TimeRange;
  private activeMediaTypes: Set<MediaType> = new Set(['image']); // Which types to show
  private updateCallbacks: ((media: any, timeRange: TimeRange) => void)[] = [];
  private isUserControlledWindow: boolean = false; // Track if user has manually set window

  constructor(config: Partial<TimeMachineConfig> = {}) {
    this.config = {
      maxStoredPerType: 10000, // Store up to 10,000 items per media type
      timeSliceMinutes: 60, // Default 1-hour time slices
      storageKey: 'time-machine-media',
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
   * Add media item to the time machine (with duplicate prevention)
   */
  addMediaItem(mediaItem: Omit<TimeMachineMediaItem, 'timestamp'> & { timestamp?: number }): void {
    const timestampedItem: TimeMachineMediaItem = {
      ...mediaItem,
      timestamp: mediaItem.timestamp || Date.now()
    };

    // Create unique key for this media item (URL + eventId combination)
    const uniqueKey = `${timestampedItem.url}:${timestampedItem.eventId || 'no-event'}`;
    
    // Skip if we've already seen this exact media item
    if (this.seenMediaItems.has(uniqueKey)) {
      console.log(`🔄 Skipping duplicate ${timestampedItem.type}: ${timestampedItem.url.slice(0, 50)}... (eventId: ${timestampedItem.eventId?.slice(0, 8)})`);
      return;
    }

    // Mark as seen
    this.seenMediaItems.add(uniqueKey);
    if (timestampedItem.eventId) {
      this.seenEventIds.add(timestampedItem.eventId);
    }

    // Add to appropriate storage based on type
    const storage = this.getStorageForType(timestampedItem.type);
    storage.unshift(timestampedItem);

    // Maintain size limit per type (10k each)
    if (storage.length > this.config.maxStoredPerType) {
      const removed = storage.splice(this.config.maxStoredPerType);
      // Remove old items from seen sets to allow them to reappear later
      removed.forEach(item => {
        const oldKey = `${item.url}:${item.eventId || 'no-event'}`;
        this.seenMediaItems.delete(oldKey);
      });
    }

    // Clean up seen sets periodically to prevent memory bloat
    if (this.seenMediaItems.size > this.config.maxStoredPerType * 5) {
      console.log(`🧹 Cleaning up seen media items cache (${this.seenMediaItems.size} -> ${this.config.maxStoredPerType * 2})`);
      // Keep only the most recent half
      const recentItems = Array.from(this.seenMediaItems).slice(0, this.config.maxStoredPerType * 2);
      this.seenMediaItems = new Set(recentItems);
    }

    // Save to storage
    this.saveToStorage();

    console.log(`🎬 Added ${timestampedItem.type} to time machine. Total ${timestampedItem.type}s: ${storage.length}`);
  }

  /**
   * Legacy method for backward compatibility
   */
  addImage(image: any): void {
    this.addMediaItem({
      ...image,
      type: 'image' as MediaType
    });
  }

  /**
   * Get storage array for specific media type
   */
  private getStorageForType(type: MediaType): TimeMachineMediaItem[] {
    switch (type) {
      case 'image': return this.images;
      case 'video': return this.videos;
      case 'audio': return this.audio;
      case 'document': return this.documents;
      case 'link': return this.links;
      default: return this.images;
    }
  }

  /**
   * Get media for a specific time range and type(s)
   */
  getMediaForTimeRange(timeRange: TimeRange, types?: MediaType[]): TimeMachineMediaItem[] {
    const typesToShow = types || Array.from(this.activeMediaTypes);
    const allMedia: TimeMachineMediaItem[] = [];

    // Collect media from all requested types
    typesToShow.forEach(type => {
      const storage = this.getStorageForType(type);
      const filtered = storage.filter(item => 
        item.timestamp >= timeRange.start && item.timestamp <= timeRange.end
      );
      allMedia.push(...filtered);
    });

    return allMedia.sort((a, b) => b.timestamp - a.timestamp); // Newest first
  }

  /**
   * Legacy method - get images for time range
   */
  getImagesForTimeRange(timeRange: TimeRange): any[] {
    return this.getMediaForTimeRange(timeRange, ['image']);
  }

  /**
   * Get media by specific type
   */
  getMediaByType(type: MediaType, timeRange?: TimeRange): TimeMachineMediaItem[] {
    const storage = this.getStorageForType(type);
    if (!timeRange) {
      return [...storage];
    }
    return storage.filter(item => 
      item.timestamp >= timeRange.start && item.timestamp <= timeRange.end
    ).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get current media for active types
   */
  getCurrentMedia(): TimeMachineMediaItem[] {
    return this.getMediaForTimeRange(this.currentTimeRange);
  }

  /**
   * Legacy method - get images for current time range
   */
  getCurrentImages(): any[] {
    return this.getMediaForTimeRange(this.currentTimeRange, ['image']);
  }

  /**
   * Set active media types to display
   */
  setActiveMediaTypes(types: MediaType[]): void {
    this.activeMediaTypes = new Set(types);
    console.log(`🎬 Active media types: ${Array.from(this.activeMediaTypes).join(', ')}`);
  }

  /**
   * Get statistics for all media types
   */
  getMediaStats(): Record<MediaType, number> {
    return {
      image: this.images.length,
      video: this.videos.length,
      audio: this.audio.length,
      document: this.documents.length,
      link: this.links.length,
      text: 0 // Not stored separately
    };
  }

  /**
   * Travel to a specific time range
   */
  travelToTimeRange(timeRange: TimeRange): any[] {
    this.currentTimeRange = timeRange;
    this.isUserControlledWindow = true; // Mark as user-controlled
    const media = this.getCurrentMedia();
    this.notifyCallbacks();
    
    // Save the user's window settings
    this.saveWindowSettings();
    
    console.log(`🕰️ Time traveled to ${new Date(timeRange.start).toLocaleString()} - ${new Date(timeRange.end).toLocaleString()}`);
    console.log(`🎬 Found ${media.length} media items in this time period`);
    console.log(`⏰ Window duration: ${Math.round((timeRange.end - timeRange.start) / (60 * 1000))} minutes (user-controlled: ${this.isUserControlledWindow})`);
    
    return media;
  }

  /**
   * Travel to a specific date (with configurable timespan)
   */
  travelToDate(date: Date, timespanMinutes: number = this.config.timeSliceMinutes): any[] {
    const timestamp = date.getTime();
    const timeRange: TimeRange = {
      start: timestamp - (timespanMinutes * 60 * 1000 / 2), // Half before
      end: timestamp + (timespanMinutes * 60 * 1000 / 2)    // Half after
    };
    
    // Mark as user-controlled if they provided a custom timespan
    if (timespanMinutes !== this.config.timeSliceMinutes) {
      this.isUserControlledWindow = true;
    }
    
    return this.travelToTimeRange(timeRange);
  }

  /**
   * Travel backwards in time by specified minutes
   */
  travelBackwards(minutes: number): any[] {
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
  travelForwards(minutes: number): any[] {
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
  jumpToNow(): any[] {
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
    
    return this.getCurrentMedia();
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
   * Get total number of stored media items
   */
  getTotalMediaCount(): number {
    return this.images.length + this.videos.length + this.audio.length + this.documents.length + this.links.length;
  }

  /**
   * Legacy method - get total image count
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
   * Find any media item by event ID across ALL media types
   */
  findMediaByEventId(eventId: string): TimeMachineMediaItem | null {
    // Search through all media types
    const allStorages = [this.images, this.videos, this.audio, this.documents, this.links];
    
    for (const storage of allStorages) {
      const found = storage.find(item => item.eventId === eventId);
      if (found) {
        console.log(`📍 Found ${found.type} for event ${eventId.slice(0, 8)} in time machine`);
        return found;
      }
    }
    
    console.log(`❌ Event ${eventId.slice(0, 8)} not found in any time machine storage`);
    return null;
  }

  /**
   * Get all stored images (for searching)
   */
  getAllImages(): TimeMachineImage[] {
    return [...this.images];
  }

  /**
   * Get all media from a specific user (pubkey)
   */
  getMediaByUser(pubkey: string): TimeMachineMediaItem[] {
    const allStorages = [this.images, this.videos, this.audio, this.documents, this.links];
    const userMedia: TimeMachineMediaItem[] = [];
    
    allStorages.forEach(storage => {
      const userItems = storage.filter(item => 
        item.eventData && item.eventData.pubkey === pubkey
      );
      userMedia.push(...userItems);
    });
    
    // Sort by timestamp, newest first
    return userMedia.sort((a, b) => b.timestamp - a.timestamp);
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
   * Clear all stored media
   */
  clearHistory(): void {
    this.images = [];
    this.videos = [];
    this.audio = [];
    this.documents = [];
    this.links = [];
    this.seenMediaItems.clear();
    this.seenEventIds.clear();
    this.saveToStorage();
    this.notifyCallbacks();
    console.log('🕰️ Time machine history cleared');
  }

  /**
   * Clean up duplicates from existing storage
   */
  cleanupDuplicates(): void {
    console.log('🧹 Starting duplicate cleanup...');
    
    const cleanStorage = (storage: TimeMachineMediaItem[], typeName: string) => {
      const seen = new Set<string>();
      const originalLength = storage.length;
      
      // Filter out duplicates based on URL + eventId
      const cleaned = storage.filter(item => {
        const key = `${item.url}:${item.eventId || 'no-event'}`;
        if (seen.has(key)) {
          return false; // Duplicate
        }
        seen.add(key);
        return true;
      });
      
      // Update storage
      storage.length = 0;
      storage.push(...cleaned);
      
      console.log(`🧹 ${typeName}: ${originalLength} -> ${cleaned.length} (removed ${originalLength - cleaned.length} duplicates)`);
      return cleaned.length;
    };

    // Clean all media types
    cleanStorage(this.images, 'Images');
    cleanStorage(this.videos, 'Videos');
    cleanStorage(this.audio, 'Audio');
    cleanStorage(this.documents, 'Documents');
    cleanStorage(this.links, 'Links');

    // Rebuild seen sets from cleaned data
    this.seenMediaItems.clear();
    this.seenEventIds.clear();
    
    [this.images, this.videos, this.audio, this.documents, this.links].forEach(storage => {
      storage.forEach(item => {
        const key = `${item.url}:${item.eventId || 'no-event'}`;
        this.seenMediaItems.add(key);
        if (item.eventId) {
          this.seenEventIds.add(item.eventId);
        }
      });
    });

    this.saveToStorage();
    console.log('🧹 Duplicate cleanup complete');
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
   * Save all media types to storage
   */
  private saveToStorage(): void {
    try {
      // Save all media types (limit each to avoid storage bloat)
      const data = {
        images: this.images.slice(0, 1000),
        videos: this.videos.slice(0, 1000),
        audio: this.audio.slice(0, 1000),
        documents: this.documents.slice(0, 1000),
        links: this.links.slice(0, 1000),
        timestamp: Date.now()
      };
      
      const file = Bun.file(`${this.config.storageKey}.json`);
      Bun.write(file, JSON.stringify(data, null, 2));
      console.log(`💾 Multi-media cache updated: ${data.images.length} images, ${data.videos.length} videos, ${data.audio.length} audio, ${data.documents.length} docs, ${data.links.length} links`);
    } catch (error) {
      console.error('Error saving time machine data:', error);
    }
  }

  /**
   * Load all media types and window settings from storage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      // Load all media types
      const file = Bun.file(`${this.config.storageKey}.json`);
      if (await file.exists()) {
        const data = await file.json();
        if (data) {
          // Load images (backward compatibility)
          if (Array.isArray(data.images)) {
            this.images = data.images;
          }
          
          // Load new media types
          if (Array.isArray(data.videos)) {
            this.videos = data.videos;
          }
          if (Array.isArray(data.audio)) {
            this.audio = data.audio;
          }
          if (Array.isArray(data.documents)) {
            this.documents = data.documents;
          }
          if (Array.isArray(data.links)) {
            this.links = data.links;
          }
          
          console.log(`🕰️ Loaded multi-media from storage: ${this.images.length} images, ${this.videos.length} videos, ${this.audio.length} audio, ${this.documents.length} docs, ${this.links.length} links`);
          
          // Rebuild seen sets from loaded data
          this.seenMediaItems.clear();
          this.seenEventIds.clear();
          
          [this.images, this.videos, this.audio, this.documents, this.links].forEach(storage => {
            storage.forEach(item => {
              const key = `${item.url}:${item.eventId || 'no-event'}`;
              this.seenMediaItems.add(key);
              if (item.eventId) {
                this.seenEventIds.add(item.eventId);
              }
            });
          });
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
