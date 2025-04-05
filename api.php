<?php
/**
 * Central API Handler
 * 
 * Routes API requests to appropriate resource handlers using PATH_INFO
 * Format: /api.php/resource/action/arguments
 * Example: /api.php/doc/get/docs/home.md
 * 
 * Resources are implemented as PHP classes:
 * - Doc: Handles markdown document operations
 * - Nav: Handles navigation structure operations
 */

// Enable error reporting for debugging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/api_errors.log');
error_reporting(E_ALL);

// Set content type to JSON
header('Content-Type: application/json');

// Handle CORS if needed
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Error handler function for API responses
function apiError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message
    ]);
    exit;
}

// Check if PATH_INFO is provided
if (!isset($_SERVER['PATH_INFO']) || empty($_SERVER['PATH_INFO'])) {
    apiError('No API endpoint specified', 404);
}

// Parse the path
$path = trim($_SERVER['PATH_INFO'], '/');
$parts = explode('/', $path);

// Need at least resource and action
if (count($parts) < 2) {
    apiError('Invalid API request format. Use: /api.php/resource/action/args', 400);
}

// Extract resource, action, and args
$resource = ucfirst(strtolower($parts[0])); // Capitalize first letter
$action = strtolower($parts[1]);
$args = array_slice($parts, 2);

// Valid resources
$validResources = ['Doc', 'Nav'];

// Check if resource is valid
if (!in_array($resource, $validResources)) {
    // Special diagnostic endpoint for Git status
    if ($resource === 'Diagnostic' && $action === 'git') {
        try {
            // Check if Git is installed
            exec('command -v git', $gitPathOutput, $gitPathReturnCode);
            $gitInstalled = ($gitPathReturnCode === 0);
            
            // Check if .git directory exists
            $repoPath = realpath(__DIR__);
            $gitDirExists = is_dir($repoPath . '/.git');
            
            // Try to run a simple git command
            $gitCommandWorks = false;
            if ($gitInstalled) {
                exec('cd ' . escapeshellarg($repoPath) . ' && git --version', $gitVersionOutput, $gitVersionReturnCode);
                $gitCommandWorks = ($gitVersionReturnCode === 0);
            }
            
            // Output diagnostic info
            echo json_encode([
                'success' => true,
                'data' => [
                    'git_installed' => $gitInstalled,
                    'git_path' => $gitInstalled ? $gitPathOutput[0] : null,
                    'git_dir_exists' => $gitDirExists,
                    'git_command_works' => $gitCommandWorks,
                    'git_version' => $gitCommandWorks ? implode("\n", $gitVersionOutput) : null,
                    'repo_path' => $repoPath
                ]
            ]);
            exit;
        } catch (Exception $e) {
            apiError("Git diagnostic failed: " . $e->getMessage(), 500);
        }
    }
    
    apiError("Invalid resource: {$resource}. Valid resources are: " . implode(', ', $validResources), 404);
}

// Include resource class
$resourceFile = __DIR__ . "/includes/{$resource}.php";
if (!file_exists($resourceFile)) {
    apiError("Resource implementation not found: {$resourceFile}", 500);
}

require_once($resourceFile);

// Create resource instance
$className = $resource;
try {
    $resourceInstance = new $className();
} catch (Exception $e) {
    apiError("Failed to instantiate resource {$resource}: " . $e->getMessage(), 500);
}

// Check if action exists
if (!method_exists($resourceInstance, $action)) {
    apiError("Action '{$action}' not found in resource '{$resource}'", 404);
}

// Execute the action
try {
    // Get request data (combine GET, POST, and JSON input)
    $requestData = [];
    $requestData = array_merge($requestData, $_GET);
    $requestData = array_merge($requestData, $_POST);
    
    // If content type is JSON, parse request body
    if (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        $jsonData = json_decode(file_get_contents('php://input'), true);
        if ($jsonData) {
            $requestData = array_merge($requestData, $jsonData);
        }
    }
    
    // Add uploaded files if any
    if (!empty($_FILES)) {
        $requestData['_files'] = $_FILES;
    }

    // Execute the action with args and request data
    $result = $resourceInstance->$action($args, $requestData);
    
    // Output the result
    echo json_encode([
        'success' => true,
        'data' => $result
    ]);
} catch (Exception $e) {
    apiError($e->getMessage(), 500);
} 