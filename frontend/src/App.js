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

const InputField = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 100px;
  resize: vertical;
`;

const Button = styled.button`
  background: #0073e6;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background: #005bb5;
  }
  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  margin: 1rem 0;
  padding: 0.5rem;
  border: 1px solid #dc3545;
  border-radius: 4px;
  background-color: #fff8f8;
`;

const ResultSection = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f8f9fa;
`;

const SummaryList = styled.ul`
  list-style-type: disc;
  margin-top: 1rem;
  padding-left: 1.5rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  margin: 0.5rem 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: Arial, sans-serif;
  resize: vertical;
`;

function App() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!input.trim()) {
      setError('Please enter some text or a URL to analyze');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5001/analyze', { url: input });
      setResults(response.data);
    } catch (error) {
      console.error('Error analyzing content:', error);
      setError(
        error.response?.data?.message || 
        'There was an error processing your request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>AI Article Analyzer</Header>
      <InputField 
        placeholder="Enter article URL or paste text here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <Button 
        onClick={handleAnalyze} 
        disabled={loading || !input.trim()}
      >
        {loading ? 'Analyzing...' : 'Analyze Content'}
      </Button>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {results && (
        <ResultSection>
          <h2>Summary</h2>
          <SummaryList>
            {results.summary.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </SummaryList>
          
          <h3>Email Draft</h3>
          <TextArea 
            value={results.emailDraft} 
            readOnly 
            rows={8}
          />
          
          <h3>Social Media Post</h3>
          <TextArea 
            value={results.socialPost} 
            readOnly 
            rows={4}
          />
        </ResultSection>
      )}
    </Container>
  );
}

export default App; 