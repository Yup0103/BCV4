import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  FaCopy, FaPaste, FaCut, FaTrash, FaObjectGroup, FaObjectUngroup,
  FaArrowUp, FaArrowDown, FaLink, FaUnlink, FaLock, FaLockOpen
} from 'react-icons/fa';
import { MediaItem } from '../Preview/UnifiedCanvas';

// Styled components for clip management UI
const ClipManagerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--background-medium);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-md);
`;

const ClipManagerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
`;

const ClipManagerTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
`;

const ClipManagerToolbar = styled.div`
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
`;

const ClipManagerButton = styled.button<{ active?: boolean }>`
  background: ${props => props.active ? 'var(--primary-color)' : 'var(--background-dark)'};
  color: ${props => props.active ? 'white' : 'var(--text-primary)'};
  border: none;
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background: ${props => props.active ? 'var(--primary-color-dark)' : 'var(--background-light)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    font-size: 0.9rem;
  }
`;

const ClipList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 200px;
  overflow-y: auto;
`;

const ClipItem = styled.div<{ isSelected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: ${props => props.isSelected ? 'var(--primary-color-light)' : 'var(--background-dark)'};
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  
  &:hover {
    background: ${props => props.isSelected ? 'var(--primary-color-light)' : 'var(--background-light)'};
  }
`;

const ClipInfo = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

const ClipIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--background-medium);
`;

const ClipName = styled.div`
  font-size: 0.9rem;
`;

const ClipDuration = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const ClipActions = styled.div`
  display: flex;
  gap: var(--spacing-xs);
`;

const ClipActionButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  
  &:hover {
    background: var(--background-medium);
    color: var(--text-primary);
  }
`;

// Interface for ClipManager props
interface ClipManagerProps {
  clips: MediaItem[];
  selectedClipIds: string[];
  onSelectClip: (id: string, multiSelect?: boolean) => void;
  onDeleteClips: (ids: string[]) => void;
  onDuplicateClips: (ids: string[]) => void;
  onSplitClip: (id: string, time: number) => void;
  onGroupClips: (ids: string[]) => void;
  onUngroupClips: (ids: string[]) => void;
  onArrangeClips: (ids: string[], direction: 'forward' | 'backward') => void;
  onLockClips: (ids: string[], locked: boolean) => void;
  currentTime: number;
}

const ClipManager: React.FC<ClipManagerProps> = ({
  clips,
  selectedClipIds,
  onSelectClip,
  onDeleteClips,
  onDuplicateClips,
  onSplitClip,
  onGroupClips,
  onUngroupClips,
  onArrangeClips,
  onLockClips,
  currentTime
}) => {
  // State for clipboard
  const [clipboard, setClipboard] = useState<MediaItem[]>([]);
  
  // Handle copy
  const handleCopy = () => {
    const clipsToCopy = clips.filter(clip => selectedClipIds.includes(clip.id));
    setClipboard(clipsToCopy);
  };
  
  // Handle paste
  const handlePaste = () => {
    // In a real implementation, you would:
    // 1. Create new clips based on the clipboard items
    // 2. Add them to the timeline
    console.log('Pasting clips from clipboard');
  };
  
  // Handle cut
  const handleCut = () => {
    handleCopy();
    onDeleteClips(selectedClipIds);
  };
  
  // Format time (e.g., 65.5 -> "1:05.5")
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toFixed(1).padStart(4, '0')}`;
  };
  
  return (
    <ClipManagerContainer>
      <ClipManagerHeader>
        <ClipManagerTitle>Clip Manager</ClipManagerTitle>
        <ClipManagerToolbar>
          <ClipManagerButton 
            onClick={handleCopy}
            disabled={selectedClipIds.length === 0}
            title="Copy selected clips"
          >
            <FaCopy /> Copy
          </ClipManagerButton>
          <ClipManagerButton 
            onClick={handlePaste}
            disabled={clipboard.length === 0}
            title="Paste clips"
          >
            <FaPaste /> Paste
          </ClipManagerButton>
          <ClipManagerButton 
            onClick={handleCut}
            disabled={selectedClipIds.length === 0}
            title="Cut selected clips"
          >
            <FaCut /> Cut
          </ClipManagerButton>
        </ClipManagerToolbar>
      </ClipManagerHeader>
      
      <ClipManagerToolbar>
        <ClipManagerButton 
          onClick={() => onDeleteClips(selectedClipIds)}
          disabled={selectedClipIds.length === 0}
          title="Delete selected clips"
        >
          <FaTrash /> Delete
        </ClipManagerButton>
        <ClipManagerButton 
          onClick={() => onDuplicateClips(selectedClipIds)}
          disabled={selectedClipIds.length === 0}
          title="Duplicate selected clips"
        >
          <FaCopy /> Duplicate
        </ClipManagerButton>
        <ClipManagerButton 
          onClick={() => selectedClipIds.length === 1 && onSplitClip(selectedClipIds[0], currentTime)}
          disabled={selectedClipIds.length !== 1}
          title="Split clip at current time"
        >
          <FaCut /> Split
        </ClipManagerButton>
        <ClipManagerButton 
          onClick={() => onGroupClips(selectedClipIds)}
          disabled={selectedClipIds.length <= 1}
          title="Group selected clips"
        >
          <FaObjectGroup /> Group
        </ClipManagerButton>
        <ClipManagerButton 
          onClick={() => onUngroupClips(selectedClipIds)}
          disabled={selectedClipIds.length === 0}
          title="Ungroup selected clips"
        >
          <FaObjectUngroup /> Ungroup
        </ClipManagerButton>
        <ClipManagerButton 
          onClick={() => onArrangeClips(selectedClipIds, 'forward')}
          disabled={selectedClipIds.length === 0}
          title="Bring forward"
        >
          <FaArrowUp /> Forward
        </ClipManagerButton>
        <ClipManagerButton 
          onClick={() => onArrangeClips(selectedClipIds, 'backward')}
          disabled={selectedClipIds.length === 0}
          title="Send backward"
        >
          <FaArrowDown /> Backward
        </ClipManagerButton>
        <ClipManagerButton 
          onClick={() => onLockClips(selectedClipIds, true)}
          disabled={selectedClipIds.length === 0}
          title="Lock selected clips"
        >
          <FaLock /> Lock
        </ClipManagerButton>
        <ClipManagerButton 
          onClick={() => onLockClips(selectedClipIds, false)}
          disabled={selectedClipIds.length === 0}
          title="Unlock selected clips"
        >
          <FaLockOpen /> Unlock
        </ClipManagerButton>
      </ClipManagerToolbar>
      
      <ClipList>
        {clips.map(clip => (
          <ClipItem 
            key={clip.id}
            isSelected={selectedClipIds.includes(clip.id)}
            onClick={() => onSelectClip(clip.id, false)}
            onContextMenu={(e) => {
              e.preventDefault();
              onSelectClip(clip.id, true);
            }}
          >
            <ClipInfo>
              <ClipIcon>
                {clip.type === 'video' && <FaCut size={12} />}
                {clip.type === 'image' && <FaCopy size={12} />}
                {clip.type === 'text' && <FaPaste size={12} />}
              </ClipIcon>
              <ClipName>
                {clip.type === 'text' ? (clip.text || 'Text') : `${clip.type.charAt(0).toUpperCase() + clip.type.slice(1)} Clip`}
              </ClipName>
              <ClipDuration>
                {formatTime(clip.duration || 0)}
              </ClipDuration>
            </ClipInfo>
            <ClipActions>
              <ClipActionButton 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClips([clip.id]);
                }}
                title="Delete clip"
              >
                <FaTrash size={12} />
              </ClipActionButton>
              <ClipActionButton 
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateClips([clip.id]);
                }}
                title="Duplicate clip"
              >
                <FaCopy size={12} />
              </ClipActionButton>
              <ClipActionButton 
                onClick={(e) => {
                  e.stopPropagation();
                  onLockClips([clip.id], !clip.isLocked);
                }}
                title={clip.isLocked ? "Unlock clip" : "Lock clip"}
              >
                {clip.isLocked ? <FaLockOpen size={12} /> : <FaLock size={12} />}
              </ClipActionButton>
            </ClipActions>
          </ClipItem>
        ))}
      </ClipList>
    </ClipManagerContainer>
  );
};

export default ClipManager; 