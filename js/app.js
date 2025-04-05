/**
 * Main Application Logic for The Give Hub Documentation Platform
 * 
 * This file integrates the three main web components:
 * - nav-sidebar: Navigation sidebar
 * - tabs-container: Tab management
 * - markdown-editor: Content viewing and editing
 * 
 * It also handles data management and coordination between components.
 */

// Content Manager - handles document loading and saving
class ContentManager {
  constructor() {
    this.contentStore = new Map();
    this.initializeContent();
  }
  
  // Initialize content from localStorage or load defaults
  initializeContent() {
    const storedContent = localStorage.getItem('giveHubDocsContent');
    
    if (storedContent) {
      try {
        const parsedContent = JSON.parse(storedContent);
        
        for (const [path, content] of Object.entries(parsedContent)) {
          this.contentStore.set(path, content);
        }
        
        console.log('Loaded content from localStorage');
      } catch (error) {
        console.error('Error parsing stored content:', error);
        this.loadDefaultContent();
      }
    } else {
      this.loadDefaultContent();
    }
  }
  
  // Load default sample content
  loadDefaultContent() {
    // Default home page
    this.contentStore.set('docs/home.md', `# Welcome to The Give Hub Documentation

This is the central knowledge base for The Give Hub, a non-profit crowdfunding platform focused on social causes that uses the Stellar blockchain for managing donations.

## What you'll find here

* Getting started guides
* Blockchain integration details
* Platform features documentation
* API references
* Development guidelines

Select a topic from the navigation menu to get started.`);

    // About page
    this.contentStore.set('docs/about.md', `# About The Give Hub

## Our Mission

The Give Hub aims to revolutionize charitable giving by leveraging blockchain technology to create transparent, efficient, and impactful donation experiences.

## Core Values

* **Transparency**: All donations are traceable on the blockchain
* **Efficiency**: Low fees and fast transactions
* **Impact**: Focus on measurable outcomes
* **Accessibility**: Making giving easy for everyone`);

    // Blockchain basics
    this.contentStore.set('docs/blockchain/stellar-basics.md', `# Stellar Blockchain Integration

## Overview

The Give Hub utilizes the Stellar blockchain as its underlying infrastructure for transparent, secure, and efficient donation management. This document outlines the key aspects of our Stellar integration and how it benefits both donors and recipient organizations.

## Why Stellar?

We chose Stellar for The Give Hub platform for several compelling reasons:

- **Low Transaction Costs**: Stellar transaction fees are minimal (0.00001 XLM per transaction), making it ideal for donations of any size.
- **Fast Settlement**: Transactions confirm in 3-5 seconds, providing immediate feedback to donors.
- **Built-in Decentralized Exchange**: Allows for seamless conversion between different currencies and assets.
- **Energy Efficient**: Stellar's consensus protocol is environmentally friendly compared to proof-of-work blockchains.
- **Compliance Features**: Stellar supports compliance needs for non-profit organizations.`);

    console.log('Loaded default content');
  }
  
  // Get content for a document path
  async getContent(path) {
    // First try to get from in-memory store
    if (this.contentStore.has(path)) {
      return this.contentStore.get(path);
    }
    
    // If not in memory, try to fetch from server
    try {
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`Failed to load document: ${response.statusText}`);
      }
      
      const content = await response.text();
      
      // Cache the content
      this.contentStore.set(path, content);
      
      return content;
    } catch (error) {
      console.error('Error loading content:', error);
      throw error;
    }
  }
  
  // Save content for a document path
  async saveContent(path, content) {
    // Update in-memory store
    this.contentStore.set(path, content);
    
    // Persist to localStorage
    this.persistToStorage();
    
    // Save to server
    console.log(`Saving content to path: ${path}`);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append("path", path);
      formData.append("content", content);
      
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
      
      console.log("Document saved successfully to server", result);
      return { success: true, path, serverResponse: result };
    } catch (error) {
      console.error("Error saving to server:", error);
      // Still return success since we saved to localStorage
      return { success: true, path, warning: "Saved to browser only. Server save failed." };
    }
  }
  
  // Save content to localStorage
  persistToStorage() {
    try {
      const contentObject = {};
      
      for (const [path, content] of this.contentStore.entries()) {
        contentObject[path] = content;
      }
      
      localStorage.setItem('giveHubDocsContent', JSON.stringify(contentObject));
    } catch (error) {
      console.error('Error persisting content to localStorage:', error);
    }
  }
}

// Main application class
class GiveHubDocs {
  constructor() {
    // Initialize services
    this.contentManager = new ContentManager();
    this.documentSynchronizer = new DocumentSynchronizer(this.contentManager);
    
    // Set theme preferences from localStorage
    this.initializeTheme();
    
    // Find component elements
    this.setupComponentReferences();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load initial document if specified in URL
    this.handleInitialRoute();
    
    // Check for documents needing sync
    this.checkForDocumentsNeedingSync();
  }
  
  // Find component elements in the DOM
  setupComponentReferences() {
    this.navSidebar = document.querySelector('nav-sidebar');
    this.tabsContainer = document.querySelector('tabs-container');
    this.markdownEditor = document.querySelector('markdown-editor');
    this.appContainer = document.querySelector('.app-container');
    
    // Create elements if they don't exist
    if (!this.navSidebar) {
      console.warn('NavSidebar element not found, creating dynamically');
      this.navSidebar = document.createElement('nav-sidebar');
      this.navSidebar.setAttribute('data-nav-url', 'nav/main.json');
      this.navSidebar.setAttribute('data-default-page', 'docs/home.md');
      this.appContainer.prepend(this.navSidebar);
    }
    
    if (!this.tabsContainer) {
      console.warn('TabsContainer element not found, creating dynamically');
      this.tabsContainer = document.createElement('tabs-container');
      this.appContainer.querySelector('.content-area').prepend(this.tabsContainer);
    }
    
    if (!this.markdownEditor) {
      console.warn('MarkdownEditor element not found, creating dynamically');
      this.markdownEditor = document.createElement('markdown-editor');
      this.appContainer.querySelector('.content-area').appendChild(this.markdownEditor);
    }
  }
  
  // Set up event listeners for component interactions
  setupEventListeners() {
    // Handle navigation item selection
    document.addEventListener('nav-item-selected', this.handleNavItemSelected.bind(this));
    
    // Handle content save requests
    document.addEventListener('content-save', this.handleContentSave.bind(this));
    
    // Handle document editing status changes
    document.addEventListener('document-changed', this.handleDocumentChanged.bind(this));
    
    // Handle navigation resizing
    document.addEventListener('navigation-resized', this.handleNavigationResized.bind(this));
    
    // Handle mobile navigation mode changes
    document.addEventListener('navigation-mode-change', this.handleNavigationModeChange.bind(this));
    
    // Handle theme toggle if it exists
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', this.toggleDarkMode.bind(this));
    }
  }
  
  // Handle navigation item selection
  async handleNavItemSelected(event) {
    const { path, title } = event.detail;
    
    try {
      // Fetch the content for this path
      await this.contentManager.getContent(path);
      
      // No need to do anything else - the tabs component is listening for this event
      // and will handle creating/activating the tab, which will trigger content loading
    } catch (error) {
      console.error('Error handling navigation selection:', error);
      this.showNotification('Failed to load document', 'error');
    }
  }
  
  // Handle content save requests
  async handleContentSave(event) {
    const { path, content } = event.detail;
    
    try {
      const result = await this.contentManager.saveContent(path, content);
      
      if (result.warning) {
        // Show warning if saved to localStorage but not to server
        this.showNotification('Document saved locally, but server save failed: ' + result.warning, 'warning');
      } else if (result.serverResponse) {
        // Show success with server details if available
        this.showNotification('Document saved successfully to server');
      } else {
        // Generic success
        this.showNotification('Document saved successfully');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      this.showNotification('Failed to save document: ' + error.message, 'error');
    }
  }
  
  // Handle document changed events
  handleDocumentChanged(event) {
    const { path, unsaved } = event.detail;
    
    // Find the tab for this document
    const tabId = this.findTabIdForPath(path);
    if (tabId) {
      // Update the tab's unsaved indicator
      this.tabsContainer.setUnsaved(tabId, unsaved);
    }
  }
  
  // Find the tab ID for a given document path
  findTabIdForPath(path) {
    const activeTab = this.tabsContainer.getActiveTab();
    if (activeTab && activeTab.path === path) {
      return activeTab.id;
    }
    return null;
  }
  
  // Handle navigation resize events
  handleNavigationResized(event) {
    // No need to manually adjust since we're using flex layout
    console.log('Navigation resized', event.detail);
  }
  
  // Handle navigation mode changes (mobile/desktop)
  handleNavigationModeChange(event) {
    // No need to manually adjust since we're using flex layout
    console.log('Navigation mode changed', event.detail);
  }
  
  // Handle initial route from URL
  handleInitialRoute() {
    // The navigation component handles this itself,
    // so we don't need to do anything here
  }
  
  // Initialize theme from localStorage
  initializeTheme() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
      document.body.classList.add('dark-mode');
    }
  }
  
  // Toggle dark mode
  toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
  }
  
  // Show notification message
  showNotification(message, type = 'success', clickHandler = null) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add click handler if provided
    if (clickHandler) {
      notification.style.cursor = 'pointer';
      notification.addEventListener('click', () => {
        clickHandler();
        notification.remove();
      });
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after delay (unless it has a click handler)
    if (!clickHandler) {
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
      }, 3000);
    }
  }
  
  // Check for any documents needing synchronization
  async checkForDocumentsNeedingSync() {
    try {
      const differences = await this.documentSynchronizer.scanAllDocuments();
      
      if (differences.length > 0) {
        console.log(`Found ${differences.length} documents with differences between localStorage and server`);
        
        // Show notification about found differences
        this.showNotification(
          `Found ${differences.length} documents with local changes. Click here to sync.`,
          "info",
          () => this.showSyncDialog(differences)
        );
      }
    } catch (error) {
      console.error("Error checking for documents needing sync:", error);
    }
  }
  
  // Show the sync dialog for all documents with differences
  async showSyncDialog(differences) {
    try {
      // Process all pending syncs
      await this.documentSynchronizer.processAllPendingSyncs(
        (message, type) => this.showNotification(message, type)
      );
      
      this.showNotification("Synchronization complete", "success");
    } catch (error) {
      console.error("Error during synchronization:", error);
      this.showNotification("Error during synchronization: " + error.message, "error");
    }
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Register components
  if (typeof registerComponents === 'function') {
    registerComponents();
  }
  
  // Initialize the app
  window.giveHubDocs = new GiveHubDocs();
});