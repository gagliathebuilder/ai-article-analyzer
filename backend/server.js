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

async function analyzeArticle(text, includeEmojis = true) {
  try {
    const systemPrompt = `You are an AI assistant that analyzes articles and provides:
1. A summary in 3-5 key points that accurately reflect the most important factual information in the article
2. A draft email to share the article
3. A social media post about the article
${includeEmojis ? `4. Suggest 3-5 relevant emojis for both the email and social post, considering the content's tone and subject matter.

For emoji suggestions, provide them in a separate JSON array format under emojiSuggestions with "email" and "social" arrays.` : ''}

When creating the summary:
- Focus on extracting ONLY facts and information explicitly stated in the article
- Include specific numbers, percentages, dates, and statistics exactly as reported
- Do not add any interpretations or conclusions that aren't directly in the article
- Double-check your summary against the article for factual accuracy
- Prioritize the most important and noteworthy information
- Make sure each point is specific and substantive, not general observations

Please format your response in JSON with keys: summary (array), emailDraft (string), socialPost (string)${includeEmojis ? ', emojiSuggestions (object with email and social arrays)' : ''}.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please analyze this article: ${text}` }
      ],
      temperature: 0.5,
    });

    const aiResponse = JSON.parse(response.choices[0].message.content);
    return {
      summary: aiResponse.summary || [],
      emailDraft: aiResponse.emailDraft || '',
      socialPost: aiResponse.socialPost || '',
      emojiSuggestions: includeEmojis ? (aiResponse.emojiSuggestions || { email: [], social: [] }) : undefined
    };
  } catch (error) {
    console.error('Error in AI analysis:', error);
    throw error;
  }
}

app.post('/analyze', async (req, res) => {
  const { url, includeEmojis } = req.body;
  
  if (!url || url.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Please provide a URL or text content to analyze'
    });
  }

  try {
    const analysisResult = await analyzeArticle(url.trim(), includeEmojis);
    res.json(analysisResult);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to analyze article',
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