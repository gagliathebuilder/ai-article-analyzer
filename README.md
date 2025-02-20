# AI Article Analyzer

A tool that uses AI to analyze articles and generate summaries, email drafts, and social media posts.

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. Set up environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Get your API key from [OpenAI](https://platform.openai.com/api-keys)
   - Update `backend/.env` with your API key

4. Start the development servers:
   ```bash
   npm start
   ```

This will start both the frontend (http://localhost:3000) and backend (http://localhost:5001) servers.

## Environment Variables

The following environment variables are required:

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `PORT`: Backend server port (optional, defaults to 5001)

## Security Notes

- Never commit your `.env` file to version control
- Keep your API keys secure and rotate them regularly
- If you accidentally expose your API key, revoke it immediately and generate a new one

## Features

- Article analysis using AI
- Summary generation
- Email draft creation
- Social media post suggestions
- Support for both URL and direct text input

## Development

- Frontend: React with styled-components
- Backend: Node.js with Express
- AI: OpenAI GPT-3.5 Turbo 