chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // Check if the URL ends with .pdf
  if (details.url.endsWith('.pdf')) {
    // Redirect to your custom viewer
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('viewer/viewer.html') + '?file=' + encodeURIComponent(details.url)
    });
  }
}, { url: [{ urlMatches: '.*\\.pdf$' }] });