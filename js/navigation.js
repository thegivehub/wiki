// Navigation Web Component with Mobile Responsiveness
class SiteNavigation extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Component state
    this.state = {
      navLoaded: false,
      currentRoute: '',
      defaultPage: 'dashboard.html',
      navData: null,
      isMobile: window.innerWidth < 768,
      isNavOpen: false, // Track mobile nav open state
      theme: this.getAttribute('theme') || 'default',
      initializing: true, // Flag to track initialization phase
      editable: false, // Whether navigation can be edited
      backendUrl: null, // URL to the backend for saving navigation
    };

    // Global tracker for all rendered navigation items to prevent duplication
    this.renderedItems = new Set();
    this.loadedIncludes = new Map();

    // Bind methods
    this.handleNavClick = this.handleNavClick.bind(this);
    this.findAndLoadNavItemByHash = this.findAndLoadNavItemByHash.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.toggleMobileNav = this.toggleMobileNav.bind(this);
    this.handleAddButtonClick = this.handleAddButtonClick.bind(this);
    this.handleDialogClose = this.handleDialogClose.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.updateIconPreview = this.updateIconPreview.bind(this);
  }

  connectedCallback() {
    // Initialize the component
    this.render();
    
    // Get initial attributes
    const navUrl = this.getAttribute('data-nav-url') || 'nav/main.json';
    const defaultPage = this.getAttribute('data-default-page') || 'dashboard.html';
    const editable = this.getAttribute('data-editable') === 'true';
    const backendUrl = this.getAttribute('data-backend-url') || 'nav-editor.php';
    
    // Set properties without triggering navigation reload
    this.state.defaultPage = defaultPage;
    this.state.editable = editable;
    this.state.backendUrl = backendUrl;
    
    // Initialize dialog functionality
    this.initDialog();
    
    // Load navigation only once
    this.loadNavigation(navUrl);
    
    // Clear initialization flag after a small delay to allow attr changes to settle
    setTimeout(() => {
      this.state.initializing = false;
      console.log("Component initialization complete");
    }, 50);
    
    this.handleInitialRoute();

    // Apply initial theme if set
    const initialTheme = this.getAttribute('theme');
    if (initialTheme) {
      this.applyTheme(initialTheme);
    }

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash.substring(1);
      if (newHash) {
        this.findAndLoadNavItemByHash(newHash);
      }
    });

    // Listen for resize events
    window.addEventListener('resize', this.handleResize);

    // Execute initial resize check
    this.handleResize();
  }

  disconnectedCallback() {
    // Clean up event listeners
    window.removeEventListener('resize', this.handleResize);
  }

  // Handle window resize
  handleResize() {
    const wasMobile = this.state.isMobile;
    this.state.isMobile = window.innerWidth < 768;
    
    // Only update if the state actually changed
    if (wasMobile !== this.state.isMobile) {
      this.updateMobileState();
    }
  }

  // Update mobile/desktop state
  updateMobileState() {
    const navSidebar = this.shadowRoot.querySelector('.nav-sidebar');
    const toggleButton = this.shadowRoot.querySelector('.nav-toggle-button');
    const resizeHandle = this.shadowRoot.querySelector('.nav-resize-handle');
    
    if (this.state.isMobile) {
      // Switch to mobile view
      navSidebar.classList.add('mobile');
      if (!this.state.isNavOpen) {
        navSidebar.classList.add('closed');
      }
      toggleButton.style.display = 'flex';
      
      // Reset width for mobile
      navSidebar.style.width = '';
      
      // Hide resize handle in mobile mode
      if (resizeHandle) {
        resizeHandle.style.display = 'none';
      }
    } else {
      // Switch to desktop view
      navSidebar.classList.remove('mobile', 'closed');
      toggleButton.style.display = 'none';
      
      // Restore saved width in desktop mode
      const savedWidth = localStorage.getItem('nav-sidebar-width');
      if (savedWidth) {
        navSidebar.style.width = savedWidth;
      }
      
      // Show resize handle in desktop mode
      if (resizeHandle) {
        resizeHandle.style.display = 'block';
      }
    }

    // Dispatch event for parent container to adjust layout
    this.dispatchEvent(new CustomEvent('navigation-mode-change', {
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
      overlay.style.display = 'block';
      setTimeout(() => {
        overlay.style.opacity = '1';
      }, 10);
    } else {
      navSidebar.classList.add('closed');
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 300); // Match transition duration
    }
  }

  // Initial render of the component structure
  render() {
    // Apply base styles
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--nav-font-family, 'Lexend', -apple-system, BlinkMacSystemFont, sans-serif);
          position: relative;
          
          /* Theme variables with defaults */
          --nav-bg-color: white;
          --nav-text-color: #374151;
          --nav-border-color: #e5e7eb;
          --nav-hover-bg-color: #f3f4f6;
          --nav-active-bg-color: #eff6ff;
          --nav-active-text-color: #2563eb;
          --nav-icon-color: #374151;
          --nav-active-icon-color: #2563eb;
          --nav-toggle-button-bg: #2563eb;
          --nav-toggle-button-color: white;
          --nav-toggle-button-hover-bg: #1d4ed8;
          --nav-scrollbar-thumb-color: #d1d5db;
          --nav-scrollbar-track-color: #f3f4f6;
          --nav-header-bg-color: #f9fafb;
          --nav-overlay-bg-color: rgba(0, 0, 0, 0.5);
          --nav-shadow-color: rgba(0, 0, 0, 0.1);
          --nav-transition-duration: 0.3s;
          --nav-font-size: 1rem;
          --nav-mobile-width: 250px;
          --nav-default-width: 250px;
          --nav-min-width: 180px;
          --nav-max-width: 500px;
          --nav-resize-handle-color: #d1d5db;
          --nav-resize-handle-hover-color: #9ca3af;
          --nav-add-button-bg: #e5e7eb;
          --nav-add-button-color: #374151;
          --nav-add-button-hover-bg: #d1d5db;
          --nav-add-button-active-bg: #2563eb;
          --nav-add-button-active-color: white;
        }
        
        .nav-sidebar {
          height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0;
          background-color: var(--nav-bg-color);
          transition: transform var(--nav-transition-duration) ease, left var(--nav-transition-duration) ease;
          z-index: 1000;
          border-right: 1px solid var(--nav-border-color);
          width: var(--nav-default-width);
          min-width: var(--nav-min-width);
          max-width: var(--nav-max-width);
          resize: horizontal;
          position: relative;
        }
        
        /* Resize handle styles */
        .nav-resize-handle {
          position: absolute;
          top: 0;
          right: 0;
          width: 5px;
          height: 100%;
          background-color: var(--nav-resize-handle-color);
          cursor: ew-resize;
          opacity: 0.5;
          transition: opacity 0.2s ease, background-color 0.2s ease;
        }
        
        .nav-resize-handle:hover {
          opacity: 1;
          background-color: var(--nav-resize-handle-hover-color);
        }
        
        /* Add Entry Button Styles */
        .nav-add-button {
          display: none; /* Initially hidden, shown on parent hover */
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 3px;
          background: var(--nav-add-button-bg);
          color: var(--nav-add-button-color);
          border: none;
          cursor: pointer;
          font-size: 14px;
          margin-right: 8px;
          transition: all 0.2s ease;
          position: absolute;
          right: 25px;
          top: 10px;
        }
        
        .nav-add-button:hover {
          background: var(--nav-add-button-hover-bg);
        }
        
        .nav-add-button:active {
          background: var(--nav-add-button-active-bg);
          color: var(--nav-add-button-active-color);
        }
        
        .nav-item:hover > .nav-add-button {
          display: flex;
        }
        
        /* Dialog styles */
        .nav-dialog {
          position: fixed;
          z-index: 1001;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 8px;
          padding: 20px;
          width: 500px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 8px var(--nav-shadow-color);
          display: none;
        }
        
        .nav-dialog.open {
          display: block;
        }
        
        .nav-dialog-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          display: none;
        }
        
        .nav-dialog-backdrop.open {
          display: block;
        }
        
        .nav-dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--nav-border-color);
        }
        
        .nav-dialog-header h3 {
          margin: 0;
          font-size: 1.2rem;
        }
        
        .nav-dialog-close {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: var(--nav-text-color);
        }
        
        .nav-dialog-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .form-group label {
          font-weight: 500;
        }
        
        .form-group input, 
        .form-group select,
        .form-group textarea {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid var(--nav-border-color);
        }
        
        .form-group input:focus, 
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--nav-active-bg-color);
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
        }
        
        .form-row {
          display: flex;
          gap: 10px;
        }
        
        .form-row .form-group {
          flex: 1;
        }
        
        .icon-preview {
          width: 24px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 10px;
          background-color: var(--nav-hover-bg-color);
          border-radius: 4px;
        }
        
        .dialog-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        
        .btn {
          padding: 8px 15px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-cancel {
          background-color: #e5e7eb;
          color: #374151;
        }
        
        .btn-cancel:hover {
          background-color: #d1d5db;
        }
        
        .btn-save {
          background-color: #2563eb;
          color: white;
        }
        
        .btn-save:hover {
          background-color: #1d4ed8;
        }
        
        /* Mobile styles */
        .nav-sidebar.mobile {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: var(--nav-mobile-width);
          box-shadow: 0 0 15px var(--nav-shadow-color);
          resize: none;
        }
        
        .nav-sidebar.mobile .nav-resize-handle {
          display: none;
        }
        
        .nav-sidebar.mobile.closed {
          transform: translateX(-100%);
        }
        
        .nav-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--nav-overlay-bg-color);
          z-index: 999;
          opacity: 0;
          transition: opacity var(--nav-transition-duration) ease;
        }
        
        .nav-toggle-button {
          display: none;
          position: fixed;
          top: 10px;
          left: 10px;
          z-index: 1001;
          background-color: var(--nav-toggle-button-bg);
          color: var(--nav-toggle-button-color);
          box-shadow: 0 2px 5px var(--nav-shadow-color);
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 1rem;
          align-items: center;
          justify-content: center;
        }
        
        .nav-toggle-button:hover {
          background-color: var(--nav-toggle-button-hover-bg);
        }
        
        .nav-toggle-button .close-icon {
          display: none;
        }
        
        .nav-toggle-button .menu-icon {
          display: block;
        }
        
        .nav-sidebar:not(.closed) ~ .nav-toggle-button .close-icon {
          display: block;
        }
        
        .nav-sidebar:not(.closed) ~ .nav-toggle-button .menu-icon {
          display: none;
        }
        
        .nav-sidebar::-webkit-scrollbar {
          width: 5px;
        }
        
        .nav-sidebar::-webkit-scrollbar-thumb {
          background-color: var(--nav-scrollbar-thumb-color);
          border-radius: 10px;
        }
        
        .nav-sidebar::-webkit-scrollbar-track {
          background-color: var(--nav-scrollbar-track-color);
        }
        
        .nav-link {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          color: var(--nav-text-color);
          text-decoration: none;
          transition: background-color 0.15s ease, color 0.15s ease;
          font-size: var(--nav-font-size);
        }
        
        .nav-link:hover {
          background-color: var(--nav-hover-bg-color);
        }
        
        .nav-link.active {
          background-color: var(--nav-active-bg-color);
          color: var(--nav-active-text-color);
        }
        
        .nav-icon {
          margin-right: 0.75rem;
          width: 20px;
          text-align: center;
          font-size: var(--nav-font-size);
          color: var(--nav-icon-color);
        }
        
        .nav-link.active .nav-icon {
          color: var(--nav-active-icon-color);
        }
        
        .nav-treeview {
          padding-left: 1rem;
          display: none;
        }
        
        .nav-item.menu-open > .nav-treeview {
          display: block;
        }
        
        .nav-item {
          position: relative;
          list-style: none;
        }
        
        .right {
          position: absolute;
          right: 1rem;
          top: 0.5em;
          transform-origin: 50% 50%;
          transition: transform 0.2s ease;
        }
        
        .nav-item.menu-open > .nav-link .right {
          transform: rotate(-90deg);
        }
        
        .nav-toggle {
          height: 1em;
          width: 1em;
          float: right;
        }

        .nav-sidebar-mobile-header {
          display: none;
          padding: 1rem;
          background-color: var(--nav-header-bg-color);
          border-bottom: 1px solid var(--nav-border-color);
          font-weight: bold;
          color: var(--nav-text-color);
        }
        
        .nav-sidebar.mobile .nav-sidebar-mobile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .close-mobile-nav {
          background: none;
          border: none;
          font-size: calc(var(--nav-font-size) * 1.25);
          cursor: pointer;
          color: var(--nav-text-color);
        }
        
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

        .fas {
          font-family: 'Font Awesome 5 Free';
          font-weight: 900;
        }

        .far {
          font-family: 'Font Awesome 5 Free';
          font-weight: 400;
        }

        .fa-angle-left::before { content: '\\f104'; }
        .fa-circle::before { content: '\\f111'; }
        .fa-bars::before { content: '\\f0c9'; }
        .fa-times::before { content: '\\f00d'; }
        
        /* Mobile-specific styles */
        @media (max-width: 767px) {
          :host {
            width: 100%;
          }
        }

        /* File upload styles */
        .file-upload-container {
          border: 2px dashed var(--nav-border-color);
          border-radius: 4px;
          padding: 15px;
          text-align: center;
          margin-bottom: 5px;
          transition: all 0.2s ease;
        }
        
        .file-upload-container:hover {
          border-color: var(--nav-active-bg-color);
          background-color: var(--nav-hover-bg-color);
        }
        
        .file-upload-preview {
          margin-top: 10px;
          font-size: 0.9em;
          color: var(--nav-text-color);
        }
        
        .file-upload-help {
          color: var(--nav-text-color);
          opacity: 0.7;
          font-size: 0.8em;
        }
      </style>
      
      <div class="nav-overlay"></div>
      
      <button class="nav-toggle-button" aria-label="Toggle navigation menu">
        <i class="fas fa-bars menu-icon"></i>
        <i class="fas fa-times close-icon"></i>
      </button>
      
      <div class="nav-sidebar">
        <div class="nav-resize-handle" title="Drag to resize"></div>
        <div class="nav-sidebar-mobile-header">
          <span>Menu</span>
          <button class="close-mobile-nav" aria-label="Close navigation menu">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false" id="sidemenu">
          <!-- Navigation items will be inserted here -->
          <slot></slot>
        </ul>
      </div>
      
      <!-- Dialog for adding new navigation items -->
      <div class="nav-dialog-backdrop"></div>
      <div class="nav-dialog">
        <div class="nav-dialog-header">
          <h3>Add Navigation Item</h3>
          <button class="nav-dialog-close">×</button>
        </div>
        <form class="nav-dialog-form">
          <input type="hidden" id="parent-path" value="">
          <input type="hidden" id="target-file" value="">
          
          <div class="form-group">
            <label for="title">Title *</label>
            <input type="text" id="title" required placeholder="Enter item title">
          </div>
          
          <div class="form-group">
            <label for="path">Document Path</label>
            <input type="text" id="path" placeholder="Path to the document (e.g., docs/example.md)">
          </div>
          
          <div class="form-group">
            <label for="file-upload">Upload Document</label>
            <div class="file-upload-container">
              <input type="file" id="file-upload" accept=".md,.html,.txt,.pdf">
              <div class="file-upload-preview"></div>
            </div>
            <small class="file-upload-help">Supported formats: .md, .html, .txt, .pdf</small>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="icon-type">Icon Type</label>
              <select id="icon-type">
                <option value="text">Text/Emoji</option>
                <option value="class">CSS Class</option>
                <option value="url">Image URL</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="icon-value">Icon Value <span class="icon-preview"></span></label>
              <input type="text" id="icon-value" placeholder="Enter icon value">
            </div>
          </div>
          
          <div class="form-group">
            <label for="tags">Tags</label>
            <input type="text" id="tags" placeholder="Enter comma-separated tags">
          </div>
          
          <div class="dialog-footer">
            <button type="button" class="btn btn-cancel">Cancel</button>
            <button type="submit" class="btn btn-save">Save</button>
          </div>
        </form>
      </div>
    `;
    
    // Create a link element for Font Awesome
    const fontAwesomeLink = document.createElement('link');
    fontAwesomeLink.rel = 'stylesheet';
    fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    
    // Append the link to the document head
    document.head.appendChild(fontAwesomeLink);
    
    // Add event listeners for mobile navigation
    const toggleButton = this.shadowRoot.querySelector('.nav-toggle-button');
    const overlay = this.shadowRoot.querySelector('.nav-overlay');
    const closeButton = this.shadowRoot.querySelector('.close-mobile-nav');
    
    toggleButton.addEventListener('click', this.toggleMobileNav);
    overlay.addEventListener('click', this.toggleMobileNav);
    closeButton.addEventListener('click', this.toggleMobileNav);
    
    // Initialize resize functionality
    this.initResizeHandling();
  }

  // Initialize resize handling
  initResizeHandling() {
    const navSidebar = this.shadowRoot.querySelector('.nav-sidebar');
    const resizeHandle = this.shadowRoot.querySelector('.nav-resize-handle');
    
    if (!resizeHandle || !navSidebar) return;
    
    let startX, startWidth;
    
    const startResize = (e) => {
      startX = e.clientX;
      startWidth = parseInt(getComputedStyle(navSidebar).width, 10);
      
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
      
      // Add resize class to body to prevent text selection during resize
      document.body.classList.add('resizing-nav');
    };
    
    const resize = (e) => {
      if (this.state.isMobile) return;
      
      const newWidth = startWidth + (e.clientX - startX);
      const minWidth = parseInt(getComputedStyle(this).getPropertyValue('--nav-min-width'), 10) || 180;
      const maxWidth = parseInt(getComputedStyle(this).getPropertyValue('--nav-max-width'), 10) || 500;
      
      // Apply width constraints
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        navSidebar.style.width = `${newWidth}px`;
        
        // Dispatch event for parent container to adjust layout
        this.dispatchEvent(new CustomEvent('navigation-resized', {
          detail: { width: newWidth }
        }));
      }
    };
    
    const stopResize = () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
      document.body.classList.remove('resizing-nav');
      
      // Save the width to localStorage for persistence
      localStorage.setItem('nav-sidebar-width', navSidebar.style.width);
    };
    
    // Add event listener to resize handle
    resizeHandle.addEventListener('mousedown', startResize);
    
    // Load saved width from localStorage if available
    const savedWidth = localStorage.getItem('nav-sidebar-width');
    if (savedWidth && !this.state.isMobile) {
      navSidebar.style.width = savedWidth;
    }
  }

  // Handle navigation item click - Modified for mobile
  handleNavClick(event, element) {
      event.preventDefault();
      
      const page = element.getAttribute('data-page');
      
      // Don't do anything if it's a parent menu without a link
      if (!page || page === '#') {
          // Toggle submenu if it's a parent item
          const listItem = element.parentElement;
          if (listItem.classList.contains('has-treeview')) {
              listItem.classList.toggle('menu-open');
          }
          return;
      }
      
      // Update active state
      this.shadowRoot.querySelectorAll('.nav-link').forEach(link => {
          link.classList.remove('active');
      });
      
      element.classList.add('active');
      
      // Load the page - dispatch event for parent to handle
      this.dispatchEvent(new CustomEvent('navigation-click', {
          detail: { page: page }
      }));
      
      // Update current route
      this.state.currentRoute = page;
      
      // Update browser URL (hash only)
      this.updateBrowserUrl(page);
      
      // In mobile view, close the navigation after selecting an item
      if (this.state.isMobile && this.state.isNavOpen) {
          this.toggleMobileNav();
      }
  }

  // Load navigation from JSON file
  async loadNavigation(url) {
    try {
      // Reset navigation state to prevent duplicates during re-renders
      this.loadedIncludes = new Map(); // Track loaded includes
      this.renderedItems = new Set(); // Reset global tracker
      
      const navUrl = url || this.getAttribute('data-nav-url') || 'nav/main.json';
      console.log(`Loading navigation from URL: ${navUrl}`);
      
      const response = await fetch(navUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to load navigation: ${response.statusText}`);
      }
      
      this.state.navData = await response.json();
      console.log('Navigation data loaded, rendering navigation');
      
      this.renderNavigation();
      this.state.navLoaded = true;
      
      // Dispatch event that navigation is loaded
      this.dispatchEvent(new CustomEvent('navigation-loaded', {
        detail: { navData: this.state.navData }
      }));
    } catch (error) {
      console.error('Error loading navigation:', error);
      this.renderFallbackNavigation();
    }
  }

  // Render navigation items
  renderNavigation() {
    if (!this.state.navData) return;
    
    console.log('Starting navigation render');
    
    const sidemenu = this.shadowRoot.getElementById('sidemenu');
    sidemenu.innerHTML = '';
    
    // Important: Reset the loaded includes when rendering navigation
    this.loadedIncludes = new Map();
    this.renderedItems = new Set();
    
    // Store processed items to prevent duplicates
    this._processedItems = new Set();
    
    // Render sidebar items
    if (this.state.navData.sidemenu) {
      console.log(`Processing ${this.state.navData.sidemenu.length} menu items`);
      this.buildNavTree(this.state.navData.sidemenu, sidemenu);
    }
    
    // Dispatch event that navigation is rendered
    this.dispatchEvent(new CustomEvent('navigation-rendered'));
  }

  setIcon(item, link) {
      // Handle icon based on available properties
      if (item.iconUrl) {
          // Use the iconUrl if available (preferred approach)
          if (item.iconUrl.startsWith('data:image/svg')) {
              // It's an SVG data URL - create an SVG element
              const iconWrapper = document.createElement('span');
              iconWrapper.className = 'nav-icon';
              
              // Instead of attempting to decode, just use the data URL directly in an img tag
              const imgIcon = document.createElement('img');
              imgIcon.src = item.iconUrl;
              imgIcon.style.width = '1em';
              imgIcon.style.height = '1em';
              iconWrapper.appendChild(imgIcon);
              
              link.appendChild(iconWrapper);
          } else {
              // It's a regular image URL
              const imgIcon = document.createElement('img');
              imgIcon.src = item.iconUrl;
              imgIcon.className = 'nav-icon';
              imgIcon.style.width = '20px';
              imgIcon.style.height = '20px';
              link.appendChild(imgIcon);
          }
      } else if (item.icon) {
          let m = item.icon.match(/^(\w+):\s*(.*)/);
          if (m) {
              const icontype = m[1];
              const iconval = m[2];
              let iconel = document.createElement("span");
              iconel.className = "nav-icon";
            switch (icontype) {
              case "class":
                iconel.classList.add(iconval);
                break;
              case "text":
                iconel.innerHTML = iconval;
                break;
              case "url":
                let imgicon = document.createElement('img');
                imgicon.src = iconval;
                iconel.appendChild(imgicon);
                break;
              default: 
                iconel.innerHTML = "⬤";
            }
            
            link.appendChild(iconel);
          } else if (item.icon.match(/\.(gif|png|jpg|svg)/)) {
              // It's an image path
              const imgIcon = document.createElement('img');
              imgIcon.src = item.icon;
              imgIcon.className = 'nav-icon';
              imgIcon.style.width = '20px';
              imgIcon.style.height = '20px';
              link.appendChild(imgIcon);
          } else {
              // It's a FontAwesome class or similar
              const icon = document.createElement('i');
              icon.className = `nav-icon ${item.icon}`;
              
              // If using FontAwesome, make sure it has the base class
              if (item.icon.includes('fa-') && !item.icon.includes('fas ') && !item.icon.includes('far ')) {
                  icon.className = `nav-icon fas ${item.icon}`;
              }
              
              link.appendChild(icon);
          }
      } else {
          // Default icon if none provided
          const icon = document.createElement('i');
          icon.className = 'nav-icon fas fa-circle';
          link.appendChild(icon);
      }
      
      return link;
  }

  // Create navigation item element
  async createNavItem(item, parentPath = null) {
      // Generate a unique ID for this item based on its properties
      const itemId = this.getItemUniqueId(item);
      
      // Skip if this exact item has already been rendered globally
      if (this.renderedItems.has(itemId)) {
        console.log(`Skipping globally duplicated item: ${item.title}`);
        return null; // Return null to signal this item should be skipped
      }
      
      // Add this item to the global tracker
      this.renderedItems.add(itemId);
      
      const navItem = document.createElement('li');
      navItem.className = 'nav-item';
      navItem.setAttribute('data-item-id', itemId); // Store the ID for debugging
      
      // Store the item's original data for editing
      navItem.setAttribute('data-item-title', item.title);
      if (item.path) navItem.setAttribute('data-item-path', item.path);
      if (item.icon) navItem.setAttribute('data-item-icon', item.icon);
      if (item.tags) navItem.setAttribute('data-item-tags', item.tags);
      
      if ((item.children && item.children.length > 0) || (item._include)) {
          navItem.classList.add('has-treeview');
      }
      
      let link = document.createElement('a');
      link.href = item.link || '#';
      link.className = 'nav-link';
      link.setAttribute('data-page', item.link || '');
      
      // Use a more robust way to handle event listeners to prevent duplicates
      // Use an ID to identify this specific link
      const linkId = `nav-link-${Math.random().toString(36).substring(2, 11)}`;
      link.setAttribute('data-link-id', linkId);
      
      // Remove any existing click listeners (in case of reuse)
      const oldListener = link._clickHandler;
      if (oldListener) {
        link.removeEventListener('click', oldListener);
      }
      
      // Store the handler reference for later cleanup
      link._clickHandler = (e) => this.handleNavClick(e, link);
      link.addEventListener('click', link._clickHandler);
      
      // Handle icon based on available properties
      link = this.setIcon(item, link);

      // Add title
      const text = document.createElement('span');
      text.textContent = item.title;
      text.style.marginLeft = '0.5rem';
      link.appendChild(text);
      
      // Add dropdown arrow if has children
      if ((item.children && item.children.length > 0) || item._include) {
          const arrow = document.createElement('span');
          arrow.innerHTML = "◀";
          arrow.className = 'right nav-toggle';
          link.appendChild(arrow);
      }
      
      navItem.appendChild(link);
      
      // If navigation is editable, add "add item" button to items with children or includes
      if (this.state.editable) {
        // Determine the target file and parent path for adding new items
        let targetFile = '';
        let currentPath = '';
        
        if (item._include) {
          targetFile = item._include.replace(/^\//, ''); // Remove leading slash
          currentPath = '';
        } else if (parentPath !== null) {
          // This is a child item
          targetFile = parentPath.file;
          currentPath = parentPath.path;
        } else {
          // This is a top-level item in main.json
          targetFile = 'main.json';
          currentPath = '';
        }
        
        const addButton = document.createElement('button');
        addButton.className = 'nav-add-button';
        addButton.innerHTML = '+';
        addButton.title = 'Add new item';
        addButton.setAttribute('data-target-file', targetFile);
        addButton.setAttribute('data-parent-path', currentPath);
        
        // Add click handler for the add button
        addButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleAddButtonClick(e.target);
        });
        
        navItem.appendChild(addButton);
      }
      
      // Generate a unique ID for the treeview container
      const treeviewId = `treeview-${Math.random().toString(36).substring(2, 11)}`;
      
      // Handle includes and children
      if (item._include) {
        // Only create the container if it doesn't exist
        let childrenContainer = navItem.querySelector('.nav-treeview');
        if (!childrenContainer) {
          childrenContainer = document.createElement('ul');
          childrenContainer.className = 'nav nav-treeview';
          childrenContainer.setAttribute('data-container-id', treeviewId);
          navItem.appendChild(childrenContainer);
        }
 
        await this.loadIncludedNav(item._include, childrenContainer);
      } else if (item.children && item.children.length > 0) {
          const treeview = document.createElement('ul');
          treeview.className = 'nav nav-treeview';
          treeview.setAttribute('data-container-id', treeviewId);
          
          // Create a parent path object for children
          const childParentPath = {
            file: parentPath ? parentPath.file : 'main.json',
            path: item.title
          };
          
          for (const child of item.children) {
              let navchild = await this.createNavItem(child, childParentPath);
              if (navchild) { // Only append if not null (not a duplicate)
                treeview.appendChild(navchild);
              }
          }
          
          navItem.appendChild(treeview);
      }
      
      return navItem;
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
      
      if (!this.loadedIncludes) {
        console.log('Creating new loadedIncludes Map');
        this.loadedIncludes = new Map();
      }
      
      if (this.loadedIncludes.has(includeKey)) {
        console.log(`Include ${path} already loaded in container ${containerKey}, skipping`);
        return;
      }
      
      console.log(`Loading include ${path} into container ${containerKey}`);
      
      // Clear container to prevent duplicates
      container.innerHTML = '';
      
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Failed to load included navigation: ${response.status}`);
      
      const navData = await response.json();
      
      // Mark this include as loaded BEFORE building the tree to prevent recursive issues
      this.loadedIncludes.set(includeKey, true);
      
      // Build the nav tree from the included data
      await this.buildNavTree(navData, container);
      
      console.log(`Finished loading include: ${path}`);
    } catch (error) {
      console.error('Error loading included navigation:', error);
      container.innerHTML = `<div class="nav-error">Failed to load navigation: ${path}</div>`;
    }
  }

  async buildNavTree(items, container) {
    if (!Array.isArray(items)) return;
    
    console.log(`Building nav tree with ${items.length} items`);
    
    // Clear container first to prevent duplicates
    if (!container.dataset.buildStarted) {
      container.innerHTML = '';
      container.dataset.buildStarted = 'true';
    }
    
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
      const navItem = await this.createNavItem(item);
      
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
    
    // Clean up the build flag
    delete container.dataset.buildStarted;
    
    console.log(`Finished building nav tree for container`);
  }
  

  // Render fallback navigation if loading fails
  renderFallbackNavigation() {
    const sidemenu = this.shadowRoot.getElementById('sidemenu');
    sidemenu.innerHTML = `
      <li class="nav-item">
        <a href="dashboard.html" class="nav-link" data-page="dashboard.html">
          <i class="nav-icon fas fa-tachometer-alt"></i>
          <span>Dashboard</span>
        </a>
      </li>
      <li class="nav-item">
        <a href="campaigns.html" class="nav-link" data-page="campaigns.html">
          <i class="nav-icon fas fa-chart-line"></i>
          <span>Campaign Review</span>
        </a>
      </li>
      <li class="nav-item">
        <a href="users.html" class="nav-link" data-page="users.html">
          <i class="nav-icon fas fa-users"></i>
          <span>User Management</span>
        </a>
      </li>
       <li class="nav-item">
        <a href="reports.html" class="nav-link" data-page="reports.html">
          <i class="nav-icon fas fa-file-lines"></i>
          <span>Reports</span>
        </a>
      </li>
    `;
    
    // Add event listeners to the fallback navigation
    sidemenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => this.handleNavClick(e, link));
    });
  }

  // Update browser URL
  updateBrowserUrl(page) {
    // Extract the page name without extension to use as hash
    const pageName = page.replace('.html', '');
    
    // Update both query param and hash for better compatibility
    const url = new URL(window.location.href);
    //url.searchParams.set('page', page);
    url.hash = pageName;
    window.history.pushState({}, '', url);
  }

  // Handle initial route from URL
  handleInitialRoute() {
      // Check if there's a hash in the URL
      const hash = window.location.hash.substring(1);
      
      // Check if there's a route in the URL query params
      const urlParams = new URLSearchParams(window.location.search);
      const queryRoute = urlParams.get('page');
      
      // Wait for navigation to load
      if (hash) {
          // Process hash-based navigation after navigation is loaded
          this.addEventListener('navigation-rendered', () => {
              this.findAndLoadNavItemByHash(hash);
          }, { once: true });
      } else if (queryRoute) {
          // Honor query parameter if provided but no hash
          this.state.currentRoute = queryRoute;
          
          // Dispatch event to load the page
          this.dispatchEvent(new CustomEvent('navigation-click', {
              detail: { page: queryRoute }
          }));
          
          // Update active state when navigation is rendered
          this.addEventListener('navigation-rendered', () => {
              this.updateActiveNavState(queryRoute);
          }, { once: true });
      } else {
          // Load default page
          this.dispatchEvent(new CustomEvent('navigation-click', {
              detail: { page: this.state.defaultPage }
          }));
      }
  }

  // Find and load a nav item based on hash value
  findAndLoadNavItemByHash(hash) {
    // Wait until navigation is loaded
    if (!this.state.navLoaded) {
      this.addEventListener('navigation-rendered', () => {
        this.findAndLoadNavItemByHash(hash);
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
      const page = link.getAttribute('data-page');
      
      // Skip links without a page attribute or with '#'
      if (!page || page === '#') continue;
      
      // Check if the link matches the hash exactly
      if (page === hash || page === hash + '.html') {
        matchedLink = link;
        break;
      }
    }
    
    // If no exact match, try to find a match by title
    if (!matchedLink) {
      for (let i = 0; i < navLinks.length; i++) {
        const link = navLinks[i];
        const page = link.getAttribute('data-page');
        
        // Skip links without a page attribute or with '#'
        if (!page || page === '#') continue;
        
        // Get the title text and normalize it
        const titleText = link.textContent.trim().toLowerCase().replace(/\W/g, '');
        
        if (titleText === normalizedHash) {
          matchedLink = link;
          break;
        }
      }
    }
    
    // If a match was found, load the page and update the active state
    if (matchedLink) {
      const page = matchedLink.getAttribute('data-page');
      
      // Dispatch event to load the page
      this.dispatchEvent(new CustomEvent('navigation-click', {
        detail: { page: page }
      }));
      
      this.updateActiveNavState(page);
      
      // Scroll the matched link into view in the sidebar
      matchedLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      console.warn(`No navigation item found for hash: ${hash}`);
      // Fall back to the default page
      this.dispatchEvent(new CustomEvent('navigation-click', {
        detail: { page: this.state.defaultPage }
      }));
    }
  }

  // Update the active state in the navigation
  updateActiveNavState(route) {
    const navLink = this.shadowRoot.querySelector(`.nav-link[data-page="${route}"]`);
    
    if (navLink) {
      // Remove active class from all nav links
      this.shadowRoot.querySelectorAll('.nav-link').forEach(link => {
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
        parent = parent.parentElement;
      }
    }
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

  // Initialize the dialog functionality
  initDialog() {
    const dialog = this.shadowRoot.querySelector('.nav-dialog');
    const backdrop = this.shadowRoot.querySelector('.nav-dialog-backdrop');
    const closeButton = this.shadowRoot.querySelector('.nav-dialog-close');
    const cancelButton = this.shadowRoot.querySelector('.btn-cancel');
    const form = this.shadowRoot.querySelector('.nav-dialog-form');
    const iconTypeSelect = this.shadowRoot.querySelector('#icon-type');
    const iconValueInput = this.shadowRoot.querySelector('#icon-value');
    const fileUpload = this.shadowRoot.querySelector('#file-upload');
    const filePreview = this.shadowRoot.querySelector('.file-upload-preview');
    
    // Close the dialog when clicking the close button or cancel button
    closeButton.addEventListener('click', this.handleDialogClose);
    cancelButton.addEventListener('click', this.handleDialogClose);
    
    // Close the dialog when clicking the backdrop
    backdrop.addEventListener('click', this.handleDialogClose);
    
    // Handle form submission
    form.addEventListener('submit', this.handleFormSubmit);
    
    // Update icon preview as the user types
    iconTypeSelect.addEventListener('change', this.updateIconPreview);
    iconValueInput.addEventListener('input', this.updateIconPreview);
    
    // Handle file upload preview
    fileUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        filePreview.textContent = `Selected file: ${file.name}`;
        filePreview.style.color = 'var(--nav-active-text-color)';
      } else {
        filePreview.textContent = '';
        filePreview.style.color = 'var(--nav-text-color)';
      }
    });
  }
  
  // Handle "Add Item" button click
  handleAddButtonClick(button) {
    const targetFile = button.getAttribute('data-target-file');
    const parentPath = button.getAttribute('data-parent-path');
    const dialog = this.shadowRoot.querySelector('.nav-dialog');
    const backdrop = this.shadowRoot.querySelector('.nav-dialog-backdrop');
    const form = this.shadowRoot.querySelector('.nav-dialog-form');
    
    // Reset the form
    form.reset();
    
    // Set the target file and parent path
    this.shadowRoot.querySelector('#target-file').value = targetFile;
    this.shadowRoot.querySelector('#parent-path').value = parentPath;
    
    // Show the dialog
    dialog.classList.add('open');
    backdrop.classList.add('open');
    
    // Focus on the title field
    setTimeout(() => {
      this.shadowRoot.querySelector('#title').focus();
    }, 100);
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
    const iconType = this.shadowRoot.querySelector('#icon-type').value;
    const iconValue = this.shadowRoot.querySelector('#icon-value').value;
    const preview = this.shadowRoot.querySelector('.icon-preview');
    
    if (!iconValue) {
      preview.innerHTML = '';
      return;
    }
    
    switch (iconType) {
      case 'text':
        preview.innerHTML = iconValue;
        break;
      case 'class':
        preview.innerHTML = `<i class="${iconValue}"></i>`;
        break;
      case 'url':
        preview.innerHTML = `<img src="${iconValue}" style="width: 16px; height: 16px;" />`;
        break;
    }
  }
  
  // Handle form submission
  async handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const title = this.shadowRoot.querySelector('#title').value.trim();
    const path = this.shadowRoot.querySelector('#path').value.trim();
    const iconType = this.shadowRoot.querySelector('#icon-type').value;
    const iconValue = this.shadowRoot.querySelector('#icon-value').value.trim();
    const tags = this.shadowRoot.querySelector('#tags').value.trim();
    const targetFile = this.shadowRoot.querySelector('#target-file').value;
    const parentPath = this.shadowRoot.querySelector('#parent-path').value;
    const fileUpload = this.shadowRoot.querySelector('#file-upload');
    const uploadedFile = fileUpload.files[0];
    
    // Validation - title is required
    if (!title) {
      alert('Title is required');
      return;
    }
    
    // Create new item object
    const newItem = {
      title: title
    };
    
    // Add optional properties if provided
    if (path) newItem.path = path;
    if (iconValue) newItem.icon = `${iconType}: ${iconValue}`;
    if (tags) newItem.tags = tags;
    
    try {
      // Handle file upload if a file was selected
      if (uploadedFile) {
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
      
      // Fetch the current navigation file
      const response = await fetch(targetFile);
      if (!response.ok) throw new Error(`Failed to load navigation file: ${response.status}`);
      
      let navData = await response.json();
      
      // Convert to array if it's not already (some files may be arrays directly)
      if (!Array.isArray(navData)) {
        if (navData.sidemenu && Array.isArray(navData.sidemenu)) {
          navData = navData.sidemenu;
        } else {
          console.error('Unexpected navigation data format');
          alert('Error: Navigation data has an unexpected format');
          return;
        }
      }
      
      // Find the parent item to add to, or add to root if no parent
      if (!parentPath) {
        // Add to root level
        navData.push(newItem);
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
              items[i].children.push(newItem);
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
          alert('Parent not found. Item will be added to the root level');
          navData.push(newItem);
        }
      }
      
      // Save the updated navigation
      const formData = new FormData();
      formData.append('filename', targetFile);
      
      // If the data is an array but the target is main.json, wrap it in an object
      let saveData;
      if (targetFile === 'main.json' && Array.isArray(navData)) {
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
        alert('Navigation item added successfully');
        
        // Close the dialog
        this.handleDialogClose();
        
        // Reload the navigation
        this.loadNavigation();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving navigation:', error);
      alert('An error occurred while saving the navigation');
    }
  }

  // Define observed attributes
  static get observedAttributes() {
    return ['data-nav-url', 'data-default-page', 'theme', 'data-editable', 'data-backend-url'];
  }

  // Handle attribute changes
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    console.log(`Attribute changed: ${name} from ${oldValue} to ${newValue}`);
    
    // Skip loading navigation during initialization phase to prevent duplicates
    if (name === 'data-nav-url' && !this.state.initializing) {
      // Reset all tracking
      this.loadedIncludes = new Map();
      this._processedItems = new Set();
      this.renderedItems = new Set();
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
}

// Register the custom element
customElements.define('site-navigation', SiteNavigation);
