<?php
/**
 * Document Editor Backend
 * 
 * Handles saving markdown documents with automatic backups.
 * POST Parameters:
 * - path: The target file path to save
 * - content: Markdown or HTML content to save
 * - action: Optional action type (sync, save)
 */

// Set headers
header('Content-Type: application/json');

// Basic security - allowed directories and file extensions
$allowed_dirs = ['docs/', 'examples/'];
$allowed_extensions = ['.md', '.html', '.txt'];

// Check if this is a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed. Use POST.']);
    exit;
}

// Get the posted data
$path = isset($_POST['path']) ? $_POST['path'] : '';
$content = isset($_POST['content']) ? $_POST['content'] : '';
$action = isset($_POST['action']) ? $_POST['action'] : 'save';

// Validate path and content
if (empty($path) || empty($content)) {
    echo json_encode(['success' => false, 'message' => 'Path and content are required.']);
    exit;
}

// Sanitize the path
$path = ltrim($path, '/');
$path = str_replace(['..', '//'], '', $path);

// Validate directory - ensure it's within allowed directories
$valid_dir = false;
foreach ($allowed_dirs as $dir) {
    if (strpos($path, $dir) === 0) {
        $valid_dir = true;
        break;
    }
}

if (!$valid_dir) {
    echo json_encode(['success' => false, 'message' => 'Invalid directory. Document must be in an allowed directory.']);
    exit;
}

// Validate file extension
$file_ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
if (!in_array('.' . $file_ext, $allowed_extensions)) {
    echo json_encode(['success' => false, 'message' => 'Invalid file type. Allowed types: markdown, html, txt']);
    exit;
}

// Create directory if it doesn't exist
$dir = dirname($path);
if (!file_exists($dir) && !empty($dir)) {
    if (!mkdir($dir, 0755, true)) {
        echo json_encode(['success' => false, 'message' => 'Failed to create directory.']);
        exit;
    }
}

// For sync action, include current server file contents in response
$server_content = null;
if ($action === 'sync' && file_exists($path)) {
    $server_content = file_get_contents($path);
}

// Check if file exists and create backup
$backup_path = null;
if (file_exists($path)) {
    $backup_suffix = date('YmdHis'); // ISO-style date (202503300530)
    $backup_path = $path . '.' . $backup_suffix . '.bak';
    
    if (!copy($path, $backup_path)) {
        echo json_encode(['success' => false, 'message' => 'Failed to create backup.']);
        exit;
    }
}

// Save the content to the file
if (file_put_contents($path, $content) === false) {
    echo json_encode(['success' => false, 'message' => 'Failed to save document.']);
    exit;
}

// Success response
$response = [
    'success' => true, 
    'message' => 'Document saved successfully.',
    'file' => $path,
    'backup' => $backup_path,
    'action' => $action
];

// Add server content for sync actions
if ($action === 'sync' && $server_content !== null) {
    $response['server_content'] = $server_content;
}

echo json_encode($response); 