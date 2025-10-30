// This applies the simple CSS filter
function applyQuickFilter(enabled) {
  if (enabled) {
    document.documentElement.style.filter = 'invert(1) hue-rotate(180deg)';
    // This is the trick: re-invert images and videos so they look normal
    document.querySelectorAll('img, video, picture').forEach(el => {
      el.style.filter = 'invert(1) hue-rotate(180deg)';
    });
  } else {
    document.documentElement.style.filter = '';
    document.querySelectorAll('img, video, picture').forEach(el => {
      el.style.filter = '';
    });
  }
}

// 1. Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'TOGGLE_QUICK_FILTER') {
    applyQuickFilter(request.enabled);
  }
});

// 2. Apply on page load if it was already on
chrome.storage.sync.get(['quickFilterEnabled'], (result) => {
  if (result.quickFilterEnabled) {
    applyQuickFilter(true);
  }
});