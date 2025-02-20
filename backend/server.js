const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = 5001;

// Increase the limit to handle larger text inputs
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function sanitizeInput(text) {
  if (typeof text !== 'string') {
    console.log('Input type:', typeof text, 'Input value:', text);
    return '';
  }
  // Remove any potential HTML
  text = text.replace(/<[^>]*>/g, ' ');
  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  // Limit length for API constraints
  return text.substring(0, 4000);
}

async function fetchArticleContent(url) {
  try {
    const response = await axios.get(url);
    return sanitizeInput(response.data);
  } catch (error) {
    console.error('Error fetching article:', error.message);
    throw new Error('Failed to fetch article content. Please check the URL and try again.');
  }
}

async function analyzeArticle(input) {
  try {
    console.log('Analyzing input:', input.substring(0, 100) + '...');

    if (!input || typeof input !== 'string') {
      console.error('Invalid input type or empty input:', typeof input);
      throw new Error('Invalid input: Please provide text or a URL to analyze');
    }

    let content = sanitizeInput(input);
    console.log('Sanitized content length:', content.length);
    let sourceType = 'text';
    
    // If input is a URL, fetch its content
    if (isValidUrl(input)) {
      console.log('Input is a URL, attempting to fetch content');
      try {
        content = await fetchArticleContent(input);
        sourceType = 'url';
      } catch (error) {
        console.warn('Failed to fetch URL content:', error.message);
        content = sanitizeInput(input);
      }
    }

    if (content.length < 10) {
      throw new Error('Content too short: Please provide more text to analyze');
    }

    console.log('Sending content to OpenAI, length:', content.length);

    const systemPrompt = `You are an AI assistant that analyzes articles and provides:
1. A summary in 3 key points
2. A draft email to share the article
3. A social media post about the article

For the email draft:
- Include a professional subject line
- Keep it concise but informative
- Include the original article link/text for reference

For the social media post:
- Keep it under 280 characters
- Make it engaging and shareable
- Include relevant context

Please format your response in JSON with keys: summary (array), emailDraft (string), and socialPost (string).`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please analyze this article content: ${content}` }
      ],
      temperature: 0.7,
    });

    console.log('Received response from OpenAI');

    try {
      const aiResponse = JSON.parse(response.choices[0].message.content);
      console.log('Successfully parsed OpenAI response');
      return {
        summary: aiResponse.summary || [],
        emailDraft: aiResponse.emailDraft || '',
        socialPost: aiResponse.socialPost || '',
        sourceType,
        originalInput: input,
        contentLength: content.length
      };
    } catch (error) {
      console.error('Error parsing AI response:', error.message);
      console.error('Raw AI response:', response.choices[0].message.content);
      throw new Error('Error processing AI response. Please try again.');
    }
  } catch (error) {
    console.error('Error in AI analysis:', error.message);
    throw error;
  }
}

app.post('/analyze', async (req, res) => {
  console.log('Received analyze request');
  const { url } = req.body;
  
  if (!url || url.trim().length === 0) {
    console.log('Empty input received');
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Please provide a URL or text content to analyze'
    });
  }

  try {
    console.log('Processing input of length:', url.length);
    const analysisResult = await analyzeArticle(url.trim());
    console.log('Analysis completed successfully');
    res.json(analysisResult);
  } catch (error) {
    console.error('Analysis failed:', error.message);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message || 'Failed to analyze content'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 