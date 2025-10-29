// Polyfill WebSocket for Jest
const WebSocket = require('ws');

// Make WebSocket available globally
global.WebSocket = WebSocket;

// If you're using jsdom test environment, also add to window
if (typeof window !== 'undefined') {
  window.WebSocket = WebSocket;
}