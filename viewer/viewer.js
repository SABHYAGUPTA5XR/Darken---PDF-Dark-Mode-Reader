// This is a simplified PDF.js loader. 
// You'll need to download PDF.js from Mozilla's site and include its files.

// 1. Get the PDF file URL from our query parameter
const urlParams = new URLSearchParams(window.location.search);
const pdfUrl = decodeURIComponent(urlParams.get('file'));

const container = document.getElementById('pdf-container');

// 2. Initialize PDF.js (simplified)
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.js';

// 3. Load the document
pdfjsLib.getDocument(pdfUrl).promise.then(pdf => {
  // Loop through all pages
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    pdf.getPage(pageNum).then(page => {
      
      const viewport = page.getViewport({ scale: 1.5 });
      
      // Create canvas for the page
      const canvas = document.createElement('canvas');
      const canvasContext = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Create a div to hold both canvas and text
      const pageDiv = document.createElement('div');
      pageDiv.className = 'page';
      pageDiv.style.width = viewport.width + 'px';
      pageDiv.style.height = viewport.height + 'px';
      pageDiv.appendChild(canvas);
      
      container.appendChild(pageDiv);
      
      // Render the page content (backgrounds, images)
      page.render({ canvasContext, viewport });

      // Render the text layer
      page.getTextContent().then(textContent => {
        const textLayerDiv = document.createElement('div');
        textLayerDiv.className = 'textLayer';
        textLayerDiv.style.width = viewport.width + 'px';
        textLayerDiv.style.height = viewport.height + 'px';
        pageDiv.appendChild(textLayerDiv);
        
        pdfjsLib.renderTextLayer({
          textContent,
          container: textLayerDiv,
          viewport,
          textDivs: []
        });
      });
    });
  }
});