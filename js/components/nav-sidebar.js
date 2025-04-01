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
      renderedItems: new Set()
    };
    
    // Bind methods
    this.handleNavClick = this.handleNavClick.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.toggleMobileNav = this.toggleMobileNav.bind(this);
    
    // Render initial structure
    this.render();
    
    // Listen for resize events
    window.addEventListener('resize', this.handleResize);
  }
  
  connectedCallback() {
    // Get attributes
    const navUrl = this.getAttribute('data-nav-url') || 'nav/main.json';
    const defaultPage = this.getAttribute('data-default-page') || '';
    
    // Set state
    this.state.defaultPage = defaultPage;
    
    // Load navigation
    this.loadNavigation(navUrl);
    
    // Initialize resize functionality
    this.initResizeHandling();
    
    // Handle initial route
    this.handleInitialRoute();
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
          display: block;
          height: 100%;
          overflow-y: auto;
          background-color: var(--nav-bg-color, white);
          color: var(--nav-text-color, #333);
          font-family: var(--nav-font-family, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif);
          border-right: 1px solid var(--nav-border-color, #e0e0e0);
          width: var(--nav-default-width, 250px);
          min-width: var(--nav-min-width, 180px);
          max-width: var(--nav-max-width, 400px);
          position: relative;
          transition: transform 0.3s ease;
        }
        
        .nav-resize-handle {
          position: absolute;
          top: 0;
          right: 0;
          width: 5px;
          height: 100%;
          background-color: var(--nav-resize-handle-color, #e0e0e0);
          cursor: ew-resize;
          opacity: 0.5;
          transition: opacity 0.2s ease, background-color 0.2s ease;
        }
        
        .nav-resize-handle:hover {
          opacity: 1;
          background-color: var(--nav-resize-handle-hover-color, #ccc);
        }
        
        .nav-header {
          font-size: 18px;
          font-weight: bold;
          padding: 15px;
          border-bottom: 1px solid var(--nav-border-color, #e0e0e0);
          background-color: var(--nav-header-bg-color, #f5f5f5);
        }
        
        .nav-tree {
          padding: 10px;
        }
        
        .nav-item {
          margin: 2px 0;
          list-style: none;
          position: relative;
        }
        
        .nav-link {
          display: flex;
          align-items: center;
          padding: 8px 10px;
          text-decoration: none;
          color: var(--nav-text-color, #333);
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        
        .nav-link:hover {
          background-color: var(--nav-hover-bg-color, #f0f0f0);
        }
        
        .nav-link.active {
          background-color: var(--nav-active-bg-color, #e6f7ff);
          color: var(--nav-active-text-color, #1890ff);
          font-weight: 500;
        }
        
        .nav-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
          color: var(--nav-icon-color, #555);
        }
        
        .nav-link.active .nav-icon {
          color: var(--nav-active-icon-color, #1890ff);
        }
        
        .nav-title {
          flex-grow: 1;
        }
        
        .nav-toggle {
          width: 20px;
          height: 20px;
          text-align: center;
          transition: transform 0.2s ease;
        }
        
        .nav-treeview {
          padding-left: 20px;
          display: none;
          margin: 0;
          padding-left: 24px;
        }
        
        .nav-item.menu-open > .nav-treeview {
          display: block;
        }
        
        .nav-item.menu-open > .nav-link .nav-toggle {
          transform: rotate(90deg);
        }
        
        /* Mobile styles */
        :host(.mobile) {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: var(--nav-mobile-width, 260px);
          z-index: 1000;
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
        }
        
        :host(.mobile.closed) {
          transform: translateX(-100%);
        }
        
        .nav-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 999;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .nav-overlay.visible {
          display: block;
          opacity: 1;
        }
        
        .mobile-header {
          display: none;
          padding: 15px;
          background-color: var(--nav-header-bg-color, #f5f5f5);
          border-bottom: 1px solid var(--nav-border-color, #e0e0e0);
          font-weight: bold;
        }
        
        :host(.mobile) .mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .mobile-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: var(--nav-text-color, #333);
        }
        
        .loading {
          padding: 20px;
          text-align: center;
          color: #999;
        }
        
        .error {
          padding: 20px;
          color: #f44336;
          background-color: #ffebee;
          border-radius: 4px;
          margin: 10px;
        }
      </style>
      
      <div class="nav-resize-handle" title="Drag to resize"></div>
      
      <div class="nav-overlay"></div>
      
      <div class="mobile-header">
        <span>Menu</span>
        <button class="mobile-close" aria-label="Close menu">×</button>
      </div>
      
      <div class="nav-header">The Give Hub Docs</div>
      
      <ul class="nav-tree">
        <li class="loading">Loading navigation...</li>
      </ul>
    `;
    
    // Add event listeners
    this.shadowRoot.querySelector('.nav-overlay').addEventListener('click', this.toggleMobileNav);
    this.shadowRoot.querySelector('.mobile-close').addEventListener('click', this.toggleMobileNav);
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
    
    // Handle different data structures
    let items = this.state.navData;
    if (!Array.isArray(items) && items.sidemenu && Array.isArray(items.sidemenu)) {
      items = items.sidemenu;
    }
    
    if (Array.isArray(items) && items.length > 0) {
      this.buildNavTree(items, navTree);
    } else {
      this.showError('Navigation data is empty or has invalid format');
    }
  }
  
  // Build navigation tree
  buildNavTree(items, container) {
    items.forEach(item => {
      const navItem = this.createNavItem(item);
      if (navItem) {
        container.appendChild(navItem);
      }
    });
  }
  
  // Create a navigation item 
  createNavItem(item) {
    const navItem = document.createElement('li');
    navItem.className = 'nav-item';
    
    // Check if it has children
    const hasChildren = item._children?.length > 0 || item._include;
    if (hasChildren) {
      navItem.classList.add('has-treeview');
    }
    
    // Create link element
    const link = document.createElement('a');
    link.className = 'nav-link';
    link.href = '#';
    link.setAttribute('data-path', item.path || '');
    
    // Add icon
    const iconElement = document.createElement('span');
    iconElement.className = 'nav-icon';
    
    if (item.icon) {
      if (item.icon.startsWith('class:')) {
        // Class-based icon (emoji or text)
        iconElement.textContent = item.icon.substring(6);
      } else if (item.icon.startsWith('url:')) {
        // URL-based icon
        const img = document.createElement('img');
        img.src = item.icon.substring(4);
        img.alt = '';
        img.style.width = '16px';
        img.style.height = '16px';
        iconElement.appendChild(img);
      } else {
        // Default to URL
        const img = document.createElement('img');
        img.src = item.icon;
        img.alt = '';
        img.style.width = '16px';
        img.style.height = '16px';
        iconElement.appendChild(img);
      }
    } else {
      // Default icon
      iconElement.textContent = '•';
    }
    
    link.appendChild(iconElement);
    
    // Add title
    const titleElement = document.createElement('span');
    titleElement.className = 'nav-title';
    titleElement.textContent = item.title;
    link.appendChild(titleElement);
    
    // Add toggle arrow for items with children
    if (hasChildren) {
      const toggleElement = document.createElement('span');
      toggleElement.className = 'nav-toggle';
      toggleElement.textContent = '▶';
      link.appendChild(toggleElement);
    }
    
    // Add click event
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Toggle submenu if item has children
      if (hasChildren) {
        navItem.classList.toggle('menu-open');
        
        // Load included navigation if not loaded yet
        if (item._include && !navItem._includeLoaded) {
          this.loadIncludedNav(item._include, treeview);
          navItem._includeLoaded = true;
        }
      }
      
      // Open document if path is provided
      if (item.path) {
        this.handleNavClick(e, link);
      }
    });
    
    navItem.appendChild(link);
    
    // Create children container if needed
    if (hasChildren) {
      const treeview = document.createElement('ul');
      treeview.className = 'nav-treeview';
      
      // Add inline children if available
      if (item._children && Array.isArray(item._children)) {
        this.buildNavTree(item._children, treeview);
      }
      
      navItem.appendChild(treeview);
    }
    
    return navItem;
  }
  
  // Load included navigation file
  async loadIncludedNav(path, container) {
    try {
      // Check if already loaded
      if (this.state.loadedIncludes.has(path)) {
        return;
      }
      
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`Failed to load included navigation: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.state.loadedIncludes.set(path, true);
      
      // Clear container and build tree
      container.innerHTML = '';
      this.buildNavTree(data, container);
    } catch (error) {
      console.error(`Error loading included navigation ${path}:`, error);
      container.innerHTML = `<li class="error">Failed to load: ${error.message}</li>`;
    }
  }
  
  // Handle navigation item click
  handleNavClick(event, element) {
    event.preventDefault();
    
    const path = element.getAttribute('data-path');
    if (!path) return;
    
    // Update active state
    this.shadowRoot.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    element.classList.add('active');
    
    // Dispatch event to load content
    this.dispatchEvent(new CustomEvent('nav-item-selected', {
      bubbles: true,
      composed: true,
      detail: {
        title: element.querySelector('.nav-title').textContent,
        path: path
      }
    }));
    
    // Update browser URL (hash)
    const pageName = path.split('/').pop().replace(/\.\w+$/, '');
    window.location.hash = pageName;
    
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
    if (this.state.isMobile) {
      // Switch to mobile view
      this.classList.add('mobile');
      if (!this.state.isNavOpen) {
        this.classList.add('closed');
      }
      
      // Hide resize handle in mobile mode
      this.shadowRoot.querySelector('.nav-resize-handle').style.display = 'none';
    } else {
      // Switch to desktop view
      this.classList.remove('mobile', 'closed');
      
      // Restore saved width in desktop mode
      const savedWidth = localStorage.getItem('navSidebarWidth');
      if (savedWidth) {
        this.style.width = savedWidth;
      }
      
      // Show resize handle in desktop mode
      this.shadowRoot.querySelector('.nav-resize-handle').style.display = 'block';
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
    
    const overlay = this.shadowRoot.querySelector('.nav-overlay');
    
    if (this.state.isNavOpen) {
      this.classList.remove('closed');
      overlay.classList.add('visible');
    } else {
      this.classList.add('closed');
      overlay.classList.remove('visible');
    }
  }
  
  // Initialize resize handling
  initResizeHandling() {
    const resizeHandle = this.shadowRoot.querySelector('.nav-resize-handle');
    
    let startX, startWidth;
    
    const startResize = (e) => {
      startX = e.clientX;
      startWidth = parseInt(getComputedStyle(this).width, 10);
      
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
      
      // Add resize class to body to prevent text selection during resize
      document.body.classList.add('resizing-nav');
    };
    
    const resize = (e) => {
      if (this.state.isMobile) return;
      
      const newWidth = startWidth + (e.clientX - startX);
      const minWidth = parseInt(getComputedStyle(this).getPropertyValue('--nav-min-width'), 10) || 180;
      const maxWidth = parseInt(getComputedStyle(this).getPropertyValue('--nav-max-width'), 10) || 400;
      
      // Apply width constraints
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        this.style.width = `${newWidth}px`;
        
        // Dispatch event for parent container to adjust layout
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
      localStorage.setItem('navSidebarWidth', this.style.width);
    };
    
    // Add event listener to resize handle
    resizeHandle.addEventListener('mousedown', startResize);
    
    // Load saved width from localStorage if available
    const savedWidth = localStorage.getItem('navSidebarWidth');
    if (savedWidth && !this.state.isMobile) {
      this.style.width = savedWidth;
    }
  }
  
  // Handle initial route from URL
  handleInitialRoute() {
    // Check if there's a hash in the URL
    const hash = window.location.hash.substring(1);
    
    if (hash) {
      // If navigation is not loaded yet, wait for it
      if (!this.state.navLoaded) {
        this.addEventListener('navigation-loaded', () => {
          this.findAndLoadItemByHash(hash);
        }, { once: true });
      } else {
        this.findAndLoadItemByHash(hash);
      }
    } else if (this.state.defaultPage) {
      // Load default page if no hash
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
  
  // Find and load item by hash
  findAndLoadItemByHash(hash) {
    // Find all nav links
    const navLinks = this.shadowRoot.querySelectorAll('.nav-link');
    
    // Try to find a matching link
    for (const link of navLinks) {
      const path = link.getAttribute('data-path');
      if (!path) continue;
      
      // Check if the path matches the hash
      const pageName = path.split('/').pop().replace(/\.\w+$/, '');
      if (pageName === hash) {
        // Open parent menus
        let parent = link.closest('.has-treeview');
        while (parent) {
          parent.classList.add('menu-open');
          parent = parent.parentElement.closest('.has-treeview');
        }
        
        // Simulate a click on the link
        link.classList.add('active');
        this.dispatchEvent(new CustomEvent('nav-item-selected', {
          bubbles: true,
          composed: true,
          detail: {
            title: link.querySelector('.nav-title').textContent,
            path: path
          }
        }));
        
        // Scroll the link into view
        link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
    }
    
    // If no match found and we have a default page, load it
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
  
  // Define which attributes to observe
  static get observedAttributes() {
    return ['data-nav-url', 'data-default-page'];
  }
  
  // Handle attribute changes
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    if (name === 'data-nav-url' && newValue) {
      this.loadNavigation(newValue);
    } else if (name === 'data-default-page') {
      this.state.defaultPage = newValue;
    }
  }
}

// Register the web component
customElements.define('nav-sidebar', NavSidebar);