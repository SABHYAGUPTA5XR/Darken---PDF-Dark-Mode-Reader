// 1. Import the PDF.js library
import * as pdfjsLib from './pdf.mjs';

// 2. Set the path to the worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('viewer/pdf.worker.mjs');

// --- NEW V1: Theme Definitions ---
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

let currentTheme = 'pure-dark'; // Default

// --- Theme Apply Function ---
function applyTheme(themeName) {
  currentTheme = themeName;
  document.body.dataset.theme = themeName;
  
  // Note: This only affects NEWLY rendered pages.
  // For a full V1, we'd need to re-render all pages,
  // but for now, we'll just set it for the initial render.
  // We'll also update the body style immediately.
  document.body.style.backgroundColor = THEMES[themeName].bg;
  document.body.style.color = THEMES[themeName].text;
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
  applyTheme(e.target.value);
  
  // *** CHALLENGE ***
  // As noted above, changing theme *after* render is hard.
  // The simple V1 fix is to alert the user to reload.
  // A V2 fix would re-render all canvases.
  alert("Theme changed! You may need to reload the PDF for the page backgrounds to update fully.");
});

// --- Initial Load ---
// Set default theme on body
applyTheme('pure-dark');
// Render the PDF
renderPDF();