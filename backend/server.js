const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = 3000;

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

CRITICAL REQUIREMENTS FOR SUMMARY CREATION:
- ONLY include information that is EXPLICITLY stated in the article - no exceptions
- NEVER add interpretations, predictions, or industry trends unless they are directly quoted in the article
- ALWAYS include specific numbers, percentages, and statistics exactly as they appear in the article
- Include exact quotations from key figures mentioned in the article
- AVOID generic or vague statements that could apply to any company in the industry
- If the article mentions specific time periods (months, quarters, years), include them exactly
- VERIFY each summary point against the article text before finalizing
- PRIORITIZE information from the first 3-4 paragraphs as they typically contain the most critical facts

Example of GOOD summary point: "Magnite reported a 4% year-over-year growth in Q4 2024, earning $194 million with $36 million in profit, up from $31 million a year before."
Example of BAD summary point: "Magnite's market positioning remains strong, indicating resilience in its business model." (too vague, not supported by specific facts)

Please format your response in JSON with keys: summary (array), emailDraft (string), socialPost (string)${includeEmojis ? ', emojiSuggestions (object with email and social arrays)' : ''}.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please analyze this article: ${text}` }
      ],
      temperature: 0.3,
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