/**
 * Version History Component
 * 
 * A web component that displays version history for documents and navigation
 * with options to view, compare, and restore previous versions.
 */
class VersionHistory extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Component state
    this.state = {
      isOpen: false,
      currentPath: null,
      currentType: null, // 'doc' or 'nav'
      history: [],
      loading: false,
      error: null,
      selectedVersion: null,
      compareMode: false,
      compareVersions: [],
      diffContent: null
    };
    
    // Render initial structure
    this.render();
  }
  
  connectedCallback() {
    // Listen for document changes
    document.addEventListener('tab-changed', this.handleDocumentChange.bind(this));
    
    // Add event listener to toggle button
    const toggleBtn = this.shadowRoot.querySelector('.history-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', this.togglePanel.bind(this));
    }
  }
  
  // Render component HTML
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
        }
        
        .history-toggle {
          background-color: var(--primary-button-bg-color, #2563eb);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 10px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .history-toggle:hover {
          background-color: var(--primary-button-hover-bg-color, #1d4ed8);
        }
        
        .history-toggle .icon {
          font-size: 16px;
        }
        
        .history-panel {
          position: absolute;
          top: 100%;
          right: 0;
          width: 400px;
          max-height: 600px;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 1000;
          display: none;
          flex-direction: column;
          overflow: hidden;
        }
        
        .history-panel.open {
          display: flex;
        }
        
        .panel-header {
          padding: 10px 15px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .panel-header h3 {
          margin: 0;
          font-size: 16px;
        }
        
        .panel-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #6b7280;
        }
        
        .panel-close:hover {
          color: #111827;
        }
        
        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 10px 0;
        }
        
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          font-style: italic;
          color: #6b7280;
        }
        
        .error {
          color: #ef4444;
          padding: 10px 15px;
          margin: 10px;
          background-color: #fee2e2;
          border-radius: 4px;
        }
        
        .version-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        
        .version-item {
          padding: 8px 15px;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .version-item:hover {
          background-color: #f9fafb;
        }
        
        .version-item.selected {
          background-color: #e0f2fe;
        }
        
        .version-info {
          flex: 1;
        }
        
        .version-author {
          font-weight: 500;
          margin-bottom: 3px;
        }
        
        .version-date {
          font-size: 12px;
          color: #6b7280;
        }
        
        .version-message {
          font-size: 13px;
          color: #1f2937;
          margin-top: 5px;
          word-break: break-word;
        }
        
        .version-actions {
          display: flex;
          gap: 5px;
        }
        
        .btn {
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 3px 8px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .btn:hover {
          background-color: #e5e7eb;
        }
        
        .btn-primary {
          background-color: #2563eb;
          color: white;
          border-color: #2563eb;
        }
        
        .btn-primary:hover {
          background-color: #1d4ed8;
        }
        
        .panel-actions {
          display: flex;
          justify-content: space-between;
          padding: 10px 15px;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }
        
        .compare-select {
          display: flex;
          align-items: center;
          padding: 5px 10px;
          background-color: #f3f4f6;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        
        .compare-select label {
          font-size: 12px;
          margin-right: 10px;
        }
        
        .compare-buttons {
          display: flex;
          justify-content: center;
          gap: 10px;
          padding: 10px;
        }
        
        .empty-message {
          padding: 20px;
          text-align: center;
          color: #6b7280;
          font-style: italic;
        }
        
        .diff-container {
          padding: 10px 15px;
          overflow: auto;
          max-height: 400px;
          font-family: monospace;
          font-size: 12px;
          white-space: pre-wrap;
          line-height: 1.5;
        }
        
        .diff-header {
          padding: 10px 15px;
          display: flex;
          justify-content: space-between;
          background-color: #f3f4f6;
          border-bottom: 1px solid #e5e7eb;
          font-size: 12px;
        }
        
        .diff-line-added {
          background-color: #d1fae5;
          color: #065f46;
        }
        
        .diff-line-removed {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        
        .diff-info {
          padding: 5px 15px;
          font-size: 12px;
          color: #6b7280;
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
      </style>
      
      <button class="history-toggle" title="View version history">
        <span class="icon">📋</span>
        <span>History</span>
      </button>
      
      <div class="history-panel">
        <div class="panel-header">
          <h3>Version History</h3>
          <button class="panel-close" title="Close">&times;</button>
        </div>
        
        <div class="panel-content">
          <!-- Content will be rendered dynamically -->
          <div class="empty-message">Select a document to view its history</div>
        </div>
        
        <div class="panel-actions">
          <button class="btn compare-toggle">Compare Selected</button>
          <button class="btn btn-primary restore-btn">Restore Selected</button>
        </div>
      </div>
    `;
    
    // Add event listeners
    this.addEventListeners();
  }
  
  // Add event listeners to panel elements
  addEventListeners() {
    const panel = this.shadowRoot.querySelector('.history-panel');
    const closeBtn = this.shadowRoot.querySelector('.panel-close');
    const compareBtn = this.shadowRoot.querySelector('.compare-toggle');
    const restoreBtn = this.shadowRoot.querySelector('.restore-btn');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.state.isOpen = false;
        panel.classList.remove('open');
      });
    }
    
    if (compareBtn) {
      compareBtn.addEventListener('click', this.toggleCompareMode.bind(this));
    }
    
    if (restoreBtn) {
      restoreBtn.addEventListener('click', this.restoreSelected.bind(this));
    }
    
    // Close panel when clicking outside
    document.addEventListener('click', (event) => {
      if (this.state.isOpen && !this.contains(event.target) && !panel.contains(event.target)) {
        this.state.isOpen = false;
        panel.classList.remove('open');
      }
    });
  }
  
  // Toggle the history panel
  togglePanel() {
    const panel = this.shadowRoot.querySelector('.history-panel');
    this.state.isOpen = !this.state.isOpen;
    
    if (this.state.isOpen) {
      panel.classList.add('open');
      this.loadHistory();
    } else {
      panel.classList.remove('open');
    }
  }
  
  // Handle document/tab change
  handleDocumentChange(event) {
    const { path } = event.detail;
    
    // Reset state if path changes
    if (path !== this.state.currentPath) {
      this.state.currentPath = path;
      this.state.history = [];
      this.state.selectedVersion = null;
      this.state.compareMode = false;
      this.state.compareVersions = [];
      this.state.diffContent = null;
      
      // Determine type based on path
      this.state.currentType = path.startsWith('nav/') ? 'nav' : 'doc';
      
      // If panel is open, load history for new document
      if (this.state.isOpen) {
        this.loadHistory();
      }
    }
  }
  
  // Load version history for current document
  async loadHistory() {
    if (!this.state.currentPath) {
      this.renderEmptyState();
      return;
    }
    
    const panelContent = this.shadowRoot.querySelector('.panel-content');
    
    // Show loading state
    this.state.loading = true;
    panelContent.innerHTML = '<div class="loading">Loading version history...</div>';
    
    try {
      // Determine resource type and path
      const resourceType = this.state.currentType;
      let resourcePath, resourceName;
      
      if (resourceType === 'nav') {
        resourceName = this.state.currentPath.replace('nav/', '').replace('.json', '');
        const response = await fetch(`api.php/nav/history/${resourceName}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load history: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load navigation history');
        }
        
        this.state.history = result.data.history;
      } else {
        // Document type
        resourcePath = this.state.currentPath;
        const response = await fetch(`api.php/doc/history/${resourcePath}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load history: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load document history');
        }
        
        this.state.history = result.data.history;
      }
      
      // Reset loading state
      this.state.loading = false;
      
      // Render history
      this.renderHistory();
    } catch (error) {
      console.error('Error loading history:', error);
      this.state.loading = false;
      this.state.error = error.message;
      
      // Show error
      panelContent.innerHTML = `
        <div class="error">
          ${error.message}
        </div>
      `;
    }
  }
  
  // Render empty state
  renderEmptyState() {
    const panelContent = this.shadowRoot.querySelector('.panel-content');
    panelContent.innerHTML = '<div class="empty-message">Select a document to view its history</div>';
  }
  
  // Render history list
  renderHistory() {
    const panelContent = this.shadowRoot.querySelector('.panel-content');
    
    if (this.state.history.length === 0) {
      panelContent.innerHTML = '<div class="empty-message">No version history available</div>';
      return;
    }
    
    let html;
    
    if (this.state.compareMode) {
      // Render compare mode UI
      html = `
        <div class="compare-info">
          <p>Select two versions to compare. The older version should be selected first.</p>
        </div>
      `;
    } else if (this.state.diffContent) {
      // Render diff view
      const fromVersion = this.state.compareVersions[0];
      const toVersion = this.state.compareVersions[1];
      
      html = `
        <div class="diff-header">
          <span>From: ${fromVersion.date}</span>
          <span>To: ${toVersion.date}</span>
        </div>
        <div class="diff-info">
          <div>Comparing changes between versions</div>
        </div>
        <div class="diff-container">${this.formatDiff(this.state.diffContent)}</div>
        <div class="compare-buttons">
          <button class="btn back-to-history">Back to History</button>
        </div>
      `;
      
      // Register back button handler after rendering
      setTimeout(() => {
        const backBtn = this.shadowRoot.querySelector('.back-to-history');
        if (backBtn) {
          backBtn.addEventListener('click', () => {
            this.state.diffContent = null;
            this.state.compareMode = false;
            this.state.compareVersions = [];
            this.renderHistory();
          });
        }
      }, 0);
      
      return panelContent.innerHTML = html;
    }
    
    // Default history list view
    html = `
      <ul class="version-list">
        ${this.state.history.map((version, index) => `
          <li class="version-item ${this.isVersionSelected(version) ? 'selected' : ''}" data-index="${index}">
            <div class="version-info">
              <div class="version-author">${version.author}</div>
              <div class="version-date">${version.date}</div>
              <div class="version-message">${version.message}</div>
            </div>
            <div class="version-actions">
              ${this.state.compareMode 
                ? `<button class="btn select-for-compare" data-index="${index}">Select</button>`
                : `<button class="btn view-btn" data-index="${index}">View</button>`
              }
            </div>
          </li>
        `).join('')}
      </ul>
    `;
    
    panelContent.innerHTML = html;
    
    // Add event listeners to version items
    this.addVersionItemListeners();
  }
  
  // Add event listeners to version list items
  addVersionItemListeners() {
    const items = this.shadowRoot.querySelectorAll('.version-item');
    const viewButtons = this.shadowRoot.querySelectorAll('.view-btn');
    const compareButtons = this.shadowRoot.querySelectorAll('.select-for-compare');
    
    items.forEach(item => {
      item.addEventListener('click', (event) => {
        if (!this.state.compareMode && !event.target.closest('button')) {
          const index = parseInt(item.dataset.index);
          this.selectVersion(index);
        }
      });
    });
    
    viewButtons.forEach(btn => {
      btn.addEventListener('click', (event) => {
        const index = parseInt(btn.dataset.index);
        this.viewVersion(index);
      });
    });
    
    compareButtons.forEach(btn => {
      btn.addEventListener('click', (event) => {
        const index = parseInt(btn.dataset.index);
        this.selectForCompare(index);
      });
    });
  }
  
  // Check if version is selected
  isVersionSelected(version) {
    if (this.state.compareMode) {
      return this.state.compareVersions.some(v => v.hash === version.hash);
    } else {
      return this.state.selectedVersion && this.state.selectedVersion.hash === version.hash;
    }
  }
  
  // Select a version
  selectVersion(index) {
    this.state.selectedVersion = this.state.history[index];
    this.renderHistory();
  }
  
  // View a specific version
  async viewVersion(index) {
    const version = this.state.history[index];
    
    try {
      if (this.state.currentType === 'nav') {
        const navName = this.state.currentPath.replace('nav/', '').replace('.json', '');
        const response = await fetch(`api.php/nav/version/${navName}/${version.hash}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load version: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load navigation version');
        }
        
        // Dispatch event to show this version in preview
        this.dispatchEvent(new CustomEvent('version-selected', {
          bubbles: true,
          composed: true,
          detail: { 
            type: 'nav',
            path: this.state.currentPath,
            version: version,
            content: result.data.content
          }
        }));
      } else {
        // Document type
        const response = await fetch(`api.php/doc/version/${this.state.currentPath}/${version.hash}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load version: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load document version');
        }
        
        // Dispatch event to show this version in preview
        this.dispatchEvent(new CustomEvent('version-selected', {
          bubbles: true,
          composed: true,
          detail: {
            type: 'doc',
            path: this.state.currentPath,
            version: version,
            content: result.data.content
          }
        }));
      }
    } catch (error) {
      console.error('Error viewing version:', error);
      alert(`Error viewing version: ${error.message}`);
    }
  }
  
  // Toggle compare mode
  toggleCompareMode() {
    this.state.compareMode = !this.state.compareMode;
    this.state.compareVersions = [];
    this.renderHistory();
    
    // Update toggle button text
    const compareBtn = this.shadowRoot.querySelector('.compare-toggle');
    if (compareBtn) {
      compareBtn.textContent = this.state.compareMode ? 'Cancel Compare' : 'Compare Selected';
    }
  }
  
  // Select version for comparison
  selectForCompare(index) {
    const version = this.state.history[index];
    
    // If already selected, remove it
    const existingIndex = this.state.compareVersions.findIndex(v => v.hash === version.hash);
    if (existingIndex >= 0) {
      this.state.compareVersions.splice(existingIndex, 1);
    } else {
      // Otherwise add it if we have less than 2 versions selected
      if (this.state.compareVersions.length < 2) {
        this.state.compareVersions.push(version);
      } else {
        // Replace the oldest version if we already have 2
        this.state.compareVersions.shift();
        this.state.compareVersions.push(version);
      }
    }
    
    this.renderHistory();
    
    // If we have 2 versions selected, compare them
    if (this.state.compareVersions.length === 2) {
      this.compareVersions();
    }
  }
  
  // Compare selected versions
  async compareVersions() {
    if (this.state.compareVersions.length !== 2) {
      return;
    }
    
    const [olderVersion, newerVersion] = this.state.compareVersions;
    
    try {
      if (this.state.currentType === 'nav') {
        const navName = this.state.currentPath.replace('nav/', '').replace('.json', '');
        const response = await fetch(`api.php/nav/compare/${navName}/${olderVersion.hash}/${newerVersion.hash}`);
        
        if (!response.ok) {
          throw new Error(`Failed to compare versions: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to compare navigation versions');
        }
        
        this.state.diffContent = result.data.diff;
      } else {
        // Document type
        const response = await fetch(`api.php/doc/compare/${this.state.currentPath}/${olderVersion.hash}/${newerVersion.hash}`);
        
        if (!response.ok) {
          throw new Error(`Failed to compare versions: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to compare document versions');
        }
        
        this.state.diffContent = result.data.diff;
      }
      
      // Render the diff view
      this.renderHistory();
    } catch (error) {
      console.error('Error comparing versions:', error);
      alert(`Error comparing versions: ${error.message}`);
    }
  }
  
  // Format diff output with colors
  formatDiff(diffText) {
    if (!diffText) return '';
    
    return diffText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .split('\n')
      .map(line => {
        if (line.startsWith('+')) {
          return `<div class="diff-line-added">${line}</div>`;
        } else if (line.startsWith('-')) {
          return `<div class="diff-line-removed">${line}</div>`;
        } else {
          return `<div>${line}</div>`;
        }
      })
      .join('');
  }
  
  // Restore selected version
  async restoreSelected() {
    const version = this.state.selectedVersion;
    
    if (!version) {
      alert('Please select a version to restore');
      return;
    }
    
    if (!confirm(`Are you sure you want to restore the version from ${version.date}?`)) {
      return;
    }
    
    try {
      if (this.state.currentType === 'nav') {
        const navName = this.state.currentPath.replace('nav/', '').replace('.json', '');
        
        // First, get the content of the selected version
        const versionResponse = await fetch(`api.php/nav/version/${navName}/${version.hash}`);
        
        if (!versionResponse.ok) {
          throw new Error(`Failed to get version content: ${versionResponse.statusText}`);
        }
        
        const versionResult = await versionResponse.json();
        
        if (!versionResult.success) {
          throw new Error(versionResult.error || 'Failed to get version content');
        }
        
        // Now save it as the current version
        const saveResponse = await fetch(`api.php/nav/save/${navName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: versionResult.data.content,
            commit_message: `Restored to version from ${version.date}`
          })
        });
        
        if (!saveResponse.ok) {
          throw new Error(`Failed to restore version: ${saveResponse.statusText}`);
        }
        
        const saveResult = await saveResponse.json();
        
        if (!saveResult.success) {
          throw new Error(saveResult.error || 'Failed to restore navigation version');
        }
      } else {
        // Document type
        // First, get the content of the selected version
        const versionResponse = await fetch(`api.php/doc/version/${this.state.currentPath}/${version.hash}`);
        
        if (!versionResponse.ok) {
          throw new Error(`Failed to get version content: ${versionResponse.statusText}`);
        }
        
        const versionResult = await versionResponse.json();
        
        if (!versionResult.success) {
          throw new Error(versionResult.error || 'Failed to get version content');
        }
        
        // Now save it as the current version
        const saveResponse = await fetch(`api.php/doc/save/${this.state.currentPath}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: versionResult.data.content,
            commit_message: `Restored to version from ${version.date}`
          })
        });
        
        if (!saveResponse.ok) {
          throw new Error(`Failed to restore version: ${saveResponse.statusText}`);
        }
        
        const saveResult = await saveResponse.json();
        
        if (!saveResult.success) {
          throw new Error(saveResult.error || 'Failed to restore document version');
        }
      }
      
      // Success! Close panel and reload content
      alert('Version restored successfully');
      this.togglePanel(); // Close panel
      
      // Dispatch event to reload the document
      this.dispatchEvent(new CustomEvent('document-restored', {
        bubbles: true,
        composed: true,
        detail: {
          path: this.state.currentPath,
          type: this.state.currentType
        }
      }));
      
      // Reload history after a short delay
      setTimeout(() => {
        if (this.state.isOpen) {
          this.loadHistory();
        }
      }, 1000);
    } catch (error) {
      console.error('Error restoring version:', error);
      alert(`Error restoring version: ${error.message}`);
    }
  }
}

// Register the component
customElements.define('version-history', VersionHistory); 