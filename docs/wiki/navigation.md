# Navigation Management

This guide explains how to manage the navigation structure in The Give Hub Documentation Platform.

## Navigation System Overview

The navigation system uses JSON files to define the structure of the documentation. These files are stored in the `nav/` directory.

### Key Concepts

- **Main Navigation File**: `nav/main.json` is the entry point for the navigation
- **Included Navigation**: Main navigation can include sub-navigation files
- **Navigation Items**: Each item can be a link to a document or a container for other items
- **Hierarchical Structure**: Navigation can have multiple levels of nesting

## Navigation File Structure

### Basic Structure

Navigation files contain an array of navigation items:

```json
[
  {
    "title": "Home",
    "path": "docs/home.md",
    "icon": "class:🏠",
    "tags": "home,welcome"
  },
  {
    "title": "Getting Started",
    "icon": "class:🚀",
    "children": [
      {
        "title": "Installation",
        "path": "docs/installation.md",
        "icon": "class:📥"
      },
      {
        "title": "Configuration",
        "path": "docs/configuration.md",
        "icon": "class:⚙️"
      }
    ]
  }
]
```

### Navigation Item Properties

Each navigation item can have these properties:

- **title** (required): Display name in the navigation
- **path** (optional): Path to the document this item links to
- **icon** (optional): Icon displayed next to the title
- **tags** (optional): Comma-separated tags for categorization
- **children** (optional): Array of child navigation items
- **_include** (optional): Path to another navigation file to include

### Including Other Navigation Files

For better organization, you can split navigation into multiple files:

```json
{
  "title": "Developer Guide",
  "icon": "class:💻",
  "_include": "nav/developer.json"
}
```

This allows you to:
- Keep navigation files smaller and more manageable
- Have different people maintain different sections
- Reuse navigation sections across multiple projects

## Managing Navigation Through the UI

If editing is enabled (`data-editable="true"` on the nav-sidebar component), you can manage navigation through the user interface.

### Adding Navigation Items

1. Hover over a navigation item to reveal the **+** button
2. Click the **+** button
3. Fill in the dialog form:
   - **Title**: Required - The display name for the navigation item
   - **Document Path**: Path to the document (e.g., `docs/example.md`)
   - **Upload Document**: Optionally upload a new document file
   - **Icon**: Choose an icon for the navigation item
   - **Tags**: Add comma-separated tags for categorization
4. Click **Save** to add the item

### Navigation Item Types

Based on the properties you provide, you can create different types of navigation items:

1. **Document Link**: Includes a `path` property to link to a document
   ```json
   {
     "title": "Installation",
     "path": "docs/installation.md",
     "icon": "class:📥"
   }
   ```

2. **Section Container**: Has `children` but no `path`, acts as a collapsible section
   ```json
   {
     "title": "Advanced Topics",
     "icon": "class:🔍",
     "children": [...]
   }
   ```

3. **Include Container**: Uses `_include` to pull in another navigation file
   ```json
   {
     "title": "API Reference",
     "icon": "class:🔌",
     "_include": "nav/api.json"
   }
   ```

### Icon Options

When adding icons, you have several options:

1. **Emoji Icons**: Simple and universally supported
   ```json
   "icon": "class:🏠"
   ```

2. **Font Awesome Icons**: If Font Awesome is loaded
   ```json
   "icon": "fas fa-home"
   ```

3. **Image URLs**: For custom icons
   ```json
   "icon": "url:/images/custom-icon.png"
   ```

## Advanced Navigation Management

### Manual Editing

For more complex changes, you can edit the navigation JSON files directly:

1. Edit the appropriate file in the `nav/` directory
2. Save the file
3. Refresh the wiki to see your changes

### Navigation Structure Best Practices

1. **Logical Grouping**: Group related documents together
2. **Meaningful Titles**: Use clear, descriptive titles
3. **Consistent Naming**: Maintain consistency in naming sections
4. **Depth Control**: Avoid deep nesting (more than 3-4 levels)
5. **Section Balance**: Try to keep sections balanced in size
6. **Order**: Arrange items in a logical order (e.g., basic to advanced)

### File Organization Strategies

1. **Feature-Based**: Organize by feature or module
   ```
   nav/
   ├── main.json
   ├── installation.json
   ├── user-guide.json
   ├── api.json
   └── developer.json
   ```

2. **Audience-Based**: Organize by target audience
   ```
   nav/
   ├── main.json
   ├── end-users.json
   ├── administrators.json
   └── developers.json
   ```

3. **Hybrid Approach**: Combine strategies for complex documentation
   ```
   nav/
   ├── main.json
   ├── getting-started/
   │   ├── index.json
   │   ├── users.json
   │   └── admins.json
   └── features/
       ├── index.json
       ├── feature1.json
       └── feature2.json
   ```

## Troubleshooting

### Common Navigation Issues

1. **Navigation Not Loading**
   - Check for JSON syntax errors
   - Verify file permissions
   - Check browser console for errors

2. **Included Navigation Not Appearing**
   - Verify the path to the included file is correct
   - Check for circular references (file A includes file B, which includes file A)
   - Ensure the included file is valid JSON

3. **Icons Not Displaying**
   - Check that the icon format is correct
   - Verify that Font Awesome is loaded if using FA icons
   - Ensure image URLs are correct if using custom icons

4. **Cannot Save Navigation Changes**
   - Verify write permissions to the `nav/` directory
   - Check server logs for PHP errors
   - Ensure the form is filled out correctly

### Navigation Backup and Recovery

The system automatically creates backups when saving navigation changes:

1. Backups are stored in the same directory with a timestamp suffix
2. To recover from a backup, rename the backup file to the original name
3. For example, to restore from `main.json.20250330153045`, rename it to `main.json`