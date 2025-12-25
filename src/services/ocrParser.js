import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - using unpkg CDN for reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

// API Keys
const HUGGINGFACE_API_TOKEN = import.meta.env.VITE_HUGGINGFACE_API_TOKEN || '';
const OCR_SPACE_API_KEY = import.meta.env.VITE_OCR_SPACE_API_KEY || 'K87899142388957';

/**
 * Extract text using OCR.space API (fallback method)
 */
async function extractTextWithOCRSpace(file) {
  try {
    console.log('Using OCR.space API...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': OCR_SPACE_API_KEY,
      },
      body: formData,
    });

    const result = await response.json();
    console.log('OCR.space response:', result);

    if (result.ParsedResults && result.ParsedResults.length > 0) {
      const text = result.ParsedResults[0].ParsedText;
      console.log('Extracted OCR text:', text.substring(0, 500));
      return text;
    }

    return '';
  } catch (error) {
    console.error('OCR.space Error:', error);
    return '';
  }
}

/**
 * Extract event details using HuggingFace Idefics3-8B-Llama3 Vision Model
 */
async function extractEventDetailsWithIdefics(file) {
  try {
    console.log('Attempting HuggingFace Idefics3 extraction...');
    
    // Convert file to base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (HUGGINGFACE_API_TOKEN) {
      headers['Authorization'] = `Bearer ${HUGGINGFACE_API_TOKEN}`;
    }

    const prompt = `Extract event information from this image. Return ONLY a valid JSON object with these fields (include only fields you are confident about):
{
  "eventName": "the main event title",
  "date": "the event date",
  "time": "the event time",
  "venue": "the venue name",
  "city": "the city name",
  "description": "brief description",
  "whatToExpect": "what attendees can expect"
}

Rules:
- Only include fields you can clearly see in the image
- Do not make up or guess information
- Return valid JSON only, no additional text
- Event name should be the main title, not artist names or taglines`;

    const response = await fetch(
      'https://api-inference.huggingface.co/models/HuggingFaceM4/Idefics3-8B-Llama3',
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.1,
          },
          image: base64,
        }),
      }
    );

    console.log('HuggingFace response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HuggingFace API Error:', response.status, errorText);
      
      // If model is loading, don't retry - fall back to OCR.space
      if (response.status === 503) {
        console.log('Model is loading. Falling back to OCR.space...');
        return null;
      }
      
      return null;
    }

    const result = await response.json();
    console.log('HuggingFace result:', result);

    // Handle different response formats
    let text = '';
    if (Array.isArray(result)) {
      text = result[0]?.generated_text || '';
    } else if (result.generated_text) {
      text = result.generated_text;
    } else if (typeof result === 'string') {
      text = result;
    }

    if (text) {
      console.log('Generated text:', text);
      
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const eventDetails = JSON.parse(jsonMatch[0]);
          console.log('Successfully extracted details:', eventDetails);
          return eventDetails;
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
        }
      }
    }

    console.log('HuggingFace did not return valid JSON, falling back...');
    return null;
  } catch (error) {
    console.error('HuggingFace Idefics3 Error:', error);
    return null;
  }
}

/**
 * Extract text from image - uses OCR.space (HuggingFace has CORS issues from browser)
 */
async function extractTextFromImage(file) {
  // Use OCR.space directly (HuggingFace requires backend proxy due to CORS)
  const ocrText = await extractTextWithOCRSpace(file);
  return ocrText;
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
 * Generic pattern matching - NO hardcoding of specific values
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

  // Try to parse as JSON first (from AI models)
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'object' && parsed !== null) {
      // Return only fields that exist and are non-empty
      Object.keys(details).forEach(key => {
        if (parsed[key] && typeof parsed[key] === 'string' && parsed[key].trim().length > 0) {
          details[key] = parsed[key].trim();
        }
      });
      return details;
    }
  } catch (e) {
    // Not JSON, continue with pattern matching
  }

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Extract date - generic patterns
  const datePatterns = [
    // "21ST DECEMBER 2025", "1st Jan 2024"
    /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{2,4})\b/i,
    // "DECEMBER 21 2025", "Jan 1 2024"
    /\b((?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{2,4})\b/i,
    // "21/12/2025", "12-21-2025"
    /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      details.date = match[1].trim();
      break;
    }
  }

  // Extract time - generic patterns
  const timePatterns = [
    /\b(\d{1,2}:\d{2}\s*(?:am|pm))\b/i,
    /\b(\d{1,2}:\d{2})\s*(?:hrs?|hours?)?\b/i,
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      details.time = match[1].trim();
      break;
    }
  }

  // Extract venue - look for venue-related keywords
  const venuePatterns = [
    /(?:venue|location|place|at|@)[\s:]+([^\n,]{3,50})/i,
    /\b([A-Z][A-Za-z\s]{2,40}\s+(?:center|centre|hall|theater|theatre|stadium|arena|auditorium|ground|park|club))\b/i,
  ];

  for (const pattern of venuePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      details.venue = match[1].trim();
      break;
    }
  }

  // Extract city - look for city-related keywords
  const cityPatterns = [
    /(?:city|location|in|@)[\s:]+([A-Z][A-Za-z\s]{2,25}?)(?:\s|$|,|\n)/i,
  ];

  for (const pattern of cityPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      details.city = match[1].trim();
      break;
    }
  }

  // Extract event name - look for "BY [ARTIST]" pattern
  const byPattern = /\bby\s+([^\n]{3,40})/i;
  const byMatch = text.match(byPattern);
  
  if (byMatch) {
    const beforeBy = text.substring(0, byMatch.index).trim();
    const beforeByLines = beforeBy.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Get the last substantial line before "BY"
    for (const line of beforeByLines.reverse()) {
      if (line.length >= 3 && line.length <= 60) {
        details.eventName = line;
        break;
      }
    }
  }
  
  // Fallback: look for the first substantial line that's not a date
  if (!details.eventName) {
    for (const line of lines) {
      if (line.length >= 3 && line.length <= 60) {
        // Skip lines that look like dates
        if (!line.match(/\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i) &&
            !line.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d/i)) {
          details.eventName = line;
          break;
        }
      }
    }
  }

  // Extract description
  const descPatterns = [
    /(?:description|about|details)[\s:]+([^\n]{10,300})/i,
  ];

  for (const pattern of descPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      details.description = match[1].trim();
      break;
    }
  }

  // Extract "what to expect"
  const expectPatterns = [
    /(?:what to expect|expect|highlights|features)[\s:]+([^\n]{10,300})/i,
  ];

  for (const pattern of expectPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      details.whatToExpect = match[1].trim();
      break;
    }
  }

  // Only return non-empty fields
  const result = {};
  Object.keys(details).forEach(key => {
    if (details[key] && details[key].length > 0) {
      result[key] = details[key];
    }
  });

  return result;
}

/**
 * Main function to extract event details from uploaded file
 */
export async function extractEventDetails(file) {
  console.log('Starting extraction for file:', file.name, file.type);
  
  try {
    if (file.type.startsWith('image/')) {
      // Use OCR.space for images (HuggingFace has CORS restrictions from browser)
      console.log('Using OCR.space for text extraction...');
      const ocrText = await extractTextWithOCRSpace(file);
      
      if (ocrText && ocrText.trim().length > 0) {
        console.log('OCR.space succeeded, parsing text...');
        const eventDetails = parseEventDetails(ocrText);
        console.log('Parsed details:', eventDetails);
        return eventDetails;
      }
      
      console.log('No text extracted from image');
      return {};
      
    } else if (file.type === 'application/pdf') {
      const extractedText = await extractTextFromPDF(file);
      return parseEventDetails(extractedText);
    } else if (file.type.startsWith('text/') || file.type.includes('document')) {
      const extractedText = await extractTextFromDocument(file);
      return parseEventDetails(extractedText);
    } else {
      // Unknown file type, try OCR
      const ocrText = await extractTextWithOCRSpace(file);
      if (ocrText) {
        return parseEventDetails(ocrText);
      }
      return {};
    }
  } catch (error) {
    console.error('Error extracting event details:', error);
    console.error('Error stack:', error.stack);
    return {};
  }
}

