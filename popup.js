const toggle = document.getElementById('quick-filter-toggle');

// 1. Get the current saved state
chrome.storage.sync.get(['quickFilterEnabled'], (result) => {
  toggle.checked = !!result.quickFilterEnabled;
});

// 2. Save the new state and tell the content script
toggle.addEventListener('change', () => {
  const isEnabled = toggle.checked;
  chrome.storage.sync.set({ quickFilterEnabled: isEnabled });

  // Send a message to the active tab's content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { 
      type: 'TOGGLE_QUICK_FILTER', 
      enabled: isEnabled 
    });
  });
});