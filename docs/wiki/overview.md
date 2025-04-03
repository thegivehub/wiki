# Wiki System Overview

## Introduction

The Give Hub Documentation Platform is a lightweight, browser-based wiki system designed for maintaining project documentation. It uses a combination of modern web technologies to provide a responsive, user-friendly experience:

- **Web Components** - Custom elements for encapsulated functionality
- **Markdown Support** - Content is written in Markdown for simplicity
- **Client-Side Rendering** - Content is processed in the browser
- **JSON Navigation** - Flexible, hierarchical navigation structure
- **Local Storage** - Document caching and persistence
- **Server-Side Storage** - Navigation structure saved to server

## Key Features

- **Intuitive Editing** - In-place Markdown editing with preview
- **Tab-Based Interface** - Multiple documents open simultaneously
- **Responsive Design** - Works on mobile and desktop devices
- **Theme Support** - Light and dark mode supported
- **Navigation Management** - Add and organize documentation sections
- **File Upload** - Upload Markdown files directly through the interface
- **Auto-Save** - Automatically saves changes during editing

## Architecture

The platform consists of three main web components:

1. **`nav-sidebar`** - Handles navigation display and management
2. **`tabs-container`** - Manages open document tabs
3. **`markdown-editor`** - Provides document viewing and editing

These components interact through custom events and are coordinated by the main application code in `app.js`.

## Data Flow

1. **Navigation Loading**
   - Navigation structure loaded from JSON files
   - Main navigation file (`main.json`) can include other navigation sections
   - Creates a hierarchical menu structure

2. **Document Loading**
   - Documents are loaded either from the server or local cache
   - Content is stored in memory and localStorage for persistence
   - Markdown is rendered to HTML for display

3. **Content Saving**
   - Document changes saved to localStorage
   - Navigation structure changes saved to server via `nav-editor.php`
   - File uploads processed server-side

## Technologies Used

- **HTML5 & CSS3** - Modern web standards
- **JavaScript** - ES6+ for component functionality
- **Web Components API** - Shadow DOM and Custom Elements
- **Fetch API** - For server communication
- **localStorage** - For client-side persistence
- **marked.js** - For Markdown rendering
- **Font Awesome** - For icons

## System Requirements

- Modern browser with Web Components support
- PHP server for navigation saving (optional)
- No database required

## Next Steps

For more detailed information about the wiki system, refer to the following sections:
- [Installation and Setup](installation.md)
- [User Guide](user-guide.md)
- [Adding and Editing Content](editing.md)
- [Navigation Management](navigation.md)
- [Technical Reference](technical.md)
- [Customization](customization.md)