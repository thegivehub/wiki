# The Give Hub Documentation Platform

A responsive, component-based documentation system for The Give Hub, a non-profit crowdfunding platform focused on social causes that uses the Stellar blockchain for managing donations.

## Features

- **Responsive Design**: Works on all screen sizes with a resizable navigation sidebar
- **Web Components**: Uses custom elements for modular architecture
- **Markdown Support**: Content stored as markdown files for easy editing
- **Tabbed Interface**: Multiple documents can be open simultaneously
- **Inline Editing**: Content editable using contenteditable
- **JSON Navigation**: Flexible, nested navigation structure
- **Dark Mode**: Toggle between light and dark themes
- **LocalStorage**: Remembers user preferences

## Project Structure

```
give-hub-docs/
├── index.html                 # Main entry point
├── css/
│   ├── styles.css             # Main styles
│   └── dark-mode.css          # Dark mode theme
├── js/
│   ├── app.js                 # Main application logic
│   ├── components/
│   │   ├── nav-sidebar.js     # Navigation component
│   │   ├── tabs-container.js  # Tabs management
│   │   └── markdown-editor.js # Content editor
│   └── utils/
│       └── markdown.js        # Markdown utilities
├── nav/                       # Navigation JSON files
│   ├── main.json              # Main navigation
│   ├── blockchain.json        # Blockchain section
│   └── api.json               # API reference
└── docs/                      # Markdown content
    ├── home.md                # Home page
    ├── about.md               # About page
    ├── getting-started/       # Getting started docs
    ├── blockchain/            # Blockchain docs
    ├── features/              # Platform features
    └── api/                   # API documentation
```

## Setup Instructions

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Basic knowledge of HTML, CSS, and JavaScript
- A web server for local development (optional)

### Installation

1. **Clone or download the repository**

```bash
git clone https://github.com/yourorganization/give-hub-docs.git
cd give-hub-docs
```

2. **Serve the files**

You can use any web server to serve the files. For development, you can use:

- **Python's built-in server**:
  ```bash
  python -m http.server
  ```

- **Node.js with live-server**:
  ```bash
  npm install -g live-server
  live-server
  ```

3. **Open in your browser**

Open `http://localhost:8000` (or whatever port your server is using) in your browser.

## Navigation Structure

Navigation is defined in JSON files located in the `nav/` directory. The main structure is in `main.json`, and it can include other navigation files.

### Navigation JSON Format

```json
[
  {
    "title": "Home",
    "path": "docs/home.md",
    "icon": "class:🏠",
    "tags": "home,start,welcome"
  },
  {
    "title": "Getting Started",
    "icon": "class:🚀",
    "_children": [
      {
        "title": "Installation",
        "path": "docs/getting-started/installation.md",
        "icon": "class:📥"
      },
      {
        "title": "Configuration",
        "path": "docs/getting-started/configuration.md",
        "icon": "class:⚙️"
      }
    ]
  },
  {
    "title": "Blockchain Integration",
    "icon": "class:⛓️",
    "_include": "nav/blockchain.json"
  }
]
```

### Navigation Properties

- **title**: Display name for the navigation item
- **path**: Path to the markdown file (if item is a document)
- **icon**: Icon to display (can be a URL or a class)
  - Prefix with `class:` to use a CSS class or emoji
  - Prefix with `url:` to use an image URL
  - No prefix defaults to URL
- **_children**: Array of child navigation items (for inline children)
- **_include**: Path to another navigation JSON file (for external children)
- **classname**: Additional CSS class to apply to the item
- **tags**: Comma-separated tags for categorization and search

## Content Editing

All content is stored as Markdown files in the `docs/` directory. The platform provides a built-in editor with preview functionality.

### Markdown Support

The system supports standard Markdown syntax:

- Headers (`#`, `##`, `###`, etc.)
- Emphasis (`*italic*`, `**bold**`)
- Lists (ordered and unordered)
- Links (`[text](url)`)
- Images (`![alt](url)`)
- Code blocks (fenced with \`\`\`)
- Tables (pipe-separated)
- Blockquotes (> at beginning of line)

## Customization

### Themes

The platform includes both light and dark themes. You can customize these by modifying the CSS variables in:

- `css/styles.css` for the light theme
- `css/dark-mode.css` for the dark theme

### Navigation

To modify the navigation structure:

1. Edit the JSON files in the `nav/` directory
2. Create new JSON files for complex sections
3. Link them using the `_include` property

### Adding Content

To add new content:

1. Create a new markdown file in the appropriate directory under `docs/`
2. Add an entry to the navigation JSON, with the `path` pointing to your new file

## Advanced Configuration

### LocalStorage Keys

The platform uses the following LocalStorage keys:

- `navSidebarWidth`: Width of the navigation sidebar
- `darkMode`: Whether dark mode is enabled
- `fontSize`: Font size for the content
- `giveHubDocsContent`: Cached document content (when using the demo mode)

### Web Components

The platform uses custom elements for its core functionality:

- `<nav-sidebar>`: Navigation tree rendering
- `<tabs-container>`: Tab management
- `<markdown-editor>`: Content editing

These components can be extended or replaced as needed.

## Backend Integration

For a production environment, you'll need to implement server-side functionality:

1. **API Endpoints**
   - GET `/api/docs/{path}` - Retrieve document content
   - PUT `/api/docs/{path}` - Update document content
   - GET `/api/nav/{path}` - Retrieve navigation structure

2. **Authentication**
   - Add user authentication for editing permissions
   - Implement role-based access control

3. **Content Storage**
   - Store documents in a database or file system
   - Implement versioning for change history

## Mobile Support

The platform includes responsive design for mobile devices:

- Navigation sidebar becomes a sliding panel on small screens
- Toolbar adapts to smaller viewports
- Touch-friendly controls for tabs and navigation

## Troubleshooting

**Navigation doesn't load**
- Check that your JSON files are valid
- Look for console errors related to JSON parsing

**Content doesn't save**
- In demo mode, content is saved to LocalStorage
- For production, ensure your backend API is properly configured

**Styles don't match screenshots**
- Make sure all CSS files are properly loaded
- Check for CSS conflicts with other stylesheets

## License

[MIT License](LICENSE)

## Credits

Developed for [The Give Hub](https://github.com/thegivehub) by [Christopher Robison](https://github.com/chrisrobison).

