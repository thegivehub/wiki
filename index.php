<?php
/**
 * Wiki Entry Point
 * 
 * Redirects to the document editor with the requested document or index.md
 */

// Get document path from GET parameter or use default
$docPath = isset($_GET['doc']) ? $_GET['doc'] : 'docs/index.md';

// Validate the path to prevent directory traversal
$docPath = ltrim($docPath, '/');
$docPath = str_replace(['..', '//'], '', $docPath);

// Redirect to document editor with the document path
header("Location: document-editor.html?doc=" . urlencode($docPath));
exit; 