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
- **OCR.space API** (Free OCR for images - much better than Tesseract)
- **OpenAI GPT-4 Vision** (Optional - for best accuracy)
- pdf.js (PDF text extraction)
- react-dropzone (file upload)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. (Optional) Set up API keys for better accuracy:
   - Create a `.env` file in the project root (see `env.example.txt`)
   - The free OCR.space API key is already included
   - For best results, add your OpenAI API key to `.env`:
   ```bash
   echo "VITE_OPENAI_API_KEY=your_key_here" > .env
   ```
   Get an OpenAI API key from: https://platform.openai.com/api-keys

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## OCR Options

The system tries multiple OCR methods in order of accuracy:

1. **OpenAI GPT-4 Vision** (if API key provided)
   - Most accurate
   - Understands context (knows "Satrangi Re" is event name, not "menu")
   - Returns structured JSON directly
   - Costs ~$0.01-0.02 per image
   - Set `VITE_OPENAI_API_KEY` to enable

2. **OCR.space API** (default, free tier)
   - Better than Tesseract for posters
   - Free tier: 25,000 requests/month
   - No API key needed (uses shared key)
   - Get your own key for higher limits: https://ocr.space/ocrapi

3. **Pattern matching fallback**
   - Parses OCR text using flexible regex patterns
   - No hardcoded values (cities, venues, etc.)

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

