/**
 * 🔞 Lightweight Content Filter System
 * Background AI classification with on-demand filtering
 */

let nsfwModel = null;
let isFilterActive = false;
let imageClassifications = new Map();
let classificationQueue = [];

// Simple image classification
window.classifyImage = function(imgElement) {
  if (!imgElement.complete) return;
  
  // Immediate URL-based classification for instant feedback
  const url = imgElement.src.toLowerCase();
  let quickCategory = 'Neutral';
  let quickConfidence = 0.3;
  
  if (url.includes('eporner') || url.includes('adult') || url.includes('porn') || url.includes('xxx')) {
    quickCategory = 'Porn';
    quickConfidence = 0.9;
  } else if (url.includes('sexy') || url.includes('bikini') || url.includes('picjj.com') || url.includes('klyker.com')) {
    quickCategory = 'Sexy';
    quickConfidence = 0.7;
  } else if (url.includes('hentai') || url.includes('anime')) {
    quickCategory = 'Hentai';
    quickConfidence = 0.8;
  }
  
  // Show immediate tag (will be updated by AI later)
  showSafetyTag(imgElement, quickCategory, quickConfidence);
  
  // Add to queue for background processing
  classificationQueue.push(imgElement);
  
  // Process if model is ready
  if (nsfwModel) {
    processQueue();
  }
};

// Load NSFWJS model in background
async function loadContentFilter() {
  try {
    console.log('🔞 Loading content filter...');
    
    // Load TensorFlow.js
    if (!window.tf) {
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
    }
    
    // Load NSFWJS
    if (!window.nsfwjs) {
      await loadScript('https://cdn.jsdelivr.net/npm/nsfwjs@4.2.1/dist/nsfwjs.min.js');
    }
    
    // Initialize model
    nsfwModel = await window.nsfwjs.load();
    console.log('✅ Content filter ready');
    
    // Process queued images
    processQueue();
    
  } catch (error) {
    console.log('⚠️ Content filter not available:', error.message);
  }
}

// Load script helper
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Process classification queue
async function processQueue() {
  if (!nsfwModel || classificationQueue.length === 0) return;
  
  const img = classificationQueue.shift();
  if (!img || !img.complete) return;
  
  try {
    const predictions = await nsfwModel.classify(img);
    const maxPred = predictions.reduce((max, pred) => 
      pred.probability > max.probability ? pred : max
    );
    
    // Enhanced classification with age rating
    let ageRating = '0+';
    let shouldBlur = false;
    
    if (maxPred.className === 'Porn' && maxPred.probability > 0.3) {
      ageRating = '18+';
      shouldBlur = true; // Always blur porn
    } else if (maxPred.className === 'Hentai' && maxPred.probability > 0.3) {
      ageRating = '18+';
      shouldBlur = true; // Always blur hentai
    } else if (maxPred.className === 'Sexy' && maxPred.probability > 0.4) {
      ageRating = '16+';
      shouldBlur = currentFilterLevel === '12+' || currentFilterLevel === '16+';
    } else if (maxPred.className === 'Drawing' && maxPred.probability > 0.7) {
      ageRating = '12+';
      shouldBlur = currentFilterLevel === '12+';
    }
    
    const classification = {
      category: maxPred.className,
      confidence: maxPred.probability,
      ageRating,
      shouldBlur: shouldBlur && isFilterActive
    };
    
    // Store classification
    imageClassifications.set(img.src, classification);
    
    console.log('🔞', img.src.slice(-20), '→', classification.category, Math.round(classification.confidence * 100) + '% (', ageRating, ')');
    
    // Show safety classification tag
    showSafetyTag(img, maxPred.className, maxPred.probability);
    
    // Apply age rating filter if active
    if (isFilterActive && classification.shouldBlur) {
      applyBlur(img, ageRating);
    }
    
    // Apply category filter if active
    if (categoryFilterActive && !allowedCategories.includes(maxPred.className)) {
      const container = img.closest('.content-item')?.parentElement;
      if (container) {
        container.style.display = 'none';
      }
    }
    
  } catch (error) {
    console.error('Classification error:', error);
  }
  
  // Continue processing
  if (classificationQueue.length > 0) {
    setTimeout(processQueue, 50);
  }
}

// Show safety classification tag on image
function showSafetyTag(img, category, confidence) {
  const container = img.closest('.content-item');
  const safetyTag = container?.querySelector('.safety-tag');
  
  if (safetyTag) {
    // Set tag content and color
    safetyTag.textContent = category.toUpperCase();
    safetyTag.style.display = 'block';
    
    // Color-code by category
    if (category === 'Porn') {
      safetyTag.style.background = 'rgba(220,38,38,0.9)'; // Red
    } else if (category === 'Hentai') {
      safetyTag.style.background = 'rgba(147,51,234,0.9)'; // Purple
    } else if (category === 'Sexy') {
      safetyTag.style.background = 'rgba(245,158,11,0.9)'; // Orange
    } else if (category === 'Drawing') {
      safetyTag.style.background = 'rgba(59,130,246,0.9)'; // Blue
    } else {
      safetyTag.style.background = 'rgba(34,197,94,0.9)'; // Green for Neutral
    }
    
    // Show confidence if high
    if (confidence > 0.7) {
      const confidenceTag = container?.querySelector('.confidence-tag');
      if (confidenceTag) {
        confidenceTag.textContent = Math.round(confidence * 100) + '%';
        confidenceTag.style.display = 'block';
      }
    }
  }
}

// Apply blur to image with proper age rating
function applyBlur(img, contentRating = '16+') {
  const container = img.closest('.content-item');
  const overlay = container?.querySelector('.content-warning-overlay');
  
  if (container && overlay) {
    console.log('🌫️ Applying blur to:', img.src.slice(0, 50) + '... (Rating:', contentRating + ')');
    img.style.filter = 'blur(20px)';
    img.style.transition = 'filter 0.3s ease';
    
    // Update overlay content with correct rating
    const ageRatingDiv = overlay.querySelector('.age-rating');
    if (ageRatingDiv) {
      ageRatingDiv.textContent = 'FSK ' + contentRating;
      
      // Update overlay colors based on rating
      if (contentRating === '18+') {
        ageRatingDiv.style.background = '#7c2d12'; // Dark red for 18+
      } else if (contentRating === '16+') {
        ageRatingDiv.style.background = '#ef4444'; // Red for 16+
      } else if (contentRating === '12+') {
        ageRatingDiv.style.background = '#f59e0b'; // Orange for 12+
      }
    }
    
    // Update main overlay title
    const titleDiv = overlay.querySelector('div[style*="font-size:48px"]');
    if (titleDiv) {
      titleDiv.textContent = '[' + contentRating + ']';
    }
    
    overlay.style.display = 'flex';
    return true;
  } else {
    console.log('❌ Could not find container/overlay for:', img.src.slice(0, 50) + '...');
    return false;
  }
}

// Current filter level - load from localStorage
let currentFilterLevel = localStorage.getItem('content-filter-level') || '18+';
// Update existing isFilterActive variable
isFilterActive = localStorage.getItem('content-filter-active') === 'true';

// Toggle filter function with multiple levels
window.toggleContentFilter = function() {
  // Cycle through filter levels: OFF -> 12+ -> 16+ -> 18+ -> OFF
  if (!isFilterActive) {
    currentFilterLevel = '12+';
    isFilterActive = true;
  } else if (currentFilterLevel === '12+') {
    currentFilterLevel = '16+';
  } else if (currentFilterLevel === '16+') {
    currentFilterLevel = '18+';
  } else {
    isFilterActive = false;
    currentFilterLevel = '18+';
  }
  
  // Save state to localStorage
  localStorage.setItem('content-filter-active', isFilterActive.toString());
  localStorage.setItem('content-filter-level', currentFilterLevel);
  
  const btn = document.getElementById('filter-toggle-btn');
  if (btn) {
    if (isFilterActive) {
      btn.style.background = 'rgba(255,107,107,0.8)';
      btn.innerHTML = `[${currentFilterLevel}] ON`;
    } else {
      btn.style.background = 'rgba(255,107,107,0.2)';
      btn.innerHTML = '[18+] OFF';
    }
  }
  
  if (isFilterActive) {
    applyCurrentFilter();
  } else {
    // Remove all blurs
    document.querySelectorAll('.content-item img').forEach(img => {
      img.style.filter = 'none';
      const overlay = img.closest('.content-item')?.querySelector('.content-warning-overlay');
      if (overlay) overlay.style.display = 'none';
    });
    console.log('🔞 Filter deactivated - all content visible');
  }
};

// Reveal content function
window.revealContent = function(overlayElement) {
  const img = overlayElement.parentElement.querySelector('img');
  img.style.filter = 'none';
  overlayElement.style.display = 'none';
  console.log('👁️ Content revealed');
};

// Reapply filter (called when page content changes)
window.reapplyContentFilter = function() {
  if (isFilterActive) {
    console.log('🔞 Reapplying content filter after page change');
    
    // Wait a moment for images to load, then apply filter
    setTimeout(() => {
      window.toggleContentFilter();
      window.toggleContentFilter(); // Toggle twice to reapply current state
    }, 500);
  }
};

// Watch for page navigation changes
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    console.log('🔞 Page changed, reapplying filter...');
    setTimeout(window.reapplyContentFilter, 1000);
  }
}).observe(document, { subtree: true, childList: true });

// Initialize filter state on page load
function initializeFilterState() {
  const btn = document.getElementById('filter-toggle-btn');
  if (btn) {
    if (isFilterActive) {
      btn.style.background = 'rgba(255,107,107,0.8)';
      btn.innerHTML = `[${currentFilterLevel}] ON`;
      
      // Apply filter immediately
      console.log('🔞 Restoring filter state:', currentFilterLevel);
      applyCurrentFilter();
    } else {
      btn.style.background = 'rgba(255,107,107,0.2)';
      btn.innerHTML = '[18+] OFF';
    }
  }
}

// Apply current filter settings
function applyCurrentFilter() {
  if (!isFilterActive) return;
  
  console.log('🔞 Applying', currentFilterLevel, 'filter to all images...');
  
  let blurredCount = 0;
  document.querySelectorAll('.content-item img').forEach(img => {
    const url = img.src.toLowerCase();
    
    // Determine content rating and apply filter based on current level
    let contentRating = '0+';
    let shouldBlur = false;
    
    // Classify content by URL patterns
    if (url.includes('eporner') || url.includes('adult') || url.includes('porn') || url.includes('xxx')) {
      contentRating = '18+'; // Explicit content
      shouldBlur = true; // Always blur 18+ content regardless of filter level
    } else if (url.includes('sexy') || url.includes('bikini') || url.includes('lingerie') || 
               url.includes('klyker.com') || url.includes('picjj.com')) {
      contentRating = '16+'; // Suggestive content (like the girls in your screenshot)
      // Blur for 12+ and 16+ filters, but NOT for 18+ filter
      shouldBlur = currentFilterLevel === '12+' || currentFilterLevel === '16+';
    } else if (url.includes('model') || url.includes('fashion')) {
      contentRating = '12+'; // Mild suggestive content
      // Only blur for the strictest 12+ filter
      shouldBlur = currentFilterLevel === '12+';
    }
    
    if (shouldBlur) {
      if (applyBlur(img, contentRating)) {
        blurredCount++;
      }
    }
  });
  
  console.log('🔞 Filter applied:', blurredCount, 'images blurred with', currentFilterLevel, 'filter');
}

// Test function to manually apply filter
window.testContentFilter = function() {
  console.log('🧪 Testing content filter manually...');
  
  let blurredCount = 0;
  document.querySelectorAll('.content-item img').forEach(img => {
    const url = img.src.toLowerCase();
    
    // Test with 16+ classification for picjj.com images
    if (url.includes('picjj.com') || url.includes('sexy') || url.includes('klyker')) {
      console.log('🔞 Test: Blurring 16+ content:', url.slice(0, 50) + '...');
      if (applyBlur(img, '16+')) {
        blurredCount++;
      }
    }
  });
  
  console.log('🧪 Test complete: Blurred', blurredCount, 'images');
  return blurredCount;
};

// 🎨 CATEGORY FILTER SYSTEM
let categoryFilterActive = false;
let allowedCategories = ['Neutral', 'Drawing', 'Sexy']; // Default: hide Porn and Hentai

// Toggle category filter panel
window.toggleCategoryFilter = function() {
  const panel = document.getElementById('category-filter-panel');
  const isVisible = panel.style.display !== 'none';
  panel.style.display = isVisible ? 'none' : 'block';
  
  if (!isVisible) {
    loadCategorySettings();
  }
};

// Apply category filter
window.applyCategoryFilter = function() {
  // Read settings from checkboxes
  allowedCategories = [];
  if (document.getElementById('show-neutral').checked) allowedCategories.push('Neutral');
  if (document.getElementById('show-drawing').checked) allowedCategories.push('Drawing');
  if (document.getElementById('show-sexy').checked) allowedCategories.push('Sexy');
  if (document.getElementById('show-porn').checked) allowedCategories.push('Porn');
  if (document.getElementById('show-hentai').checked) allowedCategories.push('Hentai');
  
  categoryFilterActive = allowedCategories.length < 5; // Active if not all categories selected
  
  // Save to localStorage
  localStorage.setItem('category-filter-settings', JSON.stringify(allowedCategories));
  
  // Update button
  const btn = document.getElementById('category-filter-btn');
  if (btn) {
    btn.style.background = categoryFilterActive ? 'rgba(124,58,237,0.8)' : 'rgba(124,58,237,0.2)';
    btn.innerHTML = categoryFilterActive ? '🎨 ON (' + allowedCategories.length + ')' : '🎨 Categories';
  }
  
  // Apply category filtering
  applyCategoryFiltering();
  
  // Close panel
  document.getElementById('category-filter-panel').style.display = 'none';
  
  console.log('🎨 Category filter applied:', allowedCategories);
};

// Set category preset
window.setCategoryPreset = function(preset) {
  if (preset === 'safe') {
    // Only Neutral and Drawing
    document.getElementById('show-neutral').checked = true;
    document.getElementById('show-drawing').checked = true;
    document.getElementById('show-sexy').checked = false;
    document.getElementById('show-porn').checked = false;
    document.getElementById('show-hentai').checked = false;
  } else if (preset === 'moderate') {
    // Neutral, Drawing, and Sexy
    document.getElementById('show-neutral').checked = true;
    document.getElementById('show-drawing').checked = true;
    document.getElementById('show-sexy').checked = true;
    document.getElementById('show-porn').checked = false;
    document.getElementById('show-hentai').checked = false;
  } else if (preset === 'all') {
    // All categories
    document.getElementById('show-neutral').checked = true;
    document.getElementById('show-drawing').checked = true;
    document.getElementById('show-sexy').checked = true;
    document.getElementById('show-porn').checked = true;
    document.getElementById('show-hentai').checked = true;
  }
};

// Close category filter
window.closeCategoryFilter = function() {
  document.getElementById('category-filter-panel').style.display = 'none';
};

// Apply category filtering to all images
function applyCategoryFiltering() {
  if (!categoryFilterActive) {
    // Show all images if filter is off
    document.querySelectorAll('.content-item').forEach(item => {
      const container = item.parentElement;
      if (container) container.style.display = 'block';
    });
    return;
  }
  
  let hiddenCount = 0;
  let shownCount = 0;
  
  document.querySelectorAll('.content-item img').forEach(img => {
    const url = img.src.toLowerCase();
    let category = 'Neutral'; // Default category
    
    // Check if we have AI classification
    const aiClassification = imageClassifications.get(img.src);
    if (aiClassification) {
      category = aiClassification.category;
    } else {
      // Fallback to URL-based detection
      if (url.includes('eporner') || url.includes('porn') || url.includes('adult')) {
        category = 'Porn';
      } else if (url.includes('hentai') || url.includes('anime')) {
        category = 'Hentai';
      } else if (url.includes('sexy') || url.includes('bikini') || url.includes('picjj.com') || url.includes('klyker.com')) {
        category = 'Sexy';
      } else if (url.includes('art') || url.includes('drawing') || url.includes('illustration')) {
        category = 'Drawing';
      }
    }
    
    // Hide or show based on category filter
    const container = img.closest('.content-item')?.parentElement;
    if (container) {
      if (!allowedCategories.includes(category)) {
        container.style.display = 'none';
        hiddenCount++;
      } else {
        container.style.display = 'block';
        shownCount++;
      }
    }
  });
  
  console.log('🎨 Category filter: Hidden', hiddenCount, 'images, showing', shownCount, 'images. Categories:', allowedCategories);
}

// Load category settings
function loadCategorySettings() {
  try {
    const stored = localStorage.getItem('category-filter-settings');
    if (stored) {
      allowedCategories = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading category settings:', error);
  }
  
  // Update UI
  document.getElementById('show-neutral').checked = allowedCategories.includes('Neutral');
  document.getElementById('show-drawing').checked = allowedCategories.includes('Drawing');
  document.getElementById('show-sexy').checked = allowedCategories.includes('Sexy');
  document.getElementById('show-porn').checked = allowedCategories.includes('Porn');
  document.getElementById('show-hentai').checked = allowedCategories.includes('Hentai');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Initialize filter state
  setTimeout(initializeFilterState, 500);
  
  // Initialize category filter
  setTimeout(() => {
    const stored = localStorage.getItem('category-filter-settings');
    if (stored) {
      allowedCategories = JSON.parse(stored);
      categoryFilterActive = allowedCategories.length < 5;
      
      const btn = document.getElementById('category-filter-btn');
      if (btn && categoryFilterActive) {
        btn.style.background = 'rgba(124,58,237,0.8)';
        btn.innerHTML = '🎨 ON (' + allowedCategories.length + ')';
        applyCategoryFiltering();
      }
    }
  }, 1000);
  
  // Load model in background after 2 seconds
  setTimeout(loadContentFilter, 2000);
  
  console.log('🔞 Content filter initialized - AI loading in background');
  console.log('🎯 Age filter: Click button to cycle 12+ → 16+ → 18+ → OFF');
  console.log('🎨 Category filter: Click Categories button to show/hide content types');
  console.log('🧪 Debug: Type testContentFilter() in console to test manually');
});

// Also reinitialize when images load
window.addEventListener('load', () => {
  setTimeout(() => {
    // Apply filter to any new images
    if (isFilterActive) {
      console.log('🔞 Page fully loaded, checking for new images to filter');
      window.reapplyContentFilter();
    }
  }, 1000);
});
