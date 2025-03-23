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

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #ddd;
`;

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  color: #2c3e50;
  font-size: 0.9rem;
`;

const ToggleSwitch = styled.div`
  position: relative;
  width: 40px;
  height: 20px;
  background: ${props => props.checked ? '#28a745' : '#ddd'};
  border-radius: 20px;
  padding: 2px;
  transition: background 0.2s ease;
  margin-right: 8px;
  cursor: pointer;

  &:before {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s ease;
    transform: translateX(${props => props.checked ? '20px' : '0'});
  }
`;

const EmojiSuggestions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
`;

const EmojiButton = styled.button`
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;

  &:hover {
    background: #f1f1f1;
    transform: scale(1.1);
  }
`;

const ThemeContainer = styled.div`
  margin-bottom: 20px;
`;

const ThemeTitle = styled.h3`
  font-size: 1.1em;
  font-weight: 600;
  margin-bottom: 10px;
  color: #2c3e50;
`;

const SubPointsList = styled.ul`
  list-style-type: disc;
  margin-left: 20px;
  margin-bottom: 15px;
`;

function App() {
  const [url, setUrl] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState({ email: false, social: false });
  const [emojisEnabled, setEmojisEnabled] = useState(true);
  const [emojiSuggestions, setEmojiSuggestions] = useState({ email: [], social: [] });

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/analyze', { 
        url,
        includeEmojis: emojisEnabled 
      });
      setResults(response.data);
      
      // Set emoji suggestions if enabled
      if (emojisEnabled && response.data.emojiSuggestions) {
        setEmojiSuggestions(response.data.emojiSuggestions);
      } else {
        setEmojiSuggestions({ email: [], social: [] });
      }
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
    setEmojiSuggestions({ email: [], social: [] });
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

  const insertEmoji = (emoji, type) => {
    const text = results[type === 'email' ? 'emailDraft' : 'socialPost'];
    let newText;

    // Smart placement rules
    if (type === 'email') {
      // For email, place emoji after the greeting or subject
      const lines = text.split('\n');
      if (lines[0].toLowerCase().includes('subject:')) {
        // Add after subject line
        lines[0] = `${lines[0]} ${emoji}`;
        newText = lines.join('\n');
      } else {
        // Add after first greeting line
        const firstLineEnd = text.indexOf('\n');
        if (firstLineEnd !== -1) {
          newText = text.slice(0, firstLineEnd) + ` ${emoji}` + text.slice(firstLineEnd);
        } else {
          newText = `${text} ${emoji}`;
        }
      }
    } else {
      // For social post, add emoji at strategic positions
      const sentences = text.split('. ');
      if (sentences.length > 1) {
        // Add emoji after the first sentence for emphasis
        sentences[0] = `${sentences[0]} ${emoji}`;
        newText = sentences.join('. ');
      } else {
        // If it's a single sentence, add at the beginning
        newText = `${emoji} ${text}`;
      }
    }

    setResults(prev => ({
      ...prev,
      [type === 'email' ? 'emailDraft' : 'socialPost']: newText
    }));
  };

  const previewEmoji = (emoji, type) => {
    const textArea = document.querySelector(`textarea[data-type="${type}"]`);
    if (textArea) {
      // Create or update preview element
      let preview = document.querySelector(`#emoji-preview-${type}`);
      if (!preview) {
        preview = document.createElement('div');
        preview.id = `emoji-preview-${type}`;
        preview.style.position = 'absolute';
        preview.style.left = '0';
        preview.style.bottom = '-30px'; // Position below the textarea
        preview.style.background = 'rgba(44, 62, 80, 0.95)'; // Darker background for better visibility
        preview.style.color = 'white'; // White text for contrast
        preview.style.padding = '8px 12px';
        preview.style.borderRadius = '4px';
        preview.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        preview.style.fontSize = '0.9rem';
        preview.style.zIndex = '100';
        preview.style.width = 'fit-content';
        textArea.parentNode.style.position = 'relative'; // Ensure parent has relative positioning
        textArea.parentNode.appendChild(preview);
      }
      
      const previewText = type === 'email' 
        ? `Will add ${emoji} after greeting/subject`
        : `Will add ${emoji} ${type === 'social' ? 'at the start of the post' : ''}`;
      
      preview.textContent = previewText;
      preview.style.display = 'block';
    }
  };

  const hideEmojiPreview = (type) => {
    const preview = document.querySelector(`#emoji-preview-${type}`);
    if (preview) {
      preview.style.display = 'none';
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
      <ToggleContainer>
        <ToggleLabel>
          <ToggleSwitch 
            checked={emojisEnabled}
            onClick={() => setEmojisEnabled(!emojisEnabled)}
          />
          Enable Emoji Suggestions 🎯
        </ToggleLabel>
      </ToggleContainer>
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
          <SectionTitle>Thematic Analysis</SectionTitle>
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
              data-type="email"
            />
            {emojisEnabled && emojiSuggestions.email?.length > 0 && (
              <EmojiSuggestions>
                {emojiSuggestions.email.map((emoji, index) => (
                  <EmojiButton 
                    key={index}
                    onClick={() => insertEmoji(emoji, 'email')}
                    onMouseEnter={() => previewEmoji(emoji, 'email')}
                    onMouseLeave={() => hideEmojiPreview('email')}
                  >
                    {emoji}
                  </EmojiButton>
                ))}
              </EmojiSuggestions>
            )}
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
              data-type="social"
            />
            {emojisEnabled && emojiSuggestions.social?.length > 0 && (
              <EmojiSuggestions>
                {emojiSuggestions.social.map((emoji, index) => (
                  <EmojiButton 
                    key={index}
                    onClick={() => insertEmoji(emoji, 'social')}
                    onMouseEnter={() => previewEmoji(emoji, 'social')}
                    onMouseLeave={() => hideEmojiPreview('social')}
                  >
                    {emoji}
                  </EmojiButton>
                ))}
              </EmojiSuggestions>
            )}
          </TextAreaContainer>
        </ResultsContainer>
      )}
    </Container>
  );
}

export default App; 