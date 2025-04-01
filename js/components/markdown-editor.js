/**
 * Markdown Editor Component
 * 
 * A web component that provides markdown editing and preview functionality.
 * Features include toggling between view and edit modes, markdown rendering,
 * and auto-saving functionality.
 */
class MarkdownEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Component state
    this.state = {
      editMode: false,
      currentPath: null,
      content: null,
      unsavedChanges: false,
      autoSaveTimer: null,
      autoSaveDelay: 2000 // 2 seconds
    };
    
    // Bind methods
    this.toggleEditMode = this.toggleEditMode.bind(this);
    this.handleContentChange = this.handleContentChange.bind(this);
    this.saveContent = this.saveContent.bind(this);
    
    // Render initial structure
    this.render();
    
    // Listen for tab-related events
    document.addEventListener('tab-changed', this.handleTabChanged.bind(this));
    document.addEventListener('all-tabs-closed', this.handleAllTabsClosed.bind(this));
  }
  
  disconnectedCallback() {
    // Clean up event listeners
    document.removeEventListener('tab-changed', this.handleTabChanged);
    document.removeEventListener('all-tabs-closed', this.handleAllTabsClosed);
    
    // Clear auto-save timer
    if (this.state.autoSaveTimer) {
      clearTimeout(this.state.autoSaveTimer);
    }
  }
  
  // Render initial HTML structure
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
          overflow: auto;
          background-color: var(--editor-bg-color, white);
          color: var(--editor-text-color, #333);
          font-family: var(--editor-font-family, system-ui, sans-serif);
        }
        
        .toolbar {
          display: flex;
          padding: 8px 16px;
          background-color: var(--toolbar-bg-color, #f5f5f5);
          border-bottom: 1px solid var(--toolbar-border-color, #e0e0e0);
          align-items: center;
        }
        
        .toolbar button {
          padding: 6px 12px;
          margin-right: 8px;
          background-color: var(--button-bg-color, #fff);
          border: 1px solid var(--button-border-color, #d0d0d0);
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.15s ease;
        }
        
        .toolbar button:hover {
          background-color: var(--button-hover-bg-color, #f0f0f0);
        }
        
        .toolbar button.primary {
          background-color: var(--primary-button-bg-color, #2563eb);
          color: var(--primary-button-text-color, white);
          border-color: var(--primary-button-border-color, #1d4ed8);
        }
        
        .toolbar button.primary:hover {
          background-color: var(--primary-button-hover-bg-color, #1d4ed8);
        }
        
        .status {
          margin-left: auto;
          font-size: 14px;
          color: var(--status-text-color, #666);
        }
        
        .status.saved {
          color: var(--status-saved-color, #10b981);
        }
        
        .status.unsaved {
          color: var(--status-unsaved-color, #f59e0b);
        }
        
        .container {
          height: calc(100% - 45px);
          overflow: auto;
        }
        
        .viewer {
          padding: 20px;
          line-height: 1.6;
        }
        
        .viewer h1, .viewer h2, .viewer h3, .viewer h4, .viewer h5, .viewer h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
          line-height: 1.25;
        }
        
        .viewer h1:first-child {
          margin-top: 0;
        }
        
        .viewer h1 {
          font-size: 2em;
          border-bottom: 1px solid var(--heading-border-color, #e0e0e0);
          padding-bottom: 0.3em;
        }
        
        .viewer h2 {
          font-size: 1.5em;
          border-bottom: 1px solid var(--heading-border-color, #e0e0e0);
          padding-bottom: 0.3em;
        }
        
        .viewer h3 {
          font-size: 1.25em;
        }
        
        .viewer p {
          margin-top: 0;
          margin-bottom: 1em;
        }
        
        .viewer a {
          color: var(--link-color, #2563eb);
          text-decoration: none;
        }
        
        .viewer a:hover {
          text-decoration: underline;
        }
        
        .viewer pre {
          background-color: var(--code-bg-color, #f5f5f5);
          padding: 16px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 1em 0;
        }
        
        .viewer code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.9em;
          background-color: var(--inline-code-bg-color, #f5f5f5);
          padding: 0.2em 0.4em;
          border-radius: 3px;
        }
        
        .viewer pre code {
          background-color: transparent;
          padding: 0;
          border-radius: 0;
        }
        
        .viewer blockquote {
          margin: 1em 0;
          padding: 0 1em;
          color: var(--blockquote-text-color, #666);
          border-left: 0.25em solid var(--blockquote-border-color, #d0d0d0);
        }
        
        .viewer img {
          max-width: 100%;
          height: auto;
        }
        
        .viewer table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        
        .viewer table th, .viewer table td {
          border: 1px solid var(--table-border-color, #e0e0e0);
          padding: 8px 12px;
          text-align: left;
        }
        
        .viewer table th {
          background-color: var(--table-header-bg-color, #f5f5f5);
          font-weight: 600;
        }
        
        .viewer ul, .viewer ol {
          margin-top: 0;
          margin-bottom: 1em;
          padding-left: 2em;
        }
        
        .editor {
          height: 100%;
          padding: 20px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.9em;
          line-height: 1.6;
          border: none;
          width: 100%;
          box-sizing: border-box;
          background-color: var(--editor-textarea-bg-color, #fafafa);
          color: var(--editor-textarea-text-color, #333);
          resize: none;
          outline: none;
        }
        
        .placeholder {
          display: flex;
          height: 100%;
          align-items: center;
          justify-content: center;
          color: var(--placeholder-color, #999);
          font-size: 18px;
          text-align: center;
          padding: 20px;
        }
        
        .loading {
          display: flex;
          height: 100%;
          align-items: center;
          justify-content: center;
          color: var(--loading-color, #666);
          font-size: 18px;
        }
        
        .error {
          padding: 20px;
          color: var(--error-color, #f44336);
          background-color: var(--error-bg-color, #ffebee);
          border-radius: 4px;
          margin: 20px;
        }
      </style>
      
      <div class="toolbar" style="display: none;">
        <button id="toggle-edit-mode" class="primary">Edit</button>
        <button id="save-button">Save</button>
        <span class="status">No changes</span>
      </div>
      
      <div class="container">
        <div class="placeholder">
          <div>
            <p>Select a document from the navigation menu to get started.</p>
            <p>Open documents will appear as tabs above.</p>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners to toolbar buttons
    this.shadowRoot.getElementById('toggle-edit-mode').addEventListener('click', this.toggleEditMode);
    this.shadowRoot.getElementById('save-button').addEventListener('click', this.saveContent);
  }
  
  // Handle tab change event
  async handleTabChanged(event) {
    const { path } = event.detail;
    
    // Save current content if needed before switching
    if (this.state.unsavedChanges && this.state.currentPath) {
      await this.saveContent();
    }
    
    // Update current path
    this.state.currentPath = path;
    
    // Reset state
    this.state.editMode = false;
    this.state.unsavedChanges = false;
    
    // Show toolbar
    this.shadowRoot.querySelector('.toolbar').style.display = 'flex';
    
    // Update UI before loading content
    this.showLoading();
    
    // Load and display the document
    try {
      await this.loadDocument(path);
    } catch (error) {
      this.showError(`Failed to load document: ${error.message}`);
    }
  }
  
  // Handle all tabs closed event
  handleAllTabsClosed() {
    // Hide toolbar
    this.shadowRoot.querySelector('.toolbar').style.display = 'none';
    
    // Clear state
    this.state.currentPath = null;
    this.state.content = null;
    this.state.editMode = false;
    this.state.unsavedChanges = false;
    
    // Show placeholder
    const container = this.shadowRoot.querySelector('.container');
    container.innerHTML = `
      <div class="placeholder">
        <div>
          <p>Select a document from the navigation menu to get started.</p>
          <p>Open documents will appear as tabs above.</p>
        </div>
      </div>
    `;
  }
  
  // Show loading indicator
  showLoading() {
    const container = this.shadowRoot.querySelector('.container');
    container.innerHTML = `<div class="loading">Loading document...</div>`;
  }
  
  // Show error message
  showError(message) {
    const container = this.shadowRoot.querySelector('.container');
    container.innerHTML = `<div class="error">${message}</div>`;
  }
  
  // Load document from path
  async loadDocument(path) {
    try {
      // Fetch document content
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      // Get markdown content
      const markdown = await response.text();
      this.state.content = markdown;
      
      // Render the document in view mode
      this.renderDocument();
      
      // Update the toggle button text based on current mode
      this.updateToggleButtonText();
      
      // Clear unsaved changes status
      this.updateSaveStatus(false);
      
    } catch (error) {
      console.error('Error loading document:', error);
      throw error;
    }
  }
  
  // Render the document in current mode (view or edit)
  renderDocument() {
    const container = this.shadowRoot.querySelector('.container');
    
    if (this.state.editMode) {
      // Edit mode - show textarea
      container.innerHTML = `<textarea class="editor"></textarea>`;
      const textarea = container.querySelector('.editor');
      textarea.value = this.state.content;
      textarea.addEventListener('input', this.handleContentChange);
      textarea.focus();
    } else {
      // View mode - show rendered markdown
      container.innerHTML = `<div class="viewer">${this.markdownToHtml(this.state.content)}</div>`;
    }
  }
  
  // Toggle between edit and view modes
  toggleEditMode() {
    this.state.editMode = !this.state.editMode;
    this.renderDocument();
    this.updateToggleButtonText();
  }
  
  // Update toggle button text based on current mode
  updateToggleButtonText() {
    const toggleButton = this.shadowRoot.getElementById('toggle-edit-mode');
    toggleButton.textContent = this.state.editMode ? 'Preview' : 'Edit';
  }
  
  // Handle content changes in the editor
  handleContentChange(event) {
    // Update content
    this.state.content = event.target.value;
    
    // Mark as unsaved
    if (!this.state.unsavedChanges) {
      this.updateSaveStatus(true);
    }
    
    // Setup auto-save timer
    if (this.state.autoSaveTimer) {
      clearTimeout(this.state.autoSaveTimer);
    }
    
    this.state.autoSaveTimer = setTimeout(() => {
      this.saveContent();
    }, this.state.autoSaveDelay);
  }
  
  // Update save status in the UI
  updateSaveStatus(unsaved) {
    this.state.unsavedChanges = unsaved;
    
    const status = this.shadowRoot.querySelector('.status');
    if (unsaved) {
      status.textContent = 'Unsaved changes';
      status.className = 'status unsaved';
      
      // Notify the tabs component about unsaved changes
      this.dispatchEvent(new CustomEvent('document-changed', {
        bubbles: true,
        composed: true,
        detail: { 
          path: this.state.currentPath,
          unsaved: true
        }
      }));
    } else {
      status.textContent = 'Saved';
      status.className = 'status saved';
      
      // Clear unsaved status after a delay
      setTimeout(() => {
        if (status.textContent === 'Saved') {
          status.textContent = 'No changes';
          status.className = 'status';
        }
      }, 3000);
      
      // Notify the tabs component about saved changes
      this.dispatchEvent(new CustomEvent('document-changed', {
        bubbles: true,
        composed: true,
        detail: { 
          path: this.state.currentPath,
          unsaved: false
        }
      }));
    }
  }
  
  // Save content
  async saveContent() {
    if (!this.state.currentPath || !this.state.unsavedChanges) return;
    
    try {
      // In a real implementation, this would send content to the server
      // For now, we'll just simulate a successful save
      console.log(`Saving document ${this.state.currentPath}...`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Dispatch save event for other components to handle
      this.dispatchEvent(new CustomEvent('content-save', {
        bubbles: true,
        composed: true,
        detail: {
          path: this.state.currentPath,
          content: this.state.content
        }
      }));
      
      // Mark as saved
      this.updateSaveStatus(false);
      
      // If we're in edit mode, keep focus on the editor
      if (this.state.editMode) {
        const textarea = this.shadowRoot.querySelector('.editor');
        if (textarea) {
          textarea.focus();
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error saving document:', error);
      // Show error in status
      const status = this.shadowRoot.querySelector('.status');
      status.textContent = `Error saving: ${error.message}`;
      status.className = 'status error';
      
      return false;
    }
  }
  
  // Convert markdown to HTML
  markdownToHtml(markdown) {
    if (!markdown) return '';
    
    // This is a simple implementation - in production, use a library like marked.js
    let html = markdown
      // Headers
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
      .replace(/^###### (.*$)/gm, '<h6>$1</h6>')
      
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      
      // Images
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">')
      
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      
      // Unordered lists - handle multi-level
      .replace(/^\s*[-*+]\s+(.*?)$/gm, '<li>$1</li>')
      
      // Ordered lists
      .replace(/^\s*(\d+)\.\s+(.*?)$/gm, '<li>$2</li>')
      
      // Blockquotes
      .replace(/^\s*>\s+(.*?)$/gm, '<blockquote>$1</blockquote>')
      
      // Horizontal rule
      .replace(/^\s*---+\s*$/gm, '<hr>')
      
      // Fix lists (wrap in ul/ol)
      .replace(/(<li>.*?<\/li>)\n(?!<li>)/gs, '<ul>$1</ul>')
      
      // Cleanup multiple ul/ol tags
      .replace(/<\/ul>\s*<ul>/g, '')
      
      // Paragraphs (everything else)
      .replace(/^([^<].*?)$/gm, function(m) {
        if (m.trim() === '') return '';
        if (m.match(/^<(\/?(h|ul|ol|li|blockquote|pre|img))/)) return m;
        return '<p>' + m + '</p>';
      })
      
      // Fix for extra line breaks
      .replace(/<\/p>\s*<p>/g, '</p><p>')
      
      // Fix newlines in paragraphs
      .replace(/\n/g, '<br>');
      
    return html;
  }
}

// Register the component
customElements.define('markdown-editor', MarkdownEditor);