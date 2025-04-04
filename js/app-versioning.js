/**
 * Main application logic for the Wiki with versioning support
 */
const App = {
    // Current state
    currentDocument: null,
    isEditing: false,
    documentModified: false,
    contentManager: null, // Add ContentManager instance variable
    
    /**
     * Initialize the application
     */
    init: function() {
        // Initialize ContentManager
        this.contentManager = new ContentManager();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial document from URL
        this.loadInitialDocument();
        
        // Load navigation
        this.loadNavigation();
    },
    
    /**
     * Set up all event listeners
     */
    setupEventListeners: function() {
        // Edit button
        const editToggle = document.getElementById('edit-toggle');
        if (editToggle) {
            editToggle.addEventListener('click', () => this.toggleEditMode());
        }
        
        // Save button
        const saveButton = document.getElementById('save-button');
        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveDocument());
        }
        
        // Discard button
        const discardButton = document.getElementById('discard-button');
        if (discardButton) {
            discardButton.addEventListener('click', () => this.discardChanges());
        }
        
        // Editor change detection
        const editor = document.getElementById('markdown-editor');
        if (editor) {
            editor.addEventListener('input', () => {
                if (!this.documentModified) {
                    this.documentModified = true;
                    
                    // Enable save and discard buttons
                    if (saveButton) saveButton.removeAttribute('disabled');
                    if (discardButton) discardButton.removeAttribute('disabled');
                    
                    // Show commit message input
                    const commitMessageContainer = document.getElementById('commit-message-container');
                    if (commitMessageContainer) {
                        commitMessageContainer.classList.remove('hidden');
                    }
                }
            });
        }
        
        // Close buttons for modals
        document.querySelectorAll('.modal .close-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('visible');
                }
            });
        });
        
        // Handle clicks outside modals to close them
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('visible');
                }
            });
        });
        
        // Document restore handler
        document.addEventListener('restore-version', (e) => {
            const { type, path, version } = e.detail;
            
            if (type === 'doc') {
                // For document restoration, we'll load the specified version and save it as current
                this.restoreDocumentVersion(path, version.hash);
            } else if (type === 'nav') {
                // For navigation restoration, handled elsewhere
                this.showNotification('Navigation restoration handled by version-history component', 'info');
            }
        });
    },
    
    /**
     * Load initial document based on URL or default
     */
    loadInitialDocument: function() {
        // Parse URL for document path
        const urlParams = new URLSearchParams(window.location.search);
        const docPath = urlParams.get('doc') || 'docs/index.md';
        
        // Load the document
        this.loadDocument(docPath);
    },
    
    /**
     * Load and display the navigation
     */
    loadNavigation: function() {
        const navContainer = document.querySelector('.navigation-container');
        if (!navContainer) return;
        
        // Show loading indicator
        navContainer.innerHTML = '<div class="loading">Loading navigation...</div>';
        
        // Load the navigation data from ContentManager
        this.contentManager.loadNavigation('main')
            .then(navData => {
                // Build navigation HTML
                const navHtml = this.buildNavigationHtml(navData);
                navContainer.innerHTML = navHtml;
                
                // Add event listeners to navigation items
                this.setupNavigationListeners();
            })
            .catch(error => {
                console.error('Error loading navigation:', error);
                navContainer.innerHTML = `<div class="error">Failed to load navigation: ${error.message}</div>`;
            });
    },
    
    /**
     * Build HTML for navigation
     * @param {Array|Object} navData - Navigation data (array or object with 'items' property)
     * @returns {string} Navigation HTML
     */
    buildNavigationHtml: function(navData) {
        // Handle both formats: array or object with 'items' property
        const items = Array.isArray(navData) ? navData : (navData && navData.items ? navData.items : []);
        
        if (!items || items.length === 0) {
            return '<div class="empty-nav">No navigation items found</div>';
        }
        
        const buildItems = (items) => {
            let html = '<ul>';
            
            items.forEach(item => {
                const hasChildren = item.children && item.children.length > 0;
                const itemClass = hasChildren ? 'has-children' : '';
                
                html += `<li class="${itemClass}">`;
                
                if (item.path) {
                    const icon = item.icon ? `<span class="nav-icon">${item.icon.replace('class:', '')}</span>` : '';
                    html += `<a href="#" data-path="${item.path}" class="nav-link">${icon}${item.title}</a>`;
                } else {
                    const icon = item.icon ? `<span class="nav-icon">${item.icon.replace('class:', '')}</span>` : '';
                    html += `<span class="nav-category">${icon}${item.title}</span>`;
                }
                
                if (hasChildren) {
                    html += buildItems(item.children);
                }
                
                html += '</li>';
            });
            
            html += '</ul>';
            return html;
        };
        
        return buildItems(items);
    },
    
    /**
     * Set up event listeners for navigation items
     */
    setupNavigationListeners: function() {
        // Handle clicks on navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const path = e.target.getAttribute('data-path');
                if (path) {
                    this.loadDocument(path);
                    
                    // Update URL without reloading page
                    const url = new URL(window.location);
                    url.searchParams.set('doc', path);
                    window.history.pushState({}, '', url);
                }
            });
        });
        
        // Toggle expand/collapse for categories
        document.querySelectorAll('.nav-category').forEach(category => {
            category.addEventListener('click', (e) => {
                const listItem = e.target.closest('li');
                if (listItem && listItem.classList.contains('has-children')) {
                    listItem.classList.toggle('expanded');
                }
            });
        });
    },
    
    /**
     * Load and display a document
     * @param {string} path - Document path
     * @param {boolean} forceRefresh - Force refresh from server
     */
    loadDocument: function(path, forceRefresh = false) {
        if (!path) return;
        
        // Show loading state
        const viewContainer = document.getElementById('view-container');
        if (viewContainer) {
            viewContainer.innerHTML = '<div class="loading">Loading document...</div>';
        }
        
        // Update document path display
        this.updateDocumentPath(path);
        
        // Store current document path
        this.currentDocument = path;
        
        // Exit edit mode if active
        if (this.isEditing) {
            this.toggleEditMode(false);
        }
        
        // Load document content
        this.contentManager.loadDocument(path, forceRefresh)
            .then(content => {
                // Display the content
                this.displayDocument(content);
                
                // Dispatch event for tab change
                document.dispatchEvent(new CustomEvent('tab-changed', {
                    detail: { path: path }
                }));
            })
            .catch(error => {
                console.error('Error loading document:', error);
                if (viewContainer) {
                    viewContainer.innerHTML = `
                        <div class="error-container">
                            <h3>Error Loading Document</h3>
                            <p>${error.message}</p>
                        </div>
                    `;
                }
            });
    },
    
    /**
     * Display document content
     * @param {string} content - Markdown content
     */
    displayDocument: function(content) {
        const viewContainer = document.getElementById('view-container');
        if (!viewContainer) return;
        
        try {
            // Convert markdown to HTML
            const html = marked.parse(content);
            viewContainer.innerHTML = html;
            
            // Add special handling for links
            this.processLinks();
            
            // Store original content for edit mode
            viewContainer.setAttribute('data-original', content);
        } catch (error) {
            console.error('Error rendering markdown:', error);
            viewContainer.innerHTML = `
                <div class="error-container">
                    <h3>Error Rendering Document</h3>
                    <p>${error.message}</p>
                    <pre>${content}</pre>
                </div>
            `;
        }
    },
    
    /**
     * Process links in the document for special handling
     */
    processLinks: function() {
        const viewContainer = document.getElementById('view-container');
        if (!viewContainer) return;
        
        // Find all links
        const links = viewContainer.querySelectorAll('a');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            
            // Skip if no href or external link
            if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
                return;
            }
            
            // Handle internal document links
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Determine if it's a doc link
                if (href.endsWith('.md') || href.endsWith('.html') || href.endsWith('.txt')) {
                    this.loadDocument(href);
                    
                    // Update URL without reloading page
                    const url = new URL(window.location);
                    url.searchParams.set('doc', href);
                    window.history.pushState({}, '', url);
                }
            });
        });
    },
    
    /**
     * Update the document path display
     * @param {string} path - Document path
     */
    updateDocumentPath: function(path) {
        const pathContainer = document.querySelector('.document-path');
        if (!pathContainer) return;
        
        // Split path into segments
        const segments = path.split('/');
        const filename = segments.pop();
        
        // Build breadcrumb HTML
        let html = '<div class="breadcrumb">';
        let currentPath = '';
        
        // Add home link
        html += '<a href="#" class="breadcrumb-item" data-path="docs/index.md">Home</a>';
        
        // Add each directory
        segments.forEach(segment => {
            currentPath += segment + '/';
            html += '<span class="breadcrumb-separator">/</span>';
            html += `<a href="#" class="breadcrumb-item" data-path="${currentPath}index.md">${segment}</a>`;
        });
        
        // Add filename
        html += '<span class="breadcrumb-separator">/</span>';
        html += `<span class="breadcrumb-item current">${filename}</span>`;
        
        html += '</div>';
        pathContainer.innerHTML = html;
        
        // Add event listeners to breadcrumb links
        pathContainer.querySelectorAll('.breadcrumb-item').forEach(item => {
            if (item.tagName.toLowerCase() === 'a') {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const itemPath = e.target.getAttribute('data-path');
                    if (itemPath) {
                        this.loadDocument(itemPath);
                        
                        // Update URL without reloading page
                        const url = new URL(window.location);
                        url.searchParams.set('doc', itemPath);
                        window.history.pushState({}, '', url);
                    }
                });
            }
        });
    },
    
    /**
     * Toggle edit mode
     * @param {boolean} forceState - Force a specific state
     */
    toggleEditMode: function(forceState) {
        // Determine target state
        const targetState = (forceState !== undefined) ? forceState : !this.isEditing;
        
        const viewContainer = document.getElementById('view-container');
        const editContainer = document.getElementById('edit-container');
        const editor = document.getElementById('markdown-editor');
        const saveButton = document.getElementById('save-button');
        const discardButton = document.getElementById('discard-button');
        const editToggle = document.getElementById('edit-toggle');
        const commitMessageContainer = document.getElementById('commit-message-container');
        
        if (!viewContainer || !editContainer || !editor) return;
        
        if (targetState) {
            // Switching to edit mode
            // Get original content
            const originalContent = viewContainer.getAttribute('data-original') || '';
            
            // Set editor content
            editor.value = originalContent;
            
            // Show editor, hide viewer
            viewContainer.classList.add('hidden');
            editContainer.classList.remove('hidden');
            
            // Focus editor
            editor.focus();
            
            // Update button text
            if (editToggle) {
                editToggle.querySelector('.label').textContent = 'Preview';
            }
            
            // Initially disable save/discard since no changes made yet
            if (saveButton) saveButton.setAttribute('disabled', 'true');
            if (discardButton) discardButton.setAttribute('disabled', 'true');
            
            // Hide commit message container initially
            if (commitMessageContainer) {
                commitMessageContainer.classList.add('hidden');
            }
            
            // Set editing flag
            this.isEditing = true;
            this.documentModified = false;
        } else {
            // Switching to view mode
            
            // If document was modified, ask for confirmation
            if (this.documentModified) {
                if (!confirm('You have unsaved changes. Discard them?')) {
                    return;
                }
            }
            
            // Hide editor, show viewer
            viewContainer.classList.remove('hidden');
            editContainer.classList.add('hidden');
            
            // Update button text
            if (editToggle) {
                editToggle.querySelector('.label').textContent = 'Edit';
            }
            
            // Reset flags
            this.isEditing = false;
            this.documentModified = false;
            
            // Disable buttons
            if (saveButton) saveButton.setAttribute('disabled', 'true');
            if (discardButton) discardButton.setAttribute('disabled', 'true');
            
            // Hide commit message container
            if (commitMessageContainer) {
                commitMessageContainer.classList.add('hidden');
            }
        }
    },
    
    /**
     * Save the current document
     */
    saveDocument: function() {
        if (!this.isEditing || !this.currentDocument) return;
        
        const editor = document.getElementById('markdown-editor');
        const saveButton = document.getElementById('save-button');
        const commitMessageInput = document.getElementById('commit-message');
        
        if (!editor) return;
        
        // Get content and commit message
        const content = editor.value;
        const commitMessage = commitMessageInput ? commitMessageInput.value : '';
        
        // Disable save button while saving
        if (saveButton) {
            saveButton.setAttribute('disabled', 'true');
            saveButton.innerHTML = '<span class="icon">⏳</span><span class="label">Saving...</span>';
        }
        
        // Save the document
        this.contentManager.saveDocument(this.currentDocument, content, commitMessage)
            .then(result => {
                // Show success notification
                this.showNotification('Document saved successfully', 'success');
                
                // Update the view with the new content
                this.displayDocument(content);
                
                // Exit edit mode
                this.toggleEditMode(false);
                
                // Restore save button
                if (saveButton) {
                    saveButton.innerHTML = '<span class="icon">💾</span><span class="label">Save</span>';
                }
                
                // Clear commit message
                if (commitMessageInput) {
                    commitMessageInput.value = '';
                }
            })
            .catch(error => {
                console.error('Error saving document:', error);
                
                // Show error notification
                this.showNotification(`Failed to save: ${error.message}`, 'error');
                
                // Re-enable save button
                if (saveButton) {
                    saveButton.removeAttribute('disabled');
                    saveButton.innerHTML = '<span class="icon">💾</span><span class="label">Save</span>';
                }
            });
    },
    
    /**
     * Discard changes in the editor
     */
    discardChanges: function() {
        if (!this.isEditing) return;
        
        const viewContainer = document.getElementById('view-container');
        const editor = document.getElementById('markdown-editor');
        
        if (!viewContainer || !editor) return;
        
        // Confirm before discarding
        if (this.documentModified) {
            if (!confirm('Are you sure you want to discard your changes?')) {
                return;
            }
        }
        
        // Reset editor content to original
        const originalContent = viewContainer.getAttribute('data-original') || '';
        editor.value = originalContent;
        
        // Exit edit mode
        this.toggleEditMode(false);
    },
    
    /**
     * Restore a document to a specific version
     * @param {string} path - Document path
     * @param {string} versionHash - Version hash to restore
     */
    async restoreDocumentVersion(path, versionHash) {
        try {
            // First get the version content
            const versionData = await this.contentManager.getDocumentVersion(path, versionHash);
            
            // Display the content
            this.displayDocument(versionData.content);
            
            // Show notification
            this.showNotification(`Document restored to version from ${versionData.date}`, 'success');
            
            // Reload the document to update cache
            setTimeout(() => {
                this.loadDocument(path, true);
            }, 1000);
        } catch (error) {
            console.error('Error restoring document version:', error);
            this.showNotification(`Failed to restore version: ${error.message}`, 'error');
        }
    },
    
    /**
     * Show a notification message
     * @param {string} message - Message to display
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {number} duration - How long to show in milliseconds
     */
    showNotification: function(message, type = 'info', duration = 3000) {
        // Check if notifications container exists, create if not
        let container = document.querySelector('.notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // Add to container
        container.appendChild(notification);
        
        // Add close button handler
        const closeButton = notification.querySelector('.notification-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                notification.classList.add('removing');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300); // Match animation duration
            });
        }
        
        // Auto-remove after duration
        setTimeout(() => {
            notification.classList.add('removing');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300); // Match animation duration
        }, duration);
        
        // Show notification with animation
        setTimeout(() => {
            notification.classList.add('visible');
        }, 10);
    }
}; 