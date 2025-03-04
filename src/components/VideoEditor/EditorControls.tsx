import React, { useState } from 'react';
import styled from 'styled-components';
import { FaImage, FaFont, FaCrop, FaSlidersH, FaExchangeAlt } from 'react-icons/fa';
import ImageEditor from '../ImageEditor/ImageEditor';
import TextEditor from '../TextEditor/TextEditor';
import { TextStyle } from '../TextEditor/TextEditor';

interface EditorControlsProps {
  selectedItem: any;
  onUpdateItem: (itemId: string, updates: any) => void;
}

const ControlsContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 100;
`;

const ControlButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
  
  &:hover {
    transform: scale(1.1);
    background-color: var(--primary-color-dark);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const EditorOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const EditorControls: React.FC<EditorControlsProps> = ({ selectedItem, onUpdateItem }) => {
  const [activeEditor, setActiveEditor] = useState<'image' | 'text' | null>(null);
  
  if (!selectedItem) return null;
  
  const isImage = selectedItem.type === 'image';
  const isText = selectedItem.type === 'text';
  
  const handleImageEdit = () => {
    setActiveEditor('image');
  };
  
  const handleTextEdit = () => {
    setActiveEditor('text');
  };
  
  const handleImageSave = (editedImageData: string, edits: any) => {
    onUpdateItem(selectedItem.id, { 
      src: editedImageData,
      imageEdits: edits
    });
    setActiveEditor(null);
  };
  
  const handleTextSave = (text: string, style: TextStyle) => {
    onUpdateItem(selectedItem.id, { 
      text,
      style
    });
    setActiveEditor(null);
  };
  
  const handleEditorCancel = () => {
    setActiveEditor(null);
  };
  
  return (
    <>
      <ControlsContainer>
        {isImage && (
          <ControlButton onClick={handleImageEdit} title="Edit Image">
            <FaImage />
          </ControlButton>
        )}
        
        {isText && (
          <ControlButton onClick={handleTextEdit} title="Edit Text">
            <FaFont />
          </ControlButton>
        )}
      </ControlsContainer>
      
      {activeEditor === 'image' && isImage && (
        <EditorOverlay>
          <div style={{ width: '90%', height: '90%' }}>
            <ImageEditor 
              src={selectedItem.src}
              onSave={handleImageSave}
              onCancel={handleEditorCancel}
            />
          </div>
        </EditorOverlay>
      )}
      
      {activeEditor === 'text' && isText && (
        <EditorOverlay>
          <TextEditor 
            initialText={selectedItem.text || 'Text'}
            position={{ x: 0, y: 0 }}
            initialStyle={selectedItem.style || undefined}
            onSave={handleTextSave}
            onCancel={handleEditorCancel}
          />
        </EditorOverlay>
      )}
    </>
  );
};

export default EditorControls; 