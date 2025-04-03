<?php
/**
 * Navigation Editor Backend
 * 
 * Handles saving navigation files with automatic backups and file uploads.
 * POST Parameters:
 * - filename: The target file to save (must be in the nav directory)
 * - data: JSON string containing the navigation data
 * - file: File to upload (when action=upload)
 * - path: Target path for uploaded file
 */

// Set headers
header('Content-Type: application/json');

// Basic security
$allowed_dir = 'nav/';
$allowed_ext = '.json';
$allowed_upload_types = ['md', 'html', 'txt', 'pdf'];
$upload_dir = 'docs/'; // Directory for uploaded files

// Check if this is a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed. Use POST.']);
    exit;
}

// Handle file upload
if (isset($_GET['action']) && $_GET['action'] === 'upload') {
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'message' => 'No file uploaded or upload error.']);
        exit;
    }

    $file = $_FILES['file'];
    $path = isset($_POST['path']) ? $_POST['path'] : '';
    
    // Validate file type
    $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($file_ext, $allowed_upload_types)) {
        echo json_encode(['success' => false, 'message' => 'Invalid file type. Allowed types: ' . implode(', ', $allowed_upload_types)]);
        exit;
    }

    // Ensure upload directory exists
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }

    // Sanitize the path
    $path = ltrim($path, '/');
    $path = str_replace(['..', '//'], '', $path);
    
    // If no path provided, use the original filename
    if (empty($path)) {
        $path = $file['name'];
    }

    // Ensure the path is within the upload directory
    $full_path = $upload_dir . $path;
    $real_path = realpath($full_path);
    $upload_dir_real = realpath($upload_dir);
    
    if ($real_path === false || strpos($real_path, $upload_dir_real) !== 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid file path.']);
        exit;
    }

    // Create backup if file exists
    if (file_exists($full_path)) {
        $backup_suffix = date('YmdHis');
        $backup_path = $full_path . '.' . $backup_suffix;
        
        if (!copy($full_path, $backup_path)) {
            echo json_encode(['success' => false, 'message' => 'Failed to create backup of existing file.']);
            exit;
        }
    }

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $full_path)) {
        echo json_encode(['success' => false, 'message' => 'Failed to save uploaded file.']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'File uploaded successfully.',
        'path' => $path,
        'backup' => isset($backup_path) ? $backup_path : null
    ]);
    exit;
}

// Handle navigation file saving
$filename = isset($_POST['filename']) ? $_POST['filename'] : '';
$data = isset($_POST['data']) ? $_POST['data'] : '';

// Validate parameters
if (empty($filename) || empty($data)) {
    echo json_encode(['success' => false, 'message' => 'Missing required parameters: filename and data.']);
    exit;
}

// Validate and sanitize filename
$filename = basename($filename); // Remove path components
if (substr($filename, -5) !== $allowed_ext) {
    $filename .= $allowed_ext; // Ensure .json extension
}

// Full path for the file
$filepath = $allowed_dir . $filename;

// Validate JSON data
$json_data = json_decode($data);
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data: ' . json_last_error_msg()]);
    exit;
}

// Re-encode to ensure proper formatting
$formatted_data = json_encode($json_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

// Create backup if file exists
if (file_exists($filepath)) {
    $backup_suffix = date('YmdHis'); // ISO-style date (202503300530)
    $backup_path = $filepath . '.' . $backup_suffix;
    
    if (!copy($filepath, $backup_path)) {
        echo json_encode(['success' => false, 'message' => 'Failed to create backup.']);
        exit;
    }
}

// Save the new file
if (file_put_contents($filepath, $formatted_data) === false) {
    echo json_encode(['success' => false, 'message' => 'Failed to save navigation file.']);
    exit;
}

// Success response
echo json_encode([
    'success' => true, 
    'message' => 'Navigation saved successfully.',
    'file' => $filepath,
    'backup' => isset($backup_path) ? $backup_path : null
]); 