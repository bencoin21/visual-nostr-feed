/**
 * Fixi - Minimal Hypermedia Enhancement Library
 * A lightweight alternative to htmx for hypermedia interactions
 */

(function() {
  'use strict';

  // Core Fixi functionality
  const Fixi = {
    version: '1.0.0',
    
    init: function() {
      document.addEventListener('DOMContentLoaded', this.onReady.bind(this));
      document.addEventListener('submit', this.onSubmit.bind(this));
      document.addEventListener('click', this.onClick.bind(this));
    },
    
    onReady: function() {
      console.log('🔧 Fixi initialized');
      this.processElements();
    },
    
    processElements: function() {
      // Process elements with fx-* attributes
      const elements = document.querySelectorAll('[fx-action]');
      elements.forEach(el => {
        this.enhanceElement(el);
      });
    },
    
    enhanceElement: function(element) {
      // Add Fixi enhancement to element
      element.setAttribute('data-fx-enhanced', 'true');
    },
    
    onSubmit: function(event) {
      const form = event.target;
      if (!form.hasAttribute('fx-action')) return;
      
      event.preventDefault();
      
      const action = form.getAttribute('fx-action');
      const method = form.getAttribute('fx-method') || 'POST';
      const target = form.getAttribute('fx-target');
      const swap = form.getAttribute('fx-swap') || 'innerHTML';
      
      this.makeRequest(action, method, new FormData(form), target, swap);
    },
    
    onClick: function(event) {
      const element = event.target;
      if (!element.hasAttribute('fx-action')) return;
      
      event.preventDefault();
      
      const action = element.getAttribute('fx-action');
      const method = element.getAttribute('fx-method') || 'GET';
      const target = element.getAttribute('fx-target');
      const swap = element.getAttribute('fx-swap') || 'innerHTML';
      
      this.makeRequest(action, method, null, target, swap);
    },
    
    makeRequest: function(url, method, data, target, swap) {
      const options = {
        method: method,
        headers: {
          'FX-Request': 'true'
        }
      };
      
      if (data) {
        options.body = data;
      }
      
      fetch(url, options)
        .then(response => response.text())
        .then(html => {
          this.updateTarget(target, html, swap);
        })
        .catch(error => {
          console.error('Fixi request failed:', error);
        });
    },
    
    updateTarget: function(selector, html, swap) {
      const target = document.querySelector(selector);
      if (!target) {
        console.error('Fixi target not found:', selector);
        return;
      }
      
      switch(swap) {
        case 'innerHTML':
          target.innerHTML = html;
          break;
        case 'outerHTML':
          target.outerHTML = html;
          break;
        case 'beforeend':
          target.insertAdjacentHTML('beforeend', html);
          break;
        case 'afterbegin':
          target.insertAdjacentHTML('afterbegin', html);
          break;
        default:
          target.innerHTML = html;
      }
      
      // Re-process new elements
      this.processElements();
    }
  };
  
  // Initialize Fixi
  Fixi.init();
  
  // Expose globally
  window.Fixi = Fixi;
})();
