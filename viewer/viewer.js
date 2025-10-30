// 1. Import the PDF.js library
import * as pdfjsLib from './pdf.mjs';

// 2. Set the path to the worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('viewer/pdf.worker.mjs');

// --- V1: Theme Definitions ---
const THEMES = {
  'pure-dark': {
    bg: '#1e1e1e',     // CSS body background
    text: '#d4d4d4',  // CSS text color
    pageBg: '#1e1e1e' // Canvas render background
  },
  'soft-dark': {
    bg: '#252526',
    text: '#cccccc',
    pageBg: '#252526'
  },
  'sepia': {
    bg: '#f4e8c1',
    text: '#5b4636',
    pageBg: '#f4e8c1'
  }
};

// --- Get DOM Elements ---
const container = document.getElementById('pdf-container');
const themeSelector = document.getElementById('theme-selector');
const toggleBtn = document.getElementById('invert-toggle');
const urlParams = new URLSearchParams(window.location.search);
const pdfUrl = decodeURIComponent(urlParams.get('file'));

let currentTheme = 'pure-dark'; // This will be set by our storage logic

// --- Theme Apply Function ---
function applyTheme(themeName) {
  currentTheme = themeName;
  document.body.dataset.theme = themeName;
  
  // We can't just set body style, must set the root properties
  // (This is a fix from the previous step, our CSS uses :root)
  const root = document.documentElement;
  root.style.setProperty('--bg-color', THEMES[themeName].bg);
  root.style.setProperty('--text-color', THEMES[themeName].text);
  root.style.setProperty('--page-bg-color', THEMES[themeName].pageBg);
}

// --- PDF Rendering Function ---
async function renderPDF() {
  try {
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      const canvasContext = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const pageDiv = document.createElement('div');
      pageDiv.className = 'page';
      pageDiv.style.width = viewport.width + 'px';
      pageDiv.style.height = viewport.height + 'px';
      
      const canvasWrapper = document.createElement('div');
      canvasWrapper.className = 'canvasWrapper';
      canvasWrapper.appendChild(canvas);
      pageDiv.appendChild(canvasWrapper);
      
      container.appendChild(pageDiv);
      
      // *** KEY UPDATE HERE ***
      // Use the *current theme's* page background color for rendering
      await page.render({
        canvasContext,
        viewport,
        backgroundColor: THEMES[currentTheme].pageBg 
      }).promise;

      const textContent = await page.getTextContent();
      
      const textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'textLayer';
      textLayerDiv.style.width = viewport.width + 'px';
      textLayerDiv.style.height = viewport.height + 'px';
      pageDiv.appendChild(textLayerDiv);
        
      pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport: viewport,
        textDivs: []
      });
    }
  } catch (error) {
    console.error('Error rendering PDF:', error);
    // ... (error handling) ...
  }
}

// --- Event Listeners ---

// 1. Invert Button
toggleBtn.addEventListener('click', () => {
  container.classList.toggle('invert-canvas');
});

// 2. Theme Selector
themeSelector.addEventListener('change', (e) => {
  const newTheme = e.target.value;
  applyTheme(newTheme);
  
  // --- NEW: Save the user's choice to sync storage ---
  chrome.storage.sync.set({ selectedTheme: newTheme });
  
  // We removed the annoying 'alert()'
});

// --- NEW: Initial Load Function ---
function initialize() {
  // Get the saved theme, or use 'pure-dark' as a default
  chrome.storage.sync.get({ selectedTheme: 'pure-dark' }, (data) => {
    const savedTheme = data.selectedTheme;
    
    // 1. Apply the theme to the page
    // (This sets the 'currentTheme' variable)
    applyTheme(savedTheme);
    
    // 2. Set the dropdown to show the correct saved value
    themeSelector.value = savedTheme;
    
    // 3. NOW we can render the PDF, which will use the
    // 'currentTheme' variable for its background color.
    renderPDF();
  });
}

// --- Run the initialization ---
initialize();