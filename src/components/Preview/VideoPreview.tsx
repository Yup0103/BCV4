import { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand, FaCompress } from 'react-icons/fa';
import { BiSkipPrevious, BiSkipNext } from 'react-icons/bi';

const PreviewContainer = styled.div`
  position: relative;
  width: 100%;
  background-color: var(--background-dark);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  aspect-ratio: 16/9;
  box-shadow: var(--shadow-md);
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #000;
`;

const Controls = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  opacity: 0;
  transition: opacity 0.3s ease;
  
  ${PreviewContainer}:hover & {
    opacity: 1;
  }
`;

const ControlButton = styled.button`
  background-color: transparent;
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 50%;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    font-size: 1.2rem;
  }
`;

const PlayButton = styled(ControlButton)`
  background-color: var(--primary-color);
  
  &:hover {
    background-color: var(--primary-light);
  }
`;

const ProgressContainer = styled.div`
  flex: 1;
  margin: 0 var(--spacing-sm);
  cursor: pointer;
  height: 20px;
  display: flex;
  align-items: center;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  position: relative;
  transition: height 0.2s ease;
  
  ${ProgressContainer}:hover & {
    height: 6px;
  }
`;

const ProgressFill = styled.div<{ width: number }>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: ${props => props.width}%;
  background-color: var(--primary-color);
  border-radius: 2px;
`;

const ProgressHandle = styled.div<{ position: number }>`
  position: absolute;
  left: ${props => props.position}%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background-color: var(--primary-color);
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.2s ease;
  
  ${ProgressContainer}:hover & {
    opacity: 1;
  }
`;

const TimeDisplay = styled.div`
  color: white;
  font-size: 0.8rem;
  min-width: 80px;
  text-align: center;
`;

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  position: relative;
  
  &:hover .volume-slider {
    width: 80px;
    opacity: 1;
  }
`;

const VolumeSlider = styled.input`
  width: 0;
  opacity: 0;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &.volume-slider {
    appearance: none;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    outline: none;
    
    &::-webkit-slider-thumb {
      appearance: none;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--primary-color);
      cursor: pointer;
    }
  }
`;

export interface VideoPreviewProps {
  src: string;
  isPlaying: boolean;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayPause: () => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  src,
  isPlaying,
  currentTime,
  onTimeUpdate,
  onDurationChange,
  onPlayPause
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle play/pause
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);
  
  // Handle seeking
  useEffect(() => {
    if (!videoRef.current) return;
    
    // Only update if the difference is significant to avoid loops
    if (Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);
  
  // Handle volume changes
  useEffect(() => {
    if (!videoRef.current) return;
    
    videoRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);
  
  // Handle click on progress bar
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * (videoRef.current.duration || 0);
    
    onTimeUpdate(newTime);
  };
  
  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };
  
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };
  
  // Skip forward/backward
  const skipForward = () => {
    if (!videoRef.current) return;
    const newTime = Math.min(currentTime + 10, videoRef.current.duration || 0);
    onTimeUpdate(newTime);
  };
  
  const skipBackward = () => {
    const newTime = Math.max(currentTime - 10, 0);
    onTimeUpdate(newTime);
  };
  
  return (
    <PreviewContainer>
      <Video
        ref={videoRef}
        src={src}
        onTimeUpdate={() => {
          if (videoRef.current) {
            onTimeUpdate(videoRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            onDurationChange(videoRef.current.duration);
          }
        }}
        onClick={onPlayPause}
      />
      
      <Controls>
        <ControlButton onClick={skipBackward}>
          <BiSkipPrevious />
        </ControlButton>
        
        <PlayButton onClick={onPlayPause}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </PlayButton>
        
        <ControlButton onClick={skipForward}>
          <BiSkipNext />
        </ControlButton>
        
        <ProgressContainer onClick={handleProgressClick}>
          <ProgressBar ref={progressRef}>
            <ProgressFill width={(currentTime / (videoRef.current?.duration || 1)) * 100} />
            <ProgressHandle position={(currentTime / (videoRef.current?.duration || 1)) * 100} />
          </ProgressBar>
        </ProgressContainer>
        
        <TimeDisplay>
          {formatTime(currentTime)} / {formatTime(videoRef.current?.duration || 0)}
        </TimeDisplay>
        
        <VolumeContainer>
          <ControlButton onClick={toggleMute}>
            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          </ControlButton>
          <VolumeSlider
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </VolumeContainer>
        
        <ControlButton onClick={toggleFullscreen}>
          {isFullscreen ? <FaCompress /> : <FaExpand />}
        </ControlButton>
      </Controls>
    </PreviewContainer>
  );
};

export default VideoPreview; 