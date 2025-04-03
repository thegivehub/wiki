# Installation and Setup

## System Requirements

The Give Hub Documentation Platform has minimal requirements:

- A web server with PHP support (for navigation saving and file uploads)
- Modern web browser with JavaScript enabled
- No database required

## Installation

### Quick Start

1. **Download or Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/thegivehub-wiki.git
   ```

2. **Deploy to Web Server**

   Upload the files to your web server's public directory.

3. **Configure Permissions**

   Ensure the web server has write permissions to the following directories:
   - `nav/` - For saving navigation structure
   - `docs/` - For saving uploaded documents

   Example (for Linux systems):
   ```bash
   chmod -R 755 nav/
   chmod -R 755 docs/
   chown -R www-data:www-data nav/
   chown -R www-data:www-data docs/
   ```

4. **Access the Wiki**

   Navigate to the URL where you deployed the files in your web browser.

### Manual Installation

If you prefer to set up the system manually:

1. **Create Directory Structure**

   ```
   /your-wiki-root/
   ├── css/
   │   └── styles.css
   ├── docs/
   │   └── home.md
   ├── js/
   │   ├── app.js
   │   ├── register-components.js
   │   └── components/
   │       ├── markdown-editor.js
   │       ├── nav-sidebar.js
   │       └── tabs-container.js
   ├── nav/
   │   └── main.json
   ├── index.html
   └── nav-editor.php
   ```

2. **Create Initial Content**

   Create a basic `docs/home.md` file with initial content.

3. **Create Navigation Structure**

   Create a `nav/main.json` file with a basic navigation structure:

   ```json
   [
     {
       "title": "Home",
       "path": "docs/home.md",
       "icon": "class:🏠"
     }
   ]
   ```

## Configuration

### Main Configuration Options

The wiki system is configured through the HTML attributes on components in `index.html`:

```html
<nav-sidebar 
  data-nav-url="nav/main.json" 
  data-default-page="docs/home.md"
  data-editable="true"
  data-backend-url="nav-editor.php">
</nav-sidebar>
```

#### Key Attributes:

- `data-nav-url` - Path to the main navigation JSON file
- `data-default-page` - Default document to show when no document is selected
- `data-editable` - Whether navigation can be edited (true/false)
- `data-backend-url` - Server endpoint for saving navigation changes

### Customizing the Appearance

The appearance can be customized by editing `css/styles.css`. The system uses CSS variables for theming, making it easy to change colors and dimensions.

```css
:root {
  /* Colors */
  --primary-color: #2563eb;
  --secondary-color: #4f46e5;
  /* Other variables */
}

/* Dark mode */
body.dark-mode {
  --primary-color: #3b82f6;
  /* Dark mode variables */
}
```

## Security Considerations

### File Access

By default, the system can access files in the `docs/` directory. Ensure that sensitive files are not placed in publicly accessible directories.

### Server-Side Validation

The `nav-editor.php` file includes basic validation to ensure:

- Only JSON files in the `nav/` directory can be modified
- Only allowed file types can be uploaded
- Path traversal attacks are prevented

Review and enhance the validation as needed for your specific security requirements.

## Troubleshooting

### Common Issues

1. **Navigation Not Loading**
   - Check browser console for errors
   - Ensure `nav/main.json` is correctly formatted JSON
   - Verify file permissions allow reading the JSON file

2. **Cannot Save Navigation**
   - Check PHP error logs
   - Verify write permissions to the `nav/` directory
   - Ensure PHP is enabled on your server

3. **Cannot Upload Files**
   - Check file size limits in PHP configuration
   - Verify write permissions to the `docs/` directory
   - Ensure the file type is allowed in `nav-editor.php`

### Getting Help

For additional assistance, refer to:
- [User Guide](user-guide.md)
- [Technical Reference](technical.md)
- Open issues on the project's GitHub repository