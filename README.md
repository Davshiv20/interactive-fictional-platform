# Event Creator - Trust-First Automation

A clean, modern MVP for event creation with trust-first automation. The system only auto-fills event details it's confident about, leaving everything else for manual entry.

## Features

- **Upload Screen**: Drag & drop or click to upload event posters, PDFs, or documents
- **OCR Processing**: Extracts text from images (Tesseract.js) and PDFs (pdf.js)
- **Smart Parsing**: Conservative pattern matching - only extracts high-confidence matches
- **Event Details Form**: Clear distinction between auto-filled and manual fields
- **Review & Publish**: Final review screen before going live

## Design Philosophy

> "We only automate what we're confident about. Everything else stays with the organizer."

- **Accuracy over automation**: Only auto-fill when confident
- **Transparency over magic**: Clear labels showing what was detected
- **Empty is better than wrong**: Never guess or assume
- **User always in control**: All fields are editable

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- **HuggingFace Idefics3-8B-Llama3** (Free vision-language model for event extraction)
- pdf.js (PDF text extraction)
- react-dropzone (file upload)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. (Optional) Get a HuggingFace token for higher rate limits:
   - The app works without a token, but may hit rate limits
   - Get a free token from: https://huggingface.co/settings/tokens
   - Create a `.env` file:
   ```bash
   echo "VITE_HUGGINGFACE_API_TOKEN=your_token_here" > .env
   ```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## How It Works

1. **OCR.space API** (Free OCR Service)
   - Extracts text from event posters and flyers
   - Free tier: 25,000 requests/month
   - Already includes API key
   - More accurate than Tesseract.js for complex layouts

2. **Generic Pattern Matching**
   - Parses extracted text using flexible regex patterns
   - NO hardcoded values (works for any city, venue, or event type worldwide)
   - Extracts:
     - Event names (before "BY [ARTIST]" pattern, or prominent titles)
     - Dates (multiple formats: "21st December 2025", "12/21/2025", etc.)
     - Times (12/24 hour format)
     - Venue names (keywords: center, hall, stadium, etc.)
     - City names (keyword-based, no hardcoding)
     - Descriptions and expectations

## Note on HuggingFace/AI Models

HuggingFace Inference API (like Idefics3) requires a backend server due to CORS restrictions. Direct browser calls are blocked. To use AI vision models, you would need to:
- Set up a backend proxy server (Node.js, Python, etc.)
- Or use a service like Replicate.com that supports CORS
- For this MVP, we use OCR.space which works directly from the browser

## How It Works

1. **Upload**: User uploads an event poster, PDF, or document
2. **Processing**: System extracts text using OCR (images) or PDF parsing
3. **Parsing**: Conservative pattern matching identifies event details with high confidence
4. **Form**: Auto-filled fields are highlighted, empty fields remain for manual entry
5. **Review**: Final review before publishing

## Field Detection

The system looks for:
- Event Name: Title patterns, first line detection
- Date: Common date formats (MM/DD/YYYY, month names, etc.)
- Time: Time patterns (12:00 PM, 12:00, etc.)
- Venue: Venue keywords and location patterns
- City: City name patterns with state abbreviations
- Description: Description section keywords
- What to Expect: Expectation/highlights keywords

Only fields with high-confidence matches are auto-filled.

