/**
 * ContentManager
 * 
 * Handles loading, caching, and saving document content
 * Compatible with existing application code and new versioning system
 */
class ContentManager {
    constructor() {
        this.cache = {};
        this.documentTimestamps = {};
        
        // Default cache expiration (15 minutes in milliseconds)
        this.cacheExpiration = 15 * 60 * 1000;
        
        // Track document versions
        this.documentVersions = {};
    }
    
    /**
     * Load a document from cache, or from the server if not cached
     * @param {string} path - Document path
     * @param {boolean} bypassCache - Force server fetch even if cache exists
     * @returns {Promise<string>} Document content
     */
    async loadDocument(path, bypassCache = false) {
        // If in cache and not expired, return cached version
        const currentTime = new Date().getTime();
        const cachedDoc = this.cache[path];
        const timestamp = this.documentTimestamps[path] || 0;
        
        if (!bypassCache && cachedDoc && (currentTime - timestamp < this.cacheExpiration)) {
            console.log(`Loading document from cache: ${path}`);
            return Promise.resolve(cachedDoc);
        }
        
        // Not in cache or bypass requested, load from server
        console.log(`Loading document from server: ${path}`);
        
        try {
            // Try the new API endpoint first
            let response = await fetch(`api.php/doc/get/${path}`);
            
            // If fails, try the legacy method (direct file loading)
            if (!response.ok) {
                console.log('API endpoint not found, trying direct file loading');
                response = await fetch(path);
                
                if (!response.ok) {
                    throw new Error(`Failed to load document: ${response.statusText}`);
                }
                
                const content = await response.text();
                
                // Cache the document content
                this.cache[path] = content;
                this.documentTimestamps[path] = currentTime;
                
                return content;
            }
            
            // Process API response
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to load document');
            }
            
            // Cache the document content
            this.cache[path] = result.data.content;
            this.documentTimestamps[path] = currentTime;
            
            // Save version info if available
            if (result.data.version) {
                this.documentVersions[path] = result.data.version;
            }
            
            return result.data.content;
        } catch (error) {
            console.error('Error loading document:', error);
            
            // Fallback to direct loading if API fails
            try {
                const response = await fetch(path);
                
                if (!response.ok) {
                    throw new Error(`Failed to load document: ${response.statusText}`);
                }
                
                const content = await response.text();
                
                // Cache the document content
                this.cache[path] = content;
                this.documentTimestamps[path] = currentTime;
                
                return content;
            } catch (fallbackError) {
                console.error('Fallback loading failed:', fallbackError);
                throw new Error(`Failed to load document: ${error.message}`);
            }
        }
    }
    
    /**
     * Save a document to the server
     * @param {string} path - Document path
     * @param {string} content - Document content
     * @param {string} commitMessage - Optional commit message
     * @returns {Promise<Object>} Save result
     */
    async saveDocument(path, content, commitMessage = '') {
        console.log(`Saving document: ${path}`);
        
        try {
            // Try the new API endpoint first
            try {
                const data = {
                    content: content,
                    commit_message: commitMessage
                };
                
                const response = await fetch(`api.php/doc/save/${path}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to save document: ${response.statusText}`);
                }
                
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to save document');
                }
                
                // Update cache with the saved content
                this.cache[path] = content;
                this.documentTimestamps[path] = new Date().getTime();
                
                // Save version info if available
                if (result.data && result.data.version) {
                    this.documentVersions[path] = result.data.version;
                }
                
                return result;
            } catch (apiError) {
                // Fallback to the legacy document editor endpoint
                console.log('API saving failed, trying legacy editor:', apiError);
                
                // Create form data
                const formData = new FormData();
                formData.append("path", path);
                formData.append("content", content);
                
                // If commit message is provided, add it
                if (commitMessage) {
                    formData.append("commit_message", commitMessage);
                }
                
                // Send POST request to document-editor.php
                const response = await fetch("document-editor.php", {
                    method: "POST",
                    body: formData
                });
                
                // Parse the response
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.message || "Unknown error saving document");
                }
                
                // Update cache with the saved content
                this.cache[path] = content;
                this.documentTimestamps[path] = new Date().getTime();
                
                console.log("Document saved successfully to server", result);
                return { success: true, path, serverResponse: result };
            }
        } catch (error) {
            console.error('Error saving document:', error);
            throw error;
        }
    }
    
    /**
     * Delete a document
     * @param {string} path - Document path
     * @param {string} commitMessage - Optional commit message
     * @returns {Promise<Object>} Delete result
     */
    async deleteDocument(path, commitMessage = '') {
        console.log(`Deleting document: ${path}`);
        
        try {
            const data = {
                commit_message: commitMessage
            };
            
            const response = await fetch(`api.php/doc/delete/${path}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to delete document: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to delete document');
            }
            
            // Remove from cache
            delete this.cache[path];
            delete this.documentTimestamps[path];
            delete this.documentVersions[path];
            
            return result;
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }
    
    /**
     * Get version history for a document
     * @param {string} path - Document path
     * @param {number} limit - Optional limit on number of versions to retrieve
     * @returns {Promise<Array>} Version history array
     */
    async getDocumentHistory(path, limit = 20) {
        console.log(`Getting history for document: ${path}`);
        
        try {
            const params = limit ? `?limit=${limit}` : '';
            const response = await fetch(`api.php/doc/history/${path}${params}`);
            
            if (!response.ok) {
                throw new Error(`Failed to get document history: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to get document history');
            }
            
            return result.data.history;
        } catch (error) {
            console.error('Error getting document history:', error);
            throw error;
        }
    }
    
    /**
     * Get a specific version of a document
     * @param {string} path - Document path
     * @param {string} version - Version hash
     * @returns {Promise<Object>} Version data with content
     */
    async getDocumentVersion(path, version) {
        console.log(`Getting version ${version} of document: ${path}`);
        
        try {
            const response = await fetch(`api.php/doc/version/${path}/${version}`);
            
            if (!response.ok) {
                throw new Error(`Failed to get document version: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to get document version');
            }
            
            return result.data;
        } catch (error) {
            console.error('Error getting document version:', error);
            throw error;
        }
    }
    
    /**
     * Compare two versions of a document
     * @param {string} path - Document path
     * @param {string} fromVersion - Older version hash
     * @param {string} toVersion - Newer version hash
     * @returns {Promise<Object>} Diff data
     */
    async compareDocumentVersions(path, fromVersion, toVersion) {
        console.log(`Comparing versions of document: ${path}`);
        
        try {
            const response = await fetch(`api.php/doc/compare/${path}/${fromVersion}/${toVersion}`);
            
            if (!response.ok) {
                throw new Error(`Failed to compare document versions: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to compare document versions');
            }
            
            return result.data;
        } catch (error) {
            console.error('Error comparing document versions:', error);
            throw error;
        }
    }
    
    /**
     * Load a navigation file
     * @param {string} name - Navigation name
     * @param {boolean} bypassCache - Force server fetch even if cache exists
     * @returns {Promise<Array>} Navigation data
     */
    async loadNavigation(name, bypassCache = false) {
        // Construct the path in cache
        const path = `nav/${name}.json`;
        
        // If in cache and not expired, return cached version
        const currentTime = new Date().getTime();
        const cachedNav = this.cache[path];
        const timestamp = this.documentTimestamps[path] || 0;
        
        if (!bypassCache && cachedNav && (currentTime - timestamp < this.cacheExpiration)) {
            console.log(`Loading navigation from cache: ${name}`);
            return Promise.resolve(cachedNav);
        }
        
        // Not in cache or bypass requested, load from server
        console.log(`Loading navigation from server: ${name}`);
        
        try {
            // Try the new API endpoint first
            try {
                const response = await fetch(`api.php/nav/get/${name}`);
                
                if (!response.ok) {
                    throw new Error('API endpoint not found');
                }
                
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to load navigation');
                }
                
                // Cache the navigation
                this.cache[path] = result.data.content;
                this.documentTimestamps[path] = currentTime;
                
                // Save version info if available
                if (result.data.version) {
                    this.documentVersions[path] = result.data.version;
                }
                
                return result.data.content;
            } catch (apiError) {
                // Fallback to direct file loading
                console.log('API endpoint failed, trying direct loading:', apiError);
                
                const response = await fetch(path);
                
                if (!response.ok) {
                    throw new Error(`Failed to load navigation: ${response.statusText}`);
                }
                
                const navData = await response.json();
                
                // Cache the navigation
                this.cache[path] = navData;
                this.documentTimestamps[path] = currentTime;
                
                return navData;
            }
        } catch (error) {
            console.error('Error loading navigation:', error);
            throw error;
        }
    }
    
    /**
     * Save a navigation file
     * @param {string} name - Navigation name
     * @param {Object} content - Navigation content
     * @param {string} commitMessage - Optional commit message
     * @returns {Promise<Object>} Save result
     */
    async saveNavigation(name, content, commitMessage = '') {
        console.log(`Saving navigation: ${name}`);
        
        try {
            const data = {
                content: content,
                commit_message: commitMessage
            };
            
            const response = await fetch(`api.php/nav/save/${name}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to save navigation: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to save navigation');
            }
            
            // Update cache
            const path = `nav/${name}`;
            this.cache[path] = content;
            this.documentTimestamps[path] = new Date().getTime();
            
            // Save version info if available
            if (result.data && result.data.version) {
                this.documentVersions[path] = result.data.version;
            }
            
            return result;
        } catch (error) {
            console.error('Error saving navigation:', error);
            throw error;
        }
    }
    
    /**
     * Get navigation history
     * @param {string} name - Navigation name
     * @param {number} limit - Optional limit on number of versions to retrieve
     * @returns {Promise<Array>} Version history array
     */
    async getNavigationHistory(name, limit = 20) {
        console.log(`Getting history for navigation: ${name}`);
        
        try {
            const params = limit ? `?limit=${limit}` : '';
            const response = await fetch(`api.php/nav/history/${name}${params}`);
            
            if (!response.ok) {
                throw new Error(`Failed to get navigation history: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to get navigation history');
            }
            
            return result.data.history;
        } catch (error) {
            console.error('Error getting navigation history:', error);
            throw error;
        }
    }
    
    /**
     * Get a specific version of a navigation
     * @param {string} name - Navigation name
     * @param {string} version - Version hash
     * @returns {Promise<Object>} Version data with content
     */
    async getNavigationVersion(name, version) {
        console.log(`Getting version ${version} of navigation: ${name}`);
        
        try {
            const response = await fetch(`api.php/nav/version/${name}/${version}`);
            
            if (!response.ok) {
                throw new Error(`Failed to get navigation version: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to get navigation version');
            }
            
            return result.data;
        } catch (error) {
            console.error('Error getting navigation version:', error);
            throw error;
        }
    }
    
    /**
     * Clear the cache for a specific document or navigation
     * @param {string} path - Path to clear from cache
     */
    clearCache(path) {
        delete this.cache[path];
        delete this.documentTimestamps[path];
    }
    
    /**
     * Clear the entire cache
     */
    clearAllCache() {
        this.cache = {};
        this.documentTimestamps = {};
    }
}

// Initialize the singleton instance
window.ContentManager = new ContentManager(); 