/**
 * Fixi Extensions - Server-Sent Events Support
 * Extends Fixi with SSE capabilities for real-time updates
 */

(function() {
  'use strict';
  
  // Wait for Fixi to be available
  function waitForFixi(callback) {
    if (window.Fixi) {
      callback();
    } else {
      setTimeout(() => waitForFixi(callback), 10);
    }
  }
  
  waitForFixi(function() {
    console.log('🔌 Fixi Extensions loaded');
    
    // SSE Extension
    const SSEExtension = {
      connections: new Map(),
      
      init: function() {
        document.addEventListener('DOMContentLoaded', this.onReady.bind(this));
      },
      
      onReady: function() {
        // Find elements with ext-fx-sse-autostart
        const sseElements = document.querySelectorAll('[ext-fx-sse-autostart]');
        sseElements.forEach(el => {
          this.startSSE(el);
        });
      },
      
      startSSE: function(element) {
        const url = element.getAttribute('ext-fx-sse-autostart');
        const target = element.getAttribute('data-target');
        const swap = element.getAttribute('data-swap') || 'beforeend';
        
        if (!url || !target) {
          console.error('SSE element missing required attributes:', element);
          return;
        }
        
        console.log('🔌 Starting SSE connection to:', url);
        
        const eventSource = new EventSource(url);
        this.connections.set(element, eventSource);
        
        eventSource.onopen = function() {
          console.log('✅ SSE connection opened:', url);
        };
        
        eventSource.onerror = function(error) {
          console.error('❌ SSE connection error:', error);
        };
        
        eventSource.onmessage = function(event) {
          try {
            const data = JSON.parse(event.data);
            if (data.target && data.text) {
              window.Fixi.updateTarget(data.target, data.text, data.swap || swap);
            }
          } catch (e) {
            console.error('Failed to parse SSE message:', e);
          }
        };
        
        // Listen for custom event types
        eventSource.addEventListener('fixi', function(event) {
          try {
            const data = JSON.parse(event.data);
            if (data.target && data.text) {
              window.Fixi.updateTarget(data.target, data.text, data.swap || swap);
            }
          } catch (e) {
            console.error('Failed to parse fixi SSE event:', e);
          }
        });
        
        // Listen for image events
        eventSource.addEventListener('image', function(event) {
          try {
            const data = JSON.parse(event.data);
            if (window.addNostrImage) {
              window.addNostrImage(data.imageUrl, data.eventId, data.eventData, data.category, data.correctCategory);
            }
          } catch (e) {
            console.error('Failed to parse image SSE event:', e);
          }
        });
      },
      
      stopSSE: function(element) {
        const connection = this.connections.get(element);
        if (connection) {
          connection.close();
          this.connections.delete(element);
          console.log('🔌 SSE connection closed');
        }
      },
      
      stopAllSSE: function() {
        this.connections.forEach((connection, element) => {
          connection.close();
        });
        this.connections.clear();
        console.log('🔌 All SSE connections closed');
      }
    };
    
    // Initialize SSE Extension
    SSEExtension.init();
    
    // Expose SSE Extension
    window.Fixi.SSE = SSEExtension;
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
      SSEExtension.stopAllSSE();
    });
  });
})();
