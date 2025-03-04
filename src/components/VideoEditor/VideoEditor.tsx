import { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import VideoPreview from '../Preview/VideoPreview';
import Timeline from '../Timeline/Timeline';
import ControlPanel from '../Controls/ControlPanel';
import ClipManager from '../Timeline/ClipManager';
import { useFFmpeg } from '../../hooks/useFFmpeg';
import { 
  trimVideo, 
  addTextToVideo, 
  mixAudioWithVideo, 
  resizeVideo 
} from '../../utils/ffmpeg';
import { FaExclamationTriangle, FaUpload, FaFilm, FaImage, FaPlay, FaPause, FaVideo, FaMusic, FaFont, FaLayerGroup, FaQuestion, FaKeyboard } from 'react-icons/fa';
import { ResizePreset, TrimRange } from '../../types/video';
import ImageCanvas, { ImageItem } from '../Preview/ImageCanvas';
import UnifiedCanvas, { MediaItem } from '../Preview/UnifiedCanvas';
import { v4 as uuidv4 } from 'uuid';
import EditorControls from './EditorControls';

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: var(--background-dark);
  color: var(--text-primary);
  overflow: hidden;
`;

const EditorBody = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: 1fr auto auto;
  grid-template-areas:
    "controls preview"
    "controls timeline"
    "controls clipmanager";
  gap: var(--spacing-md);
  height: 100%;
  padding: var(--spacing-md);
`;

const PreviewSection = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
`;

const PreviewContainer = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
  background-color: var(--background-dark);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EditorModeToggle = styled.div`
  display: flex;
  background-color: var(--background-dark);
  border-radius: var(--border-radius-md);
  padding: 4px;
  margin-bottom: var(--spacing-sm);
`;

const ModeButton = styled.button<{ active: boolean }>`
  background-color: ${props => props.active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'var(--text-secondary)'};
  border: none;
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  
  &:hover {
    background-color: ${props => props.active ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const EmptyPreview = styled.div<{ isDragging?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--text-secondary);
  gap: var(--spacing-md);
  background-color: ${props => props.isDragging ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent'};
  border: 2px dashed ${props => props.isDragging ? 'var(--primary-color)' : 'var(--border-color)'};
  border-radius: var(--border-radius-md);
  transition: all 0.2s ease;
  
  h3 {
    margin: var(--spacing-sm) 0;
    font-weight: 500;
  }
  
  p {
    margin: 0;
  }
`;

const UploadIcon = styled.div`
  font-size: 4rem;
  color: var(--primary-color);
  margin-bottom: var(--spacing-md);
`;

const UploadText = styled.p`
  margin: var(--spacing-sm) 0;
  font-size: 1rem;
  color: var(--text-secondary);
  text-align: center;
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background-color: var(--error-color);
  color: white;
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  
  svg {
    font-size: 1.25rem;
  }
`;

const DragOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(var(--primary-rgb), 0.1);
  border: 3px dashed var(--primary-color);
  border-radius: var(--border-radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(3px);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;

  &.visible {
    opacity: 1;
  }
`;

const ProcessingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  color: white;
  backdrop-filter: blur(4px);
`;

const ProcessingContent = styled.div`
  background-color: var(--background-medium);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: var(--shadow-lg);
  max-width: 400px;
  width: 90%;
`;

const ProcessingTitle = styled.h2`
  margin-bottom: var(--spacing-lg);
  color: var(--primary-color);
  font-weight: 600;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: var(--background-light);
  border-radius: 4px;
  margin: var(--spacing-md) 0;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ width: number }>`
  width: ${props => props.width * 100}%;
  height: 100%;
  background-color: var(--primary-color);
  transition: width 0.3s ease;
`;

const ProgressText = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
`;

const UploadButton = styled.label`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);

  &:hover {
    background-color: var(--primary-light);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  
  &:active {
    transform: translateY(0);
  }

  input {
    display: none;
  }
`;

// Add a styled component for the playback speed indicator
const PlaybackSpeedIndicator = styled.div<{ visible: boolean }>`
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: bold;
  z-index: 1000;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
  pointer-events: none;
`;

// Add styled components for the keyboard shortcut help dialog
const HelpButton = styled.button`
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  
  &:hover {
    background-color: var(--primary-color-dark);
  }
`;

const HelpDialog = styled.div<{ visible: boolean }>`
  position: absolute;
  bottom: 70px;
  right: 20px;
  width: 400px;
  max-height: 500px;
  background-color: var(--background-light);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  padding: 20px;
  z-index: 1000;
  overflow-y: auto;
  transform: ${props => props.visible ? 'scale(1)' : 'scale(0.9)'};
  opacity: ${props => props.visible ? 1 : 0};
  transform-origin: bottom right;
  transition: transform 0.2s ease, opacity 0.2s ease;
  pointer-events: ${props => props.visible ? 'auto' : 'none'};
`;

const HelpTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--text-primary);
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ShortcutSection = styled.div`
  margin-bottom: 16px;
`;

const ShortcutSectionTitle = styled.h4`
  margin-top: 0;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-size: 1rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 4px;
`;

const ShortcutList = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
  align-items: center;
`;

const ShortcutKey = styled.kbd`
  background-color: var(--background-dark);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--text-primary);
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
`;

const ShortcutDescription = styled.span`
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

// Add a new styled component for the clip manager panel
const ClipManagerPanel = styled.div`
  grid-area: clipmanager;
  background: var(--background-medium);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  margin-top: var(--spacing-md);
`;

const VideoEditor: React.FC = () => {
  // FFmpeg hook
  const { ffmpeg, isLoaded, isLoading, progress: ffmpegProgress, error } = useFFmpeg();
  
  // File refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewSectionRef = useRef<HTMLDivElement>(null);
  
  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioSrc, setAudioSrc] = useState<string>('');
  const [audioPreviews, setAudioPreviews] = useState<{ name: string, src: string, file: File }[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Canvas state
  const [canvasItems, setCanvasItems] = useState<MediaItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'unified' | 'video'>('unified');
  const [canvasWidth, setCanvasWidth] = useState(1280);
  const [canvasHeight, setCanvasHeight] = useState(720);
  const [canvasAspectRatio, setCanvasAspectRatio] = useState('16:9');
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');
  
  // UI state
  const [isDragging, setIsDragging] = useState(false);
  
  // Multi-select state
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  
  // Add new state for advanced playback controls
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [loopRange, setLoopRange] = useState<TrimRange>({ start: 0, end: 0 });
  
  // Add state for showing the speed indicator
  const [showSpeedIndicator, setShowSpeedIndicator] = useState(false);
  
  // Add state for showing the help dialog
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  
  // Handle drag events for file upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };
  
  // Handle file upload
  const handleFileUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      const fileId = uuidv4();
      const objectUrl = URL.createObjectURL(file);
      
      // Determine file type
      let fileType: 'image' | 'video' | 'text';
      
      if (file.type.startsWith('video/')) {
        fileType = 'video';
        // Set as video file if it's the first video or no video is set yet
        if (!videoFile) {
          setVideoFile(file);
          setVideoSrc(objectUrl);
          setCurrentTime(0);
          setIsPlaying(false);
          
          // Get video duration
          const video = document.createElement('video');
          video.src = objectUrl;
          video.onloadedmetadata = () => {
            setDuration(video.duration);
          };
        }
        
        // Add to canvas items
        const newItem: MediaItem = {
          id: fileId,
          type: 'video',
          src: objectUrl,
          x: 50,
          y: 50,
          width: 640,
          height: 360,
          rotation: 0,
          zIndex: canvasItems.length + 1,
          isLocked: false
        };
        
        setCanvasItems(prev => [...prev, newItem]);
        
      } else if (file.type.startsWith('image/')) {
        fileType = 'image';
        
        // Create a new image element to get dimensions
        const img = new Image();
        img.onload = () => {
          // Calculate dimensions to fit within canvas
          const maxWidth = 640;
          const maxHeight = 480;
          
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }
          
          if (height > maxHeight) {
            const ratio = maxHeight / height;
            height = height * ratio;
            width = width * ratio;
          }
          
          // Add to canvas items
          const newItem: MediaItem = {
            id: fileId,
            type: 'image',
            src: objectUrl,
            x: 100,
            y: 100,
            width,
            height,
            rotation: 0,
            zIndex: canvasItems.length + 1,
            isLocked: false
          };
          
          setCanvasItems(prev => [...prev, newItem]);
        };
        img.src = objectUrl;
        
      } else if (file.type.startsWith('audio/')) {
        // Handle audio files
        setAudioFile(file);
        setAudioSrc(objectUrl);
      }
    });
  };
  
  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target && e.target.files) {
      handleFileUpload(e.target.files);
    }
  };
  
  // Handle adding text
  const handleAddText = () => {
    const newTextItem: MediaItem = {
      id: uuidv4(),
      type: 'text',
      text: 'Double click to edit text',
      fontColor: '#ffffff',
      fontSize: 36,
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      x: 200,
      y: 200,
      width: 300,
      height: 100,
      rotation: 0,
      zIndex: canvasItems.length + 1,
      isLocked: false
    };
    
    setCanvasItems(prev => [...prev, newTextItem]);
    setSelectedItemId(newTextItem.id);
  };
  
  // Handle adding media (UI trigger)
  const handleAddMedia = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };
  
  // Handle item update
  const handleItemUpdate = (itemId: string, updates: any) => {
    const updatedItems = canvasItems.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    setCanvasItems(updatedItems);
  };
  
  // Handle items change (for multiple items)
  const handleItemsChange = (items: MediaItem[]) => {
    setCanvasItems(items);
  };
  
  // Handle item delete (single item)
  const handleSingleItemDelete = (id: string) => {
    handleItemDelete([id]);
  };
  
  // Handle item selection (single and multi)
  const handleItemSelect = (id: string | null) => {
    setSelectedItemId(id);
    if (id) {
      setSelectedItemIds([id]);
    } else {
      setSelectedItemIds([]);
    }
  };
  
  // Handle multi-select
  const handleMultiSelect = (ids: string[]) => {
    setSelectedItemIds(ids);
    // If there's only one item selected, also set it as the primary selected item
    if (ids.length === 1) {
      setSelectedItemId(ids[0]);
    } else if (ids.length === 0) {
      setSelectedItemId(null);
    }
    // If multiple items are selected, keep the current selectedItemId if it's in the selection
    else if (!ids.includes(selectedItemId || '')) {
      setSelectedItemId(ids[0]);
    }
  };
  
  // Handle item deletion (single or multiple)
  const handleItemDelete = (ids: string[]) => {
    setCanvasItems(prev => prev.filter(item => !ids.includes(item.id)));
    if (ids.includes(selectedItemId || '')) {
      setSelectedItemId(null);
    }
  };
  
  // Handle item duplication
  const handleItemDuplicate = (ids: string[]) => {
    const itemsToDuplicate = canvasItems.filter(item => ids.includes(item.id));
    const duplicatedItems = itemsToDuplicate.map(item => ({
      ...item,
      id: uuidv4(),
      x: item.x + 20, // Offset slightly to make it visible
      y: item.y + 20
    }));
    
    setCanvasItems(prev => [...prev, ...duplicatedItems]);
  };
  
  // Handle item splitting
  const handleItemSplit = (id: string, splitPoint: number) => {
    const itemToSplit = canvasItems.find(item => item.id === id);
    if (!itemToSplit || itemToSplit.type !== 'video') return;
    
    // For simplicity, we're just duplicating the item
    // In a real implementation, you would calculate the proper split based on the timeline position
    const firstHalf = {
      ...itemToSplit,
      id: uuidv4(),
      duration: splitPoint
    };
    
    const secondHalf = {
      ...itemToSplit,
      id: uuidv4(),
      x: itemToSplit.x,
      y: itemToSplit.y + 50, // Position below the original
      startTime: splitPoint,
      duration: (itemToSplit.duration || 0) - splitPoint
    };
    
    // Remove the original and add the two new items
    setCanvasItems(prev => [
      ...prev.filter(item => item.id !== id),
      firstHalf,
      secondHalf
    ]);
  };
  
  // Handle item grouping
  const handleItemGroup = (ids: string[]) => {
    if (ids.length <= 1) return;
    
    // Create a group ID
    const groupId = uuidv4();
    
    // Update all selected items to be part of this group
    setCanvasItems(prev => 
      prev.map(item => 
        ids.includes(item.id) 
          ? { ...item, groupId } 
          : item
      )
    );
  };
  
  // Handle item ungrouping
  const handleItemUngroup = (ids: string[]) => {
    // Find all groups that contain any of the selected items
    const groupsToUngroup = new Set<string>();
    canvasItems.forEach(item => {
      if (ids.includes(item.id) && item.groupId) {
        groupsToUngroup.add(item.groupId);
      }
    });
    
    // Remove the groupId from all items in these groups
    setCanvasItems(prev => 
      prev.map(item => 
        item.groupId && groupsToUngroup.has(item.groupId)
          ? { ...item, groupId: undefined }
          : item
      )
    );
  };
  
  // Handle changing item z-index (bring forward/send backward)
  const handleItemArrange = (ids: string[], direction: 'forward' | 'backward') => {
    // Get all items sorted by z-index
    const sortedItems = [...canvasItems].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    
    if (direction === 'forward') {
      // Find the highest z-index among selected items
      const highestSelectedZIndex = Math.max(
        ...sortedItems
          .filter(item => ids.includes(item.id))
          .map(item => item.zIndex || 0)
      );
      
      // Find the next highest z-index among non-selected items
      const nextHighestItem = sortedItems
        .filter(item => !ids.includes(item.id) && (item.zIndex || 0) > highestSelectedZIndex)
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))[0];
      
      if (nextHighestItem) {
        // Swap z-indices
        setCanvasItems(prev => 
          prev.map(item => {
            if (ids.includes(item.id)) {
              return { ...item, zIndex: (nextHighestItem.zIndex || 0) + 1 };
            }
            return item;
          })
        );
      }
    } else {
      // Find the lowest z-index among selected items
      const lowestSelectedZIndex = Math.min(
        ...sortedItems
          .filter(item => ids.includes(item.id))
          .map(item => item.zIndex || 0)
      );
      
      // Find the next lowest z-index among non-selected items
      const nextLowestItem = sortedItems
        .filter(item => !ids.includes(item.id) && (item.zIndex || 0) < lowestSelectedZIndex)
        .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))[0];
      
      if (nextLowestItem) {
        // Swap z-indices
        setCanvasItems(prev => 
          prev.map(item => {
            if (ids.includes(item.id)) {
              return { ...item, zIndex: (nextLowestItem.zIndex || 0) - 1 };
            }
            return item;
          })
        );
      }
    }
  };
  
  // Handle time update
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };
  
  // Handle duration change
  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
  };
  
  // Handle play/pause
  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
    
    // Control all video elements
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach(video => {
      if (video.id.startsWith('video-')) {
        if (isPlaying) {
          video.pause();
        } else {
          // Set the current time before playing to ensure sync
          video.currentTime = currentTime;
          video.play().catch(err => {
            console.error("Error playing video:", err);
            // If autoplay is prevented, revert the playing state
            setIsPlaying(false);
          });
        }
      }
    });
  };
  
  // Handle seeking
  const handleSeek = (time: number) => {
    setCurrentTime(time);
    
    // Update video element's current time if it exists
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach(video => {
      if (video.id.startsWith('video-')) {
        video.currentTime = time;
      }
    });
  };
  
  // Handle export
  const handleExportVideo = async () => {
    if (!ffmpeg || canvasItems.length === 0) return;
    
    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingMessage('Preparing to export...');
      
      // TODO: Implement export logic for the unified canvas
      // This would involve rendering the canvas to a video
      // using FFmpeg and the current state of all items
      
      setProcessingMessage('Export completed!');
      
    } catch (error) {
      console.error('Error exporting video:', error);
      setProcessingMessage(`Export failed: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle canvas resize
  const handleCanvasResize = (width: number, height: number) => {
    // Calculate and update aspect ratio
    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b);
    };
    
    const divisor = gcd(width, height);
    const aspectRatioWidth = width / divisor;
    const aspectRatioHeight = height / divisor;
    
    // Update canvas dimensions
    setCanvasWidth(width);
    setCanvasHeight(height);
    setCanvasAspectRatio(`${aspectRatioWidth}:${aspectRatioHeight}`);
  };
  
  // Handle playback speed change
  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    
    // Update video elements' playback rate
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach(video => {
      if (video.id.startsWith('video-')) {
        video.playbackRate = speed;
      }
    });
    
    // Show the speed indicator
    setShowSpeedIndicator(true);
    
    // Hide the indicator after 2 seconds
    setTimeout(() => {
      setShowSpeedIndicator(false);
    }, 2000);
  };
  
  // Handle loop toggle
  const handleLoopToggle = () => {
    setIsLooping(prev => !prev);
  };
  
  // Handle loop range change
  const handleLoopRangeChange = (range: TrimRange) => {
    setLoopRange(range);
  };
  
  // Check if current time is outside loop range and reset if needed
  useEffect(() => {
    if (isLooping && isPlaying) {
      if (currentTime >= loopRange.end) {
        // Reset to loop start when reaching the end
        handleSeek(loopRange.start);
      }
    }
  }, [currentTime, isLooping, isPlaying, loopRange]);
  
  // Add keyboard shortcuts for playback controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.key) {
        // Space for play/pause
        case ' ':
          handlePlayPause();
          e.preventDefault();
          break;
          
        // Left/Right arrows for seeking
        case 'ArrowLeft':
          if (e.shiftKey) {
            // Shift+Left for 10 seconds back
            handleSeek(Math.max(0, currentTime - 10));
          } else {
            // Left for 5 seconds back
            handleSeek(Math.max(0, currentTime - 5));
          }
          e.preventDefault();
          break;
          
        case 'ArrowRight':
          if (e.shiftKey) {
            // Shift+Right for 10 seconds forward
            handleSeek(Math.min(duration, currentTime + 10));
          } else {
            // Right for 5 seconds forward
            handleSeek(Math.min(duration, currentTime + 5));
          }
          e.preventDefault();
          break;
          
        // Comma/Period for frame-by-frame
        case ',':
          // Previous frame
          handleSeek(Math.max(0, currentTime - (1/30)));
          e.preventDefault();
          break;
          
        case '.':
          // Next frame
          handleSeek(Math.min(duration, currentTime + (1/30)));
          e.preventDefault();
          break;
          
        // Home/End for start/end
        case 'Home':
          handleSeek(0);
          e.preventDefault();
          break;
          
        case 'End':
          handleSeek(duration);
          e.preventDefault();
          break;
          
        // Numbers for playback speed
        case '0':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            handlePlaybackSpeedChange(0.5);
            e.preventDefault();
          }
          break;
          
        case '1':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            handlePlaybackSpeedChange(1);
            e.preventDefault();
          }
          break;
          
        case '2':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            handlePlaybackSpeedChange(1.5);
            e.preventDefault();
          }
          break;
          
        case '3':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            handlePlaybackSpeedChange(2);
            e.preventDefault();
          }
          break;
          
        // L for loop toggle
        case 'l':
          handleLoopToggle();
          e.preventDefault();
          break;
          
        // [ and ] for loop range
        case '[':
          handleLoopRangeChange({ ...loopRange, start: currentTime });
          e.preventDefault();
          break;
          
        case ']':
          handleLoopRangeChange({ ...loopRange, end: currentTime });
          e.preventDefault();
          break;
          
        // \ to clear loop range
        case '\\':
          handleLoopRangeChange({ start: 0, end: duration });
          e.preventDefault();
          break;
          
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentTime, duration, handlePlayPause, handleSeek, handlePlaybackSpeedChange, handleLoopToggle, handleLoopRangeChange, loopRange]);
  
  // Toggle help dialog
  const toggleHelpDialog = () => {
    setShowHelpDialog(prev => !prev);
  };
  
  // Add a new function to handle locking/unlocking clips
  const handleLockClips = (ids: string[], locked: boolean) => {
    setCanvasItems(prev => 
      prev.map(item => 
        ids.includes(item.id) 
          ? { ...item, isLocked: locked } 
          : item
      )
    );
  };
  
  return (
    <EditorContainer>
      <EditorBody>
        <ControlPanel
          isFFmpegLoaded={isLoaded}
          isFFmpegLoading={isLoading}
          ffmpegProgress={ffmpegProgress}
          onTrimVideo={() => {}}
          onAddText={handleAddText}
          onMixAudio={() => {}}
          onExportVideo={handleExportVideo}
          onSaveProject={() => {}}
          onLoadProject={handleAddMedia}
          onUndo={() => {}}
          onRedo={() => {}}
          canUndo={false}
          canRedo={false}
        />
        
        <PreviewSection>
          <PreviewContainer 
            className="preview-container"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {videoSrc ? (
              <>
                <UnifiedCanvas
                  videoSrc={videoSrc}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  mediaItems={canvasItems}
                  selectedItemId={selectedItemId}
                  onItemSelect={handleItemSelect}
                  onItemUpdate={(updatedItem) => {
                    // Convert the old handler to work with the new EditorControls interface
                    setCanvasItems(prev => 
                      prev.map(item => 
                        item.id === updatedItem.id ? updatedItem : item
                      )
                    );
                  }}
                  playbackSpeed={playbackSpeed}
                  isLooping={isLooping}
                  loopRange={loopRange}
                />
                <EditorControls 
                  selectedItem={canvasItems.find(item => item.id === selectedItemId)}
                  onUpdateItem={handleItemUpdate}
                />
              </>
            ) : (
              <EmptyPreview
                isDragging={isDragging}
              >
                <FaLayerGroup size={48} />
                <h3>Drag & Drop Media</h3>
                <p>Add videos, images, or text to your canvas</p>
                <UploadButton onClick={handleAddMedia}>
                  <FaUpload /> Upload Media
                </UploadButton>
              </EmptyPreview>
            )}
          </PreviewContainer>
          
          <Timeline
            duration={duration}
            currentTime={currentTime}
            trimRange={{ start: 0, end: duration }}
            onTrimChange={() => {}}
            onSeek={handleSeek}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            mediaItems={canvasItems}
            selectedItemId={selectedItemId}
            onItemSelect={handleItemSelect}
            initialHeight={200}
            onMultiSelect={handleMultiSelect}
            onItemDelete={handleItemDelete}
            onItemDuplicate={handleItemDuplicate}
            onItemSplit={handleItemSplit}
            onItemGroup={handleItemGroup}
            onItemUngroup={handleItemUngroup}
            onItemArrange={handleItemArrange}
            playbackSpeed={playbackSpeed}
            onPlaybackSpeedChange={handlePlaybackSpeedChange}
            isLooping={isLooping}
            onLoopToggle={handleLoopToggle}
            loopRange={loopRange}
            onLoopRangeChange={handleLoopRangeChange}
          />
        </PreviewSection>
        
        <ClipManagerPanel>
          <ClipManager
            clips={canvasItems}
            selectedClipIds={selectedItemId ? [selectedItemId] : []}
            onSelectClip={(id, multiSelect) => {
              if (multiSelect) {
                handleMultiSelect(selectedItemId ? [selectedItemId, id] : [id]);
              } else {
                handleItemSelect(id);
              }
            }}
            onDeleteClips={handleItemDelete}
            onDuplicateClips={handleItemDuplicate}
            onSplitClip={handleItemSplit}
            onGroupClips={handleItemGroup}
            onUngroupClips={handleItemUngroup}
            onArrangeClips={handleItemArrange}
            onLockClips={handleLockClips}
            currentTime={currentTime}
          />
        </ClipManagerPanel>
      </EditorBody>
      
      {isProcessing && (
        <ProcessingOverlay>
          <div>
            <h3>Processing</h3>
            <p>{processingMessage}</p>
            <ProgressBar>
              <ProgressFill width={processingProgress} />
            </ProgressBar>
          </div>
        </ProcessingOverlay>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
        accept="video/*,image/*,audio/*"
        multiple
      />
      
      <PlaybackSpeedIndicator visible={showSpeedIndicator}>
        {playbackSpeed.toFixed(1)}x
      </PlaybackSpeedIndicator>
      
      {/* Help button and dialog */}
      <HelpButton onClick={toggleHelpDialog} title="Keyboard shortcuts">
        <FaQuestion />
      </HelpButton>
      
      <HelpDialog visible={showHelpDialog}>
        <HelpTitle>
          <FaKeyboard /> Keyboard Shortcuts
        </HelpTitle>
        
        <ShortcutSection>
          <ShortcutSectionTitle>Playback Controls</ShortcutSectionTitle>
          <ShortcutList>
            <ShortcutKey>Space</ShortcutKey>
            <ShortcutDescription>Play/Pause</ShortcutDescription>
            
            <ShortcutKey>←</ShortcutKey>
            <ShortcutDescription>Jump back 5 seconds</ShortcutDescription>
            
            <ShortcutKey>→</ShortcutKey>
            <ShortcutDescription>Jump forward 5 seconds</ShortcutDescription>
            
            <ShortcutKey>Shift + ←</ShortcutKey>
            <ShortcutDescription>Jump back 10 seconds</ShortcutDescription>
            
            <ShortcutKey>Shift + →</ShortcutKey>
            <ShortcutDescription>Jump forward 10 seconds</ShortcutDescription>
            
            <ShortcutKey>,</ShortcutKey>
            <ShortcutDescription>Previous frame</ShortcutDescription>
            
            <ShortcutKey>.</ShortcutKey>
            <ShortcutDescription>Next frame</ShortcutDescription>
            
            <ShortcutKey>Home</ShortcutKey>
            <ShortcutDescription>Go to start</ShortcutDescription>
            
            <ShortcutKey>End</ShortcutKey>
            <ShortcutDescription>Go to end</ShortcutDescription>
          </ShortcutList>
        </ShortcutSection>
        
        <ShortcutSection>
          <ShortcutSectionTitle>Playback Speed</ShortcutSectionTitle>
          <ShortcutList>
            <ShortcutKey>0</ShortcutKey>
            <ShortcutDescription>0.5x speed</ShortcutDescription>
            
            <ShortcutKey>1</ShortcutKey>
            <ShortcutDescription>Normal speed (1x)</ShortcutDescription>
            
            <ShortcutKey>2</ShortcutKey>
            <ShortcutDescription>1.5x speed</ShortcutDescription>
            
            <ShortcutKey>3</ShortcutKey>
            <ShortcutDescription>2x speed</ShortcutDescription>
          </ShortcutList>
        </ShortcutSection>
        
        <ShortcutSection>
          <ShortcutSectionTitle>Loop Controls</ShortcutSectionTitle>
          <ShortcutList>
            <ShortcutKey>L</ShortcutKey>
            <ShortcutDescription>Toggle loop mode</ShortcutDescription>
            
            <ShortcutKey>[</ShortcutKey>
            <ShortcutDescription>Set loop start point</ShortcutDescription>
            
            <ShortcutKey>]</ShortcutKey>
            <ShortcutDescription>Set loop end point</ShortcutDescription>
            
            <ShortcutKey>\</ShortcutKey>
            <ShortcutDescription>Clear loop range</ShortcutDescription>
          </ShortcutList>
        </ShortcutSection>
        
        <ShortcutSection>
          <ShortcutSectionTitle>Clip Management</ShortcutSectionTitle>
          <ShortcutList>
            <ShortcutKey>Del</ShortcutKey>
            <ShortcutDescription>Delete selected clips</ShortcutDescription>
            
            <ShortcutKey>Ctrl+D</ShortcutKey>
            <ShortcutDescription>Duplicate selected clips</ShortcutDescription>
            
            <ShortcutKey>Ctrl+S</ShortcutKey>
            <ShortcutDescription>Split clip at playhead</ShortcutDescription>
            
            <ShortcutKey>Ctrl+G</ShortcutKey>
            <ShortcutDescription>Group selected clips</ShortcutDescription>
            
            <ShortcutKey>Ctrl+Shift+G</ShortcutKey>
            <ShortcutDescription>Ungroup selected clips</ShortcutDescription>
          </ShortcutList>
        </ShortcutSection>
      </HelpDialog>
    </EditorContainer>
  );
};

export default VideoEditor; 