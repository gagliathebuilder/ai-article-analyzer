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
  color: #2c3e50;
  font-size: 2.5rem;
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
  transition: all 0.2s ease;
  &:hover {
    background: #005bb5;
    transform: translateY(-1px);
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

const ResultsContainer = styled.div`
  opacity: 0;
  transform: translateY(20px);
  animation: fadeIn 0.5s forwards;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const SectionTitle = styled.h2`
  color: #2c3e50;
  margin: 0 0 1rem;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SummaryList = styled.ul`
  list-style-type: disc;
  margin: 0 0 2rem;
  padding-left: 1.5rem;
  line-height: 1.6;
  color: #444;
`;

const TextAreaContainer = styled.div`
  margin-bottom: 2rem;
`;

const ResultTextArea = styled.textarea`
  width: 100%;
  padding: 1rem;
  margin: 0.5rem 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: Arial, sans-serif;
  line-height: 1.5;
  background: #fff;
  resize: vertical;
`;

const CopyButton = styled.button`
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #5a6268;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const CopySuccess = styled.span`
  color: #28a745;
  font-size: 0.875rem;
  margin-left: 1rem;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.2s ease;
`;

function App() {
  const [url, setUrl] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState({ email: false, social: false });

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/analyze', { url });
      setResults(response.data);
    } catch (error) {
      console.error('Error analyzing article:', error);
      alert('There was an error processing the article.');
    }
    setLoading(false);
  };

  const handleNew = () => {
    setUrl('');
    setResults(null);
    setLoading(false);
    setCopyStatus({ email: false, social: false });
  };

  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(prev => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <Container>
      <Header>AI Article Analyzer</Header>
      <InputField 
        type="text" 
        placeholder="Enter article URL or paste text here..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <ButtonContainer>
        <Button onClick={handleAnalyze}>
          {loading ? 'Analyzing...' : 'Analyze Article'}
        </Button>
        {results && (
          <NewButton onClick={handleNew}>
            New Analysis
          </NewButton>
        )}
      </ButtonContainer>
      {results && (
        <ResultsContainer>
          <SectionTitle>Key Points Summary</SectionTitle>
          <SummaryList>
            {results.summary.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </SummaryList>

          <TextAreaContainer>
            <SectionTitle>
              Email Draft
              <div>
                <CopyButton onClick={() => handleCopy(results.emailDraft, 'email')}>
                  Copy Email
                </CopyButton>
                <CopySuccess visible={copyStatus.email}>Copied!</CopySuccess>
              </div>
            </SectionTitle>
            <ResultTextArea 
              value={results.emailDraft} 
              readOnly 
              rows={8}
            />
          </TextAreaContainer>

          <TextAreaContainer>
            <SectionTitle>
              Social Media Post
              <div>
                <CopyButton onClick={() => handleCopy(results.socialPost, 'social')}>
                  Copy Post
                </CopyButton>
                <CopySuccess visible={copyStatus.social}>Copied!</CopySuccess>
              </div>
            </SectionTitle>
            <ResultTextArea 
              value={results.socialPost} 
              readOnly 
              rows={4}
            />
          </TextAreaContainer>
        </ResultsContainer>
      )}
    </Container>
  );
}

export default App; 