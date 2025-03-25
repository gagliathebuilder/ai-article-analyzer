const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const OpenAI = require('openai');
const { google } = require('googleapis');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize YouTube API
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// Verify OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Helper function to extract video ID from various video platforms
function extractVideoId(url) {
  let videoId = null;
  
  // YouTube
  if (url.includes('youtube.com/watch?v=')) {
    videoId = new URL(url).searchParams.get('v');
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0];
  }
  // Vimeo
  else if (url.includes('vimeo.com/')) {
    videoId = url.split('vimeo.com/')[1].split('?')[0];
  }
  // Dailymotion
  else if (url.includes('dailymotion.com/video/')) {
    videoId = url.split('video/')[1].split('?')[0];
  }

  return videoId;
}

// Video metadata endpoint
app.post('/video-metadata', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid video URL' });
    }

    let metadata = {};

    if (url.includes('youtube')) {
      const response = await youtube.videos.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        id: [videoId]
      });

      const video = response.data.items[0];
      metadata = {
        title: video.snippet.title,
        description: video.snippet.description,
        channel: video.snippet.channelTitle,
        duration: video.contentDetails.duration,
        views: video.statistics.viewCount,
        tags: video.snippet.tags || [],
        publishedAt: video.snippet.publishedAt
      };
    } else if (url.includes('vimeo')) {
      const response = await axios.get(`https://api.vimeo.com/videos/${videoId}`, {
        headers: { 'Authorization': `Bearer ${process.env.VIMEO_ACCESS_TOKEN}` }
      });
      const video = response.data;
      metadata = {
        title: video.name,
        description: video.description,
        channel: video.user.name,
        duration: video.duration,
        views: video.stats.plays,
        tags: video.tags.map(tag => tag.name)
      };
    }
    // Add support for other platforms as needed

    res.json(metadata);
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    res.status(500).json({ error: 'Failed to fetch video metadata' });
  }
});

async function analyzeArticle(text, contentType, videoMetadata) {
  try {
    let systemPrompt = '';
    
    if (contentType === 'video') {
      systemPrompt = `You are an AI assistant that analyzes video content and provides:
1. A summary in 3 key points based on the video metadata
2. A draft email to share the video, incorporating key highlights and why it's worth watching
3. A social media post that drives engagement for the video content

Consider the video's title, description, duration, and channel when crafting the content.
Please format your response in JSON with keys: summary (array), emailDraft (string), and socialPost (string).`;
    } else {
      systemPrompt = `You are an AI assistant that analyzes articles and provides:
1. A summary in 3 key points
2. A draft email to share the article
3. A social media post about the article

Please format your response in JSON with keys: summary (array), emailDraft (string), and socialPost (string).`;
    }

    const messages = [
      { role: "system", content: systemPrompt }
    ];

    if (contentType === 'video' && videoMetadata) {
      messages.push({
        role: "user",
        content: `Please analyze this video content:
Title: ${videoMetadata.title}
Channel: ${videoMetadata.channel}
Duration: ${videoMetadata.duration}
Description: ${videoMetadata.description}
${videoMetadata.tags ? `Tags: ${videoMetadata.tags.join(', ')}` : ''}
Views: ${videoMetadata.views || 'N/A'}`
      });
    } else {
      messages.push({
        role: "user",
        content: `Please analyze this article: ${text}`
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.7,
    });

    const aiResponse = JSON.parse(response.choices[0].message.content);
    return {
      summary: aiResponse.summary || [],
      emailDraft: aiResponse.emailDraft || '',
      socialPost: aiResponse.socialPost || ''
    };
  } catch (error) {
    console.error('Error in AI analysis:', error);
    throw error;
  }
}

app.post('/analyze', async (req, res) => {
  const { url, contentType, videoMetadata } = req.body;
  
  if (!url || url.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Please provide a URL or text content to analyze'
    });
  }

  try {
    const analysisResult = await analyzeArticle(url.trim(), contentType, videoMetadata);
    res.json(analysisResult);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to analyze content',
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
  console.log('YouTube API Key status:', process.env.YOUTUBE_API_KEY ? 'Configured' : 'Missing');
  console.log('Vimeo Access Token status:', process.env.VIMEO_ACCESS_TOKEN ? 'Configured' : 'Missing');
}); 