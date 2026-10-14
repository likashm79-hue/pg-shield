# PG Shield — PG & Hostel Agreement Red-Flag Spotter

A beginner-friendly React + Vite web app for checking PG, hostel, and rental agreement text. It supports PDF text extraction in the browser, pasted text, AI-generated clause explanations, risk labels, questions for the owner, and English/Kannada/Hindi output.

## Requirements

- Node.js 20 or newer
- A Gemini API key
- A Vercel account for the included `/api/analyze` serverless endpoint

## Run locally

1. Extract this project ZIP and open the folder in VS Code.
2. Open a terminal in the project folder.
3. Install packages:

   ```bash
   npm install
   ```

4. Create a local `.env` file in the project root containing:

   ```env
   GEMINI_API_KEY=your_real_gemini_api_key
   ```

   Do not commit `.env` or share your API key. `.env` is in `.gitignore`.

5. Run the frontend:

   ```bash
   npm run dev
   ```

**Note:** Vite by itself does not run the Vercel `/api` function. To test the full AI workflow locally, install the Vercel CLI and run `vercel dev`, or deploy to Vercel first. Keep `GEMINI_API_KEY` in Vercel's environment variables.

## Deploy to Vercel

1. Push the project to a GitHub repository.
2. In Vercel, import that GitHub repository.
3. Keep the default Vite build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Open **Project Settings → Environment Variables**.
5. Add `GEMINI_API_KEY` with your Gemini API key.
6. Redeploy after adding the variable.

The `api/analyze.js` file becomes a Vercel serverless function. The API key stays server-side and is not bundled into the frontend.

## Important deployment note

This project is configured for **Vercel** because it includes a Vercel serverless API route. For Netlify, the API handler must be moved/adapted to a Netlify Function and the frontend request route adjusted. Deploying unchanged to Netlify will display the frontend but AI analysis will not work.

## Features

- PDF upload and text extraction with `pdfjs-dist`
- Paste agreement text manually
- Gemini-based clause analysis
- High, Medium, and Low risk labels
- Plain-language explanations and owner questions
- English, Kannada, and Hindi explanation selection
- Responsive layout
- No database, login, or document storage

## Limitations

- Scanned/image-only PDFs are not OCR'd. Paste extracted text or OCR the scan before using it.
- PDF text is extracted in the browser, then sent to the serverless API only when the user starts analysis.
- Text sent for analysis is limited to 28,000 characters.
- AI may miss clauses, misunderstand context, or produce inaccurate classifications. This is awareness guidance, not legal advice.
- Check current Gemini API model availability and quotas in your Google AI Studio account if the API returns a model or quota error.
