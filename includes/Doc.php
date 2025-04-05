<?php
/**
 * Doc Resource Class
 * 
 * Handles operations on markdown documents with Git versioning support
 */
class Doc {
    private $allowedDirs = ['docs/', 'examples/'];
    private $allowedExtensions = ['.md', '.html', '.txt'];
    private $gitEnabled = true;
    private $repoPath;
    private $username = 'system'; // Will be replaced with actual username once auth is implemented
    
    /**
     * Constructor - initializes the Doc resource
     */
    public function __construct() {
        $this->repoPath = realpath(__DIR__ . '/..');
        
        // Check if git is enabled (repository exists AND git command is available)
        $this->gitEnabled = false;
        
        if (is_dir($this->repoPath . '/.git')) {
            // Check if git command is available
            exec('command -v git', $output, $returnCode);
            if ($returnCode === 0) {
                $this->gitEnabled = true;
            } else {
                error_log("Git repository exists but git command is not available");
            }
        } else {
            error_log("Git repository (.git directory) not found in {$this->repoPath}");
        }
    }
    
    /**
     * Get a document by path
     * 
     * @param array $args Path segments [docPath]
     * @param array $requestData Additional request data
     * @return array Document data including content and version history
     */
    public function get($args, $requestData = []) {
        if (empty($args)) {
            throw new Exception("Document path is required");
        }
        
        $path = $this->sanitizePath(implode('/', $args));
        $this->validateDocPath($path);
        
        if (!file_exists($path)) {
            throw new Exception("Document not found: {$path}");
        }
        
        // Get document content
        $content = file_get_contents($path);
        
        // Get version history if Git is enabled
        $history = [];
        if ($this->gitEnabled) {
            $history = $this->getGitHistory($path);
        }
        
        return [
            'path' => $path,
            'content' => $content,
            'history' => $history
        ];
    }
    
    /**
     * Save/update a document
     * 
     * @param array $args Path segments [docPath]
     * @param array $requestData Request data with 'content' and optional 'commit_message'
     * @return array Result with path and commit info if applicable
     */
    public function save($args, $requestData = []) {
        if (empty($args)) {
            throw new Exception("Document path is required");
        }
        
        $path = $this->sanitizePath(implode('/', $args));
        $this->validateDocPath($path);
        
        if (!isset($requestData['content'])) {
            throw new Exception("Document content is required");
        }
        
        $content = $requestData['content'];
        $commitMessage = isset($requestData['commit_message']) ? 
            $requestData['commit_message'] : "Updated {$path}";
        
        // Create directory if it doesn't exist
        $dir = dirname($path);
        if (!file_exists($dir) && !empty($dir)) {
            if (!mkdir($dir, 0755, true)) {
                throw new Exception("Failed to create directory: {$dir}");
            }
        }
        
        // Create a backup if file exists
        $backupPath = null;
        if (file_exists($path)) {
            $backupSuffix = date('YmdHis');
            $backupPath = $path . '.' . $backupSuffix . '.bak';
            if (!copy($path, $backupPath)) {
                throw new Exception("Failed to create backup of {$path}");
            }
        }
        
        // Save the file
        if (file_put_contents($path, $content) === false) {
            throw new Exception("Failed to save document: {$path}");
        }
        
        // Commit to Git if enabled
        $commitInfo = null;
        if ($this->gitEnabled) {
            $commitInfo = $this->commitToGit($path, $commitMessage);
        }
        
        return [
            'path' => $path,
            'backup' => $backupPath,
            'commit' => $commitInfo
        ];
    }
    
    /**
     * Delete a document
     * 
     * @param array $args Path segments [docPath]
     * @param array $requestData Request data with optional 'commit_message'
     * @return array Result with deleted path and commit info if applicable
     */
    public function delete($args, $requestData = []) {
        if (empty($args)) {
            throw new Exception("Document path is required");
        }
        
        $path = $this->sanitizePath(implode('/', $args));
        $this->validateDocPath($path);
        
        if (!file_exists($path)) {
            throw new Exception("Document not found: {$path}");
        }
        
        $commitMessage = isset($requestData['commit_message']) ? 
            $requestData['commit_message'] : "Deleted {$path}";
        
        // Create a backup before deletion
        $backupSuffix = date('YmdHis');
        $backupPath = $path . '.' . $backupSuffix . '.deleted';
        if (!copy($path, $backupPath)) {
            throw new Exception("Failed to create backup before deletion of {$path}");
        }
        
        // Delete the file
        if (!unlink($path)) {
            throw new Exception("Failed to delete document: {$path}");
        }
        
        // Commit to Git if enabled
        $commitInfo = null;
        if ($this->gitEnabled) {
            $commitInfo = $this->commitToGit($path, $commitMessage, true);
        }
        
        return [
            'path' => $path,
            'backup' => $backupPath,
            'commit' => $commitInfo
        ];
    }
    
    /**
     * List documents in a directory
     * 
     * @param array $args Path segments [dirPath]
     * @param array $requestData Additional request data
     * @return array List of documents
     */
    public function list($args, $requestData = []) {
        $dir = empty($args) ? '' : $this->sanitizePath(implode('/', $args));
        
        // Validate directory is within allowed paths
        $validDir = false;
        foreach ($this->allowedDirs as $allowedDir) {
            if ($dir === $allowedDir || strpos($dir, $allowedDir) === 0) {
                $validDir = true;
                break;
            }
        }
        
        if (!$validDir && !empty($dir)) {
            throw new Exception("Invalid directory path: {$dir}");
        }
        
        if (!empty($dir) && !is_dir($dir)) {
            throw new Exception("Directory not found: {$dir}");
        }
        
        // Get documents in the directory
        $docs = [];
        $iterator = empty($dir) ? 
            new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($this->repoPath, RecursiveDirectoryIterator::SKIP_DOTS)
            ) : 
            new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS)
            );
        
        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $path = $this->getRelativePath($file->getPathname());
                $extension = strtolower('.' . pathinfo($path, PATHINFO_EXTENSION));
                
                // Skip files with disallowed extensions or backup files
                if (!in_array($extension, $this->allowedExtensions) || strpos($path, '.bak') !== false || strpos($path, '.deleted') !== false) {
                    continue;
                }
                
                // Skip files outside allowed directories
                $inAllowedDir = false;
                foreach ($this->allowedDirs as $allowedDir) {
                    if (strpos($path, $allowedDir) === 0) {
                        $inAllowedDir = true;
                        break;
                    }
                }
                
                if (!$inAllowedDir) {
                    continue;
                }
                
                $docs[] = [
                    'path' => $path,
                    'name' => pathinfo($path, PATHINFO_FILENAME),
                    'extension' => $extension,
                    'modified' => filemtime($file->getPathname())
                ];
            }
        }
        
        return $docs;
    }
    
    /**
     * Get document version history
     * 
     * @param array $args Path segments [docPath]
     * @param array $requestData Request data with optional 'limit'
     * @return array Version history
     */
    public function history($args, $requestData = []) {
        if (empty($args)) {
            throw new Exception("Document path is required");
        }
        
        $path = $this->sanitizePath(implode('/', $args));
        $this->validateDocPath($path);
        
        if (!file_exists($path)) {
            throw new Exception("Document not found: {$path}");
        }
        
        if (!$this->gitEnabled) {
            return ['history' => []];
        }
        
        $limit = isset($requestData['limit']) ? intval($requestData['limit']) : 10;
        $history = $this->getGitHistory($path, $limit);
        
        return ['history' => $history];
    }
    
    /**
     * Get a specific version of a document
     * 
     * @param array $args Path segments [docPath, commitHash]
     * @param array $requestData Additional request data
     * @return array Document content at specified version
     */
    public function version($args, $requestData = []) {
        if (count($args) < 1) {
            throw new Exception("Document path and commit hash are required");
        }
        
        if (!$this->gitEnabled) {
            throw new Exception("Git versioning is not enabled");
        }
        
        $path = $this->sanitizePath($args[0]);
        $this->validateDocPath($path);
        
        $commitHash = isset($args[1]) ? $args[1] : 'HEAD';
        
        // Get the content at a specific version
        $command = sprintf('cd %s && git show %s:%s', 
            escapeshellarg($this->repoPath),
            escapeshellarg($commitHash),
            escapeshellarg($path)
        );
        
        exec($command, $output, $returnCode);
        
        if ($returnCode !== 0) {
            throw new Exception("Failed to retrieve version {$commitHash} of {$path}");
        }
        
        $content = implode("\n", $output);
        
        return [
            'path' => $path,
            'commit' => $commitHash,
            'content' => $content
        ];
    }
    
    /**
     * Compare two versions of a document
     * 
     * @param array $args Path segments [docPath, commitHash1, commitHash2]
     * @param array $requestData Additional request data
     * @return array Comparison result
     */
    public function compare($args, $requestData = []) {
        if (count($args) < 3) {
            throw new Exception("Document path and two commit hashes are required");
        }
        
        if (!$this->gitEnabled) {
            throw new Exception("Git versioning is not enabled");
        }
        
        $path = $this->sanitizePath($args[0]);
        $this->validateDocPath($path);
        
        $commitHash1 = $args[1];
        $commitHash2 = $args[2];
        
        // Get the diff between two versions
        $command = sprintf('cd %s && git diff %s %s -- %s', 
            escapeshellarg($this->repoPath),
            escapeshellarg($commitHash1),
            escapeshellarg($commitHash2),
            escapeshellarg($path)
        );
        
        exec($command, $output, $returnCode);
        
        if ($returnCode !== 0) {
            throw new Exception("Failed to compare versions of {$path}");
        }
        
        $diff = implode("\n", $output);
        
        return [
            'path' => $path,
            'from_commit' => $commitHash1,
            'to_commit' => $commitHash2,
            'diff' => $diff
        ];
    }
    
    /**
     * Sanitize and validate document path
     * 
     * @param string $path Document path
     * @return string Sanitized path
     */
    private function sanitizePath($path) {
        // Sanitize path
        $path = ltrim($path, '/');
        $path = str_replace(['..', '//'], '', $path);
        
        return $path;
    }
    
    /**
     * Get relative path from repo root
     * 
     * @param string $path Absolute path
     * @return string Relative path
     */
    private function getRelativePath($path) {
        $repoPath = $this->repoPath;
        
        if (strpos($path, $repoPath) === 0) {
            $relativePath = substr($path, strlen($repoPath) + 1);
            return str_replace('\\', '/', $relativePath); // Normalize for Windows
        }
        
        return $path;
    }
    
    /**
     * Validate document path
     * 
     * @param string $path Document path
     * @throws Exception if path is invalid
     */
    private function validateDocPath($path) {
        // Check allowed directories
        $validDir = false;
        foreach ($this->allowedDirs as $dir) {
            if (strpos($path, $dir) === 0) {
                $validDir = true;
                break;
            }
        }
        
        if (!$validDir) {
            throw new Exception("Invalid directory. Document must be in an allowed directory.");
        }
        
        // Check allowed extensions
        $extension = strtolower('.' . pathinfo($path, PATHINFO_EXTENSION));
        if (!in_array($extension, $this->allowedExtensions)) {
            throw new Exception("Invalid file type. Allowed types: markdown, html, txt");
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
            error_log("Git is not enabled, returning empty history");
            return [];
        }
        
        // Make sure path is relative to repo
        $relPath = $this->getRelativePath($path);
        
        // Format: hash|author|date|message
        $format = "--pretty=format:%H|%an|%at|%s";
        $command = sprintf('cd %s && git log --pretty="format:%H|%an|%at|%s" -n %d -- %s 2>&1', 
            escapeshellarg($this->repoPath),
            $limit,
            escapeshellarg($relPath)
        );
        
        error_log("Executing git command: {$command}");
        
        exec($command, $output, $returnCode);
        
        if ($returnCode !== 0) {
            error_log("Git log failed for file {$relPath} with return code {$returnCode}");
            error_log("Command output: " . implode("\n", $output));
            return [];
        }
        
        // If no output, the file might not be tracked
        if (empty($output)) {
            error_log("No git history found for {$relPath}, checking if file is tracked");
            
            // Check if file is tracked by git
            $trackCommand = sprintf('cd %s && git ls-files --error-unmatch %s 2>/dev/null', 
                escapeshellarg($this->repoPath),
                escapeshellarg($relPath)
            );
            
            exec($trackCommand, $trackOutput, $trackReturnCode);
            
            if ($trackReturnCode !== 0) {
                error_log("File {$relPath} is not tracked by git");
                return [];
            }
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
            } else {
                error_log("Malformed git log line: {$line}");
            }
        }
        
        error_log("Retrieved " . count($history) . " history entries for {$relPath}");
        return $history;
    }
} 
