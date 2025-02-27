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

function App() {
  const [url, setUrl] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState('article'); // 'article' or 'video'
  const [videoMetadata, setVideoMetadata] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      // First, if it's a video, fetch metadata
      let metadata = null;
      if (contentType === 'video' && url) {
        try {
          const metadataResponse = await axios.post('http://localhost:5001/video-metadata', { url });
          metadata = metadataResponse.data;
          setVideoMetadata(metadata);
        } catch (error) {
          console.error('Error fetching video metadata:', error);
          alert('Unable to fetch video metadata. Please check the URL.');
          setLoading(false);
          return;
        }
      }

      // Then proceed with the analysis
      const response = await axios.post('http://localhost:5001/analyze', { 
        url,
        contentType,
        videoMetadata: contentType === 'video' ? metadata : undefined
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
    setVideoMetadata(null);
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
    return videoPatterns.some(pattern => pattern.test(url)) ? 'video' : 'article';
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
      </TabContainer>

      <InputField 
        type="text" 
        placeholder={contentType === 'video' ? 
          "Enter video URL (YouTube, Vimeo, etc.)..." : 
          "Enter article URL or paste text here..."}
        value={url}
        onChange={handleUrlChange}
      />

      {contentType === 'video' && videoMetadata && (
        <VideoPreview>
          <h4>{videoMetadata.title}</h4>
          <VideoMetadata>
            <div>Duration: {videoMetadata.duration}</div>
            <div>Channel: {videoMetadata.channel}</div>
            {videoMetadata.description && (
              <div>Description: {videoMetadata.description.substring(0, 150)}...</div>
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