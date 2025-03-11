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

// Initialize Spotify API credentials
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Verify OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Helper function to extract media IDs from various platforms
function extractMediaId(url, type) {
  let mediaId = null;
  
  if (type === 'video') {
    // YouTube
    if (url.includes('youtube.com/watch?v=')) {
      mediaId = new URL(url).searchParams.get('v');
    } else if (url.includes('youtu.be/')) {
      mediaId = url.split('youtu.be/')[1].split('?')[0];
    }
    // Vimeo
    else if (url.includes('vimeo.com/')) {
      mediaId = url.split('vimeo.com/')[1].split('?')[0];
    }
  } else if (type === 'podcast') {
    // Spotify
    if (url.includes('open.spotify.com/episode/')) {
      mediaId = url.split('episode/')[1].split('?')[0];
    }
    // Apple Podcasts
    else if (url.includes('podcasts.apple.com')) {
      const match = url.match(/\/id(\d+)\?i=(\d+)/);
      if (match) {
        mediaId = {
          podcastId: match[1],
          episodeId: match[2]
        };
      }
    }
  }

  return mediaId;
}

// Get Spotify access token
async function getSpotifyAccessToken() {
  try {
    console.log('Attempting to get Spotify access token...');
    console.log('Spotify credentials configured:', {
      clientId: SPOTIFY_CLIENT_ID ? 'Set' : 'Missing',
      clientSecret: SPOTIFY_CLIENT_SECRET ? 'Set' : 'Missing'
    });

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      throw new Error('Spotify credentials are not configured');
    }

    const auth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: 'grant_type=client_credentials'
    });

    console.log('Successfully obtained Spotify access token');
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Spotify access token:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// Media metadata endpoint
app.post('/media-metadata', async (req, res) => {
  const { url, type } = req.body;

  if (!url || !type) {
    return res.status(400).json({ error: 'URL and type are required' });
  }

  try {
    console.log(`Processing ${type} URL:`, url);
    const mediaId = extractMediaId(url, type);
    if (!mediaId) {
      console.log('Failed to extract media ID from URL');
      return res.status(400).json({ error: 'Invalid media URL' });
    }
    console.log('Extracted media ID:', mediaId);

    let metadata = {};

    if (type === 'video') {
      if (url.includes('youtube')) {
        const response = await youtube.videos.list({
          part: ['snippet', 'contentDetails', 'statistics'],
          id: [mediaId]
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
        const response = await axios.get(`https://api.vimeo.com/videos/${mediaId}`, {
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
    } else if (type === 'podcast') {
      if (url.includes('spotify.com')) {
        console.log('Fetching Spotify podcast metadata...');
        const accessToken = await getSpotifyAccessToken();
        console.log('Making request to Spotify API with token:', accessToken.substring(0, 5) + '...');
        try {
          const response = await axios({
            method: 'get',
            url: `https://api.spotify.com/v1/episodes/${mediaId}`,
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Successfully fetched Spotify episode data');
          const episode = response.data;
          
          // Convert duration from milliseconds to a readable format
          const durationMinutes = Math.floor(episode.duration_ms / 60000);
          const durationSeconds = Math.floor((episode.duration_ms % 60000) / 1000);
          const formattedDuration = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
          
          metadata = {
            title: episode.name,
            description: episode.description,
            channel: episode.show.name,
            duration: formattedDuration,
            publishedAt: episode.release_date,
            episodeNumber: episode.episode_number,
            showDescription: episode.show.description
          };
        } catch (spotifyError) {
          console.error('Spotify API error:', spotifyError.response?.data || spotifyError.message);
          console.error('Full error details:', JSON.stringify(spotifyError.response?.data || spotifyError, null, 2));
          throw spotifyError;
        }
      } else if (url.includes('podcasts.apple.com')) {
        // For Apple Podcasts, we'll need to use their RSS feed
        // This is a placeholder - Apple Podcasts requires parsing the RSS feed
        metadata = {
          title: "Episode title will be fetched from RSS",
          description: "Description will be fetched from RSS",
          channel: "Show name will be fetched from RSS",
          duration: "Duration will be fetched from RSS",
          episodeNumber: "Episode number will be fetched from RSS"
        };
      }
    }

    console.log('Sending metadata response:', metadata);
    res.json(metadata);
  } catch (error) {
    console.error('Error fetching media metadata:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch media metadata' });
  }
});

async function analyzeContent(text, contentType, mediaMetadata) {
  try {
    let systemPrompt = '';
    
    if (contentType === 'video') {
      systemPrompt = `You are an AI assistant that analyzes video content and provides:
1. A summary in 3 key points based on the video metadata
2. A draft email to share the video, incorporating key highlights and why it's worth watching
3. A social media post that drives engagement for the video content

Consider the video's title, description, duration, and channel when crafting the content.
Please format your response in JSON with keys: summary (array), emailDraft (string), and socialPost (string).`;
    } else if (contentType === 'podcast') {
      systemPrompt = `You are an AI assistant that analyzes podcast episodes and provides:
1. A summary in 3 key points based on the episode metadata
2. A draft email to share the episode, incorporating key highlights and why it's worth listening to
3. A social media post that drives engagement for the podcast episode

Consider the episode's title, show name, description, duration, and episode number when crafting the content.
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

    if ((contentType === 'video' || contentType === 'podcast') && mediaMetadata) {
      const content = contentType === 'podcast' ? 
        `Please analyze this podcast episode:
Title: ${mediaMetadata.title}
Show: ${mediaMetadata.channel}
Duration: ${mediaMetadata.duration}
${mediaMetadata.episodeNumber ? `Episode Number: ${mediaMetadata.episodeNumber}` : ''}
Description: ${mediaMetadata.description}
${mediaMetadata.showDescription ? `Show Description: ${mediaMetadata.showDescription}` : ''}` :
        `Please analyze this video content:
Title: ${mediaMetadata.title}
Channel: ${mediaMetadata.channel}
Duration: ${mediaMetadata.duration}
Description: ${mediaMetadata.description}
${mediaMetadata.tags ? `Tags: ${mediaMetadata.tags.join(', ')}` : ''}
Views: ${mediaMetadata.views || 'N/A'}`;

      messages.push({ role: "user", content });
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
  const { url, contentType, mediaMetadata } = req.body;
  
  if (!url || url.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Please provide a URL or text content to analyze'
    });
  }

  try {
    const analysisResult = await analyzeContent(url.trim(), contentType, mediaMetadata);
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
  console.log('Spotify API status:', (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) ? 'Configured' : 'Missing');
}); 