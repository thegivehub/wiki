/**
 * Tabs Container Component
 * 
 * A web component that manages multiple document tabs with functionality
 * for creating, switching between, and closing tabs.
 */
class TabsContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Initialize component state
    this.tabs = [];
    this.activeTabId = null;
    
    // Render initial structure
    this.render();
    
    // Listen for navigation selection events
    document.addEventListener('nav-item-selected', this.handleNavItemSelected.bind(this));
  }
  
  connectedCallback() {
    // Add event listeners
    this.shadowRoot.addEventListener('click', this.handleTabClick.bind(this));
  }
  
  disconnectedCallback() {
    // Clean up event listeners
    document.removeEventListener('nav-item-selected', this.handleNavItemSelected);
  }
  
  // Render initial HTML structure
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          overflow: hidden;
          background-color: var(--tabs-bg-color, #f5f5f5);
          border-bottom: 1px solid var(--tabs-border-color, #ddd);
          height: 40px;
          flex-shrink: 0;
          width: 100%;
        }
        
        :host::-webkit-scrollbar {
          height: 5px;
        }
        
        :host::-webkit-scrollbar-thumb {
          background-color: var(--tabs-scrollbar-color, #ccc);
          border-radius: 2px;
        }
        
        :host::-webkit-scrollbar-track {
          background-color: var(--tabs-scrollbar-track-color, #f5f5f5);
        }
        
        .tab {
          padding: 0 15px;
          height: 100%;
          display: flex;
          align-items: center;
          background-color: var(--tab-bg-color, #eee);
          border-right: 1px solid var(--tabs-border-color, #ddd);
          cursor: pointer;
          white-space: nowrap;
          user-select: none;
          transition: background-color 0.15s ease;
          position: relative;
        }
        
        .tab:hover {
          background-color: var(--tab-hover-bg-color, #e5e5e5);
        }
        
        .tab.active {
          background-color: var(--tab-active-bg-color, #fff);
          border-bottom: 2px solid var(--tab-active-indicator-color, #2563eb);
        }
        
        .tab-title {
          margin-right: 8px;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .tab-close {
          width: 16px;
          height: 16px;
          line-height: 16px;
          text-align: center;
          border-radius: 50%;
          font-size: 12px;
          margin-left: 5px;
          opacity: 0.7;
          transition: background-color 0.15s ease, opacity 0.15s ease;
        }
        
        .tab-close:hover {
          background-color: var(--tab-close-hover-bg, #ddd);
          opacity: 1;
        }
        
        .unsaved-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--unsaved-indicator-color, #f59e0b);
          margin-left: 5px;
          display: none;
        }
        
        .tab.unsaved .unsaved-indicator {
          display: block;
        }
        
        .empty-message {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--tabs-empty-color, #999);
          font-style: italic;
          padding: 0 15px;
        }
      </style>
      
      <div class="empty-message">No documents open</div>
    `;
  }
  
  // Handle tab click events (activation and closing)
  handleTabClick(event) {
    const tab = event.target.closest('.tab');
    if (!tab) return;
    
    // Check if the close button was clicked
    if (event.target.classList.contains('tab-close')) {
      event.stopPropagation();
      this.closeTab(tab.dataset.id);
      return;
    }
    
    // Activate the clicked tab
    this.activateTab(tab.dataset.id);
  }
  
  // Handle navigation item selection
  handleNavItemSelected(event) {
    const { title, path } = event.detail;
    
    // Check if the tab already exists
    const existingTab = this.tabs.find(tab => tab.path === path);
    if (existingTab) {
      this.activateTab(existingTab.id);
      return;
    }
    
    // Create a new tab
    this.createTab(title, path);
  }
  
  // Create a new tab
  createTab(title, path) {
    // Generate a unique ID for the tab
    const id = 'tab-' + Date.now();
    
    // Remove empty message if it exists
    const emptyMessage = this.shadowRoot.querySelector('.empty-message');
    if (emptyMessage) {
      emptyMessage.remove();
    }
    
    // Create tab element
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.dataset.id = id;
    tab.dataset.path = path;
    
    const titleElement = document.createElement('span');
    titleElement.className = 'tab-title';
    titleElement.textContent = title;
    titleElement.title = title;
    
    const unsavedIndicator = document.createElement('span');
    unsavedIndicator.className = 'unsaved-indicator';
    
    const closeButton = document.createElement('span');
    closeButton.className = 'tab-close';
    closeButton.innerHTML = '&times;';
    closeButton.title = 'Close';
    
    tab.appendChild(titleElement);
    tab.appendChild(unsavedIndicator);
    tab.appendChild(closeButton);
    
    // Add tab to the DOM
    this.shadowRoot.appendChild(tab);
    
    // Store tab data
    this.tabs.push({
      id,
      title,
      path,
      element: tab,
      unsaved: false
    });
    
    // Activate the new tab
    this.activateTab(id);
    
    return id;
  }
  
  // Activate a tab
  activateTab(id) {
    // Deactivate all tabs
    this.tabs.forEach(tab => {
      tab.element.classList.remove('active');
    });
    
    // Find and activate the specified tab
    const tab = this.tabs.find(tab => tab.id === id);
    if (tab) {
      tab.element.classList.add('active');
      this.activeTabId = id;
      
      // Scroll tab into view if needed
      tab.element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      
      // Dispatch event to load content
      this.dispatchEvent(new CustomEvent('tab-changed', {
        bubbles: true,
        composed: true,
        detail: {
          id: tab.id,
          title: tab.title,
          path: tab.path
        }
      }));
    }
  }
  
  // Close a tab
  closeTab(id) {
    const tabIndex = this.tabs.findIndex(tab => tab.id === id);
    if (tabIndex === -1) return;
    
    // Remove tab from DOM
    const tab = this.tabs[tabIndex];
    tab.element.remove();
    
    // Remove tab from array
    this.tabs.splice(tabIndex, 1);
    
    // If we closed the active tab, activate another tab
    if (this.activeTabId === id) {
      if (this.tabs.length > 0) {
        // Prefer the tab to the right, or the leftmost tab if we were at the end
        const newActiveIndex = Math.min(tabIndex, this.tabs.length - 1);
        this.activateTab(this.tabs[newActiveIndex].id);
      } else {
        // No tabs left, show empty message
        this.activeTabId = null;
        this.shadowRoot.innerHTML += `<div class="empty-message">No documents open</div>`;
        
        // Notify that all tabs are closed
        this.dispatchEvent(new CustomEvent('all-tabs-closed', {
          bubbles: true,
          composed: true
        }));
      }
    }
  }
  
  // Mark a tab as having unsaved changes
  setUnsaved(id, unsaved = true) {
    const tab = this.tabs.find(tab => tab.id === id);
    if (tab) {
      tab.unsaved = unsaved;
      if (unsaved) {
        tab.element.classList.add('unsaved');
      } else {
        tab.element.classList.remove('unsaved');
      }
    }
  }
  
  // Get active tab information
  getActiveTab() {
    if (!this.activeTabId) return null;
    return this.tabs.find(tab => tab.id === this.activeTabId);
  }
}

// Register the web component
customElements.define('tabs-container', TabsContainer);