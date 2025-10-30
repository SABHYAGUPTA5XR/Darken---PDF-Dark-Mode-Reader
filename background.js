// --- In-memory state for performance ---
let isViewerEnabled = true;

// Function to get the latest state from storage
function updateEnabledState() {
  chrome.storage.sync.get({ isViewerEnabled: true }, (data) => {
    isViewerEnabled = data.isViewerEnabled;
  });
}

// 1. Update the state when the extension first starts
chrome.runtime.onStartup.addListener(updateEnabledState);
// 2. Update the state when the extension is installed/updated
chrome.runtime.onInstalled.addListener(updateEnabledState);

// 3. Listen for immediate updates from the popup.js
chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'UPDATE_ENABLED_STATE') {
    isViewerEnabled = request.isEnabled;
  }
});

// 4. The navigation listener
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // Check our in-memory state first. This is fast.
  if (isViewerEnabled && details.url.endsWith('.pdf')) {
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('viewer/viewer.html') + '?file=' + encodeURIComponent(details.url)
    });
  }
  // If not enabled, we do nothing, and the browser handles the PDF.
}, { url: [{ urlMatches: '.*\\.pdf$' }] });