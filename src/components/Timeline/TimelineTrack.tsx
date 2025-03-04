import { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import Draggable from 'react-draggable';
import { TrimRange } from '../../types/video';

interface TimelineTrackProps {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  startTime: number;
  endTime: number;
  onTrimChange: (startTime: number, endTime: number) => void;
  width?: number;
}

const TimelineContainer = styled.div`
  width: 100%;
  height: 100px;
  background-color: #2a2a2a;
  position: relative;
  border-radius: 6px;
  overflow: hidden;
`;

const Track = styled.div`
  width: 100%;
  height: 60px;
  background-color: #3a3a3a;
  position: relative;
  margin-top: 20px;
`;

const TimeMarker = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #ff5722;
  z-index: 20;
`;

const TrimHandle = styled.div<{ left?: boolean; right?: boolean }>`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 10px;
  background-color: ${props => (props.left ? '#4caf50' : '#2196f3')};
  cursor: ew-resize;
  z-index: 10;
  opacity: 0.8;
  
  &:hover {
    opacity: 1;
  }
`;

const TrimRegion = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.1);
  z-index: 5;
`;

const Timestamp = styled.div`
  position: absolute;
  bottom: 5px;
  font-size: 12px;
  color: #ddd;
  transform: translateX(-50%);
`;

const TimelineTrack: React.FC<TimelineTrackProps> = ({
  duration,
  currentTime,
  onSeek,
  startTime,
  endTime,
  onTrimChange,
  width = 600,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [leftHandlePosition, setLeftHandlePosition] = useState(0);
  const [rightHandlePosition, setRightHandlePosition] = useState(width);
  
  // Initialize handle positions based on start/end time
  useEffect(() => {
    if (duration <= 0) return;
    
    const newLeftPos = (startTime / duration) * width;
    const newRightPos = (endTime / duration) * width;
    
    setLeftHandlePosition(newLeftPos);
    setRightHandlePosition(newRightPos);
  }, [startTime, endTime, duration, width]);
  
  // Convert pixel position to time
  const positionToTime = (position: number): number => {
    return (position / width) * duration;
  };
  
  // Handle track click to seek
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const clickTime = positionToTime(clickPosition);
    
    // Only seek if within trimmed region
    if (clickTime >= startTime && clickTime <= endTime) {
      onSeek(clickTime);
    }
  };
  
  // Handle left trim drag
  const handleLeftTrimDrag = (_: any, data: { x: number }) => {
    const newPosition = Math.max(0, Math.min(data.x, rightHandlePosition - 20));
    setLeftHandlePosition(newPosition);
    
    const newStartTime = positionToTime(newPosition);
    onTrimChange(newStartTime, endTime);
    return false as const;
  };
  
  // Handle right trim drag
  const handleRightTrimDrag = (_: any, data: { x: number }) => {
    const newPosition = Math.max(leftHandlePosition + 20, Math.min(data.x, width));
    setRightHandlePosition(newPosition);
    
    const newEndTime = positionToTime(newPosition);
    onTrimChange(startTime, newEndTime);
    return false as const;
  };
  
  // Calculate current time marker position
  const timeMarkerPosition = (currentTime / duration) * width;
  
  // Generate timestamp markers
  const generateTimestamps = () => {
    const markers = [];
    const interval = Math.max(1, Math.ceil(duration / 10)); // Show around 10 markers
    
    for (let i = 0; i <= duration; i += interval) {
      const position = (i / duration) * width;
      markers.push(
        <Timestamp key={i} style={{ left: position }}>
          {formatTime(i)}
        </Timestamp>
      );
    }
    
    return markers;
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <TimelineContainer>
      <Track ref={trackRef} onClick={handleTrackClick}>
        {generateTimestamps()}
        
        <TrimRegion
          style={{
            left: leftHandlePosition,
            width: rightHandlePosition - leftHandlePosition,
          }}
        />
        
        <Draggable
          axis="x"
          position={{ x: leftHandlePosition, y: 0 }}
          onDrag={handleLeftTrimDrag}
          bounds={{ left: 0, right: rightHandlePosition - 20 }}
        >
          <TrimHandle left />
        </Draggable>
        
        <Draggable
          axis="x"
          position={{ x: rightHandlePosition, y: 0 }}
          onDrag={handleRightTrimDrag}
          bounds={{ left: leftHandlePosition + 20, right: width }}
        >
          <TrimHandle right />
        </Draggable>
        
        <TimeMarker style={{ left: timeMarkerPosition }} />
      </Track>
    </TimelineContainer>
  );
};

export default TimelineTrack; 