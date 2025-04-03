# The Give Hub - Frontend Development Guide

## 1. Application Initialization

The main app structure uses an IIFE (Immediately Invoked Function Expression) to create a self-contained scope and avoid global namespace pollution.

```javascript
(function() {
    // Common DOM helper functions
    const $ = str => document.querySelector(str);
    const $$ = str => document.querySelectorAll(str);

    // Main app object that contains all functionality
    const app = {
        // Data storage for application state
        data: {
            user: null,
            campaigns: [],
            preferences: null,
            // Other application data
        },
        
        // Application state
        state: {
            loaded: false,
            currentPage: null,
            sidebarOpen: false,
            lastError: null
        },
        
        // Configuration settings
        config: {
            account: {
                // Account settings
            },
            api: {
                baseUrl: 'https://app.thegivehub.com/api',
                endpoints: {
                    // API endpoints
                }
            }
        },
        
        // Initialization methods
        init() {
            this.setupEventListeners();
            this.loadInitialContent();
            this.setupRouting();
            this.loadUserData();
            
            // Initialize modules
            this.theme.init();
            this.auth.init();
        }
    };
})();
```

## 2. Campaign Management

Example of Campaign creation form handling:

```javascript
function handleCampaignCreation() {
    // Collect form data
    const formData = {
        title: document.getElementById('campaignTitle').value,
        type: document.getElementById('campaignType').value,
        description: document.getElementById('description').value,
        fundingGoal: parseFloat(document.getElementById('fundingGoal').value),
        deadline: document.getElementById('deadline').value,
        minContribution: parseFloat(document.getElementById('minContribution').value),
        creatorId: getUserId(), // Get user ID from authentication
        createdAt: new Date().toISOString(),
        status: 'pending', // Initial status for moderation
        location: {
            country: document.getElementById('location-country').value,
            region: document.getElementById('location-region').value,
            coordinates: {
                latitude: parseFloat(document.getElementById('location-latitude').value) || null,
                longitude: parseFloat(document.getElementById('location-longitude').value) || null
            }
        }
    };
    
    // Send data to the backend
    fetch('/api/campaign', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        // Handle success
        showNotification('Campaign created successfully!');
        window.location.href = '/my-campaigns.html';
    })
    .catch(error => {
        // Handle error
        showNotification('Error creating campaign: ' + error.message, 'error');
    });
}
```

## 3. Common Utility Functions

```javascript
// Format currency values
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Format dates consistently
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

// Calculate progress percentage
function calculateProgress(raised, goal) {
    if (!raised || !goal) return 0;
    const progress = (raised / goal) * 100;
    return Math.min(progress, 100); // Cap at 100%
}

// Show notification messages
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Hide and remove after a delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}
```

## 4. Authentication Helpers

```javascript
// Get authentication token from storage
function getToken() {
    return localStorage.getItem('accessToken') || '';
}

// Get user ID from token or local storage
function getUserId() {
    // First try localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            if (user.id || user._id || user.userId) {
                return user.id || user._id || user.userId;
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    
    // If not in localStorage, try to extract from JWT token
    const token = getToken();
    if (token) {
        try {
            // Parse JWT token (without verification)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            
            // Check all common field names for user ID
            return payload.sub || payload.userId || payload._id || payload.id || null;
        } catch (e) {
            console.error('Error parsing token:', e);
        }
    }
    
    return null;
}

// Check if user is authenticated
function checkAuth() {
    const token = getToken();
    if (!token) {
        // Redirect to login page if not authenticated
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return false;
    }
    return true;
}
```

## 5. Map Integration

```javascript
// Initialize a map with Leaflet.js
function initializeMap(containerId, lat, lng, popupText) {
    // Create map instance
    const map = L.map(containerId).setView([lat, lng], 4);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add marker at the location
    const marker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(popupText)
        .openPopup();
    
    return { map, marker };
}

// Handle map click for coordinate selection
function handleMapClick(map, event, latInput, lngInput) {
    // Get click coordinates
    const latlng = map.mouseEventToContainerPoint(event.originalEvent);
    const coordinates = map.containerPointToLatLng(latlng);
    
    // Update form fields
    document.getElementById(latInput).value = coordinates.lat;
    document.getElementById(lngInput).value = coordinates.lng;
    
    // Update marker position or create a new one
    if (window.currentMarker) {
        window.currentMarker.setLatLng(coordinates);
    } else {
        window.currentMarker = L.marker(coordinates).addTo(map);
    }
}
```

## 6. Form Handling Patterns

```javascript
// Validate form inputs
function validateForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input, select, textarea');
    let valid = true;
    
    inputs.forEach(input => {
        // Clear previous validation state
        input.classList.remove('invalid');
        const errorElement = input.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        // Check required fields
        if (input.required && !input.value.trim()) {
            valid = false;
            input.classList.add('invalid');
            if (errorElement) {
                errorElement.textContent = 'This field is required';
                errorElement.style.display = 'block';
            }
        }
        
        // Add more validation logic here...
    });
    
    return valid;
}

// Handle multi-step forms
function handleMultiStepForm() {
    let currentStep = 1;
    const totalSteps = document.querySelectorAll('.form-section').length;
    
    // Function to show a specific step
    function showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show the current step
        document.querySelector(`#step${stepNumber}`).classList.add('active');
        
        // Update progress indicators
        document.querySelectorAll('.step').forEach((step, index) => {
            if (index + 1 === stepNumber) {
                step.classList.add('active');
            } else if (index + 1 < stepNumber) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
        
        // Update button states
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        prevBtn.style.display = stepNumber === 1 ? 'none' : 'block';
        nextBtn.textContent = stepNumber === totalSteps ? 'Submit' : 'Next';
    }
    
    // Initialize with the first step
    showStep(currentStep);
}
```

## 7. Image Upload Handling

```javascript
// Handle image uploads with preview
function setupImageUpload(uploadElementId, previewElementId) {
    const uploadElement = document.getElementById(uploadElementId);
    const previewElement = document.getElementById(previewElementId);
    
    // Process files and create previews
    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    const preview = document.createElement('div');
                    preview.className = 'preview-item';
                    preview.style.backgroundImage = `url(${e.target.result})`;
                    
                    // Add remove button
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-btn';
                    removeBtn.innerHTML = '&times;';
                    removeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        preview.remove();
                    });
                    
                    preview.appendChild(removeBtn);
                    previewElement.appendChild(preview);
                    
                    // Store the file for later upload
                    preview.dataset.file = file.name;
                    window.uploadedFiles = window.uploadedFiles || {};
                    window.uploadedFiles[file.name] = file;
                };
                
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Set up event listeners for file uploads
    uploadElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadElement.classList.add('dragover');
    });
    
    uploadElement.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadElement.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    });
}
```

## 8. Theme Management

```javascript
// Theme management module
const theme = {
    init() {
        const themeToggle = document.getElementById('themeToggle');
        const moonIcon = themeToggle.querySelector('.moon-icon');
        const sunIcon = themeToggle.querySelector('.sun-icon');
        
        // Check for saved theme preference or system preference
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Set initial theme
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        }
        
        // Toggle theme on click
        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                moonIcon.classList.remove('hidden');
                sunIcon.classList.add('hidden');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                moonIcon.classList.add('hidden');
                sunIcon.classList.remove('hidden');
            }
        });
    }
};
```

## 9. API Interaction

```javascript
// API interaction module
const api = {
    // Build a full URL with the API base URL
    buildUrl(endpoint, params = {}) {
        const url = new URL(app.config.api.baseUrl + endpoint);
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });
        return url.toString();
    },
    
    // Make an authenticated request to the API
    async fetchWithAuth(endpoint, options = {}) {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        const defaultHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        const response = await fetch(this.buildUrl(endpoint), {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        });
        
        // Handle 401 (Unauthorized) - Token expired
        if (response.status === 401) {
            const refreshed = await this.refreshToken();
            if (refreshed) {
                // Retry original request with new token
                return this.fetchWithAuth(endpoint, options);
            }
            // Redirect to login if refresh failed
            window.location.href = '/login.html';
            return null;
        }
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        return response.json();
    }
};
```