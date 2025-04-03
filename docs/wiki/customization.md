# Customization Guide

This guide explains how to customize The Give Hub Documentation Platform to match your organization's needs and branding.

## Theming

### CSS Variables

The platform uses CSS variables for easy theming. The main variables are defined in `css/styles.css`:

```css
:root {
  /* Light mode colors */
  --primary-color: #2563eb;
  --secondary-color: #4f46e5;
  --accent-color: #0ea5e9;
  --text-color: #1f2937;
  --text-light-color: #6b7280;
  --bg-color: #ffffff;
  --bg-light-color: #f9fafb;
  --border-color: #e5e7eb;
  --hover-color: #f3f4f6;
  --shadow-color: rgba(0, 0, 0, 0.1);
  
  /* Sizing variables */
  --nav-width: 250px;
  --nav-min-width: 180px;
  --nav-max-width: 400px;
  --header-height: 48px;
  --tabs-height: 40px;
  
  /* Other variables */
  --transition-duration: 0.3s;
  --border-radius: 4px;
}

/* Dark mode colors */
body.dark-mode {
  --primary-color: #3b82f6;
  --secondary-color: #6366f1;
  --accent-color: #38bdf8;
  --text-color: #f9fafb;
  --text-light-color: #9ca3af;
  --bg-color: #111827;
  --bg-light-color: #1f2937;
  --border-color: #374151;
  --hover-color: #374151;
  --shadow-color: rgba(0, 0, 0, 0.5);
}
```

### Creating a Custom Theme

To create a custom theme:

1. Create a new CSS file (e.g., `custom-theme.css`)
2. Override the CSS variables:

```css
:root {
  /* Your custom theme variables */
  --primary-color: #10b981; /* Green primary */
  --secondary-color: #059669; /* Darker green */
  --accent-color: #06b6d4; /* Cyan accent */
  --text-color: #1f2937;
  /* Other overrides */
}

/* Custom dark mode if needed */
body.dark-mode {
  --primary-color: #34d399;
  /* Dark mode overrides */
}
```

3. Include your CSS file after the main stylesheet:

```html
<link rel="stylesheet" href="css/styles.css">
<link rel="stylesheet" href="css/custom-theme.css">
```

### Component-Specific Styling

Each web component has its own CSS variables that you can override:

```css
/* Navigation sidebar */
nav-sidebar {
  --nav-bg-color: #f8fafc;
  --nav-text-color: #334155;
  /* Other overrides */
}

/* Tabs container */
tabs-container {
  --tabs-bg-color: #f1f5f9;
  /* Other overrides */
}

/* Markdown editor */
markdown-editor {
  --editor-bg-color: #ffffff;
  --editor-text-color: #334155;
  /* Other overrides */
}
```

## Layout Customization

### Changing Dimensions

To change the layout dimensions:

```css
:root {
  /* Adjust sidebar width */
  --nav-width: 280px; /* Default sidebar width */
  --nav-min-width: 200px; /* Minimum sidebar width when resizing */
  --nav-max-width: 500px; /* Maximum sidebar width when resizing */
  
  /* Adjust tab height */
  --tabs-height: 45px;
  
  /* Other dimension adjustments */
}
```

### Full-Width Layout

To create a full-width layout without maximum width constraints:

```css
markdown-editor {
  --editor-max-width: none;
}

.viewer {
  max-width: none !important;
  padding: 20px 40px;
}
```

## Branding

### Adding a Logo

To add your organization's logo:

1. Add a logo container to the navigation header in `nav-sidebar.js`:

```javascript
render() {
  this.shadowRoot.innerHTML = `
    <style>/* ... */</style>
    
    <div class="nav-sidebar">
      <div class="nav-header">
        <div class="logo-container">
          <img src="images/your-logo.png" alt="Your Organization">
        </div>
        <span>Documentation</span>
      </div>
      <!-- Rest of the template -->
    </div>
  `;
}
```

2. Style the logo container:

```css
.logo-container {
  padding: 10px 0;
  text-align: center;
}

.logo-container img {
  max-width: 80%;
  height: auto;
}
```

### Custom Favicon

Replace the default `favicon.ico` with your own:

1. Create a favicon (recommended sizes: 16x16, 32x32, 48x48)
2. Replace the existing `favicon.ico` file
3. Update the HTML link if needed:

```html
<link rel="icon" href="favicon.ico">
```

## Functional Customization

### Adding a Custom Header

To add a custom header above the content:

1. Modify the `index.html` file:

```html
<div class="app-container">
  <nav-sidebar data-nav-url="nav/main.json" data-default-page="docs/home.md"></nav-sidebar>
  
  <div class="content-area">
    <div class="custom-header">
      <div class="header-logo">Your Organization</div>
      <div class="header-actions">
        <button id="theme-toggle">Toggle Dark Mode</button>
        <a href="https://github.com/your-org/your-repo" class="github-link">GitHub</a>
      </div>
    </div>
    
    <tabs-container></tabs-container>
    <markdown-editor></markdown-editor>
  </div>
</div>
```

2. Add styles for the custom header:

```css
.custom-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: var(--bg-light-color);
  border-bottom: 1px solid var(--border-color);
}

.header-logo {
  font-weight: 600;
  font-size: 1.1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.github-link {
  display: flex;
  align-items: center;
  color: var(--text-color);
  text-decoration: none;
}

.github-link:hover {
  text-decoration: underline;
}
```

### Adding Code Syntax Highlighting

To add syntax highlighting for code blocks:

1. Add highlight.js in `index.html`:

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
```

2. Modify the `markdownToHtml` method in `markdown-editor.js` to initialize highlight.js:

```javascript
markdownToHtml(markdown) {
  if (!markdown) return '';
  
  if (typeof window.marked !== 'undefined') {
    // Configure marked options
    window.marked.setOptions({
      highlight: function(code, lang) {
        if (window.hljs && lang) {
          try {
            return window.hljs.highlight(code, { language: lang }).value;
          } catch (e) {
            return code;
          }
        }
        return code;
      },
      // Other options
    });
    
    // Convert markdown to HTML
    return window.marked.parse(markdown);
  }
  // Fallback implementation
}
```

### Custom Document Templates

To add document templates for new content:

1. Create a templates directory with template files:

```
templates/
├── basic.md
├── api-doc.md
└── tutorial.md
```

2. Add a template selector to the navigation dialog in `nav-sidebar.js`:

```html
<div class="form-group">
  <label for="template">Template</label>
  <select id="template">
    <option value="">None</option>
    <option value="templates/basic.md">Basic Document</option>
    <option value="templates/api-doc.md">API Documentation</option>
    <option value="templates/tutorial.md">Tutorial</option>
  </select>
</div>
```

3. Update the form submission handler to load templates:

```javascript
async handleFormSubmit(e) {
  e.preventDefault();
  
  // Get form values
  const title = this.shadowRoot.querySelector('#title').value;
  const path = this.shadowRoot.querySelector('#path').value;
  const template = this.shadowRoot.querySelector('#template').value;
  
  // Get template content if selected
  let content = '';
  if (template) {
    try {
      const response = await fetch(template);
      if (response.ok) {
        content = await response.text();
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  }
  
  // Continue with form submission...
}
```

## Advanced Customization

### Extending the Navigation Component

To add custom functionality to the navigation:

1. Create a custom navigation component that extends the base one:

```javascript
class CustomNavSidebar extends NavSidebar {
  constructor() {
    super();
    
    // Add custom functionality
    this.addCustomFeatures();
  }
  
  addCustomFeatures() {
    // Implement custom features
  }
  
  // Override existing methods as needed
  renderNavigation() {
    // Custom rendering
    super.renderNavigation();
    // Additional customizations
  }
}

// Register the custom component
customElements.define('custom-nav-sidebar', CustomNavSidebar);
```

2. Use your custom component in `index.html`:

```html
<custom-nav-sidebar 
  data-nav-url="nav/main.json" 
  data-default-page="docs/home.md">
</custom-nav-sidebar>
```

### Adding Search Functionality

To add search to the wiki:

1. Create a search component (e.g., `search-box.js`):

```javascript
class SearchBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        /* Search box styles */
      </style>
      
      <div class="search-container">
        <input type="text" placeholder="Search..." class="search-input">
        <button class="search-button">🔍</button>
      </div>
      <div class="search-results"></div>
    `;
    
    this.shadowRoot.querySelector('.search-button').addEventListener('click', this.performSearch.bind(this));
    this.shadowRoot.querySelector('.search-input').addEventListener('keyup', e => {
      if (e.key === 'Enter') this.performSearch();
    });
  }
  
  performSearch() {
    const query = this.shadowRoot.querySelector('.search-input').value;
    // Implement search logic
    this.fetchSearchResults(query);
  }
  
  async fetchSearchResults(query) {
    // Implementation depends on your search backend
    // For a simple client-side search:
    const results = [];
    
    // Display results
    this.displayResults(results);
  }
  
  displayResults(results) {
    const resultsContainer = this.shadowRoot.querySelector('.search-results');
    // Render results
  }
}

customElements.define('search-box', SearchBox);
```

2. Add the search component to your layout:

```html
<div class="custom-header">
  <div class="header-logo">Your Organization</div>
  <search-box></search-box>
  <div class="header-actions">
    <!-- Other actions -->
  </div>
</div>
```

3. Implement a server-side search endpoint or use client-side search indexing as appropriate for your needs.