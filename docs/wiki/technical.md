# Technical Reference

This technical reference provides details about the internal workings of The Give Hub Documentation Platform for developers and administrators.

## Component Architecture

The platform uses Web Components, a set of web platform APIs that allow you to create custom, reusable, encapsulated HTML tags for use in web pages and applications.

### Web Component Structure

The system consists of three main web components:

1. **`nav-sidebar`**: Navigation component
2. **`tabs-container`**: Tab management component
3. **`markdown-editor`**: Content viewing and editing component

Each component:
- Uses Shadow DOM for style encapsulation
- Renders its own internal structure
- Handles its own events
- Communicates with other components via custom events

### Component Communication

Components communicate through custom events that bubble up through the DOM:

```javascript
// Dispatching an event
this.dispatchEvent(new CustomEvent('event-name', {
  bubbles: true,
  composed: true,
  detail: { 
    // Event data
  }
}));

// Listening for an event
document.addEventListener('event-name', (event) => {
  // Handle event
});
```

Key events include:
- `nav-item-selected`: When a navigation item is clicked
- `tab-changed`: When switching between tabs
- `content-save`: When content is saved
- `document-changed`: When document content is modified

## Client-Side Data Management

### Content Management

The `ContentManager` class in `app.js` handles document loading and saving:

```javascript
class ContentManager {
  constructor() {
    this.contentStore = new Map();
    this.initializeContent();
  }
  
  async getContent(path) {
    // Get content from memory or fetch from server
  }
  
  async saveContent(path, content) {
    // Save content to memory and localStorage
  }
  
  persistToStorage() {
    // Save all content to localStorage
  }
}
```

Key features:
- In-memory content cache with `Map`
- Persistence to `localStorage`
- Fetch API for loading content from server
- Simulated network delay for realistic UX

### Navigation Management

The `nav-sidebar` component handles navigation loading and management:

```javascript
async loadNavigation(url) {
  // Fetch navigation JSON from server
  // Parse and render navigation tree
}

buildNavTree(items, container) {
  // Recursively build navigation structure
}

async loadIncludedNav(path, container) {
  // Load included navigation files
}
```

Key features:
- Dynamic navigation loading
- Support for nested navigation via includes
- Prevention of duplicate rendering

## Server-Side Integration

### Navigation Editor

The `nav-editor.php` file provides server-side functionality for:

1. **Saving Navigation Files**
   ```php
   // Handle navigation file saving
   $filename = isset($_POST['filename']) ? $_POST['filename'] : '';
   $data = isset($_POST['data']) ? $_POST['data'] : '';
   
   // Validate and save to nav directory
   ```

2. **File Uploads**
   ```php
   // Handle file upload
   if (isset($_GET['action']) && $_GET['action'] === 'upload') {
     // Process uploaded file
     // Move to docs directory
   }
   ```

Key security features:
- Path validation to prevent directory traversal
- File type validation for uploads
- Automatic backups before overwriting files

## Technical Details

### Markdown Processing

The platform uses `marked.js` for Markdown rendering:

```javascript
markdownToHtml(markdown) {
  if (typeof window.marked !== 'undefined') {
    // Configure marked options
    window.marked.setOptions({
      breaks: true,
      gfm: true,
      // Other options
    });
    
    // Convert markdown to HTML
    return window.marked.parse(markdown);
  } else {
    // Fallback to basic implementation
  }
}
```

The component includes a basic fallback parser if `marked.js` is not available.

### Auto-Save Implementation

The auto-save feature works by:

1. Detecting content changes in the editor
2. Setting a timeout to trigger save after inactivity
3. Clearing and resetting the timeout on new changes

```javascript
handleContentChange(event) {
  // Update content
  this.state.content = event.target.value;
  
  // Setup auto-save timer
  if (this.state.autoSaveTimer) {
    clearTimeout(this.state.autoSaveTimer);
  }
  
  this.state.autoSaveTimer = setTimeout(() => {
    this.saveContent();
  }, this.state.autoSaveDelay);
}
```

### Tab Management

The `tabs-container` component handles:
- Creating new tabs
- Switching between tabs
- Closing tabs
- Tracking unsaved changes

```javascript
addTab(id, title, path) {
  // Create and add a new tab
}

removeTab(id) {
  // Remove a tab
}

setActiveTab(id) {
  // Set the active tab
}

setUnsaved(id, unsaved) {
  // Mark a tab as having unsaved changes
}
```

## CSS Theming System

The platform uses CSS Custom Properties (CSS Variables) for theming:

```css
/* Root variables */
:root {
  --primary-color: #2563eb;
  --text-color: #1f2937;
  /* Other variables */
}

/* Component-specific variables */
nav-sidebar {
  --nav-bg-color: var(--bg-light-color);
  --nav-text-color: var(--text-color);
  /* Component-specific variables */
}
```

This allows:
- Global theme control
- Component-specific styling
- Dark mode support via CSS variable overrides
- Easy customization without modifying component code

## URL Management

The platform manages URLs to allow direct linking to documents:

```javascript
// Update browser URL when navigating
updateBrowserUrl(page) {
  const pageName = page.replace('.html', '');
  const url = new URL(window.location.href);
  url.hash = pageName;
  window.history.pushState({}, '', url);
}

// Handle initial route from URL
handleInitialRoute() {
  const hash = window.location.hash.substring(1);
  // Load document based on hash
}
```

## Performance Considerations

### Optimization Techniques Used

1. **Lazy Loading**
   - Navigation items loaded on demand
   - Documents loaded only when accessed

2. **Caching**
   - Documents cached in memory
   - Content persisted to localStorage

3. **DOM Optimization**
   - Shadow DOM for encapsulation
   - DocumentFragment for batch DOM updates
   - Event delegation for handling clicks

4. **Resource Loading**
   - Asynchronous script loading
   - Minimal dependencies

### Browser Support

The platform requires browsers with support for:
- Custom Elements API
- Shadow DOM API
- ES6+ JavaScript features
- CSS Custom Properties
- Fetch API
- localStorage API

This includes:
- Chrome/Edge 67+
- Firefox 63+
- Safari 10.1+
- Opera 53+

## Extending the Platform

### Adding Custom Components

To create a new component:

1. Create a new JavaScript file in `js/components/`
2. Define a class extending `HTMLElement`
3. Implement the required lifecycle methods
4. Register the component with `customElements.define()`
5. Import the component in `register-components.js`

Example:
```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    // Initialize component
  }
  
  // Component methods
}

customElements.define('my-component', MyComponent);
```

### Plugin System

While the platform doesn't have a formal plugin system, you can extend it by:

1. Adding custom event listeners to intercept core events
2. Extending the core components with composition
3. Adding custom JavaScript modules that interact with the core components

Example extension:
```javascript
// Listen for content-save events
document.addEventListener('content-save', (event) => {
  // Add custom behavior like sending to external system
  const { path, content } = event.detail;
  sendToExternalSystem(path, content);
});
```