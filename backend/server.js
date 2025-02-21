const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Verify OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

async function analyzeArticle(text) {
  try {
    const systemPrompt = `You are an AI assistant that analyzes articles and provides:
1. A summary in 3 key points
2. A draft email to share the article (maintain proper email formatting with line breaks and spacing)
3. A social media post about the article
4. An engaging subject line for the email that maximizes open rates while maintaining context

For the subject line: provide ONLY the text without any prefix like "Subject:" or quotes. Keep it under 60 characters.
For the email draft: include proper formatting with paragraphs and line breaks.

Please format your response in JSON with keys: summary (array), emailDraft (string), socialPost (string), and subjectLine (string).`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please analyze this article: ${text}` }
      ],
      temperature: 0.7,
    });

    const aiResponse = JSON.parse(response.choices[0].message.content);
    
    // Clean up only the subject line, preserve email formatting
    return {
      summary: aiResponse.summary || [],
      emailDraft: aiResponse.emailDraft?.trim() || '',  // Just trim whitespace for email
      socialPost: aiResponse.socialPost || '',
      subjectLine: (aiResponse.subjectLine || '')
        .replace(/^["']|["']$/g, '')
        .replace(/^(?:subject:|Subject:)\s*/i, '')
        .trim()
    };
  } catch (error) {
    console.error('Error in AI analysis:', error);
    throw error;
  }
}

app.post('/analyze', async (req, res) => {
  const { url } = req.body;
  
  if (!url || url.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Please provide a URL or text content to analyze'
    });
  }

  try {
    const analysisResult = await analyzeArticle(url.trim());
    res.json(analysisResult);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to analyze article',
      message: error.message
    });
  }
});

// Add new endpoint for subject line generation
app.post('/generate-subject', async (req, res) => {
  const { emailContent, originalUrl } = req.body;

  if (!emailContent) {
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Please provide email content'
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert email marketer. Generate ONLY a compelling subject line text (no "Subject:" prefix or quotes). The subject line should:
- Maximize open rates while maintaining context
- Be attention-grabbing and specific
- Be honest (no clickbait)
- Be under 60 characters for optimal display
- NOT include any prefix like "Subject:" or quotes`
        },
        {
          role: "user",
          content: `Generate a high-converting subject line for this email content: ${emailContent}${originalUrl ? `\n\nOriginal article URL: ${originalUrl}` : ''}`
        }
      ],
      temperature: 0.7,
    });

    // Clean up the response to remove any "Subject:" prefix and quotes
    let subjectLine = response.choices[0].message.content
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^(?:subject:|Subject:)\s*/i, '') // Remove any "Subject:" prefix case-insensitive
      .trim();
    
    res.json({ subjectLine });
  } catch (error) {
    console.error('Error generating subject line:', error);
    res.status(500).json({
      error: 'Failed to generate subject line',
      message: error.message
    });
  }
});

// Start server with error handling
const server = app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('OpenAI API Key status:', process.env.OPENAI_API_KEY ? 'Configured' : 'Missing');
}); 