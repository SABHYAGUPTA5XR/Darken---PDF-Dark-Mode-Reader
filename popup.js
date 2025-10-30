const enabledToggle = document.getElementById('enabled-toggle');
const defaultThemeSelector = document.getElementById('default-theme-selector');

// 1. Load saved settings from storage
chrome.storage.sync.get(['isViewerEnabled', 'selectedTheme'], (data) => {
  // Default to 'true' (enabled) if no setting is found
  enabledToggle.checked = data.isViewerEnabled !== false;
  
  // Default to 'pure-dark' if no theme is found
  defaultThemeSelector.value = data.selectedTheme || 'pure-dark';
});

// 2. Save the toggle state
enabledToggle.addEventListener('change', () => {
  const isEnabled = enabledToggle.checked;
  chrome.storage.sync.set({ isViewerEnabled: isEnabled });

  // Send a message to the background script so it knows the state *immediately*
  chrome.runtime.sendMessage({ type: 'UPDATE_ENABLED_STATE', isEnabled });
});

// 3. Save the default theme
defaultThemeSelector.addEventListener('change', () => {
  const newTheme = defaultThemeSelector.value;
  chrome.storage.sync.set({ selectedTheme: newTheme });
});