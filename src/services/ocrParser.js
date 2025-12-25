import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - using unpkg CDN for reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

// API Keys (set in environment variables or leave empty for free tier)
const OCR_SPACE_API_KEY = import.meta.env.VITE_OCR_SPACE_API_KEY || 'K87899142388957'; // Free API key
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

/**
 * Extract text from image using OCR.space API (more accurate than Tesseract)
 */
async function extractTextFromImageOCRSpace(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Use OCR Engine 2 (better for complex layouts)

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': OCR_SPACE_API_KEY,
      },
      body: formData,
    });

    const result = await response.json();

    if (result.ParsedResults && result.ParsedResults.length > 0) {
      const text = result.ParsedResults[0].ParsedText;
      console.log('Extracted OCR text (OCR.space):', text.substring(0, 500));
      return text;
    }

    return '';
  } catch (error) {
    console.error('OCR.space Error:', error);
    return '';
  }
}

/**
 * Extract event details using OpenAI Vision API (most accurate, understands context)
 * Requires VITE_OPENAI_API_KEY environment variable
 */
async function extractEventDetailsWithOpenAI(file) {
  if (!OPENAI_API_KEY) {
    return null; // Skip if no API key
  }

  try {
    // Convert file to base64
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract event details from this poster/flyer. Return ONLY a JSON object with these fields: eventName, date, time, venue, city, description, whatToExpect. 
                
Rules:
- Only include fields you are CONFIDENT about
- Leave out fields if you're uncertain
- For eventName: extract the main event title (not taglines or artist names)
- For date: extract the exact date (e.g., "21st December 2025")
- For venue: extract the venue name
- For city: extract the city name
- Return valid JSON only, no explanation`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    const result = await response.json();
    
    if (result.choices && result.choices[0]?.message?.content) {
      const content = result.choices[0].message.content;
      // Extract JSON from response (might have markdown formatting)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const eventDetails = JSON.parse(jsonMatch[0]);
        console.log('Extracted details (OpenAI):', eventDetails);
        return eventDetails;
      }
    }

    return null;
  } catch (error) {
    console.error('OpenAI Vision Error:', error);
    return null;
  }
}

/**
 * Extract text from image - uses best available method
 */
async function extractTextFromImage(file) {
  // Try OpenAI Vision first (most accurate, if API key available)
  if (OPENAI_API_KEY) {
    const aiResult = await extractEventDetailsWithOpenAI(file);
    if (aiResult) {
      // Convert to text format for parseEventDetails
      return JSON.stringify(aiResult);
    }
  }

  // Fallback to OCR.space
  const text = await extractTextFromImageOCRSpace(file);
  return text;
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
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Extract event name - improved patterns
  // Look for text before "BY [ARTIST]" pattern (common in event posters)
  const byArtistPattern = /\bby\s+([^\n]{3,40})/i;
  const byMatch = text.match(byArtistPattern);
  
  if (byMatch) {
    // Find text before "BY [ARTIST]" - likely the event name
    const beforeBy = text.substring(0, byMatch.index).trim();
    const beforeByLines = beforeBy.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Look for the largest/most prominent line before "BY"
    let bestCandidate = '';
    for (const line of beforeByLines.reverse()) {
      // Skip very short lines and navigation elements
      if (line.length >= 5 && line.length <= 50 && 
          !line.match(/^[=\-_]+/) && // Skip separator lines
          !line.match(/menu|nav|header/i)) {
        bestCandidate = line;
        break;
      }
    }
    
    if (bestCandidate) {
      details.eventName = bestCandidate.trim();
    }
  }
  
  // If not found, look for prominent title patterns
  if (!details.eventName) {
    // Look for lines that look like titles (avoid navigation and UI elements)
    for (const line of lines) {
      if (line.length >= 5 && line.length <= 50) {
        // Skip UI elements, navigation, and dates
        if (line.match(/^[=\-_]+/) || // Separator lines
            line.match(/menu|nav|header|footer/i) || // Navigation
            line.match(/^\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i) || // Dates
            line.match(/^(january|february|march|april|may|june|july|august|september|october|november|december)/i)) {
          continue;
        }
        
        // Check if it has reasonable word count
        const wordCount = line.split(/\s+/).length;
        if (wordCount >= 1 && wordCount <= 6) {
          details.eventName = line.trim();
          break;
        }
      }
    }
  }

  // Extract date - improved patterns including ordinal numbers (21ST, 22ND, etc.)
  const datePatterns = [
    // Ordinal dates: "21ST DECEMBER 2025", "21ST DEC 2025"
    /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4})\b/i,
    // Standard formats: "DECEMBER 21, 2025", "21 DECEMBER 2025"
    /\b((?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4})\b/i,
    /\b(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec),?\s+\d{4})\b/i,
    // Numeric formats: "12/21/2025", "21-12-2025"
    /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      details.date = match[1].trim();
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

  // Extract venue - improved patterns
  const venuePatterns = [
    // Look for "GIFT CITY", "CONVENTION CENTER", etc. (all caps venue names)
    /\b([A-Z]{2,}(?:\s+[A-Z]{2,})*\s+(?:CITY|CENTER|CENTRE|HALL|THEATER|THEATRE|STADIUM|ARENA|AUDITORIUM|GROUND|PARK|CLUB|BAR|RESTAURANT))\b/,
    // Look for venue keywords followed by name
    /(?:venue|location|place|at|in)[\s:]+([A-Z][A-Za-z\s]{2,30}?)(?:\s|$|,)/i,
    // Look for common venue patterns
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:theater|theatre|hall|center|centre|venue|club|bar|restaurant|park|stadium|arena|auditorium|ground))\b/i,
  ];

  for (const pattern of venuePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const venue = match[1].trim();
      // Filter out common false positives
      if (!venue.match(/^(BY|THE|AND|OR|IN|AT|ON)$/i) && venue.length > 2) {
        details.venue = venue;
        break;
      }
    }
  }

  // Extract city - flexible pattern (no hardcoding)
  const cityPatterns = [
    // Look for prominent all-caps words at the top (likely city name)
    /^([A-Z]{3,}(?:\s+[A-Z]{3,})?)\s*$/m,
    // Look for "City:" or similar keywords
    /(?:city|location|in|at)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  ];

  for (const pattern of cityPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const city = match[1].trim();
      // Filter out common false positives
      if (!city.match(/^(BY|THE|AND|OR|IN|AT|ON|YOUR|PLAYLIST|COMING|ALIVE|MENU)$/i) && 
          city.length > 2 && 
          city.length < 30) {
        details.city = city;
        break;
      }
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

  // Post-process event name to fix common OCR errors
  if (details.eventName) {
    // Fix common OCR mistakes
    details.eventName = details.eventName
      .replace(/\bIc\b/gi, 'Re') // Fix "Ic" -> "Re"
      .replace(/\b0\b/g, 'O') // Fix "0" -> "O" in words
      .replace(/\b1\b/g, 'I') // Fix "1" -> "I" in words
      .trim();
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
      // For images, try AI extraction first
      if (OPENAI_API_KEY) {
        const aiResult = await extractEventDetailsWithOpenAI(file);
        if (aiResult && Object.keys(aiResult).length > 0) {
          return aiResult; // Return directly if AI extraction successful
        }
      }
      
      // Fallback to OCR + parsing
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

