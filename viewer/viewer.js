// 1. Import the PDF.js library
import * as pdfjsLib from './pdf.mjs';

// 2. Set the path to the worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('viewer/pdf.worker.mjs');

// --- Theme Definitions ---
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

// --- V2 UPDATE: Global state variables ---
let currentTheme = 'pure-dark';
let pdfDoc = null; // Will hold the loaded PDF document
let pageViewports = []; // Will hold the viewport for each page

// --- Theme Apply Function (CSS only) ---
// This function now ONLY applies the CSS variables, making it fast.
function applyTheme(themeName) {
  currentTheme = themeName;
  document.body.dataset.theme = themeName;
  
  const root = document.documentElement;
  root.style.setProperty('--bg-color', THEMES[themeName].bg);
  root.style.setProperty('--text-color', THEMES[themeName].text);
  root.style.setProperty('--page-bg-color', THEMES[themeName].pageBg);
}

// --- V2 UPDATE: New function to re-render canvases ---
async function reRenderCanvasBackgrounds(themeName) {
  if (!pdfDoc) return; // Don't do anything if the PDF isn't loaded

  const newBackgroundColor = THEMES[themeName].pageBg;

  // Loop through all pages
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      
      // Find the existing canvas
      const canvas = document.getElementById('canvas-' + pageNum);
      if (!canvas) continue; // Skip if canvas not found

      const canvasContext = canvas.getContext('2d');
      const viewport = pageViewports[pageNum - 1]; // Get the stored viewport
      
      // Re-render the page with the new background color
      await page.render({
        canvasContext,
        viewport,
        backgroundColor: newBackgroundColor
      }).promise;

    } catch (error) {
      console.error(`Error re-rendering page ${pageNum}:`, error);
    }
  }
}

// --- V2 UPDATE: Renamed from renderPDF to loadAndRenderPDF ---
// This function now does the *initial* load and render.
async function loadAndRenderPDF() {
  try {
    // Load the document and store it in our global variable
    pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      
      // Store the viewport so we can reuse it
      const viewport = page.getViewport({ scale: 1.5 });
      pageViewports.push(viewport);
      
      const canvas = document.createElement('canvas');
      const canvasContext = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.id = 'canvas-' + pageNum; // --- V2 UPDATE: Add ID

      const pageDiv = document.createElement('div');
      pageDiv.className = 'page';
      pageDiv.style.width = viewport.width + 'px';
      pageDiv.style.height = viewport.height + 'px';
      pageDiv.id = 'page-div-' + pageNum; // --- V2 UPDATE: Add ID
      
      const canvasWrapper = document.createElement('div');
      canvasWrapper.className = 'canvasWrapper';
      canvasWrapper.appendChild(canvas);
      pageDiv.appendChild(canvasWrapper);
      
      container.appendChild(pageDiv);
      
      // Render the page content (canvas)
      await page.render({
        canvasContext,
        viewport,
        backgroundColor: THEMES[currentTheme].pageBg 
      }).promise;

      // Render the text layer
      const textContent = await page.getTextContent();
      
      const textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'textLayer';
      textLayerDiv.style.width = viewport.width + 'px';
      textLayerDiv.style.height = viewport.height + 'px';
      textLayerDiv.id = 'text-layer-' + pageNum; // --- V2 UPDATE: Add ID
      pageDiv.appendChild(textLayerDiv);
        
      pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport: viewport,
        textDivs: []
      });
    }
  } catch (error) {
    console.error('Error loading PDF:', error);
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
  
  // 1. Apply CSS variables (fast)
  applyTheme(newTheme);
  
  // 2. --- V2 UPDATE: Re-render canvases (slower, but async) ---
  reRenderCanvasBackgrounds(newTheme);
  
  // 3. Save the choice
  chrome.storage.sync.set({ selectedTheme: newTheme });
});

// --- Initial Load Function ---
function initialize() {
  // Get the saved theme, or use 'pure-dark' as a default
  chrome.storage.sync.get({ selectedTheme: 'pure-dark' }, (data) => {
    const savedTheme = data.selectedTheme;
    
    // 1. Apply the theme variables to the page
    applyTheme(savedTheme);
    
    // 2. Set the dropdown to show the correct saved value
    themeSelector.value = savedTheme;
    
    // 3. Now, load and render the PDF for the first time
    loadAndRenderPDF();
  });
}
// --- Run the initialization ---
initialize();