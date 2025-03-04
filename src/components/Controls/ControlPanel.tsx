import React from 'react';
import styled from 'styled-components';
import { FaFont, FaMusic, FaDownload, FaUpload, FaRedo, FaUndo, FaCut, FaImage, FaVideo } from 'react-icons/fa';
import { MdAspectRatio, MdContentCut } from 'react-icons/md';

// Define ResizePreset type directly to avoid import error
type ResizePreset = 'instagram' | 'youtube' | 'tiktok';

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  background-color: var(--background-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  height: 100%;
  overflow-y: auto;
`;

const ControlsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
`;

const ControlsTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
`;

const ControlsGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
`;

const GroupTitle = styled.h4`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
`;

const ButtonsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
`;

const ControlButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: ${props => props.$active ? 'var(--primary-color)' : 'var(--background-dark)'};
  color: ${props => props.$active ? 'white' : 'var(--text-primary)'};
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$active ? 'var(--primary-light)' : 'var(--background-darker)'};
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  svg {
    font-size: 1rem;
  }
`;

const PrimaryButton = styled(ControlButton)`
  background-color: var(--primary-color);
  color: white;
  
  &:hover {
    background-color: var(--primary-light);
  }
`;

const ProgressIndicator = styled.div`
  width: 100%;
  height: 4px;
  background-color: var(--background-dark);
  border-radius: var(--border-radius-xs);
  overflow: hidden;
  margin-top: var(--spacing-sm);
`;

const ProgressBar = styled.div<{ width: number }>`
  height: 100%;
  width: ${props => props.width}%;
  background-color: var(--primary-color);
  transition: width 0.3s ease;
`;

const ResizeOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
`;

const ResizeOption = styled.button<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm);
  background-color: ${props => props.$active ? 'var(--primary-color)' : 'var(--background-dark)'};
  color: ${props => props.$active ? 'white' : 'var(--text-primary)'};
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$active ? 'var(--primary-light)' : 'var(--background-darker)'};
  }
  
  .ratio {
    font-weight: 600;
    margin-bottom: var(--spacing-xs);
  }
  
  .description {
    font-size: 0.7rem;
    color: ${props => props.$active ? 'rgba(255, 255, 255, 0.8)' : 'var(--text-secondary)'};
  }
`;

export interface ControlPanelProps {
  isFFmpegLoaded: boolean;
  isFFmpegLoading: boolean;
  ffmpegProgress: number;
  onTrimVideo: () => void;
  onAddText: () => void;
  onMixAudio: () => void;
  onResizeVideo?: (preset: ResizePreset) => void;
  onExportVideo: () => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isFFmpegLoaded,
  isFFmpegLoading,
  ffmpegProgress,
  onTrimVideo,
  onAddText,
  onMixAudio,
  onResizeVideo,
  onExportVideo,
  onSaveProject,
  onLoadProject,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const [activeResizePreset, setActiveResizePreset] = React.useState<ResizePreset | null>(null);
  
  const handleResizeOption = (preset: ResizePreset) => {
    setActiveResizePreset(preset);
    onResizeVideo?.(preset);
  };
  
  return (
    <ControlsContainer>
      <ControlsHeader>
        <ControlsTitle>Edit Tools</ControlsTitle>
        <ButtonsRow>
          <PrimaryButton onClick={onExportVideo} disabled={!isFFmpegLoaded}>
            <FaDownload />
            Export
          </PrimaryButton>
        </ButtonsRow>
      </ControlsHeader>
      
      <ControlsGroup>
        <GroupTitle>Media</GroupTitle>
        <ButtonsRow>
          <PrimaryButton onClick={onLoadProject}>
            <FaUpload />
            Add Media
          </PrimaryButton>
          <ControlButton onClick={onUndo} disabled={!canUndo}>
            <FaUndo />
          </ControlButton>
          <ControlButton onClick={onRedo} disabled={!canRedo}>
            <FaRedo />
          </ControlButton>
        </ButtonsRow>
      </ControlsGroup>
      
      <ControlsGroup>
        <GroupTitle>Edit Video</GroupTitle>
        <ButtonsRow>
          <ControlButton onClick={onTrimVideo} disabled={!isFFmpegLoaded}>
            <MdContentCut />
            Trim
          </ControlButton>
          <ControlButton onClick={onAddText} disabled={!isFFmpegLoaded}>
            <FaFont />
            Text
          </ControlButton>
          <ControlButton onClick={onMixAudio} disabled={!isFFmpegLoaded}>
            <FaMusic />
            Audio
          </ControlButton>
        </ButtonsRow>
      </ControlsGroup>
      
      {/* Only show resize options if onResizeVideo is provided */}
      {onResizeVideo && (
        <ControlsGroup>
          <GroupTitle>Resize Video</GroupTitle>
          <ControlButton 
            onClick={() => setActiveResizePreset(activeResizePreset ? null : 'instagram')} 
            disabled={!isFFmpegLoaded}
            $active={!!activeResizePreset}
          >
            <MdAspectRatio />
            Resize Options
          </ControlButton>
          
          {activeResizePreset && (
            <ResizeOptions>
              <ResizeOption 
                onClick={() => handleResizeOption('instagram')} 
                $active={activeResizePreset === 'instagram'}
              >
                <div className="ratio">1:1</div>
                <div className="description">Instagram</div>
              </ResizeOption>
              <ResizeOption 
                onClick={() => handleResizeOption('tiktok')} 
                $active={activeResizePreset === 'tiktok'}
              >
                <div className="ratio">9:16</div>
                <div className="description">TikTok</div>
              </ResizeOption>
              <ResizeOption 
                onClick={() => handleResizeOption('youtube')} 
                $active={activeResizePreset === 'youtube'}
              >
                <div className="ratio">16:9</div>
                <div className="description">YouTube</div>
              </ResizeOption>
            </ResizeOptions>
          )}
        </ControlsGroup>
      )}
      
      {isFFmpegLoading && (
        <>
          <GroupTitle>Loading FFmpeg ({Math.round(ffmpegProgress * 100)}%)</GroupTitle>
          <ProgressIndicator>
            <ProgressBar width={ffmpegProgress * 100} />
          </ProgressIndicator>
        </>
      )}
    </ControlsContainer>
  );
};

export default ControlPanel; 