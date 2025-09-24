import { Layout, ModernDiscoveryFeed, NostrPostDetail } from "./src/views.tsx";
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
      
      // Fetch Nostr feed items and get time machine images for current time range
      const feedItems = await nostrService.getFeedItems(20);
      const timeMachineImages = nostrService.getTimeMachineImages();
      const currentTimeRange = nostrService.getCurrentTimeRange();
      const availablePeriods = nostrService.getTimeMachinePeriods();
      
      // Convert time machine images to the format expected by the UI
      const cachedImagesWithData = timeMachineImages.map(img => ({
        imageUrl: img.url,
        eventId: img.eventId,
        eventData: img.eventData,
        correctCategory: img.correctCategory
      }));
      
      console.log(`🕰️ Serving ${timeMachineImages.length} images from time range: ${new Date(currentTimeRange.start).toLocaleString()} - ${new Date(currentTimeRange.end).toLocaleString()}`);
      
      return html(
        <Layout title="Visual Nostr Discovery - Image Time Machine">
          <ModernDiscoveryFeed 
            items={feedItems} 
            cachedImagesWithData={cachedImagesWithData}
            displayMode={displayMode}
            timeMachineData={{
              currentTimeRange,
              availablePeriods,
              totalImages: timeMachine.getTotalImageCount()
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

    "/nostr/post/:eventId": {
      GET: async (req) => {
        const eventId = req.params.eventId;
        
        // First try to find in current events
        let event = nostrService.getEvents().find(e => e.id === eventId);
        
        // If not found, search in ALL time machine storage (not just current range)
        if (!event) {
          const imageWithEvent = nostrService.findImageByEventId(eventId);
          
          if (imageWithEvent && imageWithEvent.eventData) {
            event = imageWithEvent.eventData;
            console.log(`📸 Found event in time machine: ${eventId.slice(0, 8)}`);
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
            const itemHtml = String(<CategorizedImageItem item={feedItem} />);
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
            
            // Also trigger the JavaScript to add the image with event data and category
            const jsPayload = JSON.stringify({
              target: "body",
              swap: "beforeend",
              text: `<script>
                ${feedItem.images.map(img => 
                  `window.addNostrImage && window.addNostrImage('${img.url}', '${feedItem.id}', ${JSON.stringify({
                    id: feedItem.id,
                    pubkey: feedItem.pubkey,
                    content: feedItem.content,
                    created_at: feedItem.created_at
                  })}, '${img.category}', '${img.correctCategory}');`
                ).join('')}
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
