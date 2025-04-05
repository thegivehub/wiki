<?php
/**
 * Nav Resource Class
 * 
 * Handles operations on navigation structure with Git versioning support
 */
class Nav {
    private $navDir = 'nav/';
    private $gitEnabled = false;
    private $repoPath;
    private $username = 'system'; // Will be replaced with actual username once auth is implemented
    
    /**
     * Constructor - initializes the Nav resource
     */
    public function __construct() {
        $this->repoPath = realpath(__DIR__ . '/..');
        
        // Check if git is enabled (repository exists)
        if (is_dir($this->repoPath . '/.git')) {
            $this->gitEnabled = true;
        }
        
        // Ensure nav directory exists
        if (!is_dir($this->repoPath . '/' . $this->navDir)) {
            mkdir($this->repoPath . '/' . $this->navDir, 0755, true);
        }
    }
    
    /**
     * Get navigation structure by name
     * 
     * @param array $args Path segments [navName]
     * @param array $requestData Additional request data
     * @return array Navigation data
     */
    public function get($args, $requestData = []) {
        if (empty($args)) {
            throw new Exception("Navigation name is required");
        }
        
        $navName = $this->sanitizeNavName($args[0]);
        $navPath = $this->getNavPath($navName);
        
        if (!file_exists($navPath)) {
            throw new Exception("Navigation file not found: {$navPath}");
        }
        
        // Get navigation content
        $content = file_get_contents($navPath);
        $nav = json_decode($content, true);
        
        if ($nav === null && json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON in navigation file: " . json_last_error_msg());
        }
        
        // Get version history if Git is enabled
        $history = [];
        if ($this->gitEnabled) {
            $history = $this->getGitHistory($navPath);
        }
        
        return [
            'path' => $navPath,
            'name' => $navName,
            'content' => $nav,
            'history' => $history
        ];
    }
    
    /**
     * List all navigation files
     * 
     * @param array $args Path segments (unused)
     * @param array $requestData Additional request data
     * @return array List of navigation files
     */
    public function list($args, $requestData = []) {
        $navFiles = [];
        $navDir = $this->repoPath . '/' . $this->navDir;
        
        if (is_dir($navDir)) {
            $files = scandir($navDir);
            foreach ($files as $file) {
                $path = $navDir . '/' . $file;
                if (is_file($path) && pathinfo($file, PATHINFO_EXTENSION) === 'json') {
                    $navFiles[] = [
                        'name' => pathinfo($file, PATHINFO_FILENAME),
                        'path' => $this->navDir . $file,
                        'modified' => filemtime($path)
                    ];
                }
            }
        }
        
        return $navFiles;
    }
    
    /**
     * Save/update navigation structure
     * 
     * @param array $args Path segments [navName]
     * @param array $requestData Request data with 'content' and optional 'commit_message'
     * @return array Result with path and commit info if applicable
     */
    public function save($args, $requestData = []) {
        if (empty($args)) {
            throw new Exception("Navigation name is required");
        }
        
        $navName = $this->sanitizeNavName($args[0]);
        $navPath = $this->getNavPath($navName);
        
        if (!isset($requestData['content'])) {
            throw new Exception("Navigation content is required");
        }
        
        $content = $requestData['content'];
        
        // Ensure content is valid JSON if it's a string
        if (is_string($content)) {
            $decodedContent = json_decode($content, true);
            if ($decodedContent === null && json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Invalid JSON content: " . json_last_error_msg());
            }
            $content = $decodedContent;
        }
        
        // Re-encode with pretty printing
        $jsonContent = json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        
        $commitMessage = isset($requestData['commit_message']) ? 
            $requestData['commit_message'] : "Updated navigation {$navName}";
        
        // Create a backup if file exists
        $backupPath = null;
        if (file_exists($navPath)) {
            $backupSuffix = date('YmdHis');
            $backupPath = $navPath . '.' . $backupSuffix . '.bak';
            if (!copy($navPath, $backupPath)) {
                throw new Exception("Failed to create backup of {$navPath}");
            }
        }
        
        // Save the file
        if (file_put_contents($navPath, $jsonContent) === false) {
            throw new Exception("Failed to save navigation: {$navPath}");
        }
        
        // Commit to Git if enabled
        $commitInfo = null;
        if ($this->gitEnabled) {
            $commitInfo = $this->commitToGit($navPath, $commitMessage);
        }
        
        return [
            'path' => $navPath,
            'name' => $navName,
            'backup' => $backupPath,
            'commit' => $commitInfo
        ];
    }
    
    /**
     * Delete a navigation file
     * 
     * @param array $args Path segments [navName]
     * @param array $requestData Request data with optional 'commit_message'
     * @return array Result with deleted path and commit info if applicable
     */
    public function delete($args, $requestData = []) {
        if (empty($args)) {
            throw new Exception("Navigation name is required");
        }
        
        $navName = $this->sanitizeNavName($args[0]);
        $navPath = $this->getNavPath($navName);
        
        if (!file_exists($navPath)) {
            throw new Exception("Navigation file not found: {$navPath}");
        }
        
        $commitMessage = isset($requestData['commit_message']) ? 
            $requestData['commit_message'] : "Deleted navigation {$navName}";
        
        // Create a backup before deletion
        $backupSuffix = date('YmdHis');
        $backupPath = $navPath . '.' . $backupSuffix . '.deleted';
        if (!copy($navPath, $backupPath)) {
            throw new Exception("Failed to create backup before deletion of {$navPath}");
        }
        
        // Delete the file
        if (!unlink($navPath)) {
            throw new Exception("Failed to delete navigation file: {$navPath}");
        }
        
        // Commit to Git if enabled
        $commitInfo = null;
        if ($this->gitEnabled) {
            $commitInfo = $this->commitToGit($navPath, $commitMessage, true);
        }
        
        return [
            'path' => $navPath,
            'name' => $navName,
            'backup' => $backupPath,
            'commit' => $commitInfo
        ];
    }
    
    /**
     * Add an item to a navigation structure
     * 
     * @param array $args Path segments [navName]
     * @param array $requestData Request data with 'item' and optional parameters
     * @return array Updated navigation data
     */
    public function addItem($args, $requestData = []) {
        if (empty($args)) {
            throw new Exception("Navigation name is required");
        }
        
        $navName = $this->sanitizeNavName($args[0]);
        $navPath = $this->getNavPath($navName);
        
        if (!isset($requestData['item'])) {
            throw new Exception("Navigation item data is required");
        }
        
        $item = $requestData['item'];
        $parentPath = isset($requestData['parent_path']) ? $requestData['parent_path'] : null;
        $position = isset($requestData['position']) ? intval($requestData['position']) : -1;
        $commitMessage = isset($requestData['commit_message']) ? 
            $requestData['commit_message'] : "Added item to navigation {$navName}";
        
        // Load existing navigation
        $nav = [];
        if (file_exists($navPath)) {
            $content = file_get_contents($navPath);
            $nav = json_decode($content, true);
            
            if ($nav === null && json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Invalid JSON in navigation file: " . json_last_error_msg());
            }
        }
        
        // Add item to the navigation structure
        if ($parentPath) {
            // Add item to a specific parent
            $nav = $this->addItemToParent($nav, $parentPath, $item, $position);
        } else {
            // Add item to the root level
            if ($position >= 0 && $position < count($nav)) {
                // Insert at specific position
                array_splice($nav, $position, 0, [$item]);
            } else {
                // Add to the end
                $nav[] = $item;
            }
        }
        
        // Save the updated navigation
        $this->saveNavigation($navPath, $nav, $commitMessage);
        
        return [
            'path' => $navPath,
            'name' => $navName,
            'content' => $nav
        ];
    }
    
    /**
     * Update an item in a navigation structure
     * 
     * @param array $args Path segments [navName, itemPath]
     * @param array $requestData Request data with 'item' properties to update
     * @return array Updated navigation data
     */
    public function updateItem($args, $requestData = []) {
        if (count($args) < 2) {
            throw new Exception("Navigation name and item path are required");
        }
        
        $navName = $this->sanitizeNavName($args[0]);
        $navPath = $this->getNavPath($navName);
        $itemPath = isset($args[1]) ? $args[1] : null;
        
        if (!$itemPath) {
            throw new Exception("Item path is required");
        }
        
        if (!isset($requestData['updates'])) {
            throw new Exception("Item updates are required");
        }
        
        $updates = $requestData['updates'];
        $commitMessage = isset($requestData['commit_message']) ? 
            $requestData['commit_message'] : "Updated item in navigation {$navName}";
        
        // Load existing navigation
        if (!file_exists($navPath)) {
            throw new Exception("Navigation file not found: {$navPath}");
        }
        
        $content = file_get_contents($navPath);
        $nav = json_decode($content, true);
        
        if ($nav === null && json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON in navigation file: " . json_last_error_msg());
        }
        
        // Update the item
        $nav = $this->updateItemInNav($nav, $itemPath, $updates);
        
        // Save the updated navigation
        $this->saveNavigation($navPath, $nav, $commitMessage);
        
        return [
            'path' => $navPath,
            'name' => $navName,
            'content' => $nav
        ];
    }
    
    /**
     * Remove an item from a navigation structure
     * 
     * @param array $args Path segments [navName, itemPath]
     * @param array $requestData Request data with optional parameters
     * @return array Updated navigation data
     */
    public function removeItem($args, $requestData = []) {
        if (count($args) < 2) {
            throw new Exception("Navigation name and item path are required");
        }
        
        $navName = $this->sanitizeNavName($args[0]);
        $navPath = $this->getNavPath($navName);
        $itemPath = isset($args[1]) ? $args[1] : null;
        
        if (!$itemPath) {
            throw new Exception("Item path is required");
        }
        
        $commitMessage = isset($requestData['commit_message']) ? 
            $requestData['commit_message'] : "Removed item from navigation {$navName}";
        
        // Load existing navigation
        if (!file_exists($navPath)) {
            throw new Exception("Navigation file not found: {$navPath}");
        }
        
        $content = file_get_contents($navPath);
        $nav = json_decode($content, true);
        
        if ($nav === null && json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON in navigation file: " . json_last_error_msg());
        }
        
        // Remove the item
        $nav = $this->removeItemFromNav($nav, $itemPath);
        
        // Save the updated navigation
        $this->saveNavigation($navPath, $nav, $commitMessage);
        
        return [
            'path' => $navPath,
            'name' => $navName,
            'content' => $nav
        ];
    }
    
    /**
     * Get version history for a navigation file
     * 
     * @param array $args Path segments [navName]
     * @param array $requestData Request data with optional 'limit'
     * @return array Version history
     */
    public function history($args, $requestData = []) {
        if (empty($args)) {
            throw new Exception("Navigation name is required");
        }
        
        $navName = $this->sanitizeNavName($args[0]);
        $navPath = $this->getNavPath($navName);
        
        if (!file_exists($navPath)) {
            throw new Exception("Navigation file not found: {$navPath}");
        }
        
        if (!$this->gitEnabled) {
            return ['history' => []];
        }
        
        $limit = isset($requestData['limit']) ? intval($requestData['limit']) : 10;
        $history = $this->getGitHistory($navPath, $limit);
        
        return [
            'name' => $navName,
            'path' => $navPath,
            'history' => $history
        ];
    }
    
    /**
     * Get a specific version of a navigation file
     * 
     * @param array $args Path segments [navName, commitHash]
     * @param array $requestData Additional request data
     * @return array Navigation content at specified version
     */
    public function version($args, $requestData = []) {
        if (count($args) < 2) {
            throw new Exception("Navigation name and commit hash are required");
        }
        
        if (!$this->gitEnabled) {
            throw new Exception("Git versioning is not enabled");
        }
        
        $navName = $this->sanitizeNavName($args[0]);
        $navPath = $this->getNavPath($navName);
        $commitHash = $args[1];
        
        // Get the content at a specific version
        $command = sprintf('cd %s && git show %s:%s', 
            escapeshellarg($this->repoPath),
            escapeshellarg($commitHash),
            escapeshellarg($navPath)
        );
        
        exec($command, $output, $returnCode);
        
        if ($returnCode !== 0) {
            throw new Exception("Failed to retrieve version {$commitHash} of {$navPath}");
        }
        
        $content = implode("\n", $output);
        $nav = json_decode($content, true);
        
        if ($nav === null && json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON in navigation version: " . json_last_error_msg());
        }
        
        return [
            'name' => $navName,
            'path' => $navPath,
            'commit' => $commitHash,
            'content' => $nav
        ];
    }
    
    /**
     * Sanitize navigation name
     * 
     * @param string $name Navigation name
     * @return string Sanitized name
     */
    private function sanitizeNavName($name) {
        // Remove any directory path components and file extensions
        $name = basename($name);
        $name = pathinfo($name, PATHINFO_FILENAME);
        
        // Remove any potentially dangerous characters
        $name = preg_replace('/[^a-zA-Z0-9_-]/', '', $name);
        
        return $name;
    }
    
    /**
     * Get full path to navigation file
     * 
     * @param string $name Navigation name
     * @return string Full path to navigation file
     */
    private function getNavPath($name) {
        return $this->repoPath . '/' . $this->navDir . $name . '.json';
    }
    
    /**
     * Add item to a specific parent in the navigation structure
     * 
     * @param array $nav Navigation structure
     * @param string $parentPath Path to parent item
     * @param array $item Item to add
     * @param int $position Position to insert at (-1 for end)
     * @return array Updated navigation structure
     */
    private function addItemToParent($nav, $parentPath, $item, $position = -1) {
        // Split path into segments
        $pathParts = explode('/', trim($parentPath, '/'));
        
        // Check if we're dealing with a simple ID by value
        if (count($pathParts) === 1) {
            return $this->addItemByParentId($nav, $pathParts[0], $item, $position);
        }
        
        // Handle more complex path navigation
        $current = &$nav;
        
        foreach ($pathParts as $part) {
            $found = false;
            
            foreach ($current as &$navItem) {
                if (isset($navItem['id']) && $navItem['id'] === $part) {
                    if (!isset($navItem['_children'])) {
                        $navItem['_children'] = [];
                    }
                    $current = &$navItem['_children'];
                    $found = true;
                    break;
                }
            }
            
            if (!$found) {
                throw new Exception("Parent path not found: {$parentPath}");
            }
        }
        
        // Add the item to the found parent
        if ($position >= 0 && $position < count($current)) {
            // Insert at specific position
            array_splice($current, $position, 0, [$item]);
        } else {
            // Add to the end
            $current[] = $item;
        }
        
        return $nav;
    }
    
    /**
     * Add item by parent ID (simple flat search)
     * 
     * @param array $nav Navigation structure
     * @param string $parentId Parent ID
     * @param array $item Item to add
     * @param int $position Position to insert at (-1 for end)
     * @return array Updated navigation structure
     */
    private function addItemByParentId($nav, $parentId, $item, $position = -1) {
        // Helper function to recursively search and add item
        $addToParent = function(&$items, $id, $newItem, $pos) use (&$addToParent) {
            foreach ($items as &$navItem) {
                if (isset($navItem['id']) && $navItem['id'] === $id) {
                    if (!isset($navItem['_children'])) {
                        $navItem['_children'] = [];
                    }
                    
                    if ($pos >= 0 && $pos < count($navItem['_children'])) {
                        // Insert at specific position
                        array_splice($navItem['_children'], $pos, 0, [$newItem]);
                    } else {
                        // Add to the end
                        $navItem['_children'][] = $newItem;
                    }
                    return true;
                }
                
                if (isset($navItem['_children']) && is_array($navItem['_children'])) {
                    if ($addToParent($navItem['_children'], $id, $newItem, $pos)) {
                        return true;
                    }
                }
            }
            return false;
        };
        
        // Try to add to parent
        if (!$addToParent($nav, $parentId, $item, $position)) {
            throw new Exception("Parent ID not found: {$parentId}");
        }
        
        return $nav;
    }
    
    /**
     * Update an item in the navigation structure
     * 
     * @param array $nav Navigation structure
     * @param string $itemPath Path to item to update
     * @param array $updates Properties to update
     * @return array Updated navigation structure
     */
    private function updateItemInNav($nav, $itemPath, $updates) {
        // Split path into segments
        $pathParts = explode('/', trim($itemPath, '/'));
        
        // Check if we're dealing with a simple ID
        if (count($pathParts) === 1) {
            return $this->updateItemById($nav, $pathParts[0], $updates);
        }
        
        // Handle more complex path navigation
        $current = &$nav;
        $target = null;
        
        // Navigate to the parent of the target item
        for ($i = 0; $i < count($pathParts) - 1; $i++) {
            $part = $pathParts[$i];
            $found = false;
            
            foreach ($current as &$navItem) {
                if (isset($navItem['id']) && $navItem['id'] === $part) {
                    if (!isset($navItem['_children'])) {
                        throw new Exception("Path segment has no children: {$part}");
                    }
                    $current = &$navItem['_children'];
                    $found = true;
                    break;
                }
            }
            
            if (!$found) {
                throw new Exception("Path segment not found: {$part}");
            }
        }
        
        // Find the target item in the current level
        $targetId = $pathParts[count($pathParts) - 1];
        $found = false;
        
        foreach ($current as &$navItem) {
            if (isset($navItem['id']) && $navItem['id'] === $targetId) {
                // Update the item with the provided properties
                foreach ($updates as $key => $value) {
                    $navItem[$key] = $value;
                }
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            throw new Exception("Target item not found: {$targetId}");
        }
        
        return $nav;
    }
    
    /**
     * Update an item by ID (simple flat search)
     * 
     * @param array $nav Navigation structure
     * @param string $itemId Item ID
     * @param array $updates Properties to update
     * @return array Updated navigation structure
     */
    private function updateItemById($nav, $itemId, $updates) {
        // Helper function to recursively search and update item
        $updateItem = function(&$items, $id, $updates) use (&$updateItem) {
            foreach ($items as &$navItem) {
                if (isset($navItem['id']) && $navItem['id'] === $id) {
                    // Update the item with the provided properties
                    foreach ($updates as $key => $value) {
                        $navItem[$key] = $value;
                    }
                    return true;
                }
                
                if (isset($navItem['_children']) && is_array($navItem['_children'])) {
                    if ($updateItem($navItem['_children'], $id, $updates)) {
                        return true;
                    }
                }
            }
            return false;
        };
        
        // Try to update the item
        if (!$updateItem($nav, $itemId, $updates)) {
            throw new Exception("Item ID not found: {$itemId}");
        }
        
        return $nav;
    }
    
    /**
     * Remove an item from the navigation structure
     * 
     * @param array $nav Navigation structure
     * @param string $itemPath Path to item to remove
     * @return array Updated navigation structure
     */
    private function removeItemFromNav($nav, $itemPath) {
        // Split path into segments
        $pathParts = explode('/', trim($itemPath, '/'));
        
        // Check if we're dealing with a simple ID
        if (count($pathParts) === 1) {
            return $this->removeItemById($nav, $pathParts[0]);
        }
        
        // Handle more complex path navigation
        $current = &$nav;
        
        // Navigate to the parent of the target item
        for ($i = 0; $i < count($pathParts) - 1; $i++) {
            $part = $pathParts[$i];
            $found = false;
            
            foreach ($current as &$navItem) {
                if (isset($navItem['id']) && $navItem['id'] === $part) {
                    if (!isset($navItem['_children'])) {
                        throw new Exception("Path segment has no children: {$part}");
                    }
                    $current = &$navItem['_children'];
                    $found = true;
                    break;
                }
            }
            
            if (!$found) {
                throw new Exception("Path segment not found: {$part}");
            }
        }
        
        // Find and remove the target item from the current level
        $targetId = $pathParts[count($pathParts) - 1];
        $found = false;
        
        foreach ($current as $index => $navItem) {
            if (isset($navItem['id']) && $navItem['id'] === $targetId) {
                // Remove the item
                array_splice($current, $index, 1);
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            throw new Exception("Target item not found: {$targetId}");
        }
        
        return $nav;
    }
    
    /**
     * Remove an item by ID (simple flat search)
     * 
     * @param array $nav Navigation structure
     * @param string $itemId Item ID
     * @return array Updated navigation structure
     */
    private function removeItemById($nav, $itemId) {
        // Helper function to recursively search and remove item
        $removeItem = function(&$items, $id) use (&$removeItem) {
            foreach ($items as $index => $navItem) {
                if (isset($navItem['id']) && $navItem['id'] === $id) {
                    // Remove the item
                    array_splice($items, $index, 1);
                    return true;
                }
                
                if (isset($navItem['_children']) && is_array($navItem['_children'])) {
                    if ($removeItem($navItem['_children'], $id)) {
                        return true;
                    }
                }
            }
            return false;
        };
        
        // Try to remove the item at root level first
        foreach ($nav as $index => $navItem) {
            if (isset($navItem['id']) && $navItem['id'] === $itemId) {
                array_splice($nav, $index, 1);
                return $nav;
            }
        }
        
        // Try to remove from children
        $result = $removeItem($nav, $itemId);
        
        if (!$result) {
            throw new Exception("Item ID not found: {$itemId}");
        }
        
        return $nav;
    }
    
    /**
     * Save navigation structure to file and commit to Git
     * 
     * @param string $navPath Path to navigation file
     * @param array $nav Navigation structure
     * @param string $commitMessage Commit message
     */
    private function saveNavigation($navPath, $nav, $commitMessage) {
        // Create a backup if file exists
        if (file_exists($navPath)) {
            $backupSuffix = date('YmdHis');
            $backupPath = $navPath . '.' . $backupSuffix . '.bak';
            if (!copy($navPath, $backupPath)) {
                error_log("Failed to create backup of {$navPath}");
            }
        }
        
        // Encode with pretty printing
        $jsonContent = json_encode($nav, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        
        // Save the file
        if (file_put_contents($navPath, $jsonContent) === false) {
            throw new Exception("Failed to save navigation: {$navPath}");
        }
        
        // Commit to Git if enabled
        if ($this->gitEnabled) {
            $this->commitToGit($navPath, $commitMessage);
        }
    }
    
    /**
     * Commit changes to Git
     * 
     * @param string $path File path
     * @param string $message Commit message
     * @param bool $isDelete Whether this is a deletion
     * @return array Commit information
     */
    private function commitToGit($path, $message, $isDelete = false) {
        if (!$this->gitEnabled) {
            return null;
        }
        
        // Build git commands
        $commands = [
            sprintf('cd %s', escapeshellarg($this->repoPath))
        ];
        
        // Add or remove the file
        if ($isDelete) {
            $commands[] = sprintf('git rm %s', escapeshellarg($path));
        } else {
            $commands[] = sprintf('git add %s', escapeshellarg($path));
        }
        
        // Add user information to commit if available
        $authorInfo = '';
        if (isset($_SERVER['PHP_AUTH_USER'])) {
            $this->username = $_SERVER['PHP_AUTH_USER'];
            // If email is available, include it
            if (isset($_SERVER['PHP_AUTH_EMAIL'])) {
                $authorInfo = sprintf('--author="%s <%s>"', 
                    $this->username, 
                    $_SERVER['PHP_AUTH_EMAIL']
                );
            } else {
                $authorInfo = sprintf('--author="%s <>"', $this->username);
            }
        }
        
        // Create commit
        $commands[] = sprintf('git commit %s -m %s', 
            $authorInfo, 
            escapeshellarg($message . ' [via API by ' . $this->username . ']')
        );
        
        // Execute commands
        $command = implode(' && ', $commands);
        exec($command, $output, $returnCode);
        
        if ($returnCode !== 0) {
            error_log("Git commit failed: " . implode("\n", $output));
            return null;
        }
        
        // Get the commit hash
        exec('cd ' . escapeshellarg($this->repoPath) . ' && git rev-parse HEAD', $hashOutput);
        $commitHash = isset($hashOutput[0]) ? $hashOutput[0] : null;
        
        return [
            'hash' => $commitHash,
            'message' => $message,
            'author' => $this->username,
            'timestamp' => time()
        ];
    }
    
    /**
     * Get Git history for a file
     * 
     * @param string $path File path
     * @param int $limit Maximum number of entries
     * @return array History entries
     */
    private function getGitHistory($path, $limit = 10) {
        if (!$this->gitEnabled) {
            return [];
        }
        
        // Format: hash|author|date|message
        $format = "--pretty=format:%H|%an|%at|%s";
        $command = sprintf('cd %s && git log %s -n %d -- %s', 
            escapeshellarg($this->repoPath),
            $format,
            $limit,
            escapeshellarg($path)
        );
        
        exec($command, $output, $returnCode);
        
        if ($returnCode !== 0) {
            error_log("Git log failed for file {$path}");
            return [];
        }
        
        $history = [];
        foreach ($output as $line) {
            $parts = explode('|', $line, 4);
            if (count($parts) === 4) {
                $history[] = [
                    'hash' => $parts[0],
                    'author' => $parts[1],
                    'timestamp' => (int)$parts[2],
                    'date' => date('Y-m-d H:i:s', (int)$parts[2]),
                    'message' => $parts[3]
                ];
            }
        }
        
        return $history;
    }
} 