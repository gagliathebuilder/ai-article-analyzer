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
2. A draft email to share the article
3. A social media post about the article
4. An engaging subject line for the email that maximizes open rates while maintaining context

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
    return {
      summary: aiResponse.summary || [],
      emailDraft: aiResponse.emailDraft || '',
      socialPost: aiResponse.socialPost || '',
      subjectLine: aiResponse.subjectLine || ''
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
          content: `You are an expert email marketer. Your task is to generate a compelling subject line that will maximize open rates while maintaining the context and integrity of the email content. The subject line should be attention-grabbing, specific, and honest - no clickbait. Keep it under 60 characters for optimal display across email clients.`
        },
        {
          role: "user",
          content: `Please generate a high-converting subject line for this email content: ${emailContent}${originalUrl ? `\n\nOriginal article URL: ${originalUrl}` : ''}`
        }
      ],
      temperature: 0.7,
    });

    const subjectLine = response.choices[0].message.content.replace(/^["']|["']$/g, '');
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