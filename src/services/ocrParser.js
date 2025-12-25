import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - using unpkg CDN for reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

// Dynamic import for Tesseract.js to handle CommonJS/ESM interop
let TesseractModule = null;

async function getTesseract() {
  if (!TesseractModule) {
    TesseractModule = await import('tesseract.js');
  }
  // Handle both default export (CommonJS interop) and named exports
  return TesseractModule.default || TesseractModule;
}

/**
 * Extract text from image using Tesseract OCR
 */
async function extractTextFromImage(file) {
  try {
    const Tesseract = await getTesseract();
    
    // Create image URL from file
    const imageUrl = URL.createObjectURL(file);
    
    // Use Tesseract.recognize directly
    const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng', {
      logger: (m) => {
        // Progress logging can be added here if needed
      }
    });
    
    // Clean up the object URL
    URL.revokeObjectURL(imageUrl);
    
    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    return '';
  }
}

/**
 * Extract text from PDF
 */
async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error) {
    console.error('PDF Extraction Error:', error);
    return '';
  }
}

/**
 * Extract text from document file
 */
async function extractTextFromDocument(file) {
  // For text-based documents, try to read as text
  try {
    const text = await file.text();
    return text;
  } catch (error) {
    // If that fails, try OCR as fallback
    if (file.type.startsWith('image/')) {
      return extractTextFromImage(file);
    }
    return '';
  }
}

/**
 * Parse extracted text to find event details
 * Uses conservative pattern matching - only extracts high-confidence matches
 */
function parseEventDetails(text) {
  const details = {
    eventName: null,
    date: null,
    time: null,
    venue: null,
    city: null,
    description: null,
    whatToExpect: null,
  };

  if (!text || text.trim().length === 0) {
    return details;
  }

  const normalizedText = text.toLowerCase();

  // Extract event name - look for title patterns (first line, or after keywords)
  const titlePatterns = [
    /^(?:event|title|name)[\s:]*([^\n]{3,60})/i,
    /^([A-Z][^\n]{5,60})/m,
  ];
  
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      details.eventName = match[1].trim();
      break;
    }
  }

  // Extract date - look for common date patterns
  const datePatterns = [
    /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/i,
    /\b\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december),?\s+\d{4}\b/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      details.date = match[0].trim();
      break;
    }
  }

  // Extract time - look for time patterns
  const timePatterns = [
    /\b(\d{1,2}:\d{2}\s*(?:am|pm))\b/i,
    /\b(\d{1,2}:\d{2})\b/,
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      details.time = match[1].trim();
      break;
    }
  }

  // Extract venue - look for venue keywords
  const venuePatterns = [
    /(?:venue|location|place|at)[\s:]+([^\n]{3,50})/i,
    /\b(?:the|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:theater|hall|center|centre|venue|club|bar|restaurant|park|stadium|arena)\b/i,
  ];

  for (const pattern of venuePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      details.venue = match[1].trim();
      break;
    }
  }

  // Extract city - look for city patterns
  const cityPatterns = [
    /(?:city|in)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    /\b([A-Z][a-z]+),?\s+(?:CA|NY|TX|FL|IL|PA|OH|GA|NC|MI|NJ|VA|WA|AZ|MA|TN|IN|MO|MD|WI|CO|MN|SC|AL|LA|KY|OR|OK|CT|IA|AR|UT|NV|MS|KS|NM|NE|WV|ID|HI|NH|ME|RI|MT|DE|SD|ND|AK|DC|VT|WY)\b/,
  ];

  for (const pattern of cityPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      details.city = match[1].trim();
      break;
    }
  }

  // Extract description - look for description sections
  const descPatterns = [
    /(?:description|about|details)[\s:]+([^\n]{20,200})/i,
  ];

  for (const pattern of descPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      details.description = match[1].trim();
      break;
    }
  }

  // Extract "what to expect" - look for expectation keywords
  const expectPatterns = [
    /(?:what to expect|expect|highlights|features)[\s:]+([^\n]{20,200})/i,
  ];

  for (const pattern of expectPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      details.whatToExpect = match[1].trim();
      break;
    }
  }

  // Only return fields that have valid content (confidence threshold)
  const result = {};
  Object.keys(details).forEach(key => {
    if (details[key] && details[key].length > 2) {
      result[key] = details[key];
    }
  });

  return result;
}

/**
 * Main function to extract event details from uploaded file
 */
export async function extractEventDetails(file) {
  let extractedText = '';

  try {
    if (file.type.startsWith('image/')) {
      extractedText = await extractTextFromImage(file);
    } else if (file.type === 'application/pdf') {
      extractedText = await extractTextFromPDF(file);
    } else if (file.type.startsWith('text/') || file.type.includes('document')) {
      extractedText = await extractTextFromDocument(file);
    } else {
      // Try OCR as fallback
      extractedText = await extractTextFromImage(file);
    }

    const eventDetails = parseEventDetails(extractedText);
    return eventDetails;
  } catch (error) {
    console.error('Error extracting event details:', error);
    return {};
  }
}

