// 🎨 GENERAL TOPICS FILTER SYSTEM
// Classifies images into general categories (food, sports, animals, etc.)

let generalFilterActive = false;
let allowedTopics = ['food', 'animals', 'sports', 'vehicles', 'nature', 'technology', 'fashion', 'architecture']; // Default: all topics
let generalClassifications = new Map();

// MobileNet model (will be loaded later)
let mobileNetModel = null;

// General topic keywords for URL-based classification
const TOPIC_KEYWORDS = {
  food: ['food', 'pizza', 'burger', 'restaurant', 'cooking', 'recipe', 'coffee', 'wine', 'cake', 'bread'],
  animals: ['dog', 'cat', 'pet', 'animal', 'wildlife', 'zoo', 'horse', 'bird', 'fish', 'puppy'],
  sports: ['sport', 'football', 'soccer', 'basketball', 'tennis', 'golf', 'gym', 'fitness', 'running', 'bike'],
  vehicles: ['car', 'truck', 'motorcycle', 'plane', 'boat', 'vehicle', 'transport', 'auto', 'aviation'],
  nature: ['nature', 'landscape', 'mountain', 'forest', 'beach', 'sunset', 'tree', 'flower', 'garden'],
  technology: ['tech', 'computer', 'phone', 'laptop', 'gadget', 'device', 'electronics', 'software'],
  fashion: ['fashion', 'style', 'clothing', 'dress', 'outfit', 'model', 'designer', 'beauty', 'makeup'],
  architecture: ['building', 'house', 'architecture', 'city', 'urban', 'construction', 'bridge', 'tower']
};

// ImageNet class mappings (simplified - would be more comprehensive with full MobileNet)
const IMAGENET_MAPPINGS = {
  // Food categories (ImageNet classes 920-969)
  'pizza': 'food',
  'hamburger': 'food', 
  'hotdog': 'food',
  'ice_cream': 'food',
  'French_loaf': 'food',
  'bagel': 'food',
  'pretzel': 'food',
  'cheeseburger': 'food',
  'espresso': 'food',
  'cup': 'food',
  
  // Animals (ImageNet classes 1-397)
  'tabby': 'animals',
  'tiger': 'animals',
  'Persian_cat': 'animals',
  'Siamese_cat': 'animals',
  'Egyptian_cat': 'animals',
  'mountain_lion': 'animals',
  'lynx': 'animals',
  'leopard': 'animals',
  'snow_leopard': 'animals',
  'jaguar': 'animals',
  'lion': 'animals',
  'tiger_cat': 'animals',
  'cheetah': 'animals',
  'brown_bear': 'animals',
  'American_black_bear': 'animals',
  'ice_bear': 'animals',
  'sloth_bear': 'animals',
  'mongoose': 'animals',
  'meerkat': 'animals',
  'tiger_beetle': 'animals',
  
  // Vehicles (ImageNet classes 400-500+)
  'sports_car': 'vehicles',
  'convertible': 'vehicles',
  'jeep': 'vehicles',
  'limousine': 'vehicles',
  'minivan': 'vehicles',
  'taxi': 'vehicles',
  'police_van': 'vehicles',
  'ambulance': 'vehicles',
  'fire_engine': 'vehicles',
  'garbage_truck': 'vehicles',
  'pickup': 'vehicles',
  'tow_truck': 'vehicles',
  'trailer_truck': 'vehicles',
  'moving_van': 'vehicles',
  'tank': 'vehicles',
  'snowplow': 'vehicles',
  'forklift': 'vehicles',
  
  // Nature/landscapes
  'lakeside': 'nature',
  'seashore': 'nature',
  'promontory': 'nature',
  'sandbar': 'nature',
  'coral_reef': 'nature',
  'valley': 'nature',
  'volcano': 'nature',
  'ballpoint': 'technology',
  'desktop_computer': 'technology',
  'laptop': 'technology',
  'notebook': 'technology',
  'web_site': 'technology',
  'cellular_telephone': 'technology'
};

// Load MobileNet model (placeholder - would load actual model)
async function loadGeneralClassifier() {
  try {
    console.log('🤖 Loading MobileNet for general classification...');
    
    // Placeholder - in real implementation would load:
    // await tf.loadLayersModel('https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/3/default/1');
    
    // For now, we'll use URL-based classification
    console.log('🎯 General classifier ready (URL-based classification active)');
    return true;
  } catch (error) {
    console.error('❌ Failed to load MobileNet:', error);
    return false;
  }
}

// Classify image into general topics
function classifyGeneralTopic(img) {
  const url = img.src.toLowerCase();
  const alt = (img.alt || '').toLowerCase();
  const combined = url + ' ' + alt;
  
  // Check each topic for keyword matches
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const keyword of keywords) {
      if (combined.includes(keyword)) {
        return {
          topic: topic,
          confidence: 0.8, // High confidence for keyword matches
          method: 'url-keywords'
        };
      }
    }
  }
  
  // Default classification
  return {
    topic: 'general',
    confidence: 0.1,
    method: 'default'
  };
}

// Toggle general filter panel
window.toggleGeneralFilter = function() {
  const panel = document.getElementById('general-filter-panel');
  const isVisible = panel.style.display !== 'none';
  panel.style.display = isVisible ? 'none' : 'block';
  
  if (!isVisible) {
    loadGeneralSettings();
  }
};

// Apply general filter
window.applyGeneralFilter = function() {
  // Read settings from checkboxes
  allowedTopics = [];
  if (document.getElementById('show-food').checked) allowedTopics.push('food');
  if (document.getElementById('show-animals').checked) allowedTopics.push('animals');
  if (document.getElementById('show-sports').checked) allowedTopics.push('sports');
  if (document.getElementById('show-vehicles').checked) allowedTopics.push('vehicles');
  if (document.getElementById('show-nature').checked) allowedTopics.push('nature');
  if (document.getElementById('show-technology').checked) allowedTopics.push('technology');
  if (document.getElementById('show-fashion').checked) allowedTopics.push('fashion');
  if (document.getElementById('show-architecture').checked) allowedTopics.push('architecture');
  
  generalFilterActive = allowedTopics.length < 8; // Active if not all topics selected
  
  // Save to localStorage
  localStorage.setItem('general-filter-settings', JSON.stringify(allowedTopics));
  
  // Update button
  const btn = document.getElementById('general-filter-btn');
  if (btn) {
    btn.style.background = generalFilterActive ? 'rgba(16,185,129,0.8)' : 'rgba(16,185,129,0.2)';
    btn.innerHTML = generalFilterActive ? '🎨 ON (' + allowedTopics.length + ')' : '🎨 Topics';
  }
  
  // Apply general topic filtering
  applyGeneralFiltering();
  
  // Close panel
  document.getElementById('general-filter-panel').style.display = 'none';
  
  console.log('🎨 General filter applied:', allowedTopics);
};

// Set general preset
window.setGeneralPreset = function(preset) {
  if (preset === 'popular') {
    // Food, Animals, Sports, Nature
    document.getElementById('show-food').checked = true;
    document.getElementById('show-animals').checked = true;
    document.getElementById('show-sports').checked = true;
    document.getElementById('show-vehicles').checked = false;
    document.getElementById('show-nature').checked = true;
    document.getElementById('show-technology').checked = false;
    document.getElementById('show-fashion').checked = false;
    document.getElementById('show-architecture').checked = false;
  } else if (preset === 'lifestyle') {
    // Food, Fashion, Nature, Architecture
    document.getElementById('show-food').checked = true;
    document.getElementById('show-animals').checked = false;
    document.getElementById('show-sports').checked = false;
    document.getElementById('show-vehicles').checked = false;
    document.getElementById('show-nature').checked = true;
    document.getElementById('show-technology').checked = false;
    document.getElementById('show-fashion').checked = true;
    document.getElementById('show-architecture').checked = true;
  } else if (preset === 'all') {
    // All topics
    document.getElementById('show-food').checked = true;
    document.getElementById('show-animals').checked = true;
    document.getElementById('show-sports').checked = true;
    document.getElementById('show-vehicles').checked = true;
    document.getElementById('show-nature').checked = true;
    document.getElementById('show-technology').checked = true;
    document.getElementById('show-fashion').checked = true;
    document.getElementById('show-architecture').checked = true;
  }
};

// Close general filter
window.closeGeneralFilter = function() {
  document.getElementById('general-filter-panel').style.display = 'none';
};

// Apply general topic filtering to all images
function applyGeneralFiltering() {
  if (!generalFilterActive) {
    // Show all images if filter is off
    document.querySelectorAll('.content-item').forEach(item => {
      const container = item.parentElement;
      if (container && !container.style.display.includes('none')) {
        container.style.display = 'block';
      }
    });
    return;
  }
  
  let hiddenCount = 0;
  let shownCount = 0;
  
  document.querySelectorAll('.content-item img').forEach(img => {
    // Skip if already hidden by other filters
    const container = img.closest('.content-item')?.parentElement;
    if (!container) return;
    
    // Get or classify topic
    let classification = generalClassifications.get(img.src);
    if (!classification) {
      classification = classifyGeneralTopic(img);
      generalClassifications.set(img.src, classification);
    }
    
    // Hide or show based on topic filter
    if (!allowedTopics.includes(classification.topic) && classification.topic !== 'general') {
      container.style.display = 'none';
      hiddenCount++;
    } else if (container.style.display === 'none') {
      // Only show if not hidden by other filters
      const hasOtherFilters = container.querySelector('img[style*="blur"]');
      if (!hasOtherFilters) {
        container.style.display = 'block';
        shownCount++;
      }
    } else {
      shownCount++;
    }
  });
  
  console.log('🎨 General filter: Hidden', hiddenCount, 'images, showing', shownCount, 'images. Topics:', allowedTopics);
}

// Load general settings
function loadGeneralSettings() {
  try {
    const stored = localStorage.getItem('general-filter-settings');
    if (stored) {
      allowedTopics = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading general settings:', error);
  }
  
  // Update UI
  document.getElementById('show-food').checked = allowedTopics.includes('food');
  document.getElementById('show-animals').checked = allowedTopics.includes('animals');
  document.getElementById('show-sports').checked = allowedTopics.includes('sports');
  document.getElementById('show-vehicles').checked = allowedTopics.includes('vehicles');
  document.getElementById('show-nature').checked = allowedTopics.includes('nature');
  document.getElementById('show-technology').checked = allowedTopics.includes('technology');
  document.getElementById('show-fashion').checked = allowedTopics.includes('fashion');
  document.getElementById('show-architecture').checked = allowedTopics.includes('architecture');
}

// Show topic classification tag on image
function showTopicTag(img, topic, confidence) {
  const container = img.closest('.content-item');
  const topicTag = container?.querySelector('.topic-tag');
  
  if (topicTag && topic !== 'general') {
    // Set tag content and color
    const topicEmojis = {
      'food': '🍕',
      'animals': '🐕', 
      'sports': '⚽',
      'vehicles': '🚗',
      'nature': '🌳',
      'technology': '💻',
      'fashion': '👗',
      'architecture': '🏠'
    };
    
    topicTag.textContent = (topicEmojis[topic] || '🎨') + ' ' + topic.toUpperCase();
    topicTag.style.display = 'block';
    
    // Color-code by topic
    const topicColors = {
      'food': 'rgba(245,158,11,0.9)',      // Orange
      'animals': 'rgba(34,197,94,0.9)',    // Green
      'sports': 'rgba(59,130,246,0.9)',    // Blue
      'vehicles': 'rgba(239,68,68,0.9)',   // Red
      'nature': 'rgba(34,197,94,0.9)',     // Green
      'technology': 'rgba(139,92,246,0.9)', // Purple
      'fashion': 'rgba(236,72,153,0.9)',   // Pink
      'architecture': 'rgba(107,114,128,0.9)' // Gray
    };
    
    topicTag.style.background = topicColors[topic] || 'rgba(16,185,129,0.9)';
    
    // Show confidence for keyword matches
    if (confidence > 0.5) {
      const confidenceTag = container?.querySelector('.confidence-tag');
      if (confidenceTag) {
        confidenceTag.textContent = 'URL';
        confidenceTag.style.display = 'block';
      }
    }
  }
}

// Auto-classify images as they load
window.classifyGeneralImage = function(img) {
  if (!img || !img.src) return;
  
  const classification = classifyGeneralTopic(img);
  generalClassifications.set(img.src, classification);
  
  console.log('🎨', img.src.slice(-20), '→', classification.topic, 
              Math.round(classification.confidence * 100) + '% (' + classification.method + ')');
  
  // Show topic classification tag
  showTopicTag(img, classification.topic, classification.confidence);
  
  // Apply filter if active
  if (generalFilterActive) {
    const container = img.closest('.content-item')?.parentElement;
    if (container && !allowedTopics.includes(classification.topic) && classification.topic !== 'general') {
      container.style.display = 'none';
    }
  }
};

// Initialize general filter
document.addEventListener('DOMContentLoaded', () => {
  // Load general classifier in background
  setTimeout(loadGeneralClassifier, 3000);
  
  // Initialize general filter state
  setTimeout(() => {
    const stored = localStorage.getItem('general-filter-settings');
    if (stored) {
      allowedTopics = JSON.parse(stored);
      generalFilterActive = allowedTopics.length < 8;
      
      const btn = document.getElementById('general-filter-btn');
      if (btn && generalFilterActive) {
        btn.style.background = 'rgba(16,185,129,0.8)';
        btn.innerHTML = '🎨 ON (' + allowedTopics.length + ')';
        applyGeneralFiltering();
      }
    }
  }, 1500);
  
  console.log('🎨 General topics filter initialized');
  console.log('🤖 Available topics: Food, Animals, Sports, Vehicles, Nature, Technology, Fashion, Architecture');
});

// Export for other scripts
window.applyGeneralFiltering = applyGeneralFiltering;
window.classifyGeneralImage = classifyGeneralImage;
