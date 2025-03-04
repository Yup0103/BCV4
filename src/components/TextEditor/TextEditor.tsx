import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaBold, FaItalic, FaUnderline, FaAlignLeft, FaAlignCenter, FaAlignRight, FaFont, FaPalette } from 'react-icons/fa';

interface TextEditorProps {
  initialText: string;
  position: { x: number, y: number };
  initialStyle?: TextStyle;
  onSave: (text: string, style: TextStyle) => void;
  onCancel: () => void;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  color: string;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right';
}

const EditorContainer = styled.div`
  position: absolute;
  z-index: 1000;
  background-color: #1e1e1e;
  border: 1px solid #444;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  min-width: 300px;
`;

const EditorToolbar = styled.div`
  display: flex;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #444;
  flex-wrap: wrap;
`;

const ToolButton = styled.button<{ active?: boolean }>`
  background-color: ${props => props.active ? 'var(--primary-color)' : '#3a3a3a'};
  color: white;
  border: none;
  border-radius: 4px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.active ? 'var(--primary-color)' : '#4a4a4a'};
  }
`;

const ToolSeparator = styled.div`
  width: 1px;
  height: 36px;
  background-color: #444;
  margin: 0 4px;
`;

const SelectControl = styled.select`
  background-color: #3a3a3a;
  color: white;
  border: none;
  border-radius: 4px;
  height: 36px;
  padding: 0 8px;
  cursor: pointer;
  font-size: 14px;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-color);
  }
`;

const FontSizeInput = styled.input`
  background-color: #3a3a3a;
  color: white;
  border: none;
  border-radius: 4px;
  height: 36px;
  width: 50px;
  padding: 0 8px;
  text-align: center;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-color);
  }
  
  /* Hide spinner */
  &::-webkit-inner-spin-button, 
  &::-webkit-outer-spin-button { 
    -webkit-appearance: none;
    margin: 0;
  }
`;

const ColorPicker = styled.input`
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  
  &::-webkit-color-swatch {
    border: none;
    border-radius: 4px;
  }
`;

const TextAreaContainer = styled.div`
  padding: 8px;
`;

const StyledTextArea = styled.textarea<{ style: TextStyle }>`
  width: 100%;
  min-height: 100px;
  background-color: #2a2a2a;
  color: ${props => props.style.color};
  font-family: ${props => props.style.fontFamily};
  font-size: ${props => props.style.fontSize}px;
  font-weight: ${props => props.style.fontWeight};
  font-style: ${props => props.style.fontStyle};
  text-decoration: ${props => props.style.textDecoration};
  text-align: ${props => props.style.textAlign};
  background-color: ${props => props.style.backgroundColor};
  padding: 8px;
  border: none;
  border-radius: 4px;
  resize: both;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-color);
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px;
  border-top: 1px solid #444;
`;

const ActionButton = styled.button<{ primary?: boolean }>`
  background-color: ${props => props.primary ? 'var(--primary-color)' : '#3a3a3a'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.primary ? 'var(--primary-color-dark)' : '#4a4a4a'};
  }
`;

const FONT_FAMILIES = [
  'Arial',
  'Verdana',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Trebuchet MS',
  'Impact'
];

const DEFAULT_STYLE: TextStyle = {
  fontFamily: 'Arial',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#ffffff',
  backgroundColor: 'transparent',
  textAlign: 'left'
};

const TextEditor: React.FC<TextEditorProps> = ({ 
  initialText, 
  position, 
  initialStyle = DEFAULT_STYLE,
  onSave, 
  onCancel 
}) => {
  const [text, setText] = useState(initialText);
  const [style, setStyle] = useState<TextStyle>(initialStyle);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    // Focus the textarea when the editor opens
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(0, text.length);
    }
  }, [text.length]);
  
  const toggleBold = () => {
    setStyle(prev => ({
      ...prev,
      fontWeight: prev.fontWeight === 'bold' ? 'normal' : 'bold'
    }));
  };
  
  const toggleItalic = () => {
    setStyle(prev => ({
      ...prev,
      fontStyle: prev.fontStyle === 'italic' ? 'normal' : 'italic'
    }));
  };
  
  const toggleUnderline = () => {
    setStyle(prev => ({
      ...prev,
      textDecoration: prev.textDecoration === 'underline' ? 'none' : 'underline'
    }));
  };
  
  const setTextAlign = (align: 'left' | 'center' | 'right') => {
    setStyle(prev => ({
      ...prev,
      textAlign: align
    }));
  };
  
  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStyle(prev => ({
      ...prev,
      fontFamily: e.target.value
    }));
  };
  
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value);
    if (isNaN(size) || size < 8) return;
    
    setStyle(prev => ({
      ...prev,
      fontSize: size
    }));
  };
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStyle(prev => ({
      ...prev,
      color: e.target.value
    }));
  };
  
  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStyle(prev => ({
      ...prev,
      backgroundColor: e.target.value
    }));
  };
  
  const handleSave = () => {
    onSave(text, style);
  };
  
  return (
    <EditorContainer style={{ top: position.y, left: position.x }}>
      <EditorToolbar>
        <SelectControl value={style.fontFamily} onChange={handleFontFamilyChange}>
          {FONT_FAMILIES.map(font => (
            <option key={font} value={font}>{font}</option>
          ))}
        </SelectControl>
        
        <FontSizeInput 
          type="number" 
          min="8" 
          max="72" 
          value={style.fontSize} 
          onChange={handleFontSizeChange} 
        />
        
        <ToolSeparator />
        
        <ToolButton 
          onClick={toggleBold} 
          active={style.fontWeight === 'bold'}
          title="Bold"
        >
          <FaBold />
        </ToolButton>
        
        <ToolButton 
          onClick={toggleItalic} 
          active={style.fontStyle === 'italic'}
          title="Italic"
        >
          <FaItalic />
        </ToolButton>
        
        <ToolButton 
          onClick={toggleUnderline} 
          active={style.textDecoration === 'underline'}
          title="Underline"
        >
          <FaUnderline />
        </ToolButton>
        
        <ToolSeparator />
        
        <ToolButton 
          onClick={() => setTextAlign('left')} 
          active={style.textAlign === 'left'}
          title="Align Left"
        >
          <FaAlignLeft />
        </ToolButton>
        
        <ToolButton 
          onClick={() => setTextAlign('center')} 
          active={style.textAlign === 'center'}
          title="Align Center"
        >
          <FaAlignCenter />
        </ToolButton>
        
        <ToolButton 
          onClick={() => setTextAlign('right')} 
          active={style.textAlign === 'right'}
          title="Align Right"
        >
          <FaAlignRight />
        </ToolButton>
        
        <ToolSeparator />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FaPalette style={{ color: 'white' }} />
          <ColorPicker 
            type="color" 
            value={style.color} 
            onChange={handleColorChange}
            title="Text Color"
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FaFont style={{ color: 'white' }} />
          <ColorPicker 
            type="color" 
            value={style.backgroundColor === 'transparent' ? '#000000' : style.backgroundColor} 
            onChange={handleBackgroundColorChange}
            title="Background Color"
          />
        </div>
      </EditorToolbar>
      
      <TextAreaContainer>
        <StyledTextArea 
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={style}
        />
      </TextAreaContainer>
      
      <ButtonsContainer>
        <ActionButton onClick={onCancel}>Cancel</ActionButton>
        <ActionButton primary onClick={handleSave}>Save</ActionButton>
      </ButtonsContainer>
    </EditorContainer>
  );
};

export default TextEditor; 