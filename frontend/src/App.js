import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const Container = styled.div`
  font-family: Arial, sans-serif;
  padding: 2rem;
  max-width: 800px;
  margin: auto;
`;

const Header = styled.h1`
  text-align: center;
  margin-bottom: 2rem;
`;

const InputField = styled.input`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Button = styled.button`
  background: #0073e6;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 1rem;
  &:hover {
    background: #005bb5;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const NewButton = styled(Button)`
  background: #28a745;
  &:hover {
    background: #218838;
  }
`;

const SummaryList = styled.ul`
  list-style-type: disc;
  margin-top: 1rem;
  padding-left: 1.5rem;
`;

const TabContainer = styled.div`
  margin-bottom: 1rem;
`;

const Tab = styled.button`
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border: none;
  background: ${props => props.active ? '#0073e6' : '#f0f0f0'};
  color: ${props => props.active ? '#fff' : '#333'};
  border-radius: 4px;
  margin-right: 0.5rem;
  cursor: pointer;
  &:hover {
    background: ${props => props.active ? '#0073e6' : '#e0e0e0'};
  }
`;

const VideoPreview = styled.div`
  margin-top: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 4px;
  background: #f9f9f9;
`;

const VideoMetadata = styled.div`
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
`;

const PodcastPreview = styled(VideoPreview)``;

const PodcastMetadata = styled(VideoMetadata)``;

function App() {
  const [url, setUrl] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState('article'); // 'article', 'video', or 'podcast'
  const [mediaMetadata, setMediaMetadata] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      // First, if it's a video or podcast, fetch metadata
      let metadata = null;
      if ((contentType === 'video' || contentType === 'podcast') && url) {
        try {
          const metadataResponse = await axios.post('http://localhost:5001/media-metadata', { 
            url,
            type: contentType 
          });
          metadata = metadataResponse.data;
          setMediaMetadata(metadata);
        } catch (error) {
          console.error('Error fetching metadata:', error);
          alert(`Unable to fetch ${contentType} metadata. Please check the URL.`);
          setLoading(false);
          return;
        }
      }

      // Then proceed with the analysis
      const response = await axios.post('http://localhost:5001/analyze', { 
        url,
        contentType,
        mediaMetadata: (contentType === 'video' || contentType === 'podcast') ? metadata : undefined
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error analyzing content:', error);
      alert('There was an error processing the content.');
    }
    setLoading(false);
  };

  const handleNew = () => {
    setUrl('');
    setResults(null);
    setLoading(false);
    setMediaMetadata(null);
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getUrlType = (url) => {
    if (!isValidUrl(url)) return null;
    
    const videoPatterns = [
      /youtube\.com\/watch\?v=/, 
      /youtu\.be\//, 
      /vimeo\.com\//, 
      /dailymotion\.com\/video\//
    ];
    
    const podcastPatterns = [
      /open\.spotify\.com\/episode\//, 
      /podcasts\.apple\.com.*\/podcast\//
    ];
    
    if (videoPatterns.some(pattern => pattern.test(url))) return 'video';
    if (podcastPatterns.some(pattern => pattern.test(url))) return 'podcast';
    return 'article';
  };

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    if (newUrl) {
      const detectedType = getUrlType(newUrl);
      if (detectedType) {
        setContentType(detectedType);
      }
    }
  };

  return (
    <Container>
      <Header>AI Content Analyzer</Header>
      
      <TabContainer>
        <Tab 
          active={contentType === 'article'} 
          onClick={() => setContentType('article')}
        >
          Article
        </Tab>
        <Tab 
          active={contentType === 'video'} 
          onClick={() => setContentType('video')}
        >
          Video
        </Tab>
        <Tab 
          active={contentType === 'podcast'} 
          onClick={() => setContentType('podcast')}
        >
          Podcast
        </Tab>
      </TabContainer>

      <InputField 
        type="text" 
        placeholder={
          contentType === 'video' ? "Enter video URL (YouTube, Vimeo, etc.)..." :
          contentType === 'podcast' ? "Enter podcast URL (Spotify, Apple Podcasts)..." :
          "Enter article URL or paste text here..."
        }
        value={url}
        onChange={handleUrlChange}
      />

      {(contentType === 'video' || contentType === 'podcast') && mediaMetadata && (
        <VideoPreview>
          <h4>{mediaMetadata.title}</h4>
          <VideoMetadata>
            <div>Duration: {mediaMetadata.duration}</div>
            <div>{contentType === 'podcast' ? 'Show' : 'Channel'}: {mediaMetadata.channel}</div>
            {mediaMetadata.description && (
              <div>Description: {mediaMetadata.description.substring(0, 150)}...</div>
            )}
            {contentType === 'podcast' && mediaMetadata.episodeNumber && (
              <div>Episode: {mediaMetadata.episodeNumber}</div>
            )}
          </VideoMetadata>
        </VideoPreview>
      )}

      <ButtonContainer>
        <Button onClick={handleAnalyze}>
          {loading ? 'Analyzing...' : 'Analyze Content'}
        </Button>
        {results && (
          <NewButton onClick={handleNew}>
            New Analysis
          </NewButton>
        )}
      </ButtonContainer>

      {results && (
        <div>
          <h2>Summary</h2>
          <SummaryList>
            {results.summary.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </SummaryList>
          
          <h3>Email Draft</h3>
          <textarea 
            style={{ width: '100%', height: '150px' }} 
            value={results.emailDraft} 
            readOnly 
          />
          
          <h3>Social Media Post</h3>
          <textarea 
            style={{ width: '100%', height: '100px' }} 
            value={results.socialPost} 
            readOnly 
          />
        </div>
      )}
    </Container>
  );
}

export default App; 