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

function App() {
  const [url, setUrl] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

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