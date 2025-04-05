/**
 * Document Synchronization Module
 * 
 * Provides functionality to sync local document changes with the server,
 * comparing versions and allowing the user to choose which changes to keep.
 */

class DocumentSynchronizer {
  constructor(contentManager) {
    this.contentManager = contentManager;
    this.pendingSync = new Map(); // Tracks documents pending sync
    this.syncInProgress = false;
  }
  
  /**
   * Compares local and server versions of a document
   * @param {string} path Document path
   * @returns {Promise<Object>} Comparison result
   */
  async compareVersions(path) {
    try {
      // Get the local version from localStorage
      const localVersion = this.contentManager.contentStore.get(path);
      
      if (!localVersion) {
        console.log(`No local version found for ${path}`);
        return { hasDifferences: false };
      }
      
      // Get the server version directly
      const response = await fetch(path, { 
        headers: { 'Cache-Control': 'no-cache' },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch server version: ${response.statusText}`);
      }
      
      const serverVersion = await response.text();
      
      // Compare versions
      if (localVersion === serverVersion) {
        return { 
          hasDifferences: false, 
          message: "Documents are identical" 
        };
      }
      
      // Calculate basic diff statistics
      const localLines = localVersion.split("\n");
      const serverLines = serverVersion.split("\n");
      
      const addedLines = localLines.length - serverLines.length;
      
      return {
        hasDifferences: true,
        local: localVersion,
        server: serverVersion,
        path: path,
        stats: {
          localLength: localVersion.length,
          serverLength: serverVersion.length,
          localLines: localLines.length,
          serverLines: serverLines.length,
          addedLines: addedLines
        }
      };
    } catch (error) {
      console.error("Error comparing document versions:", error);
      throw error;
    }
  }
  
  /**
   * Scans for all documents in localStorage and compares with server versions
   * @returns {Promise<Array>} Array of documents with differences
   */
  async scanAllDocuments() {
    const contentObject = {};
    this.pendingSync.clear();
    
    // Get all documents from localStorage
    for (const [path, content] of this.contentManager.contentStore.entries()) {
      contentObject[path] = content;
    }
    
    const differences = [];
    
    // Compare each document
    for (const path of Object.keys(contentObject)) {
      try {
        const comparison = await this.compareVersions(path);
        
        if (comparison.hasDifferences) {
          differences.push({
            path,
            comparison
          });
          
          // Add to pending sync
          this.pendingSync.set(path, comparison);
        }
      } catch (error) {
        console.error(`Error comparing ${path}:`, error);
      }
    }
    
    return differences;
  }
  
  /**
   * Syncs a specific document with the server
   * @param {string} path Document path
   * @param {string} content Content to save
   * @returns {Promise<Object>} Sync result
   */
  async syncDocument(path, content) {
    try {
      // Create form data
      const formData = new FormData();
      formData.append("path", path);
      formData.append("content", content);
      formData.append("action", "sync");
      
      // Send POST request to document-editor.php
      const response = await fetch("document-editor.php", {
        method: "POST",
        body: formData
      });
      
      // Parse the response
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Unknown error syncing document");
      }
      
      // Update in-memory store
      this.contentManager.contentStore.set(path, content);
      
      // Remove from pending sync
      this.pendingSync.delete(path);
      
      return { success: true, path, serverResponse: result };
    } catch (error) {
      console.error("Error syncing document:", error);
      return { success: false, path, error: error.message };
    }
  }
  
  /**
   * Shows a dialog allowing the user to choose which version to keep
   * @param {string} path Document path
   * @param {Object} comparison Version comparison
   * @returns {Promise<string>} Selected content
   */
  async showSyncDialog(path, comparison) {
    return new Promise((resolve, reject) => {
      // Create dialog
      const dialog = document.createElement("div");
      dialog.className = "sync-dialog";
      dialog.innerHTML = `
        <div class="sync-dialog-header">
          <h2>Document Sync Required</h2>
          <p>Changes found in local storage for: <strong>${path}</strong></p>
        </div>
        <div class="sync-dialog-body">
          <div class="sync-stats">
            <p>Local version: ${comparison.stats.localLines} lines, ${comparison.stats.localLength} characters</p>
            <p>Server version: ${comparison.stats.serverLines} lines, ${comparison.stats.serverLength} characters</p>
            <p>Difference: ${comparison.stats.addedLines > 0 ? '+' : ''}${comparison.stats.addedLines} lines</p>
          </div>
          <div class="sync-options">
            <label>
              <input type="radio" name="sync-choice" value="local" checked>
              Use local version (save browser changes to server)
            </label>
            <label>
              <input type="radio" name="sync-choice" value="server">
              Use server version (discard browser changes)
            </label>
            <label>
              <input type="radio" name="sync-choice" value="merge">
              Open merge tool (manually resolve differences)
            </label>
          </div>
        </div>
        <div class="sync-dialog-footer">
          <button class="btn btn-secondary sync-cancel">Cancel</button>
          <button class="btn btn-primary sync-confirm">Confirm</button>
        </div>
      `;
      
      // Add backdrop
      const backdrop = document.createElement("div");
      backdrop.className = "sync-dialog-backdrop";
      
      // Add to DOM
      document.body.appendChild(backdrop);
      document.body.appendChild(dialog);
      
      // Handle cancel
      dialog.querySelector(".sync-cancel").addEventListener("click", () => {
        backdrop.remove();
        dialog.remove();
        reject(new Error("Sync canceled by user"));
      });
      
      // Handle confirm
      dialog.querySelector(".sync-confirm").addEventListener("click", () => {
        const choice = dialog.querySelector('input[name="sync-choice"]:checked').value;
        let selectedContent;
        
        if (choice === "local") {
          selectedContent = comparison.local;
        } else if (choice === "server") {
          selectedContent = comparison.server;
        } else if (choice === "merge") {
          // For now, just use local version and make a proper merge tool later
          selectedContent = comparison.local;
          // TODO: Implement a proper merge tool UI
        }
        
        backdrop.remove();
        dialog.remove();
        resolve(selectedContent);
      });
    });
  }
  
  /**
   * Process all pending syncs
   * @param {Function} notifyFn Function to show notifications
   * @returns {Promise<Array>} Sync results
   */
  async processAllPendingSyncs(notifyFn) {
    if (this.syncInProgress) {
      notifyFn("Sync already in progress", "warning");
      return [];
    }
    
    this.syncInProgress = true;
    const results = [];
    
    try {
      for (const [path, comparison] of this.pendingSync.entries()) {
        try {
          notifyFn(`Syncing ${path}...`, "info");
          
          // Show dialog and get selected content
          const selectedContent = await this.showSyncDialog(path, comparison);
          
          // Sync to server
          const syncResult = await this.syncDocument(path, selectedContent);
          results.push(syncResult);
          
          if (syncResult.success) {
            notifyFn(`Synced ${path} successfully`, "success");
          } else {
            notifyFn(`Failed to sync ${path}: ${syncResult.error}`, "error");
          }
        } catch (error) {
          console.error(`Error processing sync for ${path}:`, error);
          results.push({ success: false, path, error: error.message });
        }
      }
    } finally {
      this.syncInProgress = false;
    }
    
    return results;
  }
}

// Export the class
window.DocumentSynchronizer = DocumentSynchronizer; 