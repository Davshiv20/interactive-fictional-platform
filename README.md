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
- Tesseract.js (OCR for images)
- pdf.js (PDF text extraction)
- react-dropzone (file upload)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

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

