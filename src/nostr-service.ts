import { SimplePool, type Event as NostrEvent } from "nostr-tools";
import { imageClassifier } from "./image-classifier.js";
import { CONFIG } from "./config.js";
import { timeMachine, type TimeMachineImage } from "./time-machine.js";

export interface NostrFeedItem {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
  images: Array<{
    url: string;
    category: string; // Where it's currently placed
    correctCategory: string; // Where it should be (for game)
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
            // Skip duplicate events
            if (this.seenEventIds.has(event.id)) {
              return;
            }
            
            console.log("📡 New Nostr event received:", event.id.slice(0, 8));
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

    // Extract images from content (expanded regex for more image types and formats)
    const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|bmp|svg|tiff|ico)(?:\?[^\s]*)?)/gi;
    const allImages = event.content.match(imageRegex) || [];

    // For continuous feed, be more permissive with "duplicates"
    const newImageUrls = allImages.filter(img => {
      // Only skip if we've seen this image very recently (within last 30 minutes)
      const recentlySeen = Array.from(this.imageCache).find(cacheItem => 
        cacheItem.url === img && 
        (Date.now() - cacheItem.timestamp) < CONFIG.duplicateTimeWindow
      );
      
      if (recentlySeen) {
        return false;
      }
      
      return true;
    });

    // ONLY return notes that have NEW images
    if (newImageUrls.length === 0) return null;

    // Classify each image and create structured data for the game
    const classifiedImages = await Promise.all(
      newImageUrls.map(async (imageUrl) => {
        const correctCategory = await imageClassifier.classifyImage(imageUrl, event.content);
        const placementZone = imageClassifier.getRandomPlacementZone(); // Random placement for game
        return {
          url: imageUrl,
          category: placementZone, // Where it's placed (random)
          correctCategory: correctCategory // What it should be (for game logic)
        };
      })
    );

    // Add new images to cache with event data and correct categories
    classifiedImages.forEach(img => {
      this.addToImageCache(img.url, event, img.correctCategory);
      
      // Also add to time machine
      timeMachine.addImage({
        url: img.url,
        timestamp: event.created_at * 1000, // Convert to milliseconds
        eventId: event.id,
        eventData: {
          id: event.id,
          pubkey: event.pubkey,
          content: event.content,
          created_at: event.created_at
        },
        correctCategory: img.correctCategory,
        category: img.category
      });
    });

    // Get author profile info (optional, since we're not showing text)
    const author = await this.getAuthorInfo(event.pubkey);

    return {
      id: event.id,
      pubkey: event.pubkey,
      content: event.content,
      created_at: event.created_at,
      images: classifiedImages, // Classified images with categories
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
          const profileData = JSON.parse(profiles[0].content);
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

  // Time machine integration methods
  getTimeMachineImages(timeRange?: { start: number; end: number }): TimeMachineImage[] {
    if (timeRange) {
      return timeMachine.getImagesForTimeRange(timeRange);
    }
    return timeMachine.getCurrentImages();
  }

  getTimeMachinePeriods(): Array<{start: number, end: number, count: number, label: string}> {
    return timeMachine.getTimePeriods(60); // 1-hour periods
  }

  getCurrentTimeRange(): { start: number; end: number } {
    return timeMachine.getCurrentTimeRange();
  }

  travelToTimeRange(timeRange: { start: number; end: number }): TimeMachineImage[] {
    return timeMachine.travelToTimeRange(timeRange);
  }

  travelBackwards(minutes: number): TimeMachineImage[] {
    return timeMachine.travelBackwards(minutes);
  }

  travelForwards(minutes: number): TimeMachineImage[] {
    return timeMachine.travelForwards(minutes);
  }

  jumpToNow(): TimeMachineImage[] {
    return timeMachine.jumpToNow();
  }

  travelToDate(date: Date, timespanMinutes: number = 60): TimeMachineImage[] {
    return timeMachine.travelToDate(date, timespanMinutes);
  }

  findImageByEventId(eventId: string): TimeMachineImage | null {
    return timeMachine.findImageByEventId(eventId);
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
