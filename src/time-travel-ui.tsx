/**
 * 🕰️ Time Travel UI Components
 * 
 * Interactive time travel scrollbar and controls for the image time machine
 */

import { TimeMachineImage, TimeRange } from './time-machine.js';

export interface TimeTravelControlsProps {
  currentTimeRange: TimeRange;
  totalImages: number;
  availablePeriods: Array<{
    start: number;
    end: number;
    count: number;
    label: string;
  }>;
  onTimeTravel: (timeRange: TimeRange) => void;
  onJumpToNow: () => void;
}

export function TimeTravelControls(props: TimeTravelControlsProps) {
  const { currentTimeRange, totalImages, availablePeriods, onTimeTravel, onJumpToNow } = props;

  // Calculate timeline position (0-100%) - Always extend to "now"
  const now = Date.now();
  const timelineStart = availablePeriods.length > 0 ? availablePeriods[availablePeriods.length - 1].start : now - 86400000;
  const timelineEnd = Math.max(
    availablePeriods.length > 0 ? availablePeriods[0].end : now,
    now // Always extend to current time
  );
  const timelineRange = timelineEnd - timelineStart;
  
  // Current timespan position (not just start)
  const currentStartPosition = timelineRange > 0 ? 
    ((currentTimeRange.start - timelineStart) / timelineRange) * 100 : 0;
  const currentEndPosition = timelineRange > 0 ? 
    ((currentTimeRange.end - timelineStart) / timelineRange) * 100 : 0;
  const currentWidth = currentEndPosition - currentStartPosition;
  
  // Calculate "now" position on timeline
  const nowPosition = timelineRange > 0 ? 
    ((now - timelineStart) / timelineRange) * 100 : 100;
  
  // Check if user is viewing "now" (within 10 minutes of current time)
  const isViewingNow = Math.abs(currentTimeRange.end - now) < 600000; // 10 minutes

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div id="time-travel-controls" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '100px',
      background: 'linear-gradient(135deg, rgba(10,10,10,0.98) 0%, rgba(20,20,30,0.95) 50%, rgba(10,10,10,0.98) 100%)',
      zIndex: 10000,
      padding: '20px 30px',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderBottom: '3px solid rgba(124,58,237,0.4)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)'
    }}>
      {/* Professional Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '20px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            background: 'rgba(124,58,237,0.2)',
            borderRadius: '20px',
            border: '1px solid rgba(124,58,237,0.4)'
          }}>
            <span>🎬</span>
            <span>Timeline</span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: 0.8
          }}>
            <span>📸</span>
            <span>{totalImages.toLocaleString()}</span>
            <span style={{ opacity: 0.6 }}>images</span>
          </div>
          
          {/* Time Window Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            background: 'rgba(59,130,246,0.2)',
            borderRadius: '16px',
            border: '1px solid rgba(59,130,246,0.4)',
            fontSize: '11px'
          }}>
            <span>⏱️</span>
            <button onclick="adjustTimeWindow(30)" style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              fontSize: '10px'
            }} 
            onmouseenter="this.style.background='rgba(255,255,255,0.1)'"
            onmouseleave="this.style.background='none'"
            title="Set 30 minute window">30m</button>
            <button onclick="adjustTimeWindow(60)" style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              fontSize: '10px'
            }}
            onmouseenter="this.style.background='rgba(255,255,255,0.1)'"
            onmouseleave="this.style.background='none'"
            title="Set 1 hour window">1h</button>
            <button onclick="adjustTimeWindow(120)" style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              fontSize: '10px'
            }}
            onmouseenter="this.style.background='rgba(255,255,255,0.1)'"
            onmouseleave="this.style.background='none'"
            title="Set 2 hour window">2h</button>
            <button onclick="adjustTimeWindow(180)" style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              fontSize: '10px'
            }}
            onmouseenter="this.style.background='rgba(255,255,255,0.1)'"
            onmouseleave="this.style.background='none'"
            title="Set 3 hour window">3h</button>
            <button onclick="adjustTimeWindow(360)" style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              fontSize: '10px'
            }}
            onmouseenter="this.style.background='rgba(255,255,255,0.1)'"
            onmouseleave="this.style.background='none'"
            title="Set 6 hour window">6h</button>
          </div>
          
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            background: isViewingNow ? 'rgba(16,185,129,0.2)' : 'rgba(255,107,107,0.2)',
            borderRadius: '20px',
            border: isViewingNow ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,107,107,0.4)',
            color: isViewingNow ? '#10b981' : '#ff6b6b',
            fontWeight: 'bold',
            fontSize: '11px'
          }}>
            {isViewingNow ? (
              <>
                <span style={{ color: '#10b981' }}>●</span>
                <span>LIVE</span>
              </>
            ) : (
              <>
                <span>⏰</span>
                <span>{formatRelativeTime(currentTimeRange.end)}</span>
              </>
            )}
          </div>
        </div>
        
        <div style={{ 
          fontSize: '10px', 
          opacity: 0.6,
          fontFamily: 'Monaco, "Courier New", monospace',
          letterSpacing: '0.5px'
        }}>
          {formatDateTime(currentTimeRange.start)} → {formatDateTime(currentTimeRange.end)}
        </div>
      </div>

      {/* Professional Video Editor Timeline */}
      <div 
        id="timeline-container"
        style={{
          position: 'relative',
          height: '50px',
          background: 'linear-gradient(135deg, rgba(15,15,25,0.9) 0%, rgba(25,25,35,0.95) 50%, rgba(15,15,25,0.9) 100%)',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '2px solid rgba(124,58,237,0.4)',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 16px rgba(124,58,237,0.2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onmouseenter="this.style.borderColor = 'rgba(124,58,237,0.7)'; this.style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 20px rgba(124,58,237,0.4)'"
        onmouseleave="this.style.borderColor = 'rgba(124,58,237,0.4)'; this.style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 16px rgba(124,58,237,0.2)'"
      >
        
        {/* Timeline Track */}
        <div 
          id="timeline-track"
          style={{
            position: 'absolute',
            top: '8px',
            left: '10px',
            right: '10px',
            height: '34px',
            background: 'linear-gradient(90deg, rgba(60,60,80,0.8) 0%, rgba(80,80,100,0.9) 50%, rgba(16,185,129,0.3) 100%)',
            borderRadius: '8px',
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden'
          }}
          onclick={`handleTimelineClick(event)`}
        >
        
          {/* Video Editor Style Waveform/Density Visualization */}
          {availablePeriods.map((period, index) => {
            const periodStart = ((period.start - timelineStart) / timelineRange) * 100;
            const periodWidth = ((period.end - period.start) / timelineRange) * 100;
            const intensity = Math.min(period.count / 30, 1); // Max intensity at 30 images
            
            // Color coding: Recent = green, older = blue/purple
            const isRecent = (now - period.end) < 3600000; // Within last hour
            const baseColor = isRecent ? '16, 185, 129' : '59, 130, 246';
            
            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: `${periodStart}%`,
                  width: `${periodWidth}%`,
                  height: '100%',
                  background: `linear-gradient(180deg, 
                    rgba(${baseColor}, ${0.6 + intensity * 0.4}) 0%, 
                    rgba(${baseColor}, ${0.3 + intensity * 0.3}) 50%,
                    rgba(${baseColor}, ${0.2 + intensity * 0.2}) 100%)`,
                  borderRadius: '3px',
                  border: isRecent ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  boxShadow: `inset 0 1px 3px rgba(0,0,0,0.3)`
                }}
                title={`${period.label} - ${period.count} images`}
              />
            );
          })}

          {/* Current Timespan Selection - Video Editor Style */}
          <div
            id="timespan-selector"
            style={{
              position: 'absolute',
              left: `${currentStartPosition}%`,
              width: `${currentWidth}%`,
              height: '100%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(124,58,237,0.4) 50%, rgba(255,255,255,0.25) 100%)',
              border: '2px solid rgba(255,255,255,0.8)',
              borderRadius: '6px',
              boxShadow: '0 0 20px rgba(124,58,237,0.6), inset 0 1px 2px rgba(255,255,255,0.3)',
              transition: 'all 0.2s ease',
              zIndex: 3
            }}
          >
            {/* Left Handle */}
            <div
              id="left-handle"
              style={{
                position: 'absolute',
                left: '-4px',
                top: '50%',
                width: '8px',
                height: '20px',
                background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
                borderRadius: '4px',
                transform: 'translateY(-50%)',
                cursor: 'ew-resize',
                border: '1px solid rgba(0,0,0,0.3)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
              }}
              title="Drag to adjust start time"
            />
            
            {/* Right Handle */}
            <div
              id="right-handle"
              style={{
                position: 'absolute',
                right: '-4px',
                top: '50%',
                width: '8px',
                height: '20px',
                background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
                borderRadius: '4px',
                transform: 'translateY(-50%)',
                cursor: 'ew-resize',
                border: '1px solid rgba(0,0,0,0.3)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
              }}
              title="Drag to adjust end time"
            />
            
            {/* Center Drag Area */}
            <div
              style={{
                position: 'absolute',
                left: '8px',
                right: '8px',
                top: '0',
                height: '100%',
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                color: 'rgba(255,255,255,0.9)',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)'
              }}
              title="Drag to move time window"
            >
              {Math.round((currentTimeRange.end - currentTimeRange.start) / (60 * 60 * 1000) * 10) / 10}h window
            </div>
          </div>

          {/* Future Area Indicator - Shows timeline extends beyond current images */}
          {nowPosition < 100 && (
            <div style={{
              position: 'absolute',
              left: `${nowPosition}%`,
              top: '0',
              width: `${100 - nowPosition}%`,
              height: '100%',
              background: 'rgba(100, 100, 100, 0.2)',
              borderLeft: '1px dashed rgba(255, 255, 255, 0.3)'
            }}
            title="Future - No images yet"
            />
          )}

          {/* "Now" Line Marker - Shows current time position */}
          <div style={{
            position: 'absolute',
            left: `${nowPosition}%`,
            top: '0',
            width: '3px',
            height: '100%',
            background: 'linear-gradient(180deg, rgba(16, 185, 129, 1) 0%, rgba(16, 185, 129, 0.6) 100%)',
            transform: 'translateX(-50%)',
            zIndex: 2,
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)'
          }} />

          {/* "Now" Button - Positioned at current time */}
          <div style={{
            position: 'absolute',
            left: `${nowPosition}%`,
            top: '-8px',
            width: '40px',
            height: '16px',
            background: 'rgba(16, 185, 129, 0.95)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.8)',
            transform: 'translateX(-50%)',
            zIndex: 3
          }}
          onclick={`event.stopPropagation(); jumpToNow()`}
          onmouseenter="this.style.transform = 'translateX(-50%) scale(1.1)'"
          onmouseleave="this.style.transform = 'translateX(-50%) scale(1)'"
          title="Jump to NOW - Latest images">
            NOW
          </div>
        </div>
      </div>

      {/* JavaScript for Time Travel Controls */}
      <script>{`
        // Enhanced time travel control functions
        window.timeMachineState = {
          currentTimeRange: ${JSON.stringify(currentTimeRange)},
          availablePeriods: ${JSON.stringify(availablePeriods)},
          timelineStart: ${timelineStart},
          timelineEnd: ${timelineEnd},
          now: ${now},
          isViewingNow: ${isViewingNow}
        };

        // Removed individual travel functions - only timeline click and jump to now

        window.jumpToNow = function() {
          console.log('🕰️ Jumping to now');
          
          fetch('/api/time-travel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'now' 
            })
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              window.location.reload();
            }
          })
          .catch(console.error);
        };

        // Time window adjustment function
        window.adjustTimeWindow = function(minutes) {
          console.log('⏱️ Adjusting time window to:', minutes, 'minutes');
          
          // Calculate center of current timespan
          const currentCenter = (window.timeMachineState.currentTimeRange.start + window.timeMachineState.currentTimeRange.end) / 2;
          const newDurationMs = minutes * 60 * 1000;
          
          const newTimeRange = {
            start: currentCenter - (newDurationMs / 2),
            end: currentCenter + (newDurationMs / 2)
          };
          
          // Visual feedback
          const buttons = document.querySelectorAll('[onclick*="adjustTimeWindow"]');
          buttons.forEach(btn => {
            btn.style.background = 'none';
            btn.style.color = 'rgba(255,255,255,0.8)';
          });
          
          // Highlight selected button
          const selectedButton = document.querySelector('[onclick*="adjustTimeWindow(' + minutes + ')"]');
          if (selectedButton) {
            selectedButton.style.background = 'rgba(59,130,246,0.4)';
            selectedButton.style.color = 'white';
          }
          
          // Update visual immediately
          updateTimespanVisual(newTimeRange);
          currentTimespan = newTimeRange;
          
          // Update images
          window.updateImagesForTimeRange(newTimeRange);
          
          // Save to server and reload to ensure persistence
          fetch('/api/time-travel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'set-window', 
              timeRange: newTimeRange
            })
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              console.log('⏱️ Time window saved:', minutes + 'm - reloading to persist');
              // Smooth transition and reload to ensure settings persist
              document.body.style.opacity = '0.9';
              setTimeout(() => {
                window.location.reload();
              }, 200);
            }
          })
          .catch(console.error);
        };

        window.handleTimelineClick = function(event) {
          const rect = event.currentTarget.getBoundingClientRect();
          const clickX = event.clientX - rect.left;
          const percentage = Math.max(0, Math.min(1, clickX / rect.width)); // Clamp between 0-1
          
          // Calculate target timestamp
          const timelineRange = window.timeMachineState.timelineEnd - window.timeMachineState.timelineStart;
          const targetTimestamp = window.timeMachineState.timelineStart + (timelineRange * percentage);
          
          // Visual feedback - show loading state
          const timeline = document.getElementById('timeline-bar');
          if (timeline) {
            timeline.style.opacity = '0.7';
            timeline.style.transform = 'scale(0.98)';
          }
          
          console.log('🕰️ Timeline click:', {
            percentage: Math.round(percentage * 100) + '%',
            targetTime: new Date(targetTimestamp).toLocaleString(),
            isNearNow: Math.abs(targetTimestamp - window.timeMachineState.now) < 600000
          });
          
          // Calculate current window duration in minutes to preserve user's selection
          const currentDurationMinutes = (window.timeMachineState.currentTimeRange.end - window.timeMachineState.currentTimeRange.start) / (60 * 1000);
          
          fetch('/api/time-travel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'goto', 
              timestamp: targetTimestamp,
              timespanMinutes: currentDurationMinutes
            })
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              // Smooth transition
              document.body.style.opacity = '0.9';
              setTimeout(() => {
                window.location.reload();
              }, 150);
            } else {
              // Reset visual state on error
              if (timeline) {
                timeline.style.opacity = '1';
                timeline.style.transform = 'scale(1)';
              }
            }
          })
          .catch(error => {
            console.error('Timeline navigation error:', error);
            if (timeline) {
              timeline.style.opacity = '1';
              timeline.style.transform = 'scale(1)';
            }
          });
        };

        // Professional Video Editor Timeline Controls
        let isDragging = false;
        let dragMode = 'none'; // 'timeline', 'left-handle', 'right-handle', 'timespan'
        let dragStartX = 0;
        let dragStartPosition = 0;
        let currentTimespan = {
          start: window.timeMachineState.currentTimeRange.start,
          end: window.timeMachineState.currentTimeRange.end
        };

        // Immediate image update function (no page reload)
        window.updateImagesForTimeRange = function(timeRange) {
          console.log('🎬 Updating images for timerange:', timeRange);
          
          fetch('/api/time-machine-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timeRange: timeRange })
          })
          .then(response => response.json())
          .then(data => {
            if (data.success && data.images) {
              // Update images immediately without page reload
              updateImageDisplay(data.images);
            }
          })
          .catch(console.error);
        };

        // Function to update image display in real-time
        function updateImageDisplay(images) {
          const container = document.querySelector('[style*="columns:auto 250px"]');
          if (!container) return;
          
          // Smooth fade out
          container.style.transition = 'opacity 0.3s ease';
          container.style.opacity = '0.3';
          
          setTimeout(() => {
            // Clear current images
            container.innerHTML = '';
            
            // Add new images
            images.forEach((img, index) => {
              const imageDiv = document.createElement('div');
              imageDiv.style.cssText = \`
                break-inside: avoid;
                margin-bottom: 16px;
                border-radius: 8px;
                overflow: hidden;
                background: rgba(255,255,255,0.05);
                cursor: pointer;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.4s ease;
              \`;
              
              imageDiv.onclick = () => window.open('/nostr/post/' + img.eventId, '_blank');
              
              imageDiv.innerHTML = \`
                <img src="\${img.url}" alt="Nostr Image" 
                     style="width:100%;height:auto;display:block;" loading="lazy"/>
                <div style="padding:12px;font-size:12px;opacity:0.8;">
                  <div style="display:inline-block;padding:4px 8px;background:#ec4899;border-radius:12px;margin-bottom:4px;">
                    \${img.correctCategory || 'Art'}
                  </div>
                </div>
              \`;
              
              container.appendChild(imageDiv);
              
              // Staggered animation
              setTimeout(() => {
                imageDiv.style.opacity = '1';
                imageDiv.style.transform = 'translateY(0)';
              }, index * 50);
            });
            
            // Fade container back in
            container.style.opacity = '1';
          }, 300);
        }

        // Professional video editor timeline interaction
        const timeline = document.getElementById('timeline-track');
        const timelineContainer = document.getElementById('timeline-container');
        const timespanSelector = document.getElementById('timespan-selector');
        const leftHandle = document.getElementById('left-handle');
        const rightHandle = document.getElementById('right-handle');
        
        if (timeline && timelineContainer) {
          // Handle detection
          function getHandleAtPosition(x, y) {
            const elements = document.elementsFromPoint(x, y);
            if (elements.some(el => el.id === 'left-handle')) return 'left-handle';
            if (elements.some(el => el.id === 'right-handle')) return 'right-handle';
            if (elements.some(el => el.id === 'timespan-selector')) return 'timespan';
            return 'timeline';
          }

          // Mouse down - determine drag mode
          timelineContainer.addEventListener('mousedown', function(e) {
            isDragging = true;
            dragStartX = e.clientX;
            dragMode = getHandleAtPosition(e.clientX, e.clientY);
            
            const rect = timeline.getBoundingClientRect();
            dragStartPosition = (e.clientX - rect.left) / rect.width;
            
            // Visual feedback based on drag mode
            timelineContainer.style.cursor = dragMode === 'timeline' ? 'grabbing' : 'ew-resize';
            timelineContainer.style.transform = 'scale(1.02)';
            
            console.log('🎬 Started dragging:', dragMode);
            e.preventDefault();
          });

          document.addEventListener('mousemove', function(e) {
            if (isDragging) {
              const rect = timeline.getBoundingClientRect();
              const currentX = e.clientX - rect.left;
              const percentage = Math.max(0, Math.min(1, currentX / rect.width));
              const timelineRange = window.timeMachineState.timelineEnd - window.timeMachineState.timelineStart;
              
              // Calculate new timespan based on drag mode
              let newTimespan = { ...currentTimespan };
              
              switch (dragMode) {
                case 'left-handle':
                  // Adjust start time
                  const newStart = window.timeMachineState.timelineStart + (timelineRange * percentage);
                  if (newStart < currentTimespan.end - 300000) { // Min 5 minutes
                    newTimespan.start = newStart;
                  }
                  break;
                  
                case 'right-handle':
                  // Adjust end time
                  const newEnd = window.timeMachineState.timelineStart + (timelineRange * percentage);
                  if (newEnd > currentTimespan.start + 300000) { // Min 5 minutes
                    newTimespan.end = newEnd;
                  }
                  break;
                  
                case 'timespan':
                  // Move entire timespan
                  const timespanDuration = currentTimespan.end - currentTimespan.start;
                  const centerTimestamp = window.timeMachineState.timelineStart + (timelineRange * percentage);
                  newTimespan.start = centerTimestamp - (timespanDuration / 2);
                  newTimespan.end = centerTimestamp + (timespanDuration / 2);
                  break;
                  
                case 'timeline':
                  // Create new timespan at clicked position - use current window duration or default
                  const clickTimestamp = window.timeMachineState.timelineStart + (timelineRange * percentage);
                  const currentDuration = currentTimespan.end - currentTimespan.start;
                  const defaultDuration = currentDuration > 0 ? currentDuration : (60 * 60 * 1000); // Use current or 1 hour
                  newTimespan.start = clickTimestamp - (defaultDuration / 2);
                  newTimespan.end = clickTimestamp + (defaultDuration / 2);
                  break;
              }
              
              // Update visual feedback immediately
              updateTimespanVisual(newTimespan);
              
              // Throttled image updates during drag
              if (!window.dragUpdateTimeout) {
                window.dragUpdateTimeout = setTimeout(() => {
                  window.updateImagesForTimeRange(newTimespan);
                  window.dragUpdateTimeout = null;
                }, 200); // Update every 200ms during drag
              }
              
              currentTimespan = newTimespan;
            }
          });

          document.addEventListener('mouseup', function(e) {
            if (isDragging) {
              isDragging = false;
              timeline.style.cursor = 'pointer';
              timeline.style.opacity = '1';
              
              // Trigger the actual navigation
              const rect = timeline.getBoundingClientRect();
              const finalX = e.clientX - rect.left;
              const percentage = Math.max(0, Math.min(1, finalX / rect.width));
              
              // Calculate target timestamp
              const timelineRange = window.timeMachineState.timelineEnd - window.timeMachineState.timelineStart;
              const targetTimestamp = window.timeMachineState.timelineStart + (timelineRange * percentage);
              
              console.log('🕰️ Drag navigation to:', {
                percentage: Math.round(percentage * 100) + '%',
                targetTime: new Date(targetTimestamp).toLocaleString()
              });
              
              // Navigate to new time - preserve current window duration
              const currentDurationMinutes = (currentTimespan.end - currentTimespan.start) / (60 * 1000);
              
              fetch('/api/time-travel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  action: 'goto', 
                  timestamp: targetTimestamp,
                  timespanMinutes: currentDurationMinutes
                })
              })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  document.body.style.opacity = '0.9';
                  setTimeout(() => window.location.reload(), 150);
                }
              })
              .catch(console.error);
            }
          });

          // Touch events for mobile
          timeline.addEventListener('touchstart', function(e) {
            isDragging = true;
            const touch = e.touches[0];
            dragStartX = touch.clientX;
            const rect = timeline.getBoundingClientRect();
            dragStartPosition = (touch.clientX - rect.left) / rect.width;
            e.preventDefault();
          });

          timeline.addEventListener('touchmove', function(e) {
            if (isDragging) {
              const touch = e.touches[0];
              const rect = timeline.getBoundingClientRect();
              const currentX = touch.clientX - rect.left;
              const percentage = Math.max(0, Math.min(1, currentX / rect.width));
              
              timeline.style.opacity = '0.8';
              e.preventDefault();
            }
          });

          timeline.addEventListener('touchend', function(e) {
            if (isDragging) {
              isDragging = false;
              timeline.style.opacity = '1';
              
              const touch = e.changedTouches[0];
              const rect = timeline.getBoundingClientRect();
              const finalX = touch.clientX - rect.left;
              const percentage = Math.max(0, Math.min(1, finalX / rect.width));
              
              const timelineRange = window.timeMachineState.timelineEnd - window.timeMachineState.timelineStart;
              const targetTimestamp = window.timeMachineState.timelineStart + (timelineRange * percentage);
              
              // Preserve current window duration for touch navigation
              const currentDurationMinutes = (window.timeMachineState.currentTimeRange.end - window.timeMachineState.currentTimeRange.start) / (60 * 1000);
              
              fetch('/api/time-travel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  action: 'goto', 
                  timestamp: targetTimestamp,
                  timespanMinutes: currentDurationMinutes
                })
              })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  window.location.reload();
                }
              })
              .catch(console.error);
            }
          });
        }

        // Visual update function for real-time feedback
        function updateTimespanVisual(timespan) {
          const selector = document.getElementById('timespan-selector');
          if (!selector) return;
          
          const timelineRange = window.timeMachineState.timelineEnd - window.timeMachineState.timelineStart;
          const startPos = ((timespan.start - window.timeMachineState.timelineStart) / timelineRange) * 100;
          const endPos = ((timespan.end - window.timeMachineState.timelineStart) / timelineRange) * 100;
          const width = endPos - startPos;
          
          selector.style.left = startPos + '%';
          selector.style.width = width + '%';
          
          // Update duration display
          const durationHours = (timespan.end - timespan.start) / (60 * 60 * 1000);
          const centerDiv = selector.querySelector('[title="Drag to move time window"]');
          if (centerDiv) {
            centerDiv.textContent = Math.round(durationHours * 10) / 10 + 'h window';
          }
          
          // Save the new window settings to server
          fetch('/api/time-travel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'set-window', 
              timeRange: timespan
            })
          }).catch(console.error);
        }

        // Keyboard shortcuts for professional workflow
        document.addEventListener('keydown', function(e) {
          if (e.target.tagName === 'INPUT') return; // Don't interfere with inputs
          
          switch(e.key) {
            case 'ArrowLeft':
              e.preventDefault();
              if (e.shiftKey) {
                // Shift + Left: Extend left (decrease start time)
                const newStart = currentTimespan.start - (15 * 60 * 1000); // 15 minutes
                const newTimespan = { start: newStart, end: currentTimespan.end };
                updateTimespanVisual(newTimespan);
                window.updateImagesForTimeRange(newTimespan);
                currentTimespan = newTimespan;
              } else {
                // Left: Move window left
                const duration = currentTimespan.end - currentTimespan.start;
                const newStart = currentTimespan.start - (15 * 60 * 1000);
                const newTimespan = { start: newStart, end: newStart + duration };
                updateTimespanVisual(newTimespan);
                window.updateImagesForTimeRange(newTimespan);
                currentTimespan = newTimespan;
              }
              break;
              
            case 'ArrowRight':
              e.preventDefault();
              if (e.shiftKey) {
                // Shift + Right: Extend right (increase end time)
                const newEnd = Math.min(currentTimespan.end + (15 * 60 * 1000), window.timeMachineState.now);
                const newTimespan = { start: currentTimespan.start, end: newEnd };
                updateTimespanVisual(newTimespan);
                window.updateImagesForTimeRange(newTimespan);
                currentTimespan = newTimespan;
              } else {
                // Right: Move window right
                const duration = currentTimespan.end - currentTimespan.start;
                const newEnd = Math.min(currentTimespan.end + (15 * 60 * 1000), window.timeMachineState.now);
                const newStart = newEnd - duration;
                const newTimespan = { start: newStart, end: newEnd };
                updateTimespanVisual(newTimespan);
                window.updateImagesForTimeRange(newTimespan);
                currentTimespan = newTimespan;
              }
              break;
              
            case ' ':
              e.preventDefault();
              // Spacebar: Jump to now
              window.jumpToNow();
              break;
          }
        });

        // Initialize window size button highlighting
        function initializeWindowButtons() {
          const currentDurationMinutes = (window.timeMachineState.currentTimeRange.end - window.timeMachineState.currentTimeRange.start) / (60 * 1000);
          const roundedDuration = Math.round(currentDurationMinutes);
          
          // Find and highlight the matching button
          const buttons = document.querySelectorAll('[onclick*="adjustTimeWindow"]');
          buttons.forEach(btn => {
            btn.style.background = 'none';
            btn.style.color = 'rgba(255,255,255,0.8)';
          });
          
          const matchingButton = document.querySelector('[onclick*="adjustTimeWindow(' + roundedDuration + ')"]');
          if (matchingButton) {
            matchingButton.style.background = 'rgba(59,130,246,0.4)';
            matchingButton.style.color = 'white';
          }
          
          console.log('⏱️ Current window:', roundedDuration + 'm', matchingButton ? '(button highlighted)' : '(custom duration)');
        }
        
        // Initialize on page load
        setTimeout(initializeWindowButtons, 100);

        console.log('🎬 Professional video editor timeline initialized');
        console.log('⌨️  Keyboard shortcuts: ← → (move), Shift+← → (extend), Space (jump to now)');
        console.log('⏱️  Window controls: 30m, 1h, 2h, 3h, 6h buttons for quick adjustment');
      `}</script>
    </div>
  );
}
