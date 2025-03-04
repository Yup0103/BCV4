import React, { useRef, useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { TrimRange } from '../../types/video';
import {
  FaPlay, FaPause, FaPlus, FaMinus, FaExpand, FaTrash,
  FaLock, FaLockOpen, FaEye, FaEyeSlash, FaMusic,
  FaImage, FaVideo, FaFont, FaLayerGroup, FaStepBackward,
  FaStepForward, FaFastBackward, FaFastForward, FaChevronDown,
  FaChevronRight, FaVolumeUp, FaVolumeMute, FaGripLines,
  FaCopy, FaPaste, FaCut, FaArrowUp, FaArrowDown, FaLink,
  FaUnlink, FaObjectGroup, FaObjectUngroup, FaRuler, FaMagnet, FaRedo
} from 'react-icons/fa';
import { MediaItem } from '../Preview/UnifiedCanvas';
import { createPortal } from 'react-dom';

// Timeline Container - Enhanced with better shadows and subtle gradient
const TimelineContainer = styled.div<{ height: number }>`
  width: 100%;
  background: linear-gradient(to bottom, var(--background-light), var(--background-medium));
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-md);
  margin-top: var(--spacing-md);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  height: ${props => props.height}px;
  min-height: 120px;
  max-height: 500px;
  transition: height 0.2s ease;
  position: relative;
  overflow: hidden;
`;

// Resize Handle
const ResizeHandle = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  background-color: transparent;
  cursor: ns-resize;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  &:active {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  svg {
    opacity: 0.5;
    font-size: 10px;
  }
  
  &:hover svg {
    opacity: 1;
  }
`;

// Compact Mode Toggle
const CompactModeToggle = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  
  &:hover {
    color: var(--text-primary);
  }
`;

// Timeline Header - Improved with better spacing and alignment
const TimelineHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
  padding-top: 8px;
`;

const TimelineTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
`;

// Time Ruler - Enhanced with better visual hierarchy
const TimeRuler = styled.div`
  position: relative;
  height: 28px;
  background-color: var(--background-dark);
  border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;
  display: flex;
  align-items: flex-end;
  padding-bottom: 4px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-bottom: none;
`;

const TimeMarkers = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
`;

const TimeMarker = styled.div`
  position: absolute;
  bottom: 0;
  font-size: 0.7rem;
  color: var(--text-secondary);
  transform: translateX(-50%);
  
  &::before {
    content: '';
    position: absolute;
    bottom: 14px;
    left: 50%;
    width: 1px;
    height: 6px;
    background-color: var(--border-color);
  }
  
  &:nth-child(5n+1) {
    color: var(--text-primary);
    font-weight: 500;
    
    &::before {
      height: 10px;
      width: 1.5px;
      background-color: var(--text-secondary);
    }
  }
`;

// Tracks Container - Improved with better scrolling and visual separation
const TracksContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 300px;
  overflow-y: auto;
  position: relative;
  border-radius: 0 0 var(--border-radius-sm) var(--border-radius-sm);
  background-color: var(--background-darker);
  border: 1px solid var(--border-color);
  border-top: none;
  
  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--background-dark);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--background-medium);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: var(--primary-color);
  }
`;

// Track Labels - Enhanced with toggle controls and better styling
const TrackLabelsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 160px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-color);
  background-color: var(--background-dark);
`;

const TrackLabel = styled.div`
  height: 60px;
  background-color: var(--background-dark);
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-sm);
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
  border-bottom: 1px solid var(--border-color);
  position: relative;
  
  &:hover {
    background-color: var(--background-medium);
  }
`;

const TrackInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  overflow: hidden;
`;

const TrackName = styled.div`
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TrackItemCount = styled.div`
  font-size: 0.7rem;
  color: var(--text-secondary);
`;

const TrackControls = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  opacity: 0.6;
  
  &:hover {
    opacity: 1;
  }
`;

// Track actions
const TrackActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
`;

const TrackActionButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  gap: 2px;
  
  &:hover {
    color: var(--text-primary);
    text-decoration: underline;
  }
`;

const TrackControlButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  
  &:hover {
    color: var(--text-primary);
  }
`;

// Timeline Track - Improved with grid lines
const TimelineTrack = styled.div`
  position: relative;
  height: 60px;
  background-color: var(--background-dark);
  overflow: hidden;
  flex-grow: 1;
  border-bottom: 1px solid var(--border-color);
  
  /* Grid lines */
  background-image: linear-gradient(
    to right,
    var(--border-color) 1px,
    transparent 1px
  );
  background-size: calc(100% / 10) 100%;
  background-position: 0 0;
`;

// Timeline Tracks Wrapper
const TimelineTracksWrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100% - 60px);
  overflow: hidden;
`;

// Enhanced ClipItem with better visual feedback
const ClipItem = styled.div<{
  left: number;
  width: number;
  isSelected?: boolean;
  type?: string;
  zIndex?: number;
  $isDragging?: boolean;
  isGrouped?: boolean;
  isCutting?: boolean;
}>`
  position: absolute;
  left: ${props => props.left}px;
  width: ${props => props.width}px;
  height: 50px;
  background-color: ${props => getClipColor(props.type || 'default')};
  border: 2px solid ${props => props.isSelected ? 'var(--primary-color)' : 'transparent'};
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  box-sizing: border-box;
  z-index: ${props => props.zIndex || 1};
  opacity: ${props => props.$isDragging ? 0.7 : 1};
  transform: ${props => props.$isDragging ? 'scale(1.02)' : 'scale(1)'};
  transition: transform 0.1s ease, opacity 0.1s ease;
  box-shadow: ${props => props.isSelected ? '0 0 0 2px var(--primary-color)' : 'none'};
  
  ${props => props.isGrouped && `
    border-left: 4px solid var(--accent-color);
  `}
  
  ${props => props.isCutting && `
    border: 2px dashed var(--warning-color);
  `}
`;

const ClipHandle = styled.div<{ isStart?: boolean }>`
  position: absolute;
  top: 0;
  ${props => props.isStart ? 'left: 0' : 'right: 0'};
  width: 8px;
  height: 100%;
  cursor: ew-resize;
  opacity: 0;
  transition: opacity 0.2s ease, background-color 0.2s ease;
  
  &:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.5);
  }
  
  &:active {
    background-color: rgba(255, 255, 255, 0.7);
  }
`;

const ClipContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  width: 100%;
`;

const ClipIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ClipTitle = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const ClipDuration = styled.div`
  font-size: 0.7rem;
  opacity: 0.8;
  margin-left: auto;
  padding-left: var(--spacing-xs);
`;

// Playhead - Enhanced with better visibility
const PlayheadMarker = styled.div<{ position: number }>`
  position: absolute;
  top: 0;
  left: ${props => props.position}%;
  width: 2px;
  height: 100%;
  background-color: var(--accent-color);
  z-index: 100;
  pointer-events: none;
  box-shadow: 0 0 4px rgba(255, 64, 129, 0.5);
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid var(--accent-color);
  }
`;

// Controls - Enhanced with more playback options
const TimelineControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-color);
`;

const PlaybackControls = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

const TimeDisplay = styled.div`
  font-size: 0.9rem;
  color: var(--text-primary);
  font-family: monospace;
  margin: 0 var(--spacing-sm);
  background-color: var(--background-dark);
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
`;

const ControlButton = styled.button<{ active?: boolean }>`
  background-color: var(--background-dark);
  color: var(--text-primary);
  border: none;
  border-radius: var(--border-radius-sm);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: var(--background-darker);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  ${props => props.active && `
    background-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  `}
`;

const SpeedControl = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-left: var(--spacing-md);
`;

const SpeedButton = styled.button<{ active?: boolean }>`
  background-color: ${props => props.active ? 'var(--primary-color)' : 'var(--background-dark)'};
  color: ${props => props.active ? 'white' : 'var(--text-primary)'};
  border: none;
  border-radius: var(--border-radius-xs);
  padding: 2px 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? 'var(--primary-color)' : 'var(--background-darker)'};
  }
`;

const ZoomControls = styled.div`
  display: flex;
  gap: var(--spacing-xs);
`;

// Minimap for timeline navigation
const TimelineMinimap = styled.div`
  height: 20px;
  background-color: var(--background-dark);
  border-radius: var(--border-radius-sm);
  margin-top: var(--spacing-sm);
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-color);
`;

const MinimapViewport = styled.div<{ left: number; width: number }>`
  position: absolute;
  height: 100%;
  left: ${props => props.left}%;
  width: ${props => props.width}%;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--primary-color);
  cursor: move;
`;

// Keyboard shortcut tooltip
const KeyboardShortcut = styled.span`
  display: inline-block;
  background-color: var(--background-dark);
  color: var(--text-light);
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 0.7rem;
  margin-left: auto;
  opacity: 0.7;
`;

// Selection overlay for multi-select
const SelectionOverlay = styled.div<{
  left: number;
  top: number;
  width: number;
  height: number;
}>`
  position: absolute;
  left: ${props => props.left}px;
  top: ${props => props.top}px;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: rgba(var(--primary-rgb), 0.2);
  border: 1px solid var(--primary-color);
  pointer-events: none;
  z-index: 100;
`;

// Snap indicator
const SnapIndicator = styled.div<{ position: number }>`
  position: absolute;
  left: ${props => props.position}%;
  top: 0;
  height: 100%;
  width: 2px;
  background-color: var(--accent-color);
  opacity: 0.7;
  pointer-events: none;
  z-index: 50;
  animation: pulse 0.5s ease-in-out;
  
  @keyframes pulse {
    0% { opacity: 0.7; }
    50% { opacity: 1; }
    100% { opacity: 0.7; }
  }
`;

// Enhanced context menu with more options
const ContextMenu = styled.div<{ x: number; y: number }>`
  position: fixed;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  background-color: var(--background-light);
  border-radius: var(--border-radius-sm);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-xs);
  z-index: 1000;
  min-width: 200px;
  border: 1px solid var(--border-color);
`;

const ContextMenuSection = styled.div`
  margin-bottom: var(--spacing-xs);
`;

const ContextMenuHeader = styled.div`
  font-size: 0.8rem;
  color: var(--text-muted);
  padding: var(--spacing-xs) var(--spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ContextMenuItem = styled.div`
  padding: var(--spacing-xs) var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  border-radius: var(--border-radius-xs);
  font-size: 0.9rem;
  
  &:hover {
    background-color: var(--background-medium);
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      background-color: transparent;
    }
  }
  
  svg {
    font-size: 0.9rem;
    opacity: 0.8;
  }
`;

const ContextMenuDivider = styled.div`
  height: 1px;
  background-color: var(--border-color);
  margin: var(--spacing-xs) 0;
`;

// Track Types
type TrackType = 'video' | 'image' | 'text' | 'audio';

interface Track {
  id: string;
  type: TrackType;
  name: string;
  items: MediaItem[];
  isVisible: boolean;
  isLocked: boolean;
  isCollapsed?: boolean;
}

// Timeline Props
interface TimelineProps {
  duration: number;
  currentTime: number;
  trimRange?: TrimRange;
  onTrimChange?: (range: TrimRange) => void;
  onSeek: (time: number) => void;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  mediaItems?: MediaItem[];
  selectedItemId?: string | null;
  onItemSelect?: (id: string | null) => void;
  initialHeight?: number;
  // Advanced clip management callbacks
  onMultiSelect?: (ids: string[]) => void;
  onItemDelete?: (ids: string[]) => void;
  onItemDuplicate?: (ids: string[]) => void;
  onItemSplit?: (id: string, splitPoint: number) => void;
  onItemGroup?: (ids: string[]) => void;
  onItemUngroup?: (ids: string[]) => void;
  onItemArrange?: (ids: string[], direction: 'forward' | 'backward') => void;
  // Advanced playback controls
  playbackSpeed?: number;
  onPlaybackSpeedChange?: (speed: number) => void;
  isLooping?: boolean;
  onLoopToggle?: () => void;
  loopRange?: TrimRange;
  onLoopRangeChange?: (range: TrimRange) => void;
  onLoopingChange?: (value: boolean) => void;
}

// Add new styled components for clip operations toolbar
const ClipOperationsToolbar = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
  display: ${props => props.$visible ? 'flex' : 'none'};
  gap: 8px;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  
  &:before {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 8px;
    border-style: solid;
    border-color: var(--border-color) transparent transparent transparent;
  }
`;

const ClipOperationButton = styled.button`
  background: var(--background-medium);
  border: none;
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  padding: var(--spacing-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background: var(--background-light);
  }
  
  &:active {
    transform: translateY(1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Add getClipColor function
const getClipColor = (type: string): string => {
  switch (type) {
    case 'video':
      return 'var(--video-gradient-start)';
    case 'image':
      return 'var(--image-gradient-start)';
    case 'text':
      return 'var(--text-gradient-start)';
    case 'audio':
      return 'var(--audio-gradient-start)';
    default:
      return 'var(--background-dark)';
  }
};

const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  trimRange = { start: 0, end: duration },
  onTrimChange = () => { },
  onSeek,
  isPlaying = false,
  onPlayPause = () => { },
  mediaItems = [],
  selectedItemId = null,
  onItemSelect = () => { },
  initialHeight = 300,
  // Advanced clip management callbacks
  onMultiSelect = () => { },
  onItemDelete = () => { },
  onItemDuplicate = () => { },
  onItemSplit = () => { },
  onItemGroup = () => { },
  onItemUngroup = () => { },
  onItemArrange = () => { },
  // Advanced playback controls
  playbackSpeed = 1,
  onPlaybackSpeedChange = () => { },
  isLooping = false,
  onLoopToggle = () => { },
  loopRange = { start: 0, end: duration },
  onLoopRangeChange = () => { },
  onLoopingChange = () => { }
}) => {
  // Refs
  const tracksContainerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [zoom, setZoom] = useState(1);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [isDraggingClip, setIsDraggingClip] = useState(false);
  const [isDraggingClipStart, setIsDraggingClipStart] = useState(false);
  const [isDraggingClipEnd, setIsDraggingClipEnd] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [dragStartDuration, setDragStartDuration] = useState(0);
  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);
  const [minimapStartX, setMinimapStartX] = useState(0);
  const [timeScale, setTimeScale] = useState<'seconds' | 'frames'>('seconds');
  const [showWaveforms, setShowWaveforms] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [timelineHeight, setTimelineHeight] = useState(initialHeight);
  const [isCompactMode, setIsCompactMode] = useState(false);

  // Track state
  const [trackStates, setTrackStates] = useState<{ [key: string]: { isCollapsed: boolean, isVisible: boolean, isLocked: boolean } }>({
    'video-track': { isCollapsed: false, isVisible: true, isLocked: false },
    'image-track': { isCollapsed: false, isVisible: true, isLocked: false },
    'text-track': { isCollapsed: false, isVisible: true, isLocked: false },
  });

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ show: boolean; x: number; y: number; itemId: string | null }>({
    show: false,
    x: 0,
    y: 0,
    itemId: null
  });

  // Multi-select state
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    isSelecting: boolean
  }>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    isSelecting: false
  });

  // Snapping state
  const [isSnappingEnabled, setIsSnappingEnabled] = useState(true);
  const [snapPoints, setSnapPoints] = useState<number[]>([]);
  const [activeSnapPoint, setActiveSnapPoint] = useState<number | null>(null);

  // Clipboard state
  const [clipboard, setClipboard] = useState<MediaItem[]>([]);

  // Add new state for drag and drop
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    itemId: string | null;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    offsetX: number;
    offsetY: number;
    sourceTrackId: string | null;
    targetTrackId: string | null;
    dropPosition: number | null;
    ghostWidth: number;
    ghostHeight: number;
    itemType: string;
  }>({
    isDragging: false,
    itemId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    offsetX: 0,
    offsetY: 0,
    sourceTrackId: null,
    targetTrackId: null,
    dropPosition: null,
    ghostWidth: 0,
    ghostHeight: 0,
    itemType: ''
  });

  // Add state for cut mode
  const [isCutMode, setIsCutMode] = useState(false);

  // Add new state for clip operations toolbar
  const [showClipOperations, setShowClipOperations] = useState(false);

  // Add isTimelineFocused state
  const [isTimelineFocused, setIsTimelineFocused] = useState(false);

  // Organize media items into tracks
  const tracks: Track[] = [
    {
      id: 'video-track',
      type: 'video',
      name: 'Video',
      items: mediaItems.filter(item => item.type === 'video'),
      isVisible: trackStates['video-track']?.isVisible ?? true,
      isLocked: trackStates['video-track']?.isLocked ?? false,
      isCollapsed: trackStates['video-track']?.isCollapsed ?? false
    },
    {
      id: 'image-track',
      type: 'image',
      name: 'Images',
      items: mediaItems.filter(item => item.type === 'image'),
      isVisible: trackStates['image-track']?.isVisible ?? true,
      isLocked: trackStates['image-track']?.isLocked ?? false,
      isCollapsed: trackStates['image-track']?.isCollapsed ?? false
    },
    {
      id: 'text-track',
      type: 'text',
      name: 'Text',
      items: mediaItems.filter(item => item.type === 'text'),
      isVisible: trackStates['text-track']?.isVisible ?? true,
      isLocked: trackStates['text-track']?.isLocked ?? false,
      isCollapsed: trackStates['text-track']?.isCollapsed ?? false
    }
  ];

  // Calculate time markers based on duration, zoom and time scale
  const timeMarkers = [];
  let markerInterval = Math.max(1, Math.floor(duration / (10 * zoom)));

  // Adjust marker interval based on zoom level
  if (zoom > 2) {
    markerInterval = Math.max(0.5, markerInterval);
  } else if (zoom > 4) {
    markerInterval = Math.max(0.1, markerInterval);
  }

  for (let i = 0; i <= duration; i += markerInterval) {
    timeMarkers.push({
      time: i,
      position: (i / duration) * 100
    });
  }

  // Format time based on the selected time scale
  const formatTime = (seconds: number): string => {
    if (timeScale === 'frames') {
      // Assuming 30fps
      const frames = Math.floor(seconds * 30);
      const mins = Math.floor(frames / (30 * 60));
      const secs = Math.floor((frames % (30 * 60)) / 30);
      const frameNum = frames % 30;
      return `${mins}:${secs.toString().padStart(2, '0')}:${frameNum.toString().padStart(2, '0')}`;
    } else {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 100);
      return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
  };

  // Calculate percentages for positioning
  const currentTimePercent = (currentTime / duration) * 100;
  const viewportWidth = 100 / zoom;
  const viewportLeft = Math.min(100 - viewportWidth, Math.max(0, (currentTimePercent - viewportWidth / 2)));

  // Toggle track collapse state
  const toggleTrackCollapse = (trackId: string) => {
    setTrackStates(prev => ({
      ...prev,
      [trackId]: {
        ...prev[trackId],
        isCollapsed: !prev[trackId]?.isCollapsed
      }
    }));
  };

  // Toggle track visibility
  const toggleTrackVisibility = (trackId: string) => {
    setTrackStates(prev => ({
      ...prev,
      [trackId]: {
        ...prev[trackId],
        isVisible: !prev[trackId]?.isVisible
      }
    }));
  };

  // Toggle track lock state
  const toggleTrackLock = (trackId: string) => {
    setTrackStates(prev => ({
      ...prev,
      [trackId]: {
        ...prev[trackId],
        isLocked: !prev[trackId]?.isLocked
      }
    }));
  };

  // Handle track click for seeking
  const handleTrackClick = (e: React.MouseEvent) => {
    // Only handle clicks directly on the track, not on clips
    if ((e.target as HTMLElement).closest('.clip-item')) return;

    // Also handle seeking when clicking on the track
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;

    onSeek(newTime);

    // Clear selection
    onItemSelect(null);
    setSelectedItemIds([]);
    setShowClipOperations(false);
  };

  // Handle playhead drag
  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingPlayhead(true);

    if (isPlaying) {
      onPlayPause();
    }
  };

  // Handle frame-by-frame navigation
  const handlePrevFrame = () => {
    // Assuming 30fps, move back 1/30th of a second
    const frameTime = 1 / 30;
    const newTime = Math.max(0, currentTime - frameTime);
    onSeek(newTime);
  };

  const handleNextFrame = () => {
    // Assuming 30fps, move forward 1/30th of a second
    const frameTime = 1 / 30;
    const newTime = Math.min(duration, currentTime + frameTime);
    onSeek(newTime);
  };

  // Handle jump forward/backward
  const handleJumpBack = () => {
    // Jump back 5 seconds
    const newTime = Math.max(0, currentTime - 5);
    onSeek(newTime);
  };

  const handleJumpForward = () => {
    // Jump forward 5 seconds
    const newTime = Math.min(duration, currentTime + 5);
    onSeek(newTime);
  };

  // Enhanced clip mouse down handler for drag and drop
  const handleClipMouseDown = (e: React.MouseEvent, itemId: string, trackId: string) => {
    if (e.button !== 0) return; // Only handle left mouse button

    // Find the item
    let item: MediaItem | undefined;
    let track: Track | undefined;

    tracks.forEach(t => {
      if (t.id === trackId) {
        track = t;
        const foundItem = t.items.find(i => i.id === itemId);
        if (foundItem) item = foundItem;
      }
    });

    if (!item || !track) return;

    // Calculate clip dimensions
    const clipRect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    // Select the item if not already selected
    if (!selectedItemIds.includes(itemId)) {
      if (!e.shiftKey) {
        setSelectedItemIds([itemId]);
        onItemSelect(itemId);
      } else {
        setSelectedItemIds(prev => [...prev, itemId]);
        onMultiSelect([...selectedItemIds, itemId]);
      }
    }

    // Set up drag state
    setDragState({
      isDragging: true,
      itemId,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      offsetX: e.clientX - clipRect.left,
      offsetY: e.clientY - clipRect.top,
      sourceTrackId: trackId,
      targetTrackId: null,
      dropPosition: null,
      ghostWidth: clipRect.width,
      ghostHeight: clipRect.height,
      itemType: item.type
    });

    // Add event listeners for drag
    const handleMouseMove = (e: MouseEvent) => {
      setDragState(prev => ({
        ...prev,
        currentX: e.clientX,
        currentY: e.clientY
      }));

      // Find target track based on mouse position
      const tracksContainer = tracksContainerRef.current;
      if (!tracksContainer) return;

      const containerRect = tracksContainer.getBoundingClientRect();
      const relativeY = e.clientY - containerRect.top;

      // Find the track at this Y position
      const trackHeight = 60; // This should match your track height
      const trackIndex = Math.floor(relativeY / trackHeight);
      const targetTrack = tracks[trackIndex];

      // Calculate drop position as percentage of timeline width
      const relativeX = e.clientX - containerRect.left;
      const dropPosition = (relativeX / containerRect.width) * 100;

      setDragState(prev => ({
        ...prev,
        targetTrackId: targetTrack?.id || null,
        dropPosition: dropPosition
      }));
    };

    const handleMouseUp = () => {
      if (dragState.isDragging && dragState.targetTrackId && dragState.dropPosition !== null) {
        // Handle the drop - move the clip to the new position
        // This would involve updating the clip's track and position
        console.log(`Moving clip ${dragState.itemId} to track ${dragState.targetTrackId} at position ${dragState.dropPosition}%`);

        // In a real implementation, you would:
        // 1. Calculate the new start time based on the drop position
        // 2. Update the clip's track ID
        // 3. Update the clip's position
        // 4. Emit an event to the parent component to handle the actual move
      }

      setDragState({
        isDragging: false,
        itemId: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        offsetX: 0,
        offsetY: 0,
        sourceTrackId: null,
        targetTrackId: null,
        dropPosition: null,
        ghostWidth: 0,
        ghostHeight: 0,
        itemType: ''
      });

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Toggle cut mode
  const toggleCutMode = () => {
    setIsCutMode(prev => !prev);
  };

  // Enhanced clip click handler for cut mode
  const handleClipClick = (e: React.MouseEvent, itemId: string) => {
    if (isCutMode) {
      // In cut mode, clicking a clip will split it at the playhead
      if (selectedItemId === itemId) {
        onItemSplit(itemId, currentTime);
        setIsCutMode(false); // Exit cut mode after splitting
      }
      return;
    }

    // Normal selection behavior
    if (!e.shiftKey) {
      setSelectedItemIds([itemId]);
      onItemSelect(itemId);
    } else {
      if (selectedItemIds.includes(itemId)) {
        setSelectedItemIds(prev => prev.filter(id => id !== itemId));
        if (selectedItemId === itemId) {
          onItemSelect(null);
        }
      } else {
        setSelectedItemIds(prev => [...prev, itemId]);
        onMultiSelect([...selectedItemIds, itemId]);
      }
    }

    // Show clip operations toolbar
    setShowClipOperations(true);
  };

  // Handle minimap drag start
  const handleMinimapMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingMinimap(true);
    setMinimapStartX(e.clientX);
  };

  // Handle zoom
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 10));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  // Toggle time scale
  const toggleTimeScale = () => {
    setTimeScale(prev => prev === 'seconds' ? 'frames' : 'seconds');
  };

  // Toggle waveform display
  const toggleWaveforms = () => {
    setShowWaveforms(prev => !prev);
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeStartY(e.clientY);
  };

  // Toggle compact mode
  const toggleCompactMode = () => {
    if (isCompactMode) {
      // Restore previous height
      setIsCompactMode(false);
    } else {
      // Set to compact mode (minimal height)
      setIsCompactMode(true);
    }
  };

  // Effect for resize handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && containerRef.current) {
        const deltaY = resizeStartY - e.clientY;
        const newHeight = Math.max(120, Math.min(500, timelineHeight + deltaY));
        setTimelineHeight(newHeight);
        setResizeStartY(e.clientY);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStartY, timelineHeight]);

  // Effect for compact mode
  useEffect(() => {
    if (isCompactMode) {
      setTimelineHeight(120); // Minimal height in compact mode
    } else {
      setTimelineHeight(initialHeight);
    }
  }, [isCompactMode, initialHeight]);

  // Update selectedItemIds when selectedItemId changes
  useEffect(() => {
    if (selectedItemId && !selectedItemIds.includes(selectedItemId)) {
      setSelectedItemIds([selectedItemId]);
    } else if (!selectedItemId) {
      setSelectedItemIds([]);
    }
  }, [selectedItemId]);

  // Calculate snap points
  useEffect(() => {
    if (!isSnappingEnabled) {
      setSnapPoints([]);
      return;
    }

    const points: number[] = [0, 100]; // Start and end of timeline

    // Add playhead position
    points.push(currentTimePercent);

    // Add clip boundaries
    tracks.forEach(track => {
      track.items.forEach(item => {
        // In a real implementation, these would be calculated based on item start/end times
        points.push(0); // Start of clip
        points.push(100); // End of clip
      });
    });

    setSnapPoints([...new Set(points)].sort((a, b) => a - b));
  }, [tracks, currentTimePercent, isSnappingEnabled]);

  // Handle multi-select with selection box
  const handleSelectionStart = (e: React.MouseEvent) => {
    if (!tracksContainerRef.current) return;

    // Skip if right-clicking (for context menu)
    if (e.button === 2) return;

    const rect = tracksContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSelectionBox({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      isSelecting: true
    });

    // If not holding shift, clear current selection
    if (!e.shiftKey) {
      setSelectedItemIds([]);
      onItemSelect(null);
    }

    setIsMultiSelectMode(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!tracksContainerRef.current) return;

      const rect = tracksContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setSelectionBox(prev => ({
        ...prev,
        endX: x,
        endY: y
      }));

      // Determine which clips are within the selection box
      const selectionRect = {
        left: Math.min(selectionBox.startX, x),
        top: Math.min(selectionBox.startY, y),
        right: Math.max(selectionBox.startX, x),
        bottom: Math.max(selectionBox.startY, y)
      };

      // In a real implementation, you would check each clip's position against the selection rectangle
      // and update selectedItemIds accordingly
      const selectedIds: string[] = [];

      // For demonstration, we'll just select any clip that's in the current view
      // In a real implementation, you would check the actual position of each clip
      tracks.forEach(track => {
        track.items.forEach(item => {
          // This is a simplified check - in a real implementation, you would check
          // if the clip's visual representation intersects with the selection rectangle
          selectedIds.push(item.id);
        });
      });

      if (selectedIds.length > 0) {
        setSelectedItemIds(selectedIds);
        onMultiSelect(selectedIds);
      }
    };

    const handleMouseUp = () => {
      setSelectionBox(prev => ({
        ...prev,
        isSelecting: false
      }));

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Find nearest snap point
  const findNearestSnapPoint = (position: number): number | null => {
    if (!isSnappingEnabled || snapPoints.length === 0) return null;

    const snapThreshold = 2; // Percentage of timeline width
    let nearestPoint = null;
    let minDistance = snapThreshold;

    for (const point of snapPoints) {
      const distance = Math.abs(position - point);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }

    return nearestPoint;
  };

  // Handle clipboard operations
  const handleCopy = () => {
    const itemsToCopy: MediaItem[] = [];

    // Find all selected items
    tracks.forEach(track => {
      track.items.forEach(item => {
        if (selectedItemIds.includes(item.id)) {
          itemsToCopy.push(item);
        }
      });
    });

    setClipboard(itemsToCopy);
    console.log(`Copied ${itemsToCopy.length} items to clipboard`);
  };

  const handlePaste = () => {
    if (clipboard.length === 0) return;

    // In a real implementation, you would:
    // 1. Create new items based on the clipboard items (with new IDs)
    // 2. Position them at the playhead or cursor position
    // 3. Add them to the appropriate tracks

    console.log(`Pasting ${clipboard.length} items from clipboard`);

    // This is a placeholder for the actual implementation
    // You would need to emit an event to the parent component to handle the actual pasting
  };

  // Handle group/ungroup operations
  const handleGroup = () => {
    if (selectedItemIds.length <= 1) return;

    // In a real implementation, you would:
    // 1. Create a group that contains all selected items
    // 2. Update the data structure to reflect the grouping

    console.log(`Grouping ${selectedItemIds.length} items`);

    // This is a placeholder for the actual implementation
    // You would need to emit an event to the parent component to handle the actual grouping
  };

  const handleUngroup = () => {
    // In a real implementation, you would:
    // 1. Find the selected group
    // 2. Extract all items from the group
    // 3. Update the data structure to reflect the ungrouping

    console.log(`Ungrouping selected items`);

    // This is a placeholder for the actual implementation
    // You would need to emit an event to the parent component to handle the actual ungrouping
  };

  // Toggle snapping
  const toggleSnapping = () => {
    setIsSnappingEnabled(prev => !prev);
  };

  // Enhanced context menu
  const handleClipContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      itemId
    });

    // If not holding shift and clicking on an unselected item, clear selection and select this item
    if (!e.shiftKey && !selectedItemIds.includes(itemId)) {
      setSelectedItemIds([itemId]);
      onItemSelect(itemId);
    }
    // If holding shift, toggle this item in the selection
    else if (e.shiftKey) {
      if (selectedItemIds.includes(itemId)) {
        setSelectedItemIds(prev => prev.filter(id => id !== itemId));
        if (selectedItemId === itemId) {
          onItemSelect(null);
        }
      } else {
        setSelectedItemIds(prev => [...prev, itemId]);
        onItemSelect(itemId);
      }
    }
  };

  // Enhanced context menu actions
  const handleContextMenuAction = (action: string) => {
    if (!contextMenu.itemId && selectedItemIds.length === 0) return;

    switch (action) {
      case 'delete':
        onItemDelete(selectedItemIds);
        break;
      case 'duplicate':
        onItemDuplicate(selectedItemIds);
        break;
      case 'copy':
        handleCopy();
        break;
      case 'paste':
        handlePaste();
        break;
      case 'cut':
        handleCopy();
        onItemDelete(selectedItemIds);
        break;
      case 'split':
        if (selectedItemId) {
          onItemSplit(selectedItemId, currentTime);
        }
        break;
      case 'group':
        onItemGroup(selectedItemIds);
        break;
      case 'ungroup':
        onItemUngroup(selectedItemIds);
        break;
      case 'bringForward':
        onItemArrange(selectedItemIds, 'forward');
        break;
      case 'sendBackward':
        onItemArrange(selectedItemIds, 'backward');
        break;
      default:
        break;
    }

    // Close the context menu after action
    handleCloseContextMenu();
  };

  // Close context menu
  const handleCloseContextMenu = () => {
    setContextMenu({ ...contextMenu, show: false });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        handleCloseContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.show]);

  // Add a new function to handle clip duplication
  const handleDuplicateClip = () => {
    if (selectedItemIds.length === 0) return;

    // Call the parent component's duplicate function
    onItemDuplicate(selectedItemIds);
    console.log(`Duplicating ${selectedItemIds.length} clips`);
  };

  // Add a new function to handle clip deletion
  const handleDeleteClips = () => {
    if (selectedItemIds.length === 0) return;

    // Call the parent component's delete function
    onItemDelete(selectedItemIds);
    console.log(`Deleting ${selectedItemIds.length} clips`);
  };

  // Add keyboard shortcuts for timeline operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process shortcuts if timeline is focused
      if (!isTimelineFocused) return;

      // Prevent default for all handled shortcuts
      if (['Delete', 'Backspace', 'd', 's', 'g', 'u', ' ', '1', '2', '3', '4', 'l'].includes(e.key)) {
        e.preventDefault();
      }

      // Handle keyboard shortcuts
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          handleDeleteClips();
          break;
        case 'd':
          if (e.ctrlKey || e.metaKey) {
            handleDuplicateClip();
          }
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            handleSplitClip();
          }
          break;
        case 'g':
          if (e.ctrlKey || e.metaKey) {
            onItemGroup(selectedItemIds);
          }
          break;
        case 'u':
          if (e.ctrlKey || e.metaKey) {
            onItemUngroup(selectedItemIds);
          }
          break;
        case ' ':
          onPlayPause();
          break;
        case '1':
          handleSpeedChange(0.5);
          break;
        case '2':
          handleSpeedChange(1.0);
          break;
        case '3':
          handleSpeedChange(1.5);
          break;
        case '4':
          handleSpeedChange(2.0);
          break;
        case 'l':
          toggleLooping();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isTimelineFocused,
    selectedItemIds,
    selectedItemId,
    currentTime,
    onItemDuplicate,
    onItemDelete,
    onItemSplit,
    onItemGroup,
    onItemUngroup,
    onPlayPause,
    playbackSpeed,
    isLooping,
    loopRange,
    isCutMode
  ]);

  // Handle playback speed change
  const handleSpeedChange = (speed: number) => {
    onPlaybackSpeedChange(speed);
  };

  // Add new styled components for loop control
  const LoopControl = styled.div`
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    margin-left: var(--spacing-md);
  `;

  const LoopButton = styled(ControlButton) <{ active?: boolean }>`
    background-color: ${props => props.active ? 'var(--primary-color)' : 'var(--background-dark)'};
    color: ${props => props.active ? 'white' : 'var(--text-primary)'};
  `;

  const LoopRangeIndicator = styled.div<{ startPercent: number; endPercent: number }>`
    position: absolute;
    top: 0;
    left: ${props => props.startPercent}%;
    width: ${props => props.endPercent - props.startPercent}%;
    height: 4px;
    background-color: var(--accent-color);
    opacity: 0.7;
    z-index: 50;
  `;

  // Add new state for loop control
  const [isSettingLoopStart, setIsSettingLoopStart] = useState(false);
  const [isSettingLoopEnd, setIsSettingLoopEnd] = useState(false);

  // Add new handlers for loop control
  const handleLoopToggle = () => {
    onLoopToggle();
  };

  const handleSetLoopStart = () => {
    setIsSettingLoopStart(true);
    setIsSettingLoopEnd(false);
    onLoopRangeChange({ ...loopRange, start: currentTime });
  };

  const handleSetLoopEnd = () => {
    setIsSettingLoopStart(false);
    setIsSettingLoopEnd(true);
    onLoopRangeChange({ ...loopRange, end: currentTime });
  };

  const handleClearLoopRange = () => {
    setIsSettingLoopStart(false);
    setIsSettingLoopEnd(false);
    onLoopRangeChange({ start: 0, end: duration });
  };

  // Add new styled components for drag and drop indicators
  const TrackDropIndicator = styled.div<{ position: number }>`
    position: absolute;
    left: ${props => props.position}%;
    height: 100%;
    width: 3px;
    background-color: var(--primary-color);
    z-index: 100;
    pointer-events: none;
  `;

  const TrackDropHighlight = styled.div`
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: var(--primary-color);
    opacity: 0.1;
    pointer-events: none;
  `;

  // Add new styled component for clip ghost during drag
  const ClipGhost = styled.div<{
    left: number;
    top: number;
    width: number;
    height: number;
    type: string;
  }>`
    position: fixed;
    left: ${props => props.left}px;
    top: ${props => props.top}px;
    width: ${props => props.width}px;
    height: ${props => props.height}px;
    background: ${props => {
      if (props.type === 'video') return 'linear-gradient(to bottom, var(--video-gradient-start), var(--video-gradient-end))';
      if (props.type === 'image') return 'linear-gradient(to bottom, var(--image-gradient-start), var(--image-gradient-end))';
      if (props.type === 'text') return 'linear-gradient(to bottom, var(--text-gradient-start), var(--text-gradient-end))';
      if (props.type === 'audio') return 'linear-gradient(to bottom, var(--audio-gradient-start), var(--audio-gradient-end))';
      return 'var(--background-dark)';
    }};
    border-radius: var(--border-radius-sm);
    opacity: 0.7;
    pointer-events: none;
    z-index: 9999;
    box-shadow: var(--shadow-lg);
  `;

  // Add a new function to handle clip movement between tracks
  const handleMoveClipToTrack = (clipId: string, sourceTrackId: string, targetTrackId: string, newPosition: number) => {
    // This would be implemented to move a clip from one track to another
    // and update its position within the timeline
    console.log(`Moving clip ${clipId} from track ${sourceTrackId} to track ${targetTrackId} at position ${newPosition}%`);

    // In a real implementation, you would:
    // 1. Find the clip in the source track
    // 2. Remove it from the source track
    // 3. Add it to the target track
    // 4. Update its position based on the new position percentage
    // 5. Emit an event to the parent component to handle the actual move
  };

  // Add a new function to handle clip splitting
  const handleSplitClip = () => {
    if (!selectedItemId) return;

    // Find the selected clip
    let selectedClip: MediaItem | undefined;
    let trackId: string | undefined;

    tracks.forEach(track => {
      const clip = track.items.find(item => item.id === selectedItemId);
      if (clip) {
        selectedClip = clip;
        trackId = track.id;
      }
    });

    if (!selectedClip || !trackId) return;

    // Call the parent component's split function
    onItemSplit(selectedItemId, currentTime);
    console.log(`Split clip ${selectedItemId} at ${currentTime}s`);
  };

  // Add a function to hide the clip operations toolbar
  const hideClipOperations = () => {
    setShowClipOperations(false);
  };

  // Add focus handlers
  const handleTimelineFocus = () => {
    setIsTimelineFocused(true);
  };

  const handleTimelineBlur = () => {
    setIsTimelineFocused(false);
  };

  // Replace setIsLooping with a proper function
  const toggleLooping = () => {
    setIsLooping(!isLooping);
  };

  // Add setIsLooping function
  const setIsLooping = (value: boolean) => {
    onLoopingChange(value);
  };

  return (
    <TimelineContainer
      ref={containerRef}
      height={timelineHeight}
      onFocus={handleTimelineFocus}
      onBlur={handleTimelineBlur}
      tabIndex={0}
    >
      <ResizeHandle
        onMouseDown={handleResizeStart}
        title="Drag to resize timeline"
      >
        <FaGripLines />
      </ResizeHandle>

      <CompactModeToggle
        onClick={toggleCompactMode}
        title={isCompactMode ? "Expand timeline" : "Collapse timeline"}
      >
        {isCompactMode ? "Expand" : "Collapse"}
      </CompactModeToggle>

      <TimelineHeader>
        <TimelineTitle>
          <FaLayerGroup size={16} />
          Timeline
        </TimelineTitle>
        <PlaybackControls>
          <ControlButton onClick={handleJumpBack} title="Jump back 5 seconds">
            <FaFastBackward size={12} />
          </ControlButton>
          <ControlButton onClick={handlePrevFrame} title="Previous frame">
            <FaStepBackward size={12} />
          </ControlButton>
          <ControlButton onClick={onPlayPause} title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </ControlButton>
          <ControlButton onClick={handleNextFrame} title="Next frame">
            <FaStepForward size={12} />
          </ControlButton>
          <ControlButton onClick={handleJumpForward} title="Jump forward 5 seconds">
            <FaFastForward size={12} />
          </ControlButton>
          <TimeDisplay onClick={toggleTimeScale} title="Click to toggle time format">
            {formatTime(currentTime)} / {formatTime(duration)}
          </TimeDisplay>

          <SpeedControl>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Speed:</span>
            <SpeedButton
              active={playbackSpeed === 0.5}
              onClick={() => handleSpeedChange(0.5)}
              title="0.5x speed (0)"
            >
              0.5x
            </SpeedButton>
            <SpeedButton
              active={playbackSpeed === 1}
              onClick={() => handleSpeedChange(1)}
              title="Normal speed (1)"
            >
              1x
            </SpeedButton>
            <SpeedButton
              active={playbackSpeed === 1.5}
              onClick={() => handleSpeedChange(1.5)}
              title="1.5x speed (2)"
            >
              1.5x
            </SpeedButton>
            <SpeedButton
              active={playbackSpeed === 2}
              onClick={() => handleSpeedChange(2)}
              title="2x speed (3)"
            >
              2x
            </SpeedButton>
          </SpeedControl>

          <LoopControl>
            <LoopButton
              active={isLooping}
              onClick={handleLoopToggle}
              title="Toggle loop playback (L)"
            >
              <FaRedo size={12} />
            </LoopButton>
            <ControlButton
              onClick={handleSetLoopStart}
              title="Set loop start point ([)"
            >
              [
            </ControlButton>
            <ControlButton
              onClick={handleSetLoopEnd}
              title="Set loop end point (])"
            >
              ]
            </ControlButton>
            <ControlButton
              onClick={handleClearLoopRange}
              title="Clear loop range (\\)"
            >
              ×
            </ControlButton>
          </LoopControl>
        </PlaybackControls>
      </TimelineHeader>

      {!isCompactMode && (
        <>
          <TimeRuler>
            <TimeMarkers>
              {timeMarkers.map(marker => (
                <TimeMarker
                  key={marker.time}
                  style={{ left: `${marker.position}%` }}
                >
                  {formatTime(marker.time)}
                </TimeMarker>
              ))}
            </TimeMarkers>
          </TimeRuler>

          <TimelineTracksWrapper>
            <TracksContainer
              ref={tracksContainerRef}
              onMouseDown={handleSelectionStart}
            >
              {tracks.map(trackItem => (
                <TimelineTrack
                  key={trackItem.id}
                  style={{
                    height: trackItem.isCollapsed ? '30px' : '60px',
                    opacity: trackItem.isVisible ? 1 : 0.5
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      width: `${100 * zoom}%`,
                      height: '100%',
                      minWidth: '100%'
                    }}
                    onClick={handleTrackClick}
                  >
                    {dragState.isDragging && dragState.targetTrackId === trackItem.id && (
                      <TrackDropHighlight />
                    )}

                    {!trackItem.isCollapsed && trackItem.items.map((item: MediaItem) => (
                      <ClipItem
                        key={item.id}
                        left={0}
                        width={100}
                        isSelected={selectedItemIds.includes(item.id)}
                        type={item.type}
                        zIndex={item.zIndex}
                        $isDragging={dragState.isDragging && dragState.itemId === item.id}
                        isGrouped={!!item.groupId}
                        isCutting={isCutMode && selectedItemId === item.id}
                        onClick={(e) => handleClipClick(e, item.id)}
                        onMouseDown={(e) => !trackItem.isLocked && handleClipMouseDown(e, item.id, trackItem.id)}
                        onContextMenu={(e) => handleClipContextMenu(e, item.id)}
                      >
                        <ClipHandle
                          isStart
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            // Handle clip start trim logic here
                          }}
                        />
                        <ClipContent>
                          <ClipIcon>
                            {item.type === 'video' && <FaVideo />}
                            {item.type === 'image' && <FaImage />}
                            {item.type === 'text' && <FaFont />}
                          </ClipIcon>
                          <ClipTitle>
                            {item.type === 'text' ? (item.text || 'Text') : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                          </ClipTitle>
                          <ClipDuration>
                            {formatTime(item.type === 'video' ? duration : 0)}
                          </ClipDuration>
                        </ClipContent>
                        <ClipHandle
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            // Handle clip end trim logic here
                          }}
                        />
                      </ClipItem>
                    ))}

                    {dragState.isDragging && dragState.targetTrackId === trackItem.id && dragState.dropPosition !== null && (
                      <TrackDropIndicator position={dragState.dropPosition} />
                    )}
                  </div>
                </TimelineTrack>
              ))}
            </TracksContainer>
          </TimelineTracksWrapper>

          <TimelineMinimap>
            <MinimapViewport
              left={viewportLeft}
              width={viewportWidth}
              onMouseDown={handleMinimapMouseDown}
            />
          </TimelineMinimap>
        </>
      )}

      <TimelineControls>
        <ZoomControls>
          <ControlButton onClick={handleZoomOut} title="Zoom out">
            <FaMinus />
          </ControlButton>
          <ControlButton onClick={handleZoomReset} title="Reset zoom">
            <FaExpand />
          </ControlButton>
          <ControlButton onClick={handleZoomIn} title="Zoom in">
            <FaPlus />
          </ControlButton>
        </ZoomControls>

        <ControlButton onClick={toggleWaveforms} title={showWaveforms ? "Hide waveforms" : "Show waveforms"}>
          {showWaveforms ? <FaVolumeUp /> : <FaVolumeMute />}
        </ControlButton>

        <ControlButton
          onClick={toggleSnapping}
          title={`${isSnappingEnabled ? 'Disable' : 'Enable'} snapping (S)`}
          active={isSnappingEnabled}
        >
          <FaMagnet />
        </ControlButton>

        <ControlButton
          onClick={toggleCutMode}
          title="Cut mode (X)"
          active={isCutMode}
        >
          <FaCut />
        </ControlButton>

        <ControlButton
          onClick={handleGroup}
          title="Group selected items (Ctrl+G)"
          disabled={selectedItemIds.length <= 1}
        >
          <FaObjectGroup />
        </ControlButton>

        <ControlButton
          onClick={handleUngroup}
          title="Ungroup selected items (Ctrl+Shift+G)"
          disabled={selectedItemIds.length === 0}
        >
          <FaObjectUngroup />
        </ControlButton>
      </TimelineControls>

      {/* Enhanced context menu */}
      {contextMenu.show && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y}>
          <ContextMenuSection>
            <ContextMenuItem onClick={() => handleContextMenuAction('cut')}>
              <FaCut /> Cut <KeyboardShortcut>Ctrl+X</KeyboardShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleContextMenuAction('copy')}>
              <FaCopy /> Copy <KeyboardShortcut>Ctrl+C</KeyboardShortcut>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => handleContextMenuAction('paste')}
              className={clipboard.length === 0 ? 'disabled' : ''}
            >
              <FaPaste /> Paste <KeyboardShortcut>Ctrl+V</KeyboardShortcut>
            </ContextMenuItem>
          </ContextMenuSection>

          <ContextMenuDivider />

          <ContextMenuSection>
            <ContextMenuItem onClick={() => handleContextMenuAction('duplicate')}>
              <FaCopy /> Duplicate
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleContextMenuAction('delete')}>
              <FaTrash /> Delete <KeyboardShortcut>Del</KeyboardShortcut>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => handleContextMenuAction('split')}
              className={!selectedItemId ? 'disabled' : ''}
            >
              <FaCut /> Split at Playhead <KeyboardShortcut>Ctrl+S</KeyboardShortcut>
            </ContextMenuItem>
          </ContextMenuSection>

          <ContextMenuDivider />

          <ContextMenuSection>
            <ContextMenuHeader>Arrange</ContextMenuHeader>
            <ContextMenuItem onClick={() => handleContextMenuAction('bringForward')}>
              <FaArrowUp /> Bring Forward
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleContextMenuAction('sendBackward')}>
              <FaArrowDown /> Send Backward
            </ContextMenuItem>
          </ContextMenuSection>

          <ContextMenuDivider />

          <ContextMenuSection>
            <ContextMenuHeader>Group</ContextMenuHeader>
            <ContextMenuItem
              onClick={() => handleContextMenuAction('group')}
              className={selectedItemIds.length <= 1 ? 'disabled' : ''}
            >
              <FaObjectGroup /> Group Items <KeyboardShortcut>Ctrl+G</KeyboardShortcut>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => handleContextMenuAction('ungroup')}
              className={selectedItemIds.length === 0 ? 'disabled' : ''}
            >
              <FaObjectUngroup /> Ungroup <KeyboardShortcut>Ctrl+Shift+G</KeyboardShortcut>
            </ContextMenuItem>
          </ContextMenuSection>
        </ContextMenu>
      )}

      {/* Add loop range indicator to the timeline */}
      {isLooping && (
        <LoopRangeIndicator
          startPercent={(loopRange.start / duration) * 100}
          endPercent={(loopRange.end / duration) * 100}
        />
      )}

      {/* Drag ghost */}
      {dragState.isDragging && createPortal(
        <ClipGhost
          left={dragState.currentX - dragState.offsetX}
          top={dragState.currentY - dragState.offsetY}
          width={dragState.ghostWidth}
          height={dragState.ghostHeight}
          type={dragState.itemType}
        />,
        document.body
      )}

      {/* Selection overlay */}
      {selectionBox.isSelecting && (
        <SelectionOverlay
          left={Math.min(selectionBox.startX, selectionBox.endX)}
          top={Math.min(selectionBox.startY, selectionBox.endY)}
          width={Math.abs(selectionBox.endX - selectionBox.startX)}
          height={Math.abs(selectionBox.endY - selectionBox.startY)}
        />
      )}

      {/* Snap indicator */}
      {activeSnapPoint !== null && (
        <SnapIndicator position={activeSnapPoint} />
      )}

      <PlayheadMarker
        position={currentTimePercent}
        onMouseDown={handlePlayheadMouseDown}
      />

      {/* Add clip operations toolbar */}
      {selectedItemIds.length > 0 && (
        <ClipOperationsToolbar $visible={showClipOperations}>
          <ClipOperationButton
            onClick={handleDuplicateClip}
            title="Duplicate (Ctrl+D)"
          >
            <FaCopy size={12} />
          </ClipOperationButton>
          <ClipOperationButton
            onClick={handleDeleteClips}
            title="Delete (Del)"
          >
            <FaTrash size={12} />
          </ClipOperationButton>
          <ClipOperationButton
            onClick={() => onItemSplit(selectedItemId || '', currentTime)}
            title="Split at Playhead (Ctrl+S)"
            disabled={!selectedItemId}
          >
            <FaCut size={12} />
          </ClipOperationButton>
          <ClipOperationButton
            onClick={() => onItemGroup(selectedItemIds)}
            title="Group (Ctrl+G)"
            disabled={selectedItemIds.length <= 1}
          >
            <FaObjectGroup size={12} />
          </ClipOperationButton>
          <ClipOperationButton
            onClick={() => onItemUngroup(selectedItemIds)}
            title="Ungroup (Ctrl+Shift+G)"
            disabled={selectedItemIds.length === 0}
          >
            <FaObjectUngroup size={12} />
          </ClipOperationButton>
          <ClipOperationButton
            onClick={() => onItemArrange(selectedItemIds, 'forward')}
            title="Bring Forward"
            disabled={selectedItemIds.length === 0}
          >
            <FaArrowUp size={12} />
          </ClipOperationButton>
          <ClipOperationButton
            onClick={() => onItemArrange(selectedItemIds, 'backward')}
            title="Send Backward"
            disabled={selectedItemIds.length === 0}
          >
            <FaArrowDown size={12} />
          </ClipOperationButton>
        </ClipOperationsToolbar>
      )}
    </TimelineContainer>
  );
};

export default Timeline; 