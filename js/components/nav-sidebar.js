/**
 * Navigation Sidebar Component
 * 
 * A web component that renders the navigation structure from JSON files
 * and provides an interactive sidebar with support for nested navigation items.
 */
class NavSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Component state
    this.state = {
      navLoaded: false,
      currentRoute: '',
      defaultPage: '',
      navData: null,
      isMobile: window.innerWidth < 768,
      isNavOpen: false,
      loadedIncludes: new Map(),
      renderedItems: new Set(),
      editable: false, // Whether navigation can be edited
      backendUrl: null, // URL to the backend for saving navigation
      theme: this.getAttribute('theme') || 'default', // Add theme state
      initializing: true // Flag to track initialization phase
    };
    
    // Load required libraries
    this.loadLibraries();
    
    // Bind methods
    this.handleNavClick = this.handleNavClick.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.toggleMobileNav = this.toggleMobileNav.bind(this);
    this.handleAddButtonClick = this.handleAddButtonClick.bind(this);
    this.handleDialogClose = this.handleDialogClose.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.updateIconPreview = this.updateIconPreview.bind(this);
    this.applyTheme = this.applyTheme.bind(this); // Add theme method binding
    this.setIcon = this.setIcon.bind(this);
    this.findAndLoadItemByHash = this.findAndLoadItemByHash.bind(this);
    this.updateActiveNavState = this.updateActiveNavState.bind(this);
    
    // Render initial structure
    this.render();
    
    // Listen for resize events
    window.addEventListener('resize', this.handleResize);
  }
  
  async loadLibraries() {
    // Load marked.js for markdown parsing
    if (typeof marked === 'undefined') {
      const markedScript = document.createElement('script');
      markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
      document.head.appendChild(markedScript);
      await new Promise(resolve => markedScript.onload = resolve);
    }
    
    // Load highlight.js for code syntax highlighting
    if (typeof hljs === 'undefined') {
      const hljsScript = document.createElement('script');
      hljsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js';
      document.head.appendChild(hljsScript);
      
      const hljsStyle = document.createElement('link');
      hljsStyle.rel = 'stylesheet';
      hljsStyle.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github.min.css';
      document.head.appendChild(hljsStyle);
      
      await new Promise(resolve => hljsScript.onload = resolve);
    }
  }
  
  connectedCallback() {
    // Get attributes
    const navUrl = this.getAttribute('data-nav-url') || 'nav/main.json';
    const defaultPage = this.getAttribute('data-default-page') || '';
    const editable = this.getAttribute('data-editable') === 'true';
    const backendUrl = this.getAttribute('data-backend-url') || 'nav-editor.php';
    
    console.log('Connected callback:', {
      navUrl,
      defaultPage,
      editable,
      backendUrl
    });
    
    // Set state
    this.state.defaultPage = defaultPage;
    this.state.editable = editable;
    this.state.backendUrl = backendUrl;
    
    // Add Font Awesome if not already present
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fontAwesomeLink = document.createElement('link');
      fontAwesomeLink.rel = 'stylesheet';
      fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
      document.head.appendChild(fontAwesomeLink);
    }
    
    // Load navigation
    this.loadNavigation(navUrl);
    
    // Initialize resize functionality
    this.initResizeHandling();
    
    // Initialize dialog functionality
    this.initDialog();
    
    // Handle initial route
    this.handleInitialRoute();
    
    // Apply initial theme if set
    const initialTheme = this.getAttribute('theme');
    if (initialTheme) {
      this.applyTheme(initialTheme);
    }
    
    // Clear initialization flag after a small delay to allow attr changes to settle
    setTimeout(() => {
      this.state.initializing = false;
      console.log("Component initialization complete");
    }, 50);
  }
  
  disconnectedCallback() {
    // Clean up event listeners
    window.removeEventListener('resize', this.handleResize);
  }
  
  // Helper to render initial HTML structure
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex: 0 0 var(--nav-default-width);
          min-width: var(--nav-min-width);
          max-width: var(--nav-max-width);
          height: 100%;
          overflow: hidden;
        }
        
        /* Dark theme variables */
        :host(.theme-dark) {
          --content-bg-color: #1a202c;
          --content-text-color: #e2e8f0;
          --content-heading-color: #ffffff;
          --content-code-bg: #2d3748;
          --content-border-color: #4a5568;
          --content-table-header-bg: #2d3748;
        }
        
        /* Light theme variables (default) */
        :host {
          --content-bg-color: #ffffff;
          --content-text-color: #2d3748;
          --content-heading-color: #1a202c;
          --content-code-bg: #f7fafc;
          --content-border-color: #e2e8f0;
          --content-table-header-bg: #f7fafc;
        }
        
        .nav-sidebar {
          width: 100%;
          height: 100%;
          background-color: var(--nav-bg-color);
          color: var(--nav-text-color);
          border-right: 1px solid var(--nav-border-color);
          overflow-y: auto;
          transition: width var(--nav-transition-duration) ease;
          position: relative;
        }
        
        .nav-content {
          display: none;
        }
        
        .document-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .document-content h1 {
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
          color: var(--content-heading-color);
        }
        
        .document-content h2 {
          font-size: 2rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: var(--content-heading-color);
        }
        
        .document-content h3 {
          font-size: 1.5rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: var(--content-heading-color);
        }
        
        .document-content p {
          margin-bottom: 1rem;
          line-height: 1.6;
          color: var(--content-text-color);
        }
        
        .document-content pre {
          background-color: var(--content-code-bg);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        
        .document-content code {
          font-family: 'Fira Code', monospace;
          font-size: 0.875rem;
          color: var(--content-text-color);
        }
        
        .document-content ul, .document-content ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
          color: var(--content-text-color);
        }
        
        .document-content li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        
        .document-content blockquote {
          border-left: 4px solid var(--content-border-color);
          padding-left: 1rem;
          margin: 1.5rem 0;
          color: var(--content-text-color);
        }
        
        .document-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }
        
        .document-content th, .document-content td {
          border: 1px solid var(--content-border-color);
          padding: 0.75rem;
          text-align: left;
          color: var(--content-text-color);
        }
        
        .document-content th {
          background-color: var(--content-table-header-bg);
        }
        
        .error {
          color: #e53e3e;
          padding: 1rem;
          background-color: #fff5f5;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        
        /* Dark Theme */
        :host(.theme-dark) {
          --nav-bg-color: #111827;
          --nav-text-color: #f9fafb;
          --nav-border-color: #374151;
          --nav-hover-bg-color: #1f2937;
          --nav-active-bg-color: #2563eb;
          --nav-active-text-color: white;
          --nav-icon-color: #9ca3af;
          --nav-active-icon-color: white;
          --nav-toggle-button-bg: #2563eb;
          --nav-toggle-button-color: white;
          --nav-toggle-button-hover-bg: #1d4ed8;
          --nav-scrollbar-thumb-color: #4b5563;
          --nav-scrollbar-track-color: #1f2937;
          --nav-header-bg-color: #1f2937;
        }
        
        /* Light Blue Theme */
        :host(.theme-light-blue) {
          --nav-bg-color: #f0f9ff;
          --nav-text-color: #0c4a6e;
          --nav-border-color: #bae6fd;
          --nav-hover-bg-color: #e0f2fe;
          --nav-active-bg-color: #0ea5e9;
          --nav-active-text-color: white;
          --nav-icon-color: #0284c7;
          --nav-active-icon-color: white;
          --nav-toggle-button-bg: #0ea5e9;
          --nav-toggle-button-color: white;
          --nav-toggle-button-hover-bg: #0284c7;
          --nav-scrollbar-thumb-color: #7dd3fc;
          --nav-scrollbar-track-color: #e0f2fe;
          --nav-header-bg-color: #e0f2fe;
        }
        
        /* Green Theme */
        :host(.theme-green) {
          --nav-bg-color: #f0fdf4;
          --nav-text-color: #166534;
          --nav-border-color: #bbf7d0;
          --nav-hover-bg-color: #dcfce7;
          --nav-active-bg-color: #16a34a;
          --nav-active-text-color: white;
          --nav-icon-color: #22c55e;
          --nav-active-icon-color: white;
          --nav-toggle-button-bg: #16a34a;
          --nav-toggle-button-color: white;
          --nav-toggle-button-hover-bg: #15803d;
          --nav-scrollbar-thumb-color: #86efac;
          --nav-scrollbar-track-color: #dcfce7;
          --nav-header-bg-color: #dcfce7;
        }
        
        /* Purple Theme */
        :host(.theme-purple) {
          --nav-bg-color: #faf5ff;
          --nav-text-color: #581c87;
          --nav-border-color: #d8b4fe;
          --nav-hover-bg-color: #f3e8ff;
          --nav-active-bg-color: #9333ea;
          --nav-active-text-color: white;
          --nav-icon-color: #a855f7;
          --nav-active-icon-color: white;
          --nav-toggle-button-bg: #9333ea;
          --nav-toggle-button-color: white;
          --nav-toggle-button-hover-bg: #7e22ce;
          --nav-scrollbar-thumb-color: #d8b4fe;
          --nav-scrollbar-track-color: #f3e8ff;
          --nav-header-bg-color: #f3e8ff;
        }
        
        .nav-header {
          background-color: var(--nav-header-bg-color);
          padding: 1rem;
          border-bottom: 1px solid var(--nav-border-color);
        }
        
        .nav-tree {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
        }
        
        .nav-treeview {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          padding-left: 1.5rem;
          display: none; /* Hide by default */
        }
        
        .nav-item.menu-open > .nav-treeview {
          display: flex; /* Show when parent has menu-open class */
        }
        
        .nav-item.has-treeview > .nav-link::after {
          content: "▶";
          margin-left: auto;
          font-size: 0.75rem;
          transition: transform var(--nav-transition-duration) ease;
        }
        
        .nav-item.menu-open > .nav-link::after {
          transform: rotate(90deg);
        }
        
        .nav-item {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }
        
        .nav-link {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          color: var(--nav-text-color);
          text-decoration: none;
          transition: background-color var(--nav-transition-duration) ease;
          flex: 1;
        }
        
        .nav-link:hover {
          background-color: var(--nav-hover-bg-color);
        }
        
        .nav-link.active {
          background-color: var(--nav-active-bg-color);
          color: var(--nav-active-text-color);
        }
        
        .nav-icon {
          color: var(--nav-icon-color);
          margin-right: 0.5rem;
          width: 1.25rem;
          height: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .nav-link.active .nav-icon {
          color: var(--nav-active-icon-color);
        }
        
        .nav-toggle-button {
          display: none;
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 1000;
          background-color: var(--nav-toggle-button-bg);
          color: var(--nav-toggle-button-color);
          border: none;
          border-radius: 0.375rem;
          padding: 0.5rem;
          cursor: pointer;
          transition: background-color var(--nav-transition-duration) ease;
        }
        
        .nav-toggle-button:hover {
          background-color: var(--nav-toggle-button-hover-bg);
        }
        
        .nav-resize-handle {
          position: absolute;
          top: 0;
          right: 0;
          width: 6px;
          height: 100%;
          cursor: col-resize;
          background-color: var(--nav-resize-handle-color);
          transition: background-color var(--nav-transition-duration) ease;
          z-index: 10;
        }
        
        .nav-resize-handle:hover {
          background-color: var(--nav-resize-handle-hover-color);
          width: 8px;
        }
        
        .nav-resize-handle:active {
          background-color: var(--nav-active-bg-color);
        }
        
        .nav-add-button {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background-color: var(--nav-add-button-bg, #e5e7eb);
          color: var(--nav-add-button-color, #374151);
          border: none;
          border-radius: 0.25rem;
          width: 1.5rem;
          height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: all var(--nav-transition-duration, 0.3s) ease;
          z-index: 10;
          margin-left: auto;
          font-weight: bold;
          font-size: 1rem;
        }
        
        .nav-item:hover .nav-add-button {
          opacity: 1;
        }
        
        .nav-add-button:hover {
          background-color: var(--nav-add-button-hover-bg, #d1d5db);
          transform: translateY(-50%) scale(1.1);
        }
        
        .nav-add-button:active {
          background-color: var(--nav-add-button-active-bg, #2563eb);
          color: var(--nav-add-button-active-color, white);
          transform: translateY(-50%) scale(0.95);
        }
        
        /* Mobile styles */
        @media (max-width: 768px) {
          .nav-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform var(--nav-transition-duration) ease;
          }
          
          .nav-sidebar.mobile {
            flex: 0 0 var(--nav-mobile-width);
          }
          
          .nav-sidebar.mobile:not(.closed) {
            transform: translateX(0);
          }
          
          .nav-content {
            margin-left: 0;
          }
          
          .nav-toggle-button {
            display: flex;
          }
          
          .nav-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--nav-overlay-bg-color);
            opacity: 0;
            transition: opacity var(--nav-transition-duration) ease;
            z-index: 999;
          }
          
          .nav-overlay.visible {
            display: block;
            opacity: 1;
          }
        }
        
        .nav-dialog {
          display: none;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: var(--bg-color, white);
          color: var(--text-color, black);
          border-radius: 0.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          min-width: 400px;
          max-width: 90vw;
          padding: 1.5rem;
        }
        
        .nav-dialog.open {
          display: block;
        }
        
        .nav-dialog-backdrop {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 999;
        }
        
        .nav-dialog-backdrop.open {
          display: block;
        }
        
        .nav-dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .nav-dialog-header h3 {
          margin: 0;
          font-size: 1.25rem;
          color: var(--text-color, black);
        }
        
        .nav-dialog-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-light-color, #777);
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--text-color, black);
        }
        
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--border-color, #ddd);
          border-radius: 0.25rem;
          background-color: var(--bg-light-color, #f5f5f5);
          color: var(--text-color, black);
        }
        
        .dialog-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }
        
        .dialog-footer button {
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          cursor: pointer;
          font-weight: 500;
        }
        
        .btn-cancel {
          background-color: var(--bg-light-color, #f5f5f5);
          border: 1px solid var(--border-color, #ddd);
          color: var(--text-color, black);
          margin-right: 0.5rem;
        }
        
        .btn-save {
          background-color: var(--primary-color, #2563eb);
          border: 1px solid var(--primary-color, #2563eb);
          color: white;
        }
        
        /* Remove tab-related styles */
        .tab-buttons,
        .tab-button,
        .tab-content,
        .tab-container {
          display: none;
        }
      </style>
      
      <div class="nav-sidebar">
        <div class="nav-resize-handle" title="Drag to resize"></div>
        <div class="nav-header">
          <span>Navigation</span>
        </div>
        <ul class="nav-tree">
          <!-- Navigation items will be inserted here -->
        </ul>
      </div>
      
      <div class="nav-content">
        <!-- Content will be loaded here -->
      </div>
      
      <button class="nav-toggle-button" aria-label="Toggle navigation menu">
        <i class="fas fa-bars"></i>
      </button>
      
      <div class="nav-overlay"></div>
      
      <!-- Dialog for adding new navigation items -->
      <div class="nav-dialog">
        <div class="nav-dialog-header">
          <h3>Add Navigation Item</h3>
          <button class="nav-dialog-close" aria-label="Close dialog">&times;</button>
        </div>
        <form class="nav-dialog-form">
          <input type="hidden" id="parent-path" value="">
          <input type="hidden" id="target-file" value="">
          
          <div class="form-group">
            <label for="nav-title">Title *</label>
            <input type="text" id="nav-title" name="title" required placeholder="Enter item title">
          </div>
          
          <div class="form-group">
            <label for="nav-path">Document Path</label>
            <input type="text" id="nav-path" name="path" placeholder="Path to the document (e.g., docs/example.md)">
          </div>
          
          <div class="form-group">
            <label for="nav-file-upload">Upload Document</label>
            <div class="file-upload-container">
              <input type="file" id="nav-file-upload" accept=".md,.html,.txt,.pdf">
              <div class="file-upload-preview"></div>
            </div>
            <small class="file-upload-help">Supported formats: .md, .html, .txt, .pdf</small>
          </div>
          
          <div class="form-group">
            <label for="nav-icon">Icon</label>
            <select id="nav-icon" name="icon">
              <option value="">None</option>
              <option value="class:🏠">Home</option>
              <option value="class:📝">Document</option>
              <option value="class:⚙️">Settings</option>
              <option value="class:📁">Folder</option>
              <option value="class:🔍">Search</option>
              <option value="class:📊">Chart</option>
              <option value="class:📑">List</option>
              <option value="class:🔧">Tools</option>
              <option value="class:ℹ️">Info</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="nav-tags">Tags (comma-separated)</label>
            <input type="text" id="nav-tags" name="tags" placeholder="Enter comma-separated tags">
          </div>
          
          <div class="dialog-footer">
            <button type="button" class="btn btn-cancel">Cancel</button>
            <button type="submit" class="btn btn-save">Save</button>
          </div>
        </form>
      </div>
      <div class="nav-dialog-backdrop"></div>
    `;
    
    // Add event listeners
    const overlay = this.shadowRoot.querySelector('.nav-overlay');
    const toggleButton = this.shadowRoot.querySelector('.nav-toggle-button');
    
    if (overlay) {
      overlay.addEventListener('click', this.toggleMobileNav.bind(this));
    }
    
    if (toggleButton) {
      toggleButton.addEventListener('click', this.toggleMobileNav.bind(this));
    }
  }
  
  // Load navigation from JSON file
  async loadNavigation(url) {
    try {
      console.log(`Loading navigation from ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to load navigation: ${response.statusText}`);
      }
      
      this.state.navData = await response.json();
      this.state.navLoaded = true;
      
      // Render navigation items
      this.renderNavigation();
      
      // Dispatch event that navigation is loaded
      this.dispatchEvent(new CustomEvent('navigation-loaded', {
        bubbles: true,
        composed: true,
        detail: { navData: this.state.navData }
      }));
    } catch (error) {
      console.error('Error loading navigation:', error);
      this.showError(`Failed to load navigation: ${error.message}`);
    }
  }
  
  // Show error message
  showError(message) {
    const navTree = this.shadowRoot.querySelector('.nav-tree');
    navTree.innerHTML = `<li class="error">${message}</li>`;
  }
  
  // Render navigation items
  renderNavigation() {
    // Reset state
    this.state.loadedIncludes = new Map();
    this.state.renderedItems = new Set();
    
    const navTree = this.shadowRoot.querySelector('.nav-tree');
    navTree.innerHTML = '';
    
    console.log('Rendering navigation:', {
      editable: this.state.editable,
      navData: this.state.navData
    });
    
    // Handle different data structures
    let items = this.state.navData;
    if (!Array.isArray(items) && items.sidemenu && Array.isArray(items.sidemenu)) {
      items = items.sidemenu;
    } else if (Array.isArray(items)) {
      // Already an array, use as is
    } else {
      this.showError('Navigation data is empty or has invalid format');
      return;
    }
    
    if (items.length > 0) {
      this.buildNavTree(items, navTree);
    } else {
      this.showError('Navigation data is empty');
    }
  }
  
  // Build navigation tree
  buildNavTree(items, container) {
    if (!Array.isArray(items)) return;
    
    console.log(`Building nav tree with ${items.length} items, editable: ${this.state.editable}`);
    
    // Create a single fragment to append all items at once
    const fragment = document.createDocumentFragment();
    
    // Track which items we've processed in this container
    const processedItemsInThisContainer = new Set();
    
    for (const item of items) {
      // Skip duplicates based on title within this container
      const itemKey = `${container.id || container.getAttribute('data-container-id') || 'root'}-${item.title}`;
      if (processedItemsInThisContainer.has(itemKey)) {
        console.log(`Skipping duplicate item in container: ${item.title}`);
        continue;
      }
      
      // Create nav item element
      const navItem = this.createNavItem(item);
      
      // Only add non-null items (items that weren't duplicates in global tracking)
      if (navItem) {
        // Add to fragment
        fragment.appendChild(navItem);
      }
      
      // Mark as processed in this container
      processedItemsInThisContainer.add(itemKey);
    }
    
    // Add all items at once (more efficient)
    container.appendChild(fragment);
    
    console.log(`Finished building nav tree for container`);
  }
  
  // Set icon for a navigation item
  setIcon(item, link) {
    // Handle icon based on available properties
    const iconElement = document.createElement('span');
    iconElement.className = 'nav-icon';
    
    if (item.iconUrl) {
      // Use the iconUrl if available (preferred approach)
      if (item.iconUrl.startsWith('data:image/svg')) {
        // It's an SVG data URL - create an SVG element
        // Instead of attempting to decode, just use the data URL directly in an img tag
        const imgIcon = document.createElement('img');
        imgIcon.src = item.iconUrl;
        imgIcon.style.width = '1em';
        imgIcon.style.height = '1em';
        iconElement.appendChild(imgIcon);
      } else {
        // It's a regular image URL
        const imgIcon = document.createElement('img');
        imgIcon.src = item.iconUrl;
        imgIcon.style.width = '20px';
        imgIcon.style.height = '20px';
        iconElement.appendChild(imgIcon);
      }
    } else if (item.icon) {
      let m = item.icon.match(/^(\w+):\s*(.*)/);
      if (m) {
        const icontype = m[1];
        const iconval = m[2];
        
        switch (icontype) {
          case "class":
            iconElement.textContent = iconval;
            break;
          case "text":
            iconElement.textContent = iconval;
            break;
          case "url":
            let imgicon = document.createElement('img');
            imgicon.src = iconval;
            imgicon.style.width = '16px';
            imgicon.style.height = '16px';
            iconElement.appendChild(imgicon);
            break;
          default: 
            iconElement.textContent = "⬤";
        }
      } else if (item.icon.match(/\.(gif|png|jpg|svg)/)) {
        // It's an image path
        const imgIcon = document.createElement('img');
        imgIcon.src = item.icon;
        imgIcon.style.width = '20px';
        imgIcon.style.height = '20px';
        iconElement.appendChild(imgIcon);
      } else {
        // It's a FontAwesome class or similar
        const icon = document.createElement('i');
        icon.className = item.icon;
        
        // If using FontAwesome, make sure it has the base class
        if (item.icon.includes('fa-') && !item.icon.includes('fas ') && !item.icon.includes('far ')) {
          icon.className = `fas ${item.icon}`;
        }
        
        iconElement.appendChild(icon);
      }
    } else {
      // Default icon if none provided
      iconElement.textContent = '•';
    }
    
    link.appendChild(iconElement);
    return link;
  }

  // Create a navigation item 
  createNavItem(item, level = 0, containerId = 'root') {
    // Generate a unique ID for this item based on its properties and container
    const itemId = `${containerId}-${this.getItemUniqueId(item)}`;
    
    // Skip if this exact item has already been rendered in this container
    if (this.state.renderedItems.has(itemId)) {
      console.log(`Skipping duplicate item in container ${containerId}: ${item.title}`);
      return null;
    }
    
    // Add this item to the global tracker
    this.state.renderedItems.add(itemId);
    
    const navItem = document.createElement('li');
    navItem.className = 'nav-item';
    navItem.setAttribute('data-item-id', itemId);
    
    // Store the item's original data for editing
    navItem.setAttribute('data-item-title', item.title);
    if (item.path) navItem.setAttribute('data-item-path', item.path);
    if (item.icon) navItem.setAttribute('data-item-icon', item.icon);
    if (item.tags) navItem.setAttribute('data-item-tags', item.tags);
    
    // Check if it has children or includes
    const hasChildren = (item._children && item._children.length > 0) || item._include;
    if (hasChildren) {
      navItem.classList.add('has-treeview');
    }
    
    // Create link element
    const link = document.createElement('a');
    link.className = 'nav-link';
    link.href = '#';
    link.setAttribute('data-path', item.path || '');
    
    // Use a more robust way to handle event listeners to prevent duplicates
    // Use an ID to identify this specific link
    const linkId = `nav-link-${Math.random().toString(36).substring(2, 11)}`;
    link.setAttribute('data-link-id', linkId);
    
    // Remove any existing click listeners (in case of reuse)
    const oldListener = link._clickHandler;
    if (oldListener) {
      link.removeEventListener('click', oldListener);
    }
    
    // Set up icon
    this.setIcon(item, link);
    
    // Add title
    const titleElement = document.createElement('span');
    titleElement.className = 'nav-title';
    titleElement.textContent = item.title;
    link.appendChild(titleElement);
    
    // Add dropdown arrow if has children
    if (hasChildren) {
      const arrow = document.createElement('span');
      arrow.className = 'right nav-toggle';
      link.appendChild(arrow);
    }
    
    // Store the handler reference for later cleanup
    link._clickHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Toggle submenu if item has children
      if (hasChildren) {
        navItem.classList.toggle('menu-open');
      }
      
      // Open document if path is provided
      if (item.path) {
        this.handleNavClick(e, link);
      }
    };
    
    // Add click event listener
    link.addEventListener('click', link._clickHandler);
    
    navItem.appendChild(link);
    
    // If navigation is editable, add "add item" button
    if (this.state.editable) {
      const addButton = document.createElement('button');
      addButton.className = 'nav-add-button';
      addButton.innerHTML = '+';
      addButton.title = 'Add new item';
      
      // Add click handler for the add button
      addButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleAddButtonClick(e, item.title);
      });
      
      navItem.appendChild(addButton);
    }
    
    // Handle includes and children
    if (item._include) {
      const treeview = document.createElement('ul');
      treeview.className = 'nav-treeview';
      
      // Generate a unique container ID for this include
      const includeContainerId = `include-${Math.random().toString(36).substring(2, 11)}`;
      treeview.setAttribute('data-container-id', includeContainerId);
      
      navItem.appendChild(treeview);
      
      // Load included navigation
      this.loadIncludedNav(item._include, treeview);
    } else if (item._children && item._children.length > 0) {
      const treeview = document.createElement('ul');
      treeview.className = 'nav-treeview';
      
      // Generate a unique container ID for these children
      const childrenContainerId = `children-${Math.random().toString(36).substring(2, 11)}`;
      treeview.setAttribute('data-container-id', childrenContainerId);
      
      // Create children
      item._children.forEach(child => {
        const childItem = this.createNavItem(child, level + 1, childrenContainerId);
        if (childItem) {
          treeview.appendChild(childItem);
        }
      });
      
      // Add the treeview to the navItem
      navItem.appendChild(treeview);
    }
    
    return navItem;
  }
  
  // Load included navigation file
  async loadIncludedNav(path, container) {
    try {
      console.log(`Loading include: ${path}`);
      
      // Use unique key for this include in this container
      const containerKey = container.getAttribute('data-container-id') || 
                          `container-${Math.random().toString(36).substring(2, 11)}`;
      
      // Set ID if not already set
      if (!container.getAttribute('data-container-id')) {
        container.setAttribute('data-container-id', containerKey);
      }
      
      // Check if this specific include has already been loaded into this specific container
      const includeKey = `${containerKey}:${path}`;
      
      if (this.state.loadedIncludes.has(includeKey)) {
        console.log(`Include ${path} already loaded in container ${containerKey}, skipping`);
        return;
      }
      
      console.log(`Loading include ${path} into container ${containerKey}`);
      
      // Mark this include as loaded BEFORE fetching to prevent recursive issues
      this.state.loadedIncludes.set(includeKey, true);
      
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Failed to load included navigation: ${response.status}`);
      
      const navData = await response.json();
      
      // Build the nav tree from the included data
      this.buildNavTree(navData, container);
      
      console.log(`Finished loading include: ${path}`);
    } catch (error) {
      console.error('Error loading included navigation:', error);
      container.innerHTML = `<li class="error">Failed to load: ${error.message}</li>`;
    }
  }
  
  // Handle navigation item click
  async handleNavClick(event, element) {
    event.preventDefault();
    
    const path = element.getAttribute('data-path');
    if (!path) return;
    
    // Update active state
    this.shadowRoot.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    element.classList.add('active');
    
    // Set current route
    this.state.currentRoute = path;
    
    // Dispatch event to load content
    this.dispatchEvent(new CustomEvent('nav-item-selected', {
      bubbles: true,
      composed: true,
      detail: {
        title: element.querySelector('.nav-title').textContent,
        path: path
      }
    }));
    
    // Update browser URL
    this.updateBrowserUrl(path);
    
    // In mobile view, close the navigation
    if (this.state.isMobile && this.state.isNavOpen) {
      this.toggleMobileNav();
    }
  }
  
  // Handle window resize
  handleResize() {
    const wasMobile = this.state.isMobile;
    this.state.isMobile = window.innerWidth < 768;
    
    // Only update if state changed
    if (wasMobile !== this.state.isMobile) {
      this.updateMobileState();
    }
  }
  
  // Update mobile state
  updateMobileState() {
    const navSidebar = this.shadowRoot.querySelector('.nav-sidebar');
    const resizeHandle = this.shadowRoot.querySelector('.nav-resize-handle');
    const host = this;
    
    if (this.state.isMobile) {
      // Switch to mobile view
      navSidebar.classList.add('mobile');
      if (!this.state.isNavOpen) {
        navSidebar.classList.add('closed');
      }
      
      // Clear any fixed width in mobile mode
      host.style.width = '';
      host.style.flexBasis = '';
      
      // Hide resize handle in mobile mode
      if (resizeHandle) {
        resizeHandle.style.display = 'none';
      }
    } else {
      // Switch to desktop view
      navSidebar.classList.remove('mobile', 'closed');
      
      // Restore saved width in desktop mode
      const savedWidth = localStorage.getItem('navSidebarWidth');
      if (savedWidth) {
        host.style.width = savedWidth;
        host.style.flexBasis = savedWidth;
      }
      
      // Show resize handle in desktop mode
      if (resizeHandle) {
        resizeHandle.style.display = 'block';
      }
    }
    
    // Dispatch event for parent container to adjust layout
    this.dispatchEvent(new CustomEvent('navigation-mode-change', {
      bubbles: true,
      composed: true,
      detail: { isMobile: this.state.isMobile }
    }));
  }
  
  // Toggle mobile navigation
  toggleMobileNav() {
    this.state.isNavOpen = !this.state.isNavOpen;
    
    const navSidebar = this.shadowRoot.querySelector('.nav-sidebar');
    const overlay = this.shadowRoot.querySelector('.nav-overlay');
    
    if (this.state.isNavOpen) {
      navSidebar.classList.remove('closed');
      overlay.classList.add('visible');
    } else {
      navSidebar.classList.add('closed');
      overlay.classList.remove('visible');
    }
  }
  
  // Initialize resize handling
  initResizeHandling() {
    const resizeHandle = this.shadowRoot.querySelector('.nav-resize-handle');
    const host = this;
    
    let startX, startWidth;
    
    const startResize = (e) => {
      e.preventDefault();
      startX = e.clientX;
      startWidth = host.offsetWidth;
      
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
      
      // Add resize class to body to prevent text selection during resize
      document.body.classList.add('resizing-nav');
    };
    
    const resize = (e) => {
      if (this.state.isMobile) return;
      
      const newWidth = startWidth + (e.clientX - startX);
      const minWidth = parseInt(getComputedStyle(host).getPropertyValue('min-width'), 10) || 180;
      const maxWidth = parseInt(getComputedStyle(host).getPropertyValue('max-width'), 10) || 400;
      
      // Apply width constraints
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        host.style.flexBasis = `${newWidth}px`;
        host.style.width = `${newWidth}px`;
        
        // Dispatch event for parent container to adjust layout (for compatibility)
        this.dispatchEvent(new CustomEvent('navigation-resized', {
          bubbles: true,
          composed: true,
          detail: { width: newWidth }
        }));
      }
    };
    
    const stopResize = () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
      document.body.classList.remove('resizing-nav');
      
      // Save the width to localStorage for persistence
      localStorage.setItem('navSidebarWidth', host.style.flexBasis);
    };
    
    // Add event listener to resize handle
    resizeHandle.addEventListener('mousedown', startResize);
    
    // Load saved width from localStorage if available
    const savedWidth = localStorage.getItem('navSidebarWidth');
    if (savedWidth && !this.state.isMobile) {
      host.style.flexBasis = savedWidth;
      host.style.width = savedWidth;
    }
  }
  
  // Handle initial route from URL
  handleInitialRoute() {
    // Check if there's a hash in the URL
    const hash = window.location.hash.substring(1);
    
    // Check if there's a route in the URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const queryRoute = urlParams.get('page');
    
    if (hash) {
      // If navigation is not loaded yet, wait for it
      if (!this.state.navLoaded) {
        this.addEventListener('navigation-loaded', () => {
          this.findAndLoadItemByHash(hash);
        }, { once: true });
      } else {
        this.findAndLoadItemByHash(hash);
      }
    } else if (queryRoute) {
      // Honor query parameter if provided but no hash
      this.state.currentRoute = queryRoute;
      
      // Dispatch event to load the page
      this.dispatchEvent(new CustomEvent('nav-item-selected', {
        bubbles: true,
        composed: true,
        detail: { 
          title: 'Page',
          path: queryRoute 
        }
      }));
      
      // Update active state when navigation is rendered
      if (this.state.navLoaded) {
        this.updateActiveNavState(queryRoute);
      } else {
        this.addEventListener('navigation-loaded', () => {
          this.updateActiveNavState(queryRoute);
        }, { once: true });
      }
    } else if (this.state.defaultPage) {
      // Load default page if no hash or query param
      this.dispatchEvent(new CustomEvent('nav-item-selected', {
        bubbles: true,
        composed: true,
        detail: {
          title: 'Home',
          path: this.state.defaultPage
        }
      }));
      
      // Update active state when navigation is rendered
      if (this.state.navLoaded) {
        this.updateActiveNavState(this.state.defaultPage);
      } else {
        this.addEventListener('navigation-loaded', () => {
          this.updateActiveNavState(this.state.defaultPage);
        }, { once: true });
      }
    }
    
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash.substring(1);
      if (newHash) {
        this.findAndLoadItemByHash(newHash);
      }
    });
  }
  
  // Find and load item by hash
  findAndLoadItemByHash(hash) {
    // Wait until navigation is loaded
    if (!this.state.navLoaded) {
      this.addEventListener('navigation-loaded', () => {
        this.findAndLoadItemByHash(hash);
      }, { once: true });
      return;
    }
    
    // Normalize the hash value for comparison
    const normalizedHash = hash.toLowerCase().replace(/\W/g, '');
    
    // Find all nav links
    const navLinks = this.shadowRoot.querySelectorAll('.nav-link');
    let matchedLink = null;
    
    // First try to find an exact match for the page URL
    for (let i = 0; i < navLinks.length; i++) {
      const link = navLinks[i];
      const path = link.getAttribute('data-path');
      
      // Skip links without a path attribute
      if (!path) continue;
      
      // Check if the link matches the hash exactly
      if (path === hash || path === hash + '.md' || path === hash + '.html') {
        matchedLink = link;
        break;
      }
      
      // Check if the path matches the hash
      const pageName = path.split('/').pop().replace(/\.\w+$/, '');
      if (pageName === hash) {
        matchedLink = link;
        break;
      }
    }
    
    // If no exact match, try to find a match by title
    if (!matchedLink) {
      for (let i = 0; i < navLinks.length; i++) {
        const link = navLinks[i];
        
        // Get the title text and normalize it
        const titleText = link.querySelector('.nav-title')?.textContent.trim().toLowerCase().replace(/\W/g, '');
        
        if (titleText === normalizedHash) {
          matchedLink = link;
          break;
        }
      }
    }
    
    // If a match was found, load the page and update the active state
    if (matchedLink) {
      const path = matchedLink.getAttribute('data-path');
      
      // Open parent menus
      let parent = matchedLink.closest('.has-treeview');
      while (parent) {
        parent.classList.add('menu-open');
        parent = parent.parentElement.closest('.has-treeview');
      }
      
      // Dispatch event to load the page
      this.dispatchEvent(new CustomEvent('nav-item-selected', {
        bubbles: true,
        composed: true,
        detail: {
          title: matchedLink.querySelector('.nav-title').textContent,
          path: path
        }
      }));
      
      // Update active state
      this.updateActiveNavState(path);
      
      // Scroll the matched link into view in the sidebar
      matchedLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      console.warn(`No navigation item found for hash: ${hash}`);
      // Fall back to the default page
      if (this.state.defaultPage) {
        this.dispatchEvent(new CustomEvent('nav-item-selected', {
          bubbles: true,
          composed: true,
          detail: {
            title: 'Home',
            path: this.state.defaultPage
          }
        }));
      }
    }
  }
  
  // Update the active state in the navigation
  updateActiveNavState(route) {
    const navLinks = this.shadowRoot.querySelectorAll('.nav-link');
    
    // First try to find exact match
    let navLink = Array.from(navLinks).find(link => link.getAttribute('data-path') === route);
    
    // If no exact match, try to find by filename
    if (!navLink) {
      const routeName = route.split('/').pop().replace(/\.\w+$/, '');
      navLink = Array.from(navLinks).find(link => {
        const path = link.getAttribute('data-path');
        if (!path) return false;
        return path.split('/').pop().replace(/\.\w+$/, '') === routeName;
      });
    }
    
    if (navLink) {
      // Remove active class from all nav links
      navLinks.forEach(link => {
        link.classList.remove('active');
      });
      
      // Add active class to the matched link
      navLink.classList.add('active');
      
      // Open parent menu if needed
      let parent = navLink.parentElement;
      while (parent && parent.classList.contains('nav-item')) {
        if (parent.classList.contains('has-treeview')) {
          parent.classList.add('menu-open');
        }
        parent = parent.parentElement?.closest('.nav-item');
      }
    }
  }
  
  // Define which attributes to observe
  static get observedAttributes() {
    return ['data-nav-url', 'data-default-page', 'theme', 'data-editable', 'data-backend-url'];
  }
  
  // Update browser URL
  updateBrowserUrl(page) {
    // Extract the page name without extension to use as hash
    const pageName = page.split('/').pop().replace(/\.\w+$/, '');
    
    // Update hash for better compatibility
    const url = new URL(window.location.href);
    url.hash = pageName;
    window.history.pushState({}, '', url);
  }
  
  // Handle attribute changes
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    console.log(`Attribute changed: ${name} from ${oldValue} to ${newValue}`);
    
    // Skip loading navigation during initialization phase to prevent duplicates
    if (name === 'data-nav-url' && !this.state.initializing) {
      // Reset all tracking
      this.state.loadedIncludes = new Map();
      this.state.renderedItems = new Set();
      this.loadNavigation(newValue);
    }
    
    if (name === 'data-default-page') {
      this.state.defaultPage = newValue;
    }
    
    if (name === 'theme') {
      this.applyTheme(newValue);
    }
    
    if (name === 'data-editable') {
      this.state.editable = newValue === 'true';
      // If navigation is already loaded, reload it to apply the editable state
      if (this.state.navLoaded && !this.state.initializing) {
        this.loadNavigation();
      }
    }
    
    if (name === 'data-backend-url') {
      this.state.backendUrl = newValue;
    }
  }
  
  // Initialize dialog functionality
  initDialog() {
    const dialog = this.shadowRoot.querySelector('.nav-dialog');
    const backdrop = this.shadowRoot.querySelector('.nav-dialog-backdrop');
    const closeButton = this.shadowRoot.querySelector('.nav-dialog-close');
    const cancelButton = this.shadowRoot.querySelector('.btn-cancel');
    const form = this.shadowRoot.querySelector('.nav-dialog-form');
    const iconTypeSelect = this.shadowRoot.querySelector('#nav-icon');
    const iconValueInput = this.shadowRoot.querySelector('#nav-title');
    const fileUpload = this.shadowRoot.querySelector('#nav-file-upload');
    const filePreview = this.shadowRoot.querySelector('.file-upload-preview');
    
    // Close dialog when clicking backdrop or close button
    backdrop.addEventListener('click', () => this.closeDialog());
    closeButton.addEventListener('click', () => this.closeDialog());
    cancelButton.addEventListener('click', () => this.closeDialog());
    
    // Handle form submission
    form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    
    // Update icon preview as the user types
    if (iconTypeSelect) {
      iconTypeSelect.addEventListener('change', this.updateIconPreview);
    }
    if (iconValueInput) {
      iconValueInput.addEventListener('input', this.updateIconPreview);
    }
    
    // Handle file upload preview
    if (fileUpload && filePreview) {
      fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          filePreview.textContent = `Selected file: ${file.name}`;
          filePreview.style.color = 'var(--nav-active-text-color, #1890ff)';
        } else {
          filePreview.textContent = '';
          filePreview.style.color = 'var(--nav-text-color, #333)';
        }
      });
    }
  }

  // Handle dialog close
  handleDialogClose() {
    const dialog = this.shadowRoot.querySelector('.nav-dialog');
    const backdrop = this.shadowRoot.querySelector('.nav-dialog-backdrop');
    dialog.classList.remove('open');
    backdrop.classList.remove('open');
  }

  // Update icon preview
  updateIconPreview() {
    const iconType = this.shadowRoot.querySelector('#nav-icon').value;
    const iconValue = this.shadowRoot.querySelector('#nav-title').value;
    const iconPreview = this.shadowRoot.querySelector('.icon-preview');
    
    if (iconType === 'emoji') {
      iconPreview.textContent = iconValue;
    } else if (iconType === 'material') {
      iconPreview.innerHTML = `<span class="material-icons">${iconValue}</span>`;
    } else {
      iconPreview.innerHTML = `<i class="fas fa-${iconValue}"></i>`;
    }
  }

  // Handle add button click
  handleAddButtonClick(e, parentPath = null) {
    e.preventDefault();
    e.stopPropagation();
    
    const dialog = this.shadowRoot.querySelector('.nav-dialog');
    const backdrop = this.shadowRoot.querySelector('.nav-dialog-backdrop');
    const form = this.shadowRoot.querySelector('.nav-dialog-form');
    
    // Reset form
    form.reset();
    
    // Set parent path in form data
    form.dataset.parentPath = parentPath;
    
    // Set the target file
    const targetFile = 'nav/main.json';
    if (form.querySelector('#target-file')) {
      form.querySelector('#target-file').value = targetFile;
    }
    if (form.querySelector('#parent-path')) {
      form.querySelector('#parent-path').value = parentPath;
    }
    
    // Focus on title field
    setTimeout(() => {
      const titleInput = form.querySelector('#nav-title');
      if (titleInput) {
        titleInput.focus();
      }
    }, 100);
    
    // Show dialog
    dialog.classList.add('open');
    backdrop.classList.add('open');
  }

  // Handle form submission
  async handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const parentPath = form.dataset.parentPath;
    const title = form.querySelector('#nav-title').value.trim();
    const path = form.querySelector('#nav-path').value.trim();
    const icon = form.querySelector('#nav-icon').value;
    const tags = form.querySelector('#nav-tags').value.trim();
    
    // Validation - title is required
    if (!title) {
      alert('Title is required');
      return;
    }
    
    // Create the new navigation item
    const newItem = {
      title,
      path,
      icon,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    };
    
    try {
      // Handle file upload if implemented
      const fileInput = form.querySelector('input[type="file"]');
      if (fileInput && fileInput.files.length > 0) {
        const uploadedFile = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('path', path || `docs/${uploadedFile.name}`);
        
        // Upload the file
        const uploadResponse = await fetch('nav-editor.php?action=upload', {
          method: 'POST',
          body: formData
        });
        
        const uploadResult = await uploadResponse.json();
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.message || 'Failed to upload file');
        }
        
        // Update the path with the uploaded file's path
        newItem.path = uploadResult.path;
      }
      
      // Save to navigation
      await this.addNavigationItem(newItem, parentPath);
      
      // Close the dialog
      this.closeDialog();
      
    } catch (error) {
      console.error('Error saving navigation:', error);
      alert('An error occurred while saving the navigation: ' + error.message);
    }
  }

  renderIcon(icon) {
    if (!icon) return '';
    
    const { type, value } = icon;
    
    switch (type) {
      case 'emoji':
        return value;
      case 'material':
        return `<span class="material-icons">${value}</span>`;
      case 'fontawesome':
        return `<i class="fas fa-${value}"></i>`;
      default:
        return '';
    }
  }

  // Generate a unique ID for each item based on its properties
  getItemUniqueId(item) {
    // Use title, path/link, and icon to create a unique identifier
    const titlePart = item.title || '';
    const pathPart = item.path || item.link || '';
    const iconPart = item.icon || item.iconUrl || '';
    
    // Include _include path in the ID if it exists
    const includePart = item._include || '';
    
    return `nav-item-${titlePart}-${pathPart}-${iconPart}-${includePart}`.replace(/[^a-zA-Z0-9-_]/g, '-');
  }

  // Apply theme
  applyTheme(themeName) {
    // Update state
    this.state.theme = themeName || 'default';
    
    // Get the host element correctly
    const hostElement = this;
    
    // Remove any previous theme classes
    hostElement.className = '';
    
    // Add theme class
    if (themeName && themeName !== 'default') {
      hostElement.classList.add(`theme-${themeName}`);
    }
    
    // Dispatch theme change event
    this.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme: themeName }
    }));
  }

  // Add a new navigation item
  async addNavigationItem(item, parentPath = null) {
    try {
      // Fetch current navigation data
      const navUrl = this.getAttribute('data-nav-url') || 'nav/main.json';
      const response = await fetch(navUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to load navigation file: ${response.status}`);
      }
      
      let navData = await response.json();
      
      // Convert to array if it's not already (some files may be arrays directly)
      if (!Array.isArray(navData)) {
        if (navData.sidemenu && Array.isArray(navData.sidemenu)) {
          navData = navData.sidemenu;
        } else {
          console.error('Unexpected navigation data format');
          throw new Error('Navigation data has an unexpected format');
        }
      }
      
      // Find the parent item to add to, or add to root if no parent
      if (!parentPath) {
        // Add to root level
        navData.push(item);
      } else {
        // Find parent item by path
        let foundParent = false;
        
        // Helper function to search recursively
        const addToParent = (items) => {
          for (let i = 0; i < items.length; i++) {
            if (items[i].title === parentPath) {
              // Found the parent, add the child
              if (!items[i].children) {
                items[i].children = [];
              }
              items[i].children.push(item);
              foundParent = true;
              return true;
            }
            
            // Check children if they exist
            if (items[i].children && items[i].children.length > 0) {
              if (addToParent(items[i].children)) {
                return true;
              }
            }
          }
          return false;
        };
        
        addToParent(navData);
        
        if (!foundParent) {
          console.warn('Parent not found. Item will be added to the root level');
          navData.push(item);
        }
      }
      
      // Save the updated navigation
      const formData = new FormData();
      formData.append('filename', navUrl);
      
      // If the data is an array but the target is main.json, wrap it in an object
      let saveData;
      if (navUrl === 'nav/main.json' && Array.isArray(navData)) {
        saveData = { sidemenu: navData };
      } else {
        saveData = navData;
      }
      
      formData.append('data', JSON.stringify(saveData, null, 2));
      
      // Send to the backend
      const saveResponse = await fetch(this.state.backendUrl, {
        method: 'POST',
        body: formData
      });
      
      const result = await saveResponse.json();
      
      if (result.success) {
        // Show success message
        console.log('Navigation item added successfully');
        
        // Reload the navigation
        await this.loadNavigation();
        return true;
      } else {
        throw new Error(result.message || 'Failed to save navigation');
      }
    } catch (error) {
      console.error('Error saving navigation:', error);
      alert('Failed to save navigation. Please try again.');
      throw error;
    }
  }

  // Close the dialog
  closeDialog() {
    const dialog = this.shadowRoot.querySelector('.nav-dialog');
    const backdrop = this.shadowRoot.querySelector('.nav-dialog-backdrop');
    
    dialog.classList.remove('open');
    backdrop.classList.remove('open');
    
    // Reset form
    const form = this.shadowRoot.querySelector('.nav-dialog-form');
    form.reset();
  }
}

// Register the web component
customElements.define('nav-sidebar', NavSidebar);
