// 1. Import the PDF.js library
import * as pdfjsLib from './pdf.mjs';

// 2. Set the path to the worker file
// This is critical for performance!
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('viewer/pdf.worker.mjs');

// 3. Get the PDF file URL from our query parameter
const urlParams = new URLSearchParams(window.location.search);
const pdfUrl = decodeURIComponent(urlParams.get('file'));

const container = document.getElementById('pdf-container');

async function renderPDF() {
  try {
    // 4. Load the document
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    // 5. Loop through all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      const viewport = page.getViewport({ scale: 1.5 });
      
      // Create canvas for the page
      const canvas = document.createElement('canvas');
      const canvasContext = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Create a div to hold both canvas and text
      // We apply the dark-theme CSS classes here
      const pageDiv = document.createElement('div');
      pageDiv.className = 'page';
      pageDiv.style.width = viewport.width + 'px';
      pageDiv.style.height = viewport.height + 'px';
      
      const canvasWrapper = document.createElement('div');
      canvasWrapper.className = 'canvasWrapper';
      canvasWrapper.appendChild(canvas);
      pageDiv.appendChild(canvasWrapper);
      
      container.appendChild(pageDiv);
      
      // Render the page content (backgrounds, images)
      await page.render({
        canvasContext,
        viewport,
        backgroundColor: '#1e1e1e' // <-- V1 UPDATE: Forces dark background
      }).promise;

      // Render the text layer
      const textContent = await page.getTextContent();
      
      const textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'textLayer';
      textLayerDiv.style.width = viewport.width + 'px';
      textLayerDiv.style.height = viewport.height + 'px';
      pageDiv.appendChild(textLayerDiv);
        
      // This function renders the text spans that our CSS will turn white
      pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport: viewport,
        textDivs: []
      });
    }
  } catch (error) {
    console.error('Error rendering PDF:', error);
    const errorMsg = document.createElement('h3');
    errorMsg.textContent = `Failed to load PDF: ${error.message}`;
    errorMsg.style.color = 'white';
    container.appendChild(errorMsg);
  }
}

renderPDF();

// --- V1 UPDATE: Button logic ---
const toggleBtn = document.getElementById('invert-toggle');
const containerDiv = document.getElementById('pdf-container');

toggleBtn.addEventListener('click', () => {
  containerDiv.classList.toggle('invert-canvas');
});