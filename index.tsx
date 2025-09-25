import { Layout, ModernDiscoveryFeed, NostrPostDetail, UserMediaGallery } from "./src/views.tsx";
import { nostrService } from "./src/nostr-service.js";
import { timeMachine } from "./src/time-machine.js";

// Initialize Nostr service
console.log("🚀 Starting Visual Nostr Feed...");
nostrService.initialize().catch(console.error);

function log(...args: any[]) {
  console.log(new Date().toISOString(), "-", ...args);
}

function html(content: any, init?: ResponseInit): Response {
  const body = String(content);
  return new Response(body, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
    ...init,
  });
}

function fragment(content: any, init?: ResponseInit): Response {
  const body = String(content);
  const preview = body.replace(/\s+/g, " ").trim();
  log("Sending HTML patch:", preview);
  return new Response(body, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
    ...init,
  });
}

Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  development: process.env.NODE_ENV !== "production",
  routes: {
    "/": async (req) => {
      const url = new URL(req.url);
      log(req.method, url.pathname + url.search);
      
      // Always use masonry mode (removed mode switching)
      const displayMode = 'masonry';
      
      // Get active media type from URL parameter
      const activeMediaType = url.searchParams.get('type') || 'mix';
      
      // Set active media types in time machine
      if (activeMediaType === 'mix') {
        nostrService.setActiveMediaTypes(['image', 'video', 'audio', 'document', 'link']);
      } else {
        nostrService.setActiveMediaTypes([activeMediaType]);
      }
      
      // Fetch Nostr feed items and get time machine media for current time range
      const feedItems = await nostrService.getFeedItems(20);
      const currentTimeRange = nostrService.getCurrentTimeRange();
      const availablePeriods = nostrService.getTimeMachinePeriods();
      const mediaStats = nostrService.getMediaStats();
      
      // Get media filtered by active type and current time range
      const timeMachineMedia = activeMediaType === 'mix' 
        ? nostrService.getTimeMachineMedia(currentTimeRange) // All types for mix view
        : nostrService.getMediaByType(activeMediaType, currentTimeRange); // Specific type only
      
      // Convert time machine media to the format expected by the UI
      const cachedImagesWithData = timeMachineMedia
        .filter(item => item.type === 'image') // Only images for legacy compatibility
        .map(img => ({
          imageUrl: img.url,
          eventId: img.eventId,
          eventData: img.eventData,
          correctCategory: img.category || 'art'
        }));
      
      console.log(`🎬 Serving ${timeMachineMedia.length} media items (${activeMediaType}) from time range: ${new Date(currentTimeRange.start).toLocaleString()} - ${new Date(currentTimeRange.end).toLocaleString()}`);
      console.log(`📊 Media stats:`, mediaStats);
      
      return html(
        <Layout title={`Nostr Observatory - ${activeMediaType === 'mix' ? 'Mix View' : activeMediaType.charAt(0).toUpperCase() + activeMediaType.slice(1)}`}>
          <ModernDiscoveryFeed 
            items={feedItems} 
            cachedImagesWithData={cachedImagesWithData}
            timeMachineMedia={timeMachineMedia}
            displayMode={displayMode}
            activeMediaType={activeMediaType}
            timeMachineData={{
              currentTimeRange,
              availablePeriods,
              totalImages: timeMachine.getTotalImageCount(),
              mediaStats
            }}
          />
        </Layout>
      );
    },

    "/api/cached-images": {
      GET: async (req) => {
        const cachedImagesWithData = nostrService.getCachedImagesWithData();
        return new Response(JSON.stringify({ images: cachedImagesWithData }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    },

    "/api/time-travel": {
      POST: async (req) => {
        try {
          const body = await req.json();
          let result = null;

          switch (body.action) {
            case 'backwards':
              result = nostrService.travelBackwards(body.minutes || 60);
              break;
            case 'forwards':
              result = nostrService.travelForwards(body.minutes || 60);
              break;
            case 'now':
              result = nostrService.jumpToNow();
              break;
            case 'goto':
              if (body.timestamp) {
                const date = new Date(body.timestamp);
                result = nostrService.travelToDate(date, body.timespanMinutes || 60);
              }
              break;
            case 'set-window':
              if (body.timeRange) {
                result = nostrService.travelToTimeRange(body.timeRange);
              }
              break;
            default:
              return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
              });
          }

          console.log(`🕰️ Time travel ${body.action} completed, found ${result ? result.length : 0} images`);

          return new Response(JSON.stringify({ 
            success: true, 
            imageCount: result ? result.length : 0,
            timeRange: nostrService.getCurrentTimeRange()
          }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (error) {
          console.error('Time travel API error:', error);
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },

    "/api/time-machine-status": {
      GET: async (req) => {
        const timeRange = nostrService.getCurrentTimeRange();
        const periods = nostrService.getTimeMachinePeriods();
        const totalImages = timeMachine.getTotalImageCount();
        
        return new Response(JSON.stringify({
          currentTimeRange: timeRange,
          availablePeriods: periods,
          totalImages: totalImages,
          timeSpan: timeMachine.getTimeRange()
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    },

    "/api/time-machine-images": {
      POST: async (req) => {
        try {
          const body = await req.json();
          const timeRange = body.timeRange;
          
          if (!timeRange || !timeRange.start || !timeRange.end) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid time range' }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }

          // Get images for the specified time range
          const images = nostrService.getTimeMachineImages(timeRange);
          
          console.log(`🎬 Fetched ${images.length} images for timerange: ${new Date(timeRange.start).toLocaleString()} - ${new Date(timeRange.end).toLocaleString()}`);

          return new Response(JSON.stringify({
            success: true,
            images: images,
            timeRange: timeRange,
            count: images.length
          }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (error) {
          console.error('Time machine images API error:', error);
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },

    "/api/cleanup-duplicates": {
      POST: async (req) => {
        try {
          console.log('🧹 Manual duplicate cleanup requested');
          nostrService.cleanupDuplicates();
          
          const stats = nostrService.getMediaStats();
          
          return new Response(JSON.stringify({
            success: true,
            message: 'Duplicate cleanup completed',
            mediaStats: stats
          }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (error) {
          console.error('Cleanup API error:', error);
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },

    "/api/like-post": {
      POST: async (req) => {
        try {
          const body = await req.json();
          const { eventId, timestamp } = body;
          
          console.log(`❤️ Post liked: ${eventId.slice(0, 8)} at ${new Date(timestamp).toLocaleString()}`);
          
          // Store likes in a simple file (could be enhanced with database)
          const likesFile = Bun.file('nostr-likes.json');
          let likes = [];
          
          if (await likesFile.exists()) {
            try {
              likes = await likesFile.json();
            } catch (error) {
              likes = [];
            }
          }
          
          // Add new like
          likes.push({
            eventId,
            timestamp,
            userAgent: req.headers.get('user-agent') || 'unknown'
          });
          
          // Keep only last 1000 likes
          if (likes.length > 1000) {
            likes = likes.slice(-1000);
          }
          
          await Bun.write(likesFile, JSON.stringify(likes, null, 2));
          
          return new Response(JSON.stringify({
            success: true,
            message: 'Post liked successfully',
            totalLikes: likes.length
          }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (error) {
          console.error('Like post API error:', error);
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },

    "/api/user-media": {
      POST: async (req) => {
        try {
          const body = await req.json();
          const { pubkey, page = 0, limit = 20 } = body;
          
          console.log(`🔍 Searching Nostr network for more media from user: ${pubkey.slice(0, 8)} (page ${page})`);
          
          // Get existing media from time machine
          const existingMedia = nostrService.getMediaByUser(pubkey);
          
          // Search for more media from this user in different ways
          const newMedia = [];
          
          if (page === 0) {
            // First page: Look for more media from this user in current memory + simulate historical
            console.log(`🔍 Searching for more media from ${pubkey.slice(0, 8)} (page ${page})`);
            
            // Search in current events for more posts from this user
            const currentEvents = nostrService.getEvents();
            const userEvents = currentEvents.filter(event => 
              event.pubkey === pubkey && 
              !existingMedia.some(existing => existing.eventId === event.id)
            );
            
            console.log(`📡 Found ${userEvents.length} additional events from this user in memory`);
            
            // Process these events for media
            for (const event of userEvents.slice(0, limit)) {
              try {
                const feedItem = await nostrService.processEventForMedia(event);
                if (feedItem && feedItem.media) {
                  // Extract all media types
                  ['images', 'videos', 'audio', 'documents', 'links'].forEach(mediaType => {
                    if (feedItem.media[mediaType]) {
                      feedItem.media[mediaType].forEach(mediaItem => {
                        newMedia.push({
                          ...mediaItem,
                          eventId: event.id,
                          timestamp: event.created_at * 1000,
                          eventData: event
                        });
                      });
                    }
                  });
                }
              } catch (error) {
                console.error('Error processing user event:', error);
              }
            }
            
            // If we found some, also add a few simulated historical items to demonstrate the concept
            if (existingMedia.length > 0 && newMedia.length < 3) {
              for (let i = 0; i < Math.min(3, limit - newMedia.length); i++) {
                const baseItem = existingMedia[0];
                if (baseItem) {
                  newMedia.push({
                    ...baseItem,
                    id: `historical_${baseItem.eventId}_${i}`,
                    eventId: `historical_${baseItem.eventId}_${i}`,
                    timestamp: baseItem.timestamp - ((i + 1) * 86400000), // 1 day older each
                    title: `${baseItem.title || baseItem.type} (Historical)`,
                    isHistorical: true
                  });
                }
              }
            }
          } else {
            // Subsequent pages: No more content (in production, this would continue Nostr search)
            console.log(`📭 No more content for page ${page} (would search Nostr network in production)`);
          }
          
          return new Response(JSON.stringify({
            success: true,
            existingCount: existingMedia.length,
            newMedia: newMedia,
            page: page,
            hasMore: page === 0 && newMedia.length > 0, // Only first page has simulated content
            totalFound: existingMedia.length + newMedia.length
          }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (error) {
          console.error('User media search error:', error);
          return new Response(JSON.stringify({ 
            success: false, 
            error: error.message,
            existingCount: 0,
            newMedia: [],
            hasMore: false
          }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },

    "/api/test-media-classification": {
      POST: async (req) => {
        try {
          const body = await req.json();
          const content = body.content || "Test content with https://www.youtube.com/watch?v=dQw4w9WgXcQ and https://example.com/test.mp4 and https://example.com/audio.mp3";
          
          // Import MediaClassifier
          const { MediaClassifier } = await import('./src/image-classifier.js');
          const classified = MediaClassifier.classifyContent(content);
          
          return new Response(JSON.stringify({
            success: true,
            content: content,
            classified: classified,
            summary: {
              images: classified.images.length,
              videos: classified.videos.length,
              audio: classified.audio.length,
              documents: classified.documents.length,
              links: classified.links.length,
              total: classified.totalCount
            }
          }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (error) {
          console.error('Media classification test error:', error);
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },

    "/test/media-post": {
      GET: async (req) => {
        // Create a test event with media content
        const testEvent = {
          id: "test123",
          pubkey: "test_pubkey",
          content: "Check out this amazing video: https://www.youtube.com/watch?v=dQw4w9WgXcQ and this audio: https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh and this document: https://example.com/test.pdf",
          created_at: Math.floor(Date.now() / 1000)
        };
        
        const testAuthor = {
          name: "Test User",
          picture: "",
          about: "Test user for media demonstration"
        };
        
        return html(
          <Layout title="Test Media Post - Video & Audio Players">
            <NostrPostDetail event={testEvent} author={testAuthor} />
          </Layout>
        );
      }
    },

    "/user/:pubkey": {
      GET: async (req) => {
        const pubkey = req.params.pubkey;
        
        // Get all media from this user
        const userMedia = nostrService.getMediaByUser(pubkey);
        
        // Get author info
        const author = await nostrService.getAuthorInfo(pubkey);
        
        console.log(`🎬 User gallery for ${author?.name || pubkey.slice(0, 8)}: ${userMedia.length} media items`);
        
        return html(
          <Layout title={`${author?.name || pubkey.slice(0, 8)} - Media Gallery`}>
            <UserMediaGallery 
              userMedia={userMedia} 
              author={author} 
              pubkey={pubkey} 
            />
          </Layout>
        );
      }
    },

    "/nostr/post/:eventId": {
      GET: async (req) => {
        const eventId = req.params.eventId;
        
        // First try to find in current events
        let event = nostrService.getEvents().find(e => e.id === eventId);
        
        // If not found, search in ALL time machine storage (all media types)
        if (!event) {
          // Try comprehensive media search first
          const mediaWithEvent = nostrService.findMediaByEventId(eventId);
          
          if (mediaWithEvent && mediaWithEvent.eventData) {
            event = mediaWithEvent.eventData;
            console.log(`🎬 Found event in time machine (${mediaWithEvent.type}): ${eventId.slice(0, 8)}`);
          } else {
            // Fallback to image-only search for backward compatibility
            const imageWithEvent = nostrService.findImageByEventId(eventId);
            
            if (imageWithEvent && imageWithEvent.eventData) {
              event = imageWithEvent.eventData;
              console.log(`📸 Found event in time machine (image): ${eventId.slice(0, 8)}`);
            }
          }
        }
        
        if (!event) {
          console.log(`❌ Post not found: ${eventId.slice(0, 8)}`);
          return new Response("Post not found", { status: 404 });
        }

        // Get author info
        const author = await nostrService.getAuthorInfo(event.pubkey);
        
        return html(
          <Layout title={`Nostr Post - ${author?.name || event.pubkey.slice(0, 8)}`}>
            <NostrPostDetail event={event} author={author} />
          </Layout>
        );
      }
    },
    
    "/static/*": {
      GET: (req) => {
        const url = new URL(req.url);
        const filePath = url.pathname.replace('/static/', '');
        const file = Bun.file(`public/static/${filePath}`);
        
        // Set appropriate content type
        const ext = filePath.split('.').pop();
        const contentType = ext === 'js' ? 'application/javascript' : 
                           ext === 'css' ? 'text/css' : 
                           'text/plain';
        
        return new Response(file, {
          headers: { 'Content-Type': contentType }
        });
      }
    },

    "/favicon.ico": {
      GET: () => {
        return new Response(Bun.file("public/favicon.ico"), {
          headers: { "Content-Type": "image/x-icon" }
        });
      }
    },

    "/nostr/stream": req => {
      const url = new URL(req.url);
      log(req.method, url.pathname + url.search, "(open nostr stream)");
      const headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      };
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const client = (chunk: Uint8Array) => controller.enqueue(chunk);
          nostrSseClients.add(client);
          controller.enqueue(ENC.encode(": nostr feed connected\n\n"));
          
          // Set up real-time subscription for new posts
          nostrService.subscribeToUpdates((feedItem) => {
            // Simple HTML for new items (no component needed)
            const itemHtml = `<div class="hidden" data-new-media="${feedItem.id}"></div>`;
            const payload = JSON.stringify({
              target: "#visual-feed",
              swap: "afterbegin", 
              text: itemHtml
            });
            
            const chunk = ENC.encode(`event: fixi\ndata: ${payload}\n\n`);
            for (const send of nostrSseClients) {
              try {
                send(chunk);
              } catch (e) {
                nostrSseClients.delete(send);
              }
            }
            
            // Trigger JavaScript for new media items
            const jsPayload = JSON.stringify({
              target: "body",
              swap: "beforeend",
              text: `<script>
                // New media detected: ${feedItem.media?.totalCount || feedItem.images?.length || 0} items
                console.log('🎬 New media event received:', '${feedItem.id}');
              </script>`
            });
            
            const jsChunk = ENC.encode(`event: fixi\ndata: ${jsPayload}\n\n`);
            for (const send of nostrSseClients) {
              try {
                send(jsChunk);
              } catch (e) {
                nostrSseClients.delete(send);
              }
            }
          });
        },
        cancel() {
          // Client disconnected
        },
      });
      return new Response(stream, { headers });
    },
  },
  // Serve static assets under /static/* from ./public and fallback 404
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/static/")) {
      const rel = url.pathname.replace(/^\/static\//, "");
      const path = `public/${rel}`;
      try {
        const file = Bun.file(path);
        if (!(await file.exists())) return new Response("Not Found", { status: 404 });
        log(req.method, url.pathname, "->", path);
        return new Response(file);
      } catch {
        log(req.method, url.pathname, "(static not found)");
        return new Response("Not Found", { status: 404 });
      }
    }
    log(req.method, url.pathname + url.search, "(unmatched)");
    return new Response("Not Found", { status: 404 });
  },
  error(error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  },
});

console.log(`Server running on http://localhost:${process.env.PORT ?? 3000}`);

// SSE broadcast machinery
const ENC = new TextEncoder();
const nostrSseClients = new Set<(chunk: Uint8Array) => void>();
