/**
 * KalAI Agent Demo - Complex JavaScript Example
 * 
 * This file contains more complex JavaScript code that you can use to test
 * the KalAI Agent chat interface. Try asking questions about this code
 * using the chat interface.
 * 
 * Example questions:
 * - "Explain how the UserManager class works"
 * - "What design patterns are used in this code?"
 * - "How could I improve the error handling in the fetchUserData function?"
 * - "What's the purpose of the debounce function?"
 */

// Utility function to debounce function calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Simple event emitter implementation
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return () => this.removeListener(event, listener);
  }

  emit(event, ...args) {
    if (!this.events[event]) {
      return false;
    }
    this.events[event].forEach(listener => {
      listener.apply(this, args);
    });
    return true;
  }

  removeListener(event, listener) {
    if (!this.events[event]) {
      return this;
    }
    const idx = this.events[event].indexOf(listener);
    if (idx > -1) {
      this.events[event].splice(idx, 1);
    }
    return this;
  }
}

// API service with caching
class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cache = new Map();
    this.cacheTTL = 60000; // 1 minute
  }

  async get(endpoint, params = {}) {
    const url = this._buildUrl(endpoint, params);
    const cacheKey = url.toString();
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      if (Date.now() - timestamp < this.cacheTTL) {
        return data;
      }
    }
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update cache
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
  
  _buildUrl(endpoint, params) {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });
    return url;
  }
  
  clearCache() {
    this.cache.clear();
  }
}

// User management system
class UserManager extends EventEmitter {
  constructor(apiService) {
    super();
    this.apiService = apiService;
    this.users = [];
    this.currentUser = null;
    
    // Debounce the search to prevent too many API calls
    this.searchUsers = debounce(this._searchUsers.bind(this), 300);
  }
  
  async fetchUserData(userId) {
    try {
      const userData = await this.apiService.get(`users/${userId}`);
      return this._processUserData(userData);
    } catch (error) {
      this.emit('error', `Failed to fetch user data: ${error.message}`);
      return null;
    }
  }
  
  async _searchUsers(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
      this.users = [];
      this.emit('users-updated', this.users);
      return;
    }
    
    try {
      const results = await this.apiService.get('users/search', { q: searchTerm });
      this.users = results.map(this._processUserData);
      this.emit('users-updated', this.users);
    } catch (error) {
      this.emit('error', `Search failed: ${error.message}`);
    }
  }
  
  _processUserData(userData) {
    // Add computed properties and format data
    return {
      ...userData,
      fullName: `${userData.firstName} ${userData.lastName}`,
      initials: `${userData.firstName[0]}${userData.lastName[0]}`,
      isAdmin: userData.role === 'admin',
      formattedDate: new Date(userData.createdAt).toLocaleDateString()
    };
  }
  
  setCurrentUser(user) {
    this.currentUser = user;
    this.emit('current-user-changed', user);
    
    // Store in localStorage for persistence
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }
  
  loadSavedUser() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.setCurrentUser(user);
        return user;
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('currentUser');
      }
    }
    return null;
  }
}

// Usage example
function initializeApp() {
  const apiService = new ApiService('https://api.example.com/v1');
  const userManager = new UserManager(apiService);
  
  // Set up event listeners
  userManager.on('users-updated', users => {
    console.log('Users updated:', users);
    renderUserList(users);
  });
  
  userManager.on('current-user-changed', user => {
    console.log('Current user changed:', user);
    updateUIForUser(user);
  });
  
  userManager.on('error', errorMessage => {
    console.error(errorMessage);
    showErrorNotification(errorMessage);
  });
  
  // Load saved user on startup
  const savedUser = userManager.loadSavedUser();
  if (!savedUser) {
    showLoginForm();
  }
  
  // Attach to global window for demo purposes
  window.userManager = userManager;
  
  // These functions would be implemented elsewhere
  function renderUserList(users) {
    // DOM manipulation to show users
  }
  
  function updateUIForUser(user) {
    // Update UI based on user
  }
  
  function showErrorNotification(message) {
    // Display error to user
  }
  
  function showLoginForm() {
    // Show login UI
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}