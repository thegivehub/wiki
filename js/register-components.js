/**
 * Web Component Registration
 * 
 * This file registers the custom web components used in the application.
 * It ensures all components are properly defined before they're used in the DOM.
 */

// Import components (if you're using ES modules)
// import './components/nav-sidebar.js';
// import './components/tabs-container.js';
// import './components/markdown-editor.js';

// Register components when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Ensure components are registered
  // These are now registered directly in their respective files
  // but we check here to ensure they're defined
  
  if (!customElements.get('nav-sidebar')) {
    console.warn('NavSidebar component not registered. Loading dynamically...');
    // Load the component script
    const script = document.createElement('script');
    script.src = './js/components/nav-sidebar.js';
    document.head.appendChild(script);
  }
  
  if (!customElements.get('tabs-container')) {
    console.warn('TabsContainer component not registered. Loading dynamically...');
    // Load the component script
    const script = document.createElement('script');
    script.src = './js/components/tabs-container.js';
    document.head.appendChild(script);
  }
  
  if (!customElements.get('markdown-editor')) {
    console.warn('MarkdownEditor component not registered. Loading dynamically...');
    // Load the component script
    const script = document.createElement('script');
    script.src = './js/components/markdown-editor.js';
    document.head.appendChild(script);
  }
  
  console.log('Web components registration check complete');
});