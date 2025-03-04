import { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { FaPlay, FaPause, FaExpand, FaCompress, FaCrop, FaLayerGroup, FaLock, FaUnlock, FaSyncAlt, FaTimes, FaRuler } from 'react-icons/fa';
import { MdContentCut, MdFilterCenterFocus, MdAspectRatio } from 'react-icons/md';

// Canvas container with grid background
const CanvasContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--background-dark);
  background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-md);
`;

// Artboard is the main editing area with fixed dimensions
const Artboard = styled.div<{ width: number; height: number; zoom: number }>`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  transform: scale(${props => props.zoom});
  transform-origin: center;
  background-color: #000;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) scale(${props => props.zoom});
  overflow: hidden;
`;

// Media element (image or video)
const MediaElement = styled.div<{ 
  x: number; 
  y: number; 
  width: number; 
  height: number; 
  rotation: number;
  zIndex: number;
  isSelected: boolean;
  isLocked: boolean;
}>`
  position: absolute;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  transform: rotate(${props => props.rotation}deg);
  transform-origin: center center;
  z-index: ${props => props.zIndex};
  border: ${props => props.isSelected ? '2px solid var(--primary-color)' : 'none'};
  cursor: ${props => props.isLocked ? 'not-allowed' : 'move'};
  user-select: none;
  
  &:hover {
    box-shadow: ${props => !props.isLocked && '0 0 0 1px rgba(var(--primary-rgb), 0.5)'};
  }
`;

const ImageElement = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
`;

const VideoElement = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
`;

const TextElement = styled.div<{ 
  fontColor: string; 
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
}>`
  width: 100%;
  height: 100%;
  color: ${props => props.fontColor};
  font-size: ${props => props.fontSize}px;
  font-family: ${props => props.fontFamily};
  text-align: ${props => props.textAlign};
  display: flex;
  align-items: center;
  justify-content: ${props => {
    if (props.textAlign === 'left') return 'flex-start';
    if (props.textAlign === 'right') return 'flex-end';
    return 'center';
  }};
  padding: 8px;
  overflow: hidden;
  pointer-events: none;
`;

// Handles for resizing
const ResizeHandle = styled.div<{ position: string }>`
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: var(--primary-color);
  border-radius: 50%;
  z-index: 100;
  
  ${props => {
    switch (props.position) {
      case 'top-left':
        return `
          top: -5px;
          left: -5px;
          cursor: nwse-resize;
        `;
      case 'top-right':
        return `
          top: -5px;
          right: -5px;
          cursor: nesw-resize;
        `;
      case 'bottom-left':
        return `
          bottom: -5px;
          left: -5px;
          cursor: nesw-resize;
        `;
      case 'bottom-right':
        return `
          bottom: -5px;
          right: -5px;
          cursor: nwse-resize;
        `;
      case 'top-center':
        return `
          top: -5px;
          left: 50%;
          transform: translateX(-50%);
          cursor: ns-resize;
        `;
      case 'bottom-center':
        return `
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          cursor: ns-resize;
        `;
      case 'left-center':
        return `
          left: -5px;
          top: 50%;
          transform: translateY(-50%);
          cursor: ew-resize;
        `;
      case 'right-center':
        return `
          right: -5px;
          top: 50%;
          transform: translateY(-50%);
          cursor: ew-resize;
        `;
      default:
        return '';
    }
  }}
`;

// Rotation handle
const RotateHandle = styled.div`
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  background-color: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: white;
  font-size: 12px;
  
  &:active {
    cursor: grabbing;
  }
`;

// Controls for video playback
const VideoControls = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  ${MediaElement}:hover & {
    opacity: 1;
  }
`;

const ControlButton = styled.button`
  background-color: transparent;
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

// Canvas toolbar
const CanvasToolbar = styled.div`
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--background-light);
  border-radius: var(--border-radius-md);
  padding: 8px;
  display: flex;
  gap: 8px;
  z-index: 1000;
  box-shadow: var(--shadow-md);
`;

const ToolbarButton = styled.button<{ active?: boolean }>`
  background-color: ${props => props.active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'var(--text-primary)'};
  border: none;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  
  &:hover {
    background-color: ${props => props.active ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const ZoomControls = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: var(--background-light);
  border-radius: var(--border-radius-md);
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
  box-shadow: var(--shadow-md);
`;

const ZoomText = styled.span`
  color: var(--text-primary);
  font-size: 0.9rem;
  min-width: 50px;
  text-align: center;
`;

// Add a new styled component for tooltips
const Tooltip = styled.div`
  position: absolute;
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.2s ease;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 5px;
`;

const ToolbarButtonWithTooltip = styled(ToolbarButton)`
  position: relative;
  
  &:hover ${Tooltip} {
    opacity: 1;
  }
`;

const ControlButtonWithTooltip = styled(ControlButton)`
  position: relative;
  
  &:hover ${Tooltip} {
    opacity: 1;
  }
`;

// Dropdown menu for canvas resize options
const ResizeDropdown = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--background-light);
  border-radius: var(--border-radius-md);
  padding: 8px;
  display: ${props => props.isOpen ? 'flex' : 'none'};
  flex-direction: column;
  gap: 8px;
  z-index: 1001;
  box-shadow: var(--shadow-md);
  margin-top: 8px;
  min-width: 180px;
  border: 1px solid var(--border-color);
`;

const ResizeOption = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  background-color: ${props => props.active ? 'var(--primary-color-light)' : 'transparent'};
  
  &:hover {
    background-color: ${props => props.active ? 'var(--primary-color-light)' : 'var(--background-medium)'};
  }
  
  .ratio {
    font-weight: bold;
    font-size: 0.9rem;
  }
  
  .description {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  
  .dimensions {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
`;

const ResizeOptionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ResizeOptionHeader = styled.div`
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 12px;
  margin-top: 4px;
`;

// Types
export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'text';
  src?: string;
  text?: string;
  fontColor?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  isLocked: boolean;
  // Advanced clip management properties
  groupId?: string;
  startTime?: number;
  duration?: number;
  position?: { x: number; y: number };
}

export interface UnifiedCanvasProps {
  mediaItems?: MediaItem[];
  selectedItemId?: string | null;
  onItemSelect?: (id: string | null) => void;
  onItemsChange?: (items: MediaItem[]) => void;
  onItemDelete?: (id: string) => void;
  width?: number;
  height?: number;
  currentTime?: number;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  playbackSpeed?: number;
  isLooping?: boolean;
  loopRange?: { start: number; end: number };
}

const UnifiedCanvas: React.FC<UnifiedCanvasProps> = ({
  mediaItems = [],
  selectedItemId = null,
  onItemSelect = () => {},
  onItemsChange = () => {},
  onItemDelete = () => {},
  width = 1280,
  height = 720,
  currentTime = 0,
  isPlaying = false,
  onPlayPause = () => {},
  onTimeUpdate,
  playbackSpeed = 1,
  isLooping = false,
  loopRange = { start: 0, end: 0 }
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{[key: string]: HTMLVideoElement}>({});
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartDims, setResizeStartDims] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [rotateStartAngle, setRotateStartAngle] = useState(0);
  const [videoPlayingStates, setVideoPlayingStates] = useState<Record<string, boolean>>({});
  
  // Resize dropdown state
  const [isResizeDropdownOpen, setIsResizeDropdownOpen] = useState(false);
  const resizeDropdownRef = useRef<HTMLDivElement>(null);
  
  // Canvas size presets
  const canvasSizePresets = [
    { name: 'Instagram', ratio: '1:1', width: 1080, height: 1080 },
    { name: 'Instagram Story', ratio: '9:16', width: 1080, height: 1920 },
    { name: 'TikTok', ratio: '9:16', width: 1080, height: 1920 },
    { name: 'YouTube', ratio: '16:9', width: 1920, height: 1080 },
    { name: 'Twitter', ratio: '16:9', width: 1280, height: 720 },
    { name: 'Facebook', ratio: '16:9', width: 1280, height: 720 },
    { name: 'Custom', ratio: '16:9', width: width, height: height }
  ];
  
  // Handle item selection
  const handleItemClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    const item = mediaItems.find(item => item.id === id);
    if (item && item.isLocked) return;
    
    onItemSelect(id);
  };
  
  // Handle background click to deselect
  const handleBackgroundClick = () => {
    onItemSelect(null);
  };
  
  // Start dragging an item
  const handleDragStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const item = mediaItems.find(item => item.id === id);
    if (!item || item.isLocked) return;
    
    setIsDragging(true);
    onItemSelect(id);
    
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  // Start resizing an item
  const handleResizeStart = (e: React.MouseEvent, id: string, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const item = mediaItems.find(item => item.id === id);
    if (!item || item.isLocked) return;
    
    setIsResizing(true);
    onItemSelect(id);
    setResizeHandle(handle);
    
    setResizeStartDims({
      width: item.width,
      height: item.height,
      x: item.x,
      y: item.y
    });
    
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  // Start rotating an item
  const handleRotateStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const item = mediaItems.find(item => item.id === id);
    if (!item || item.isLocked) return;
    
    setIsRotating(true);
    onItemSelect(id);
    
    const itemElement = document.getElementById(`item-${id}`);
    if (!itemElement) return;
    
    const rect = itemElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate initial angle
    const initialAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    
    setRotateStartAngle(item.rotation - initialAngle);
    
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  // Handle toggle video play
  const handleToggleVideoPlay = (id: string) => {
    setVideoPlayingStates(prev => {
      const newState = { ...prev, [id]: !prev[id] };
      
      // Get the video element
      const videoElement = videoRefs.current[id];
      if (videoElement) {
        if (newState[id]) {
          videoElement.play().catch(err => {
            console.error("Error playing video:", err);
            // If autoplay is prevented, revert the state
            return { ...prev };
          });
        } else {
          videoElement.pause();
        }
      }
      
      return newState;
    });
  };
  
  // Update video playback with speed and loop settings
  useEffect(() => {
    Object.keys(videoRefs.current).forEach(id => {
      const videoElement = videoRefs.current[id];
      if (videoElement) {
        // Update playback rate
        videoElement.playbackRate = playbackSpeed;
        
        // Handle play/pause
        if (isPlaying) {
          videoElement.currentTime = currentTime;
          videoElement.play().catch(err => {
            console.error("Error playing video:", err);
          });
        } else {
          videoElement.pause();
        }
        
        // Update the playing state
        setVideoPlayingStates(prev => ({
          ...prev,
          [id]: isPlaying
        }));
      }
    });
  }, [isPlaying, currentTime, playbackSpeed]);
  
  // Handle looping separately
  useEffect(() => {
    Object.keys(videoRefs.current).forEach(id => {
      const videoElement = videoRefs.current[id];
      if (videoElement) {
        // Set loop attribute based on isLooping prop
        videoElement.loop = isLooping;
        
        // Add or update timeupdate event listener for loop range
        const handleTimeUpdate = () => {
          if (isLooping && videoElement.currentTime >= loopRange.end) {
            videoElement.currentTime = loopRange.start;
          }
          
          if (videoPlayingStates[id] && onTimeUpdate) {
            onTimeUpdate(videoElement.currentTime);
          }
        };
        
        // Remove existing listener if any
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        
        // Add new listener
        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        
        // Clean up
        return () => {
          videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        };
      }
    });
  }, [isLooping, loopRange, videoPlayingStates, onTimeUpdate]);
  
  // Toggle item lock
  const handleToggleLock = (id: string) => {
    const item = mediaItems.find(item => item.id === id);
    if (!item) return;
    
    onItemsChange([
      ...mediaItems.filter(i => i.id !== id),
      {
        ...item,
        isLocked: !item.isLocked
      }
    ]);
    
    if (!item.isLocked && id === selectedItemId) {
      onItemSelect(null);
    }
  };
  
  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.1));
  };
  
  const handleZoomReset = () => {
    setZoom(1);
  };
  
  // Handle resize option click
  const handleResizeOptionClick = (newWidth: number, newHeight: number) => {
    if (!selectedItemId) return;
    
    const selectedItem = mediaItems.find(item => item.id === selectedItemId);
    if (!selectedItem) return;
    
    onItemsChange([
      ...mediaItems.filter(i => i.id !== selectedItemId),
      {
        ...selectedItem,
        width: newWidth,
        height: newHeight
      }
    ]);
    
    setIsResizeDropdownOpen(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resizeDropdownRef.current && 
        !resizeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsResizeDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle mouse move for dragging, resizing, or rotating
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !selectedItemId) return;
      
      const selectedItem = mediaItems.find(item => item.id === selectedItemId);
      if (!selectedItem) return;
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const deltaX = e.clientX - dragStartPos.x;
        const deltaY = e.clientY - dragStartPos.y;
        
        const scaledDeltaX = deltaX / zoom;
        const scaledDeltaY = deltaY / zoom;
        
        onItemsChange([
          ...mediaItems.filter(i => i.id !== selectedItemId),
          {
            ...selectedItem,
            x: selectedItem.x + scaledDeltaX,
            y: selectedItem.y + scaledDeltaY
          }
        ]);
        
        setDragStartPos({
          x: e.clientX,
          y: e.clientY
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
    };
    
    if (isDragging || isResizing || isRotating) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDragging, 
    isResizing, 
    isRotating, 
    dragStartPos, 
    resizeStartDims, 
    resizeHandle, 
    rotateStartAngle, 
    selectedItemId, 
    mediaItems, 
    onItemsChange,
    zoom
  ]);
  
  // Render media items
  const renderMediaItem = (item: MediaItem) => {
    const isSelected = selectedItemId === item.id;
    
    return (
      <MediaElement
        id={`item-${item.id}`}
        key={item.id}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        rotation={item.rotation}
        zIndex={item.zIndex}
        isSelected={isSelected}
        isLocked={item.isLocked}
        onClick={(e) => handleItemClick(e, item.id)}
        onMouseDown={(e) => handleDragStart(e, item.id)}
      >
        {item.type === 'image' && item.src && (
          <ImageElement src={item.src} alt="" draggable={false} />
        )}
        
        {item.type === 'video' && item.src && (
          <>
            <VideoElement
              id={`video-${item.id}`}
              src={item.src}
              loop
              muted
              playsInline
              ref={(el) => {
                if (el) {
                  // Store reference to video element
                  videoRefs.current[item.id] = el;
                  
                  // Add timeupdate event listener to sync with timeline
                  el.ontimeupdate = () => {
                    if (videoPlayingStates[item.id] && onTimeUpdate) {
                      onTimeUpdate(el.currentTime);
                    }
                  };
                  
                  // Add ended event listener
                  el.onended = () => {
                    if (videoPlayingStates[item.id]) {
                      setVideoPlayingStates(prev => ({
                        ...prev,
                        [item.id]: false
                      }));
                    }
                  };
                }
              }}
            />
            <VideoControls>
              <ControlButtonWithTooltip
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleVideoPlay(item.id);
                }}
              >
                {videoPlayingStates[item.id] ? <FaPause size={12} /> : <FaPlay size={12} />}
                <Tooltip>{videoPlayingStates[item.id] ? 'Pause video' : 'Play video'}</Tooltip>
              </ControlButtonWithTooltip>
            </VideoControls>
          </>
        )}
        
        {item.type === 'text' && (
          <TextElement
            fontColor={item.fontColor || '#ffffff'}
            fontSize={item.fontSize || 24}
            fontFamily={item.fontFamily || 'Arial, sans-serif'}
            textAlign={item.textAlign || 'center'}
          >
            {item.text}
          </TextElement>
        )}
        
        {isSelected && !item.isLocked && (
          <>
            <ResizeHandle 
              position="top-left" 
              onMouseDown={(e) => handleResizeStart(e, item.id, 'top-left')}
            />
            <ResizeHandle 
              position="top-right" 
              onMouseDown={(e) => handleResizeStart(e, item.id, 'top-right')}
            />
            <ResizeHandle 
              position="bottom-left" 
              onMouseDown={(e) => handleResizeStart(e, item.id, 'bottom-left')}
            />
            <ResizeHandle 
              position="bottom-right" 
              onMouseDown={(e) => handleResizeStart(e, item.id, 'bottom-right')}
            />
            <ResizeHandle 
              position="top-center" 
              onMouseDown={(e) => handleResizeStart(e, item.id, 'top-center')}
            />
            <ResizeHandle 
              position="bottom-center" 
              onMouseDown={(e) => handleResizeStart(e, item.id, 'bottom-center')}
            />
            <ResizeHandle 
              position="left-center" 
              onMouseDown={(e) => handleResizeStart(e, item.id, 'left-center')}
            />
            <ResizeHandle 
              position="right-center" 
              onMouseDown={(e) => handleResizeStart(e, item.id, 'right-center')}
            />
            <RotateHandle onMouseDown={(e) => handleRotateStart(e, item.id)}>⟳</RotateHandle>
            
            <ControlButtonWithTooltip
              style={{ 
                position: 'absolute', 
                top: '-40px', 
                right: '-10px',
                backgroundColor: 'var(--background-light)',
                width: '24px',
                height: '24px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleLock(item.id);
              }}
            >
              <FaUnlock size={12} />
              <Tooltip>Unlock item</Tooltip>
            </ControlButtonWithTooltip>
          </>
        )}
        
        {item.isLocked && isSelected && (
          <ControlButtonWithTooltip
            style={{ 
              position: 'absolute', 
              top: '-40px', 
              right: '-10px',
              backgroundColor: 'var(--background-light)',
              width: '24px',
              height: '24px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleLock(item.id);
            }}
          >
            <FaLock size={12} />
            <Tooltip>Lock item</Tooltip>
          </ControlButtonWithTooltip>
        )}
      </MediaElement>
    );
  };
  
  return (
    <CanvasContainer ref={containerRef} onClick={handleBackgroundClick}>
      <CanvasToolbar>
        <ToolbarButtonWithTooltip onClick={handleZoomReset}>
          <MdFilterCenterFocus />
          <Tooltip>Fit to screen</Tooltip>
        </ToolbarButtonWithTooltip>
        
        <ToolbarButtonWithTooltip 
          onClick={() => setIsResizeDropdownOpen(!isResizeDropdownOpen)}
          active={isResizeDropdownOpen}
        >
          <MdAspectRatio />
          <Tooltip>Resize canvas</Tooltip>
        </ToolbarButtonWithTooltip>
        
        <ResizeDropdown isOpen={isResizeDropdownOpen} ref={resizeDropdownRef}>
          <ResizeOptionHeader>Social Media</ResizeOptionHeader>
          <ResizeOptionGroup>
            {canvasSizePresets.slice(0, 6).map((preset, index) => (
              <ResizeOption 
                key={index}
                active={width === preset.width && height === preset.height}
                onClick={() => handleResizeOptionClick(preset.width, preset.height)}
              >
                <div>
                  <div className="ratio">{preset.ratio}</div>
                  <div className="description">{preset.name}</div>
                </div>
                <div className="dimensions">{preset.width}×{preset.height}</div>
              </ResizeOption>
            ))}
          </ResizeOptionGroup>
          
          <ResizeOptionHeader>Custom</ResizeOptionHeader>
          <ResizeOptionGroup>
            <ResizeOption 
              active={width === canvasSizePresets[6].width && height === canvasSizePresets[6].height}
              onClick={() => handleResizeOptionClick(canvasSizePresets[6].width, canvasSizePresets[6].height)}
            >
              <div>
                <div className="ratio">{canvasSizePresets[6].ratio}</div>
                <div className="description">Current Size</div>
              </div>
              <div className="dimensions">{canvasSizePresets[6].width}×{canvasSizePresets[6].height}</div>
            </ResizeOption>
          </ResizeOptionGroup>
        </ResizeDropdown>
        
        <ToolbarButtonWithTooltip>
          <FaCrop />
          <Tooltip>Crop</Tooltip>
        </ToolbarButtonWithTooltip>
        
        <ToolbarButtonWithTooltip>
          <FaLayerGroup />
          <Tooltip>Arrange layers</Tooltip>
        </ToolbarButtonWithTooltip>
      </CanvasToolbar>
      
      <Artboard width={width} height={height} zoom={zoom}>
        {mediaItems.map(renderMediaItem)}
      </Artboard>
      
      <ZoomControls>
        <ToolbarButtonWithTooltip onClick={handleZoomOut}>
          <span>-</span>
          <Tooltip>Zoom out</Tooltip>
        </ToolbarButtonWithTooltip>
        <ZoomText>{Math.round(zoom * 100)}%</ZoomText>
        <ToolbarButtonWithTooltip onClick={handleZoomIn}>
          <span>+</span>
          <Tooltip>Zoom in</Tooltip>
        </ToolbarButtonWithTooltip>
      </ZoomControls>
    </CanvasContainer>
  );
};

export default UnifiedCanvas; 