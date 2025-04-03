# User Guide

This guide explains how to use The Give Hub Documentation Platform for reading and managing documentation.

## Basic Navigation

### Main Interface

The wiki interface consists of three main sections:

1. **Navigation Sidebar** - Left side of the screen, shows document structure
2. **Tab Bar** - Top area, displays open documents as tabs
3. **Content Area** - Main area where document content is displayed

![Wiki Interface Layout](../images/wiki-layout.png)

### Opening Documents

To open a document:

1. Click on a document title in the navigation sidebar
2. The document opens in the main content area
3. A new tab is created for the document

### Working with Tabs

- **Opening Multiple Documents**: Open multiple documents by clicking different navigation items
- **Switching Between Documents**: Click on tabs to switch between open documents
- **Closing Documents**: Click the ✕ on a tab to close it
- **Unsaved Changes Indicator**: A dot appears on tabs with unsaved changes

## Reading Documentation

### Content Display

Documents are displayed in the content area with full Markdown rendering, including:

- Headings (H1-H6)
- Formatted text (bold, italic)
- Links and images
- Code blocks with syntax highlighting
- Lists (ordered and unordered)
- Tables
- Blockquotes

### Navigating Between Documents

- **Using Links**: Click on Markdown links to navigate to other documents
- **Using the Sidebar**: Use the navigation sidebar to switch between documents
- **Expanding Sections**: Click on navigation items with children to expand/collapse sections

## Editing Content

### Edit Mode

To edit a document:

1. Open the document you want to edit
2. Click the **Edit** button in the toolbar above the document
3. The document switches to edit mode with a Markdown editor

### Making Changes

In edit mode:

1. Edit the Markdown text directly in the editor
2. Changes are auto-saved after you stop typing for 2 seconds
3. You can manually save by clicking the **Save** button
4. To preview your changes, click the **Preview** button

### Markdown Basics

Here's a quick reference for Markdown syntax:

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text** or __bold text__
*Italic text* or _italic text_

[Link text](url)
![Image alt text](image-url)

- Unordered list item
- Another item
  - Nested item

1. Ordered list item
2. Another item

> Blockquote text

`Inline code`

```code
Code block
```

| Header | Header |
|--------|--------|
| Cell   | Cell   |
```

## Managing Navigation

### Viewing Navigation Structure

The navigation sidebar shows the hierarchical structure of your documentation. Items with children have an expand/collapse arrow.

### Adding Navigation Items

If navigation editing is enabled:

1. Hover over a navigation item to reveal the **+** button
2. Click the **+** button to add a child item
3. Fill in the dialog form:
   - **Title**: Required - The display name for the navigation item
   - **Document Path**: Path to the document (e.g., `docs/example.md`)
   - **Upload Document**: Optionally upload a new document file
   - **Icon**: Choose an icon for the navigation item
   - **Tags**: Add comma-separated tags for categorization

4. Click **Save** to add the item

### Navigation Item Types

There are three types of navigation items:

1. **Document Links** - Link directly to a document
2. **Sections** - Contain child items but don't link to a document
3. **External Links** - Link to external URLs

## Working with Files

### Uploading Documents

You can upload new documents through the navigation editor:

1. Click the **+** button on a navigation item
2. In the dialog, click the **Upload Document** section
3. Select a file from your computer (.md, .html, .txt, .pdf)
4. Fill in the other fields and click **Save**

The file will be uploaded to the server and the navigation updated to link to it.

## Tips and Tricks

- **URL Sharing**: The URL updates as you navigate, allowing you to share links to specific documents
- **Auto-Save**: Changes are automatically saved to prevent data loss
- **Keyboard Navigation**: Use Tab to navigate between editor controls
- **Mobile Support**: The interface adjusts for smaller screens with a collapsible navigation menu