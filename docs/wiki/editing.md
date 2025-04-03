# Adding and Editing Content

This guide explains how to add, edit, and manage content in The Give Hub Documentation Platform.

## Document Structure

### File Organization

The wiki content is organized into markdown files stored in the `docs/` directory. You can create subdirectories for better organization.

Example structure:
```
docs/
├── home.md
├── about.md
├── getting-started/
│   ├── installation.md
│   └── configuration.md
└── features/
    ├── feature1.md
    └── feature2.md
```

### File Naming Conventions

- Use lowercase letters for filenames
- Use hyphens (`-`) instead of spaces
- Use `.md` extension for all content files
- Keep filenames short but descriptive

Good examples:
- `installation-guide.md`
- `api-documentation.md`
- `troubleshooting.md`

## Creating New Documents

### Method 1: Through the Navigation Editor

The easiest way to create new documents:

1. Hover over a navigation item and click the **+** button
2. Fill in the form:
   - **Title**: The display name in the navigation
   - **Document Path**: Where to save the file (e.g., `docs/new-page.md`)
   - **Upload Document**: You can upload an existing file
   - **Icon**: Choose an icon for the navigation item
   - **Tags**: Add comma-separated tags

3. Click **Save** to create the document and add it to navigation

### Method 2: Direct File Creation

For more advanced users:

1. Create a new markdown file in the `docs/` directory
2. Add the file to the navigation structure manually by editing the appropriate JSON file in the `nav/` directory

## Editing Documents

### Basic Editing

1. Navigate to the document you want to edit
2. Click the **Edit** button in the document toolbar
3. Make changes in the Markdown editor
4. Changes are auto-saved, or click **Save** to save manually
5. Click **Preview** to switch back to viewing mode

### Markdown Syntax

The wiki uses standard Markdown with some extensions:

#### Basic Formatting

```markdown
# Heading 1
## Heading 2
### Heading 3

Paragraphs are separated by blank lines.

**Bold text** or __another way for bold__
*Italic text* or _another way for italic_
***Bold and italic***
~~Strikethrough text~~
```

#### Lists

```markdown
- Unordered list item
- Another item
  - Indented item
  - Another indented item
    - Further indented

1. Ordered list item
2. Second item
   1. Sub-item
   2. Another sub-item
```

#### Links and Images

```markdown
[Link text](https://example.com)
[Link to another document](other-doc.md)

![Image alt text](path/to/image.jpg)
![Image with title](path/to/image.jpg "Image title")
```

#### Code

```markdown
`Inline code`

```javascript
// Code block with syntax highlighting
function example() {
  return 'Hello World';
}
```

#### Tables

```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

#### Blockquotes

```markdown
> This is a blockquote
> 
> It can span multiple lines
```

#### Horizontal Rules

```markdown
---
```

## Best Practices for Content

### Document Structure

- Start each document with a level 1 heading (`# Title`)
- Use heading levels in order (don't skip from H1 to H3)
- Keep heading hierarchy logical (H2 under H1, H3 under H2)
- Break up long documents with headings for better readability

### Writing Style

- Use clear, concise language
- Write in a consistent voice and tone
- Define acronyms and technical terms
- Use examples to illustrate complex concepts
- Update content regularly to keep it accurate

### Linking

- Use relative links to other documents when possible
- Make link text descriptive of the destination
- Avoid "click here" or "more" as link text
- Check links periodically to ensure they still work

## Advanced Editing

### Working with Images

Images can be added to your wiki in two ways:

1. **Upload with the document**: If you create a document by uploading, you can include images in the same directory
2. **Reference external images**: You can link to images on external URLs

Example:
```markdown
![Local image](../images/diagram.png)
![External image](https://example.com/image.jpg)
```

### Document Templates

Consider creating templates for common document types to ensure consistency. Place them in a `templates/` directory and use them as a starting point for new content.

Example template for a feature document:

```markdown
# Feature Name

## Overview

Brief description of the feature.

## How to Use

Step-by-step instructions.

## Configuration Options

List of configuration options.

## Examples

Usage examples.

## Troubleshooting

Common issues and solutions.
```

## Troubleshooting

### Common Editing Issues

1. **Changes not saving**
   - Check your internet connection
   - Look for error messages in the browser console
   - Try manually saving with the Save button

2. **Markdown not rendering correctly**
   - Ensure proper syntax (especially with nested lists and code blocks)
   - Check for missing blank lines between different elements
   - Verify that complex elements like tables are formatted correctly

3. **Images not displaying**
   - Verify the path is correct
   - Check file permissions
   - Ensure the image file exists in the specified location