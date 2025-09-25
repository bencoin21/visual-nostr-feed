import { SimplePool, type Event as NostrEvent } from "nostr-tools";
import { imageClassifier, MediaClassifier, type MediaItem, type ClassifiedContent } from "./image-classifier.js";
import { CONFIG } from "./config.js";
import { timeMachine, type TimeMachineMediaItem } from "./time-machine.js";

export interface NostrFeedItem {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
  media: {
    images: MediaItem[];
    videos: MediaItem[];
    audio: MediaItem[];
    documents: MediaItem[];
    links: MediaItem[];
    totalCount: number;
  };
  // Legacy compatibility
  images: Array<{
    url: string;
    category: string;
    correctCategory: string;
  }>;
  author?: {
    name?: string;
    picture?: string;
  };
}

export class NostrService {
  private pool: SimplePool;
  private relays: string[];
  private events: NostrEvent[] = [];
  private profileCache = new Map<string, any>();
  private updateCallbacks: ((item: NostrFeedItem) => void)[] = [];
  private seenImages = new Set<string>(); // Track seen images to avoid duplicates
  private seenEventIds = new Set<string>(); // Track seen event IDs to avoid duplicates
  private imageCache: Array<{url: string, correctCategory: string, timestamp: number}> = []; // Cache of image data
  private connectionRetries = 0;
  private maxRetries = 5;
  private maxCacheSize = CONFIG.maxCacheSize; // Maximum number of cached images
  private currentSubscription: any = null;
  private lastEventTime = Date.now();
  private isInitializing = false;

  constructor() {
    // Use nostr-tools SimplePool for reliability
    this.pool = new SimplePool();
    this.relays = [
      "wss://relay.damus.io",
      "wss://nos.lol", 
      "wss://relay.nostr.band",
      "wss://nostr.wine",
      "wss://relay.snort.social",
      "wss://relay.primal.net",
      "wss://purplepag.es"
    ];
    
    // Load cached images on startup (async)
    this.loadImageCache().catch(console.error);
  }

  async initialize() {
    if (this.isInitializing) {
      console.log("⏳ Already initializing, skipping...");
      return;
    }
    
    this.isInitializing = true;
    console.log("🚀 Initializing Nostr service...");
    
    try {
      // Fetch recent text notes with timeout
      const queryPromise = this.pool.querySync(this.relays, {
        kinds: [1],
        limit: 50,
        since: Math.floor(Date.now() / 1000) - 7200 // Last 2 hours (expanded for more images)
      });
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 15000)
      );
      
      const events = await Promise.race([queryPromise, timeoutPromise]) as NostrEvent[];
      
      // Filter out duplicate events by ID
      const uniqueEvents = events.filter(event => {
        if (this.seenEventIds.has(event.id)) {
          return false;
        }
        this.seenEventIds.add(event.id);
        return true;
      });
      
      this.events = uniqueEvents.sort((a, b) => b.created_at - a.created_at);
      console.log(`📝 Loaded ${this.events.length} unique recent events`);

      // Start real-time subscription for new events
      this.startRealtimeSubscription();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      this.connectionRetries = 0; // Reset retry counter on success
      console.log("✅ Nostr service initialized");
      
    } catch (error) {
      console.error("❌ Failed to initialize Nostr service:", error);
      
      this.connectionRetries++;
      
      // Only retry if we haven't exceeded max retries
      if (this.connectionRetries < this.maxRetries) {
        const delay = Math.min(10000 * this.connectionRetries, 60000); // Exponential backoff, max 1 minute
        console.log(`🔄 Retrying Nostr service initialization in ${delay/1000}s... (attempt ${this.connectionRetries}/${this.maxRetries})`);
        
        setTimeout(() => {
          this.initialize();
        }, delay);
      } else {
        console.error("❌ Max retries exceeded, giving up on Nostr initialization");
      }
    } finally {
      this.isInitializing = false;
    }
  }

  private startRealtimeSubscription() {
    try {
      const since = Math.floor(Date.now() / 1000);
      
      console.log("📡 Starting real-time subscription...");
      
      const sub = this.pool.subscribeMany(this.relays, [
        {
          kinds: [1],
          since: since
        }
      ], {
        onevent: async (event: NostrEvent) => {
          try {
            // Aggressive duplicate prevention - skip immediately if seen
            if (this.seenEventIds.has(event.id)) {
              // Don't log every duplicate to reduce noise
              return;
            }
            
            console.log("📡 New Nostr event received:", event.id.slice(0, 8));
            
            // Mark as seen immediately to prevent race conditions
            this.seenEventIds.add(event.id);
            
            // Update last event time for health monitoring
            this.lastEventTime = Date.now();
            
            // Add to local events
            this.events.unshift(event);
            
            // Keep only latest 200 events in memory (increased for more variety)
            if (this.events.length > 200) {
              this.events = this.events.slice(0, 200);
            }
            
            // Clean up old event IDs to prevent memory leak
            if (this.seenEventIds.size > 1000) {
              const oldIds = Array.from(this.seenEventIds).slice(0, 500);
              oldIds.forEach(id => this.seenEventIds.delete(id));
            }
            
            // Convert to feed item and notify callbacks
            const feedItem = await this.eventToFeedItem(event);
            if (feedItem) {
              console.log(`🖼️ New image(s) found: ${feedItem.images.length} image(s)`);
              
              this.updateCallbacks.forEach(callback => {
                try {
                  callback(feedItem);
                } catch (e) {
                  console.error("Error in update callback:", e);
                }
              });
            }
          } catch (error) {
            console.error("Error processing event:", error);
          }
        },
        oneose: () => {
          console.log("📡 Nostr subscription established");
        },
        onclose: (reason) => {
          console.log("📡 Nostr subscription closed:", reason);
          
          // Attempt to reconnect after delay
          setTimeout(() => {
            console.log("🔄 Attempting to restart subscription...");
            this.startRealtimeSubscription();
          }, 5000);
        }
      });
      
      // Store subscription reference for cleanup
      this.currentSubscription = sub;
      
    } catch (error) {
      console.error("Error starting real-time subscription:", error);
      
      // Retry after delay
      setTimeout(() => {
        this.startRealtimeSubscription();
      }, 10000);
    }
  }
  
  private healthMonitoringStarted = false;
  
  private startHealthMonitoring() {
    if (this.healthMonitoringStarted) {
      return;
    }
    
    this.healthMonitoringStarted = true;
    
    // Monitor connection health every 30 seconds
    setInterval(() => {
      const timeSinceLastEvent = Date.now() - this.lastEventTime;
      
      // If no events for 3 minutes, restart subscription
      if (timeSinceLastEvent > 180000) {
        console.log("⚠️ No events received for 3 minutes, restarting subscription");
        
        if (this.currentSubscription) {
          try {
            this.currentSubscription.close();
          } catch (e) {
            console.error("Error closing subscription:", e);
          }
        }
        
        this.startRealtimeSubscription();
        this.lastEventTime = Date.now();
      }
    }, 30000);
    
    // Log health status every 5 minutes
    setInterval(() => {
      console.log(`🏥 Health check - Events: ${this.events.length}, Seen images: ${this.seenImages.size}, Event IDs: ${this.seenEventIds.size}, Callbacks: ${this.updateCallbacks.length}`);
    }, 300000);
  }

  async getFeedItems(limit: number = 20): Promise<NostrFeedItem[]> {
    const feedItems: NostrFeedItem[] = [];
    const eventsToProcess = this.events.slice(0, limit);
    
    for (const event of eventsToProcess) {
      const feedItem = await this.eventToFeedItem(event);
      if (feedItem) {
        feedItems.push(feedItem);
      }
    }
    
    return feedItems;
  }

  private async eventToFeedItem(event: NostrEvent): Promise<NostrFeedItem | null> {
    if (!event.id || !event.pubkey || !event.content) return null;

    // 🎬 NEW: Classify ALL media types from content
    const classifiedContent = MediaClassifier.classifyContent(event.content);
    
    // Check if we have any NEW media (not just images)
    const hasNewMedia = classifiedContent.totalCount > 0;
    if (!hasNewMedia) return null;

    // Add all media types to time machine
    const timestamp = event.created_at * 1000; // Convert to milliseconds
    const eventData = {
      id: event.id,
      pubkey: event.pubkey,
      content: event.content,
      created_at: event.created_at
    };

    // Add images to time machine
    for (const image of classifiedContent.images) {
      const correctCategory = await imageClassifier.classifyImage(image.url, event.content);
      timeMachine.addMediaItem({
        url: image.url,
        timestamp,
        eventId: event.id,
        eventData,
        type: 'image',
        subtype: image.subtype,
        title: image.title,
        thumbnail: image.thumbnail,
        category: correctCategory
      });
    }

    // Add videos to time machine
    for (const video of classifiedContent.videos) {
      timeMachine.addMediaItem({
        url: video.url,
        timestamp,
        eventId: event.id,
        eventData,
        type: 'video',
        subtype: video.subtype,
        title: video.title,
        thumbnail: video.thumbnail
      });
    }

    // Add audio to time machine
    for (const audio of classifiedContent.audio) {
      timeMachine.addMediaItem({
        url: audio.url,
        timestamp,
        eventId: event.id,
        eventData,
        type: 'audio',
        subtype: audio.subtype,
        title: audio.title
      });
    }

    // Add documents to time machine
    for (const doc of classifiedContent.documents) {
      timeMachine.addMediaItem({
        url: doc.url,
        timestamp,
        eventId: event.id,
        eventData,
        type: 'document',
        subtype: doc.subtype,
        title: doc.title
      });
    }

    // Add links to time machine
    for (const link of classifiedContent.links) {
      timeMachine.addMediaItem({
        url: link.url,
        timestamp,
        eventId: event.id,
        eventData,
        type: 'link',
        title: link.title
      });
    }

    // Legacy compatibility - create old format for images
    const legacyImages = classifiedContent.images.map(img => ({
      url: img.url,
      category: imageClassifier.getRandomPlacementZone(),
      correctCategory: 'art' // Default for now
    }));

    // Add to legacy cache for backward compatibility
    legacyImages.forEach(img => {
      this.addToImageCache(img.url, event, img.correctCategory);
    });

    // Get author profile info
    const author = await this.getAuthorInfo(event.pubkey);

    console.log(`🎬 New multi-media event: ${classifiedContent.images.length} images, ${classifiedContent.videos.length} videos, ${classifiedContent.audio.length} audio, ${classifiedContent.documents.length} docs, ${classifiedContent.links.length} links`);

    return {
      id: event.id,
      pubkey: event.pubkey,
      content: event.content,
      created_at: event.created_at,
      media: {
        images: classifiedContent.images,
        videos: classifiedContent.videos,
        audio: classifiedContent.audio,
        documents: classifiedContent.documents,
        links: classifiedContent.links,
        totalCount: classifiedContent.totalCount
      },
      images: legacyImages, // Legacy compatibility
      author
    };
  }

  private async getAuthorInfo(pubkey: string): Promise<{ name?: string; picture?: string } | undefined> {
    // Check cache first
    if (this.profileCache.has(pubkey)) {
      return this.profileCache.get(pubkey);
    }

    try {
      // Query for profile metadata with timeout (kind 0)
      const profilePromise = this.pool.querySync(this.relays, {
        kinds: [0],
        authors: [pubkey],
        limit: 1
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile query timeout')), 5000)
      );
      
      const profiles = await Promise.race([profilePromise, timeoutPromise]) as NostrEvent[];

      if (profiles.length > 0) {
        try {
          const profileData = JSON.parse(profiles[0]?.content || '{}');
          const profile = (profileData as any) || {};
          const authorInfo = {
            name: profile.name || profile.display_name,
            picture: profile.picture
          };
          
          // Cache the result
          this.profileCache.set(pubkey, authorInfo);
          return authorInfo;
        } catch (e) {
          console.warn("Failed to parse profile for", pubkey.slice(0, 8));
        }
      }
    } catch (error) {
      // Don't log timeout errors as they're expected
      if (!(error as Error).message?.includes('timeout')) {
        console.warn("Failed to fetch profile for", pubkey.slice(0, 8), error);
      }
    }
    
    return undefined;
  }

  // Get real-time updates for SSE
  subscribeToUpdates(callback: (item: NostrFeedItem) => void) {
    this.updateCallbacks.push(callback);
  }

  // Get cached images for quick startup
  getCachedImages(): string[] {
    return this.imageCache.map(item => item.url);
  }

  // Get events (for route access)
  getEvents() {
    return this.events;
  }

  // Get cached images with their associated event data
  getCachedImagesWithData(): Array<{ imageUrl: string; eventId?: string; eventData?: any; correctCategory?: string }> {
    return this.imageCache.map(cacheItem => {
      // Find the event that contains this image
      const event = this.events.find(e => e.content && e.content.includes(cacheItem.url));
      return {
        imageUrl: cacheItem.url,
        correctCategory: cacheItem.correctCategory,
        eventId: event?.id,
        eventData: event ? {
          id: event.id,
          pubkey: event.pubkey,
          content: event.content,
          created_at: event.created_at
        } : null
      };
    });
  }

  private addToImageCache(imageUrl: string, eventData?: any, correctCategory: string = 'art') {
    // Add to front of cache with metadata
    this.imageCache.unshift({
      url: imageUrl,
      correctCategory: correctCategory,
      timestamp: Date.now()
    });
    
    // Circular cache: keep only last 400 images
    if (this.imageCache.length > this.maxCacheSize) {
      const removed = this.imageCache.slice(this.maxCacheSize);
      this.imageCache = this.imageCache.slice(0, this.maxCacheSize);
      
      // Remove old images from seenImages set to allow them to reappear later
      removed.forEach(item => {
        this.seenImages.delete(item.url);
      });
      
      console.log(`🔄 Cache rotated: removed ${removed.length} old images, now ${this.imageCache.length} in cache`);
    }
    
    // Save to persistent storage
    this.saveImageCache();
  }

  private saveImageCache() {
    try {
      // Save to a simple file-based cache (server-side)
      const cacheData = {
        images: this.imageCache,
        timestamp: Date.now(),
        maxSize: this.maxCacheSize
      };
      
      // Save to file using Bun
      const cacheFile = Bun.file("image-cache.json");
      Bun.write(cacheFile, JSON.stringify(cacheData, null, 2));
      
      console.log(`💾 Image cache updated: ${this.imageCache.length}/${this.maxCacheSize} images`);
    } catch (error) {
      console.error("Error saving image cache:", error);
    }
  }

  private async loadImageCache() {
    try {
      console.log("📂 Loading image cache...");
      
      const cacheFile = Bun.file("image-cache.json");
      
      if (await cacheFile.exists()) {
        const cacheData = await cacheFile.json();
        
        if (cacheData && cacheData.images && Array.isArray(cacheData.images)) {
          // Handle both old format (strings) and new format (objects)
          this.imageCache = cacheData.images.map((item: any) => {
            if (typeof item === 'string') {
              // Old format - convert to new format
              return {
                url: item,
                correctCategory: 'art',
                timestamp: Date.now() - Math.random() * 86400000 // Random age up to 1 day
              };
            }
            return item; // New format
          }).slice(0, this.maxCacheSize);
          
          // Only mark recent images as seen (allow old ones to reappear)
          const recentThreshold = Date.now() - 3600000; // 1 hour ago
          this.imageCache.forEach((item: any) => {
            if (item.timestamp > recentThreshold) {
              this.seenImages.add(item.url);
            }
          });
          
          console.log(`📂 Loaded ${this.imageCache.length} cached images from file`);
        } else {
          console.log("📂 Cache file format invalid, starting fresh");
          this.imageCache = [];
        }
      } else {
        console.log("📂 No cache file found, starting fresh");
        this.imageCache = [];
      }
    } catch (error) {
      console.error("Error loading image cache:", error);
      this.imageCache = [];
    }
  }

  // Multi-media time machine integration methods
  getTimeMachineMedia(timeRange?: { start: number; end: number }, types?: string[]): TimeMachineMediaItem[] {
    if (timeRange) {
      return timeMachine.getMediaForTimeRange(timeRange, types as any);
    }
    return timeMachine.getCurrentMedia();
  }

  getMediaByType(type: string, timeRange?: { start: number; end: number }): TimeMachineMediaItem[] {
    return timeMachine.getMediaByType(type as any, timeRange);
  }

  getMediaStats(): Record<string, number> {
    return timeMachine.getMediaStats();
  }

  setActiveMediaTypes(types: string[]): void {
    timeMachine.setActiveMediaTypes(types as any);
  }

  cleanupDuplicates(): void {
    timeMachine.cleanupDuplicates();
  }

  // Legacy method
  getTimeMachineImages(timeRange?: { start: number; end: number }): any[] {
    return this.getTimeMachineMedia(timeRange, ['image']);
  }

  getTimeMachinePeriods(): Array<{start: number, end: number, count: number, label: string}> {
    return timeMachine.getTimePeriods(60); // 1-hour periods
  }

  getCurrentTimeRange(): { start: number; end: number } {
    return timeMachine.getCurrentTimeRange();
  }

  travelToTimeRange(timeRange: { start: number; end: number }): any[] {
    return timeMachine.travelToTimeRange(timeRange);
  }

  travelBackwards(minutes: number): any[] {
    return timeMachine.travelBackwards(minutes);
  }

  travelForwards(minutes: number): any[] {
    return timeMachine.travelForwards(minutes);
  }

  jumpToNow(): any[] {
    return timeMachine.jumpToNow();
  }

  travelToDate(date: Date, timespanMinutes: number = 60): any[] {
    return timeMachine.travelToDate(date, timespanMinutes);
  }

  findImageByEventId(eventId: string): any {
    return timeMachine.findImageByEventId(eventId);
  }

  findMediaByEventId(eventId: string): any {
    return timeMachine.findMediaByEventId(eventId);
  }

  getMediaByUser(pubkey: string): any[] {
    return timeMachine.getMediaByUser(pubkey);
  }

  async searchUserPosts(pubkey: string, page: number = 0, limit: number = 20): Promise<any[]> {
    try {
      console.log(`🔍 Searching Nostr network for posts from ${pubkey.slice(0, 8)} (page ${page})`);
      
      // Calculate time range for search (last 7 days for faster search)
      const now = Math.floor(Date.now() / 1000);
      const sevenDaysAgo = now - (7 * 24 * 60 * 60);
      const since = sevenDaysAgo - (page * 12 * 60 * 60); // Go back 12 hours per page
      
      return new Promise((resolve, reject) => {
        const foundPosts: any[] = [];
        let searchTimeout: any;
        let relayCount = 0;
        let completedRelays = 0;
        
        // Shorter timeout for better UX
        searchTimeout = setTimeout(() => {
          console.log(`⏰ Search timeout for ${pubkey.slice(0, 8)}: found ${foundPosts.length} posts from ${completedRelays}/${relayCount} relays`);
          resolve(foundPosts.slice(0, limit));
        }, 2000); // Reduced to 2 seconds
        
        // Use only fastest relays for user search
        const fastRelays = this.relays.slice(0, 3); // Use only first 3 relays
        relayCount = fastRelays.length;
        
        // Search specific relays for this user's posts
        const sub = this.pool.subscribeManyEose(
          fastRelays,
          [
            {
              kinds: [1],
              authors: [pubkey],
              since: since,
              limit: limit // Reduced limit for faster response
            }
          ],
          {
            onevent: (event: any) => {
              // Skip if we already have this event
              if (!foundPosts.some(p => p.id === event.id)) {
                foundPosts.push(event);
                console.log(`📡 Found user post: ${event.id.slice(0, 8)}`);
              }
              
              // Early resolve if we have enough posts
              if (foundPosts.length >= limit) {
                clearTimeout(searchTimeout);
                sub.close();
                const sortedPosts = foundPosts
                  .sort((a, b) => b.created_at - a.created_at)
                  .slice(0, limit);
                resolve(sortedPosts);
              }
            },
            oneose: () => {
              completedRelays++;
              console.log(`🔍 Relay ${completedRelays}/${relayCount} complete for ${pubkey.slice(0, 8)}`);
              
              // Resolve when all relays are done
              if (completedRelays >= relayCount) {
                clearTimeout(searchTimeout);
                
                const sortedPosts = foundPosts
                  .sort((a, b) => b.created_at - a.created_at)
                  .slice(0, limit);
                
                console.log(`✅ Search complete: ${sortedPosts.length} posts found`);
                resolve(sortedPosts);
              }
            }
          }
        );
        
        // Cleanup on timeout
        setTimeout(() => {
          try {
            sub.close();
          } catch (e) {
            // Ignore close errors
          }
        }, 2500);
        
      });
    } catch (error) {
      console.error('User post search error:', error);
      return [];
    }
  }

  // Make eventToFeedItem public for API use
  async processEventForMedia(event: any): Promise<any> {
    return this.eventToFeedItem(event);
  }

  async cleanup() {
    console.log("🔌 Cleaning up Nostr service...");
    
    try {
      if (this.currentSubscription) {
        this.currentSubscription.close();
      }
      this.pool.close(this.relays);
      
      // Cleanup time machine
      timeMachine.destroy();
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }
}

// Singleton instance for server use
export const nostrService = new NostrService();
