import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaCrop, FaUndo, FaRedo, FaCheck, FaTimes, FaSlidersH, FaFont, FaExchangeAlt } from 'react-icons/fa';

// Types
interface ImageEditorProps {
  src: string;
  onSave: (editedImageData: string, edits: ImageEdits) => void;
  onCancel: () => void;
}

interface ImageEdits {
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  flip: {
    horizontal: boolean;
    vertical: boolean;
  };
  filter: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    grayscale: number;
  };
  textOverlays: TextOverlay[];
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  isEditing: boolean;
}

interface CropArea {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// Styled Components
const EditorContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #1e1e1e;
  display: flex;
  flex-direction: column;
`;

const CanvasContainer = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const EditorCanvas = styled.canvas`
  max-width: 100%;
  max-height: 100%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
`;

const ToolbarContainer = styled.div`
  display: flex;
  background-color: #2a2a2a;
  padding: 10px;
  gap: 10px;
  align-items: center;
  justify-content: center;
`;

const ToolButton = styled.button<{ active?: boolean }>`
  background-color: ${props => props.active ? 'var(--primary-color)' : '#3a3a3a'};
  color: white;
  border: none;
  border-radius: 4px;
  width: 40px;
  height: 40px;
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
  height: 30px;
  background-color: #4a4a4a;
  margin: 0 5px;
`;

const FilterControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #2a2a2a;
  padding: 15px;
  gap: 15px;
`;

const FilterSlider = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const SliderLabel = styled.label`
  display: flex;
  justify-content: space-between;
  color: #ddd;
  font-size: 12px;

  span {
    color: #aaa;
  }
`;

const Slider = styled.input`
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  background: #3a3a3a;
  outline: none;
  border-radius: 2px;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--primary-color);
    cursor: pointer;
  }
`;

const CropOverlay = styled.div<{ dimensions: CropArea }>`
  position: absolute;
  border: 2px dashed white;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
  top: ${props => Math.min(props.dimensions.startY, props.dimensions.endY)}px;
  left: ${props => Math.min(props.dimensions.startX, props.dimensions.endX)}px;
  width: ${props => Math.abs(props.dimensions.endX - props.dimensions.startX)}px;
  height: ${props => Math.abs(props.dimensions.endY - props.dimensions.startY)}px;
`;

const TextInput = styled.textarea`
  position: absolute;
  background: transparent;
  border: 1px dashed white;
  color: white;
  font-family: Arial, sans-serif;
  padding: 4px;
  resize: none;
  outline: none;
  z-index: 100;
`;

const TextOverlayElement = styled.div<{
  x: number;
  y: number;
  isSelected: boolean;
}>`
  position: absolute;
  top: ${props => props.y}px;
  left: ${props => props.x}px;
  cursor: move;
  border: ${props => props.isSelected ? '1px dashed white' : 'none'};
  padding: 4px;
`;

// Main Component
const ImageEditor: React.FC<ImageEditorProps> = ({ src, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  const [imageEdits, setImageEdits] = useState<ImageEdits>({
    flip: { horizontal: false, vertical: false },
    filter: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      grayscale: 0
    },
    textOverlays: []
  });

  const [cropArea, setCropArea] = useState<CropArea>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [showFilterControls, setShowFilterControls] = useState(false);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setOriginalImage(img);
      
      if (canvasRef.current && containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        
        // Calculate dimensions to fit in container while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > containerWidth - 40) {
          const ratio = containerWidth / width;
          width = containerWidth - 40;
          height = height * ratio;
        }
        
        if (height > containerHeight - 40) {
          const ratio = (containerHeight - 40) / height;
          height = containerHeight - 40;
          width = width * ratio;
        }
        
        setCanvasDimensions({ width, height });
      }
    };
    img.src = src;
  }, [src]);

  // Apply edits and draw on canvas
  useEffect(() => {
    if (!canvasRef.current || !originalImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvasDimensions.width;
    canvas.height = canvasDimensions.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply transformations
    ctx.save();
    
    // Center the image
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Apply flips
    if (imageEdits.flip.horizontal) {
      ctx.scale(-1, 1);
    }
    if (imageEdits.flip.vertical) {
      ctx.scale(1, -1);
    }
    
    // Draw the image centered
    ctx.drawImage(
      originalImage,
      -canvas.width / 2,
      -canvas.height / 2,
      canvas.width,
      canvas.height
    );
    
    // Apply filters
    if (
      imageEdits.filter.brightness !== 100 ||
      imageEdits.filter.contrast !== 100 ||
      imageEdits.filter.saturation !== 100 ||
      imageEdits.filter.blur > 0 ||
      imageEdits.filter.grayscale > 0
    ) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Apply brightness
      if (imageEdits.filter.brightness !== 100) {
        const factor = imageEdits.filter.brightness / 100;
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i] = Math.min(255, imageData.data[i] * factor);
          imageData.data[i + 1] = Math.min(255, imageData.data[i + 1] * factor);
          imageData.data[i + 2] = Math.min(255, imageData.data[i + 2] * factor);
        }
      }
      
      // Apply contrast
      if (imageEdits.filter.contrast !== 100) {
        const factor = (imageEdits.filter.contrast / 100) * 2;
        const intercept = 128 * (1 - factor);
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i] = Math.min(255, Math.max(0, imageData.data[i] * factor + intercept));
          imageData.data[i + 1] = Math.min(255, Math.max(0, imageData.data[i + 1] * factor + intercept));
          imageData.data[i + 2] = Math.min(255, Math.max(0, imageData.data[i + 2] * factor + intercept));
        }
      }
      
      // Apply grayscale
      if (imageEdits.filter.grayscale > 0) {
        const factor = imageEdits.filter.grayscale / 100;
        for (let i = 0; i < imageData.data.length; i += 4) {
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
          
          imageData.data[i] = r * (1 - factor) + gray * factor;
          imageData.data[i + 1] = g * (1 - factor) + gray * factor;
          imageData.data[i + 2] = b * (1 - factor) + gray * factor;
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    }
    
    // Restore context to draw text overlays without transforms
    ctx.restore();
    
    // Draw text overlays
    imageEdits.textOverlays.forEach(overlay => {
      if (!overlay.isEditing) {
        ctx.font = `${overlay.fontSize}px Arial`;
        ctx.fillStyle = overlay.color;
        ctx.fillText(overlay.text, overlay.x, overlay.y);
      }
    });
    
  }, [originalImage, canvasDimensions, imageEdits]);

  const handleFlipHorizontal = () => {
    setImageEdits(prev => ({
      ...prev,
      flip: {
        ...prev.flip,
        horizontal: !prev.flip.horizontal
      }
    }));
  };

  const handleFlipVertical = () => {
    setImageEdits(prev => ({
      ...prev,
      flip: {
        ...prev.flip,
        vertical: !prev.flip.vertical
      }
    }));
  };

  const handleFilterChange = (
    filterType: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'grayscale',
    value: number
  ) => {
    setImageEdits(prev => ({
      ...prev,
      filter: {
        ...prev.filter,
        [filterType]: value
      }
    }));
  };

  const handleToolSelect = (tool: string) => {
    if (activeTool === tool) {
      setActiveTool(null);
      if (tool === 'crop') {
        setCropArea({ startX: 0, startY: 0, endX: 0, endY: 0 });
      }
    } else {
      setActiveTool(tool);
      if (tool === 'filter') {
        setShowFilterControls(!showFilterControls);
      } else {
        setShowFilterControls(false);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (activeTool === 'crop') {
      setCropArea({
        startX: x,
        startY: y,
        endX: x,
        endY: y
      });
      setIsDragging(true);
    } else if (activeTool === 'text') {
      // Add new text overlay
      const newTextId = Date.now().toString();
      const newTextOverlay: TextOverlay = {
        id: newTextId,
        text: 'Double click to edit',
        x,
        y,
        fontSize: 20,
        color: '#ffffff',
        isEditing: true
      };
      
      setImageEdits(prev => ({
        ...prev,
        textOverlays: [...prev.textOverlays, newTextOverlay]
      }));
      
      setSelectedTextId(newTextId);
      setActiveTool(null);
    } else {
      // Check if clicking on a text overlay
      const clickedTextIndex = imageEdits.textOverlays.findIndex(
        overlay => 
          x >= overlay.x && 
          x <= overlay.x + 200 && // approximate width
          y >= overlay.y - overlay.fontSize && 
          y <= overlay.y
      );
      
      if (clickedTextIndex >= 0) {
        setSelectedTextId(imageEdits.textOverlays[clickedTextIndex].id);
        setIsDragging(true);
      } else {
        setSelectedTextId(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (activeTool === 'crop') {
      setCropArea(prev => ({
        ...prev,
        endX: x,
        endY: y
      }));
    } else if (selectedTextId) {
      // Move text overlay
      setImageEdits(prev => ({
        ...prev,
        textOverlays: prev.textOverlays.map(overlay => 
          overlay.id === selectedTextId
            ? { ...overlay, x, y }
            : overlay
        )
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClickText = (id: string) => {
    setImageEdits(prev => ({
      ...prev,
      textOverlays: prev.textOverlays.map(overlay => 
        overlay.id === id
          ? { ...overlay, isEditing: true }
          : overlay
      )
    }));
  };

  const handleTextChange = (id: string, text: string) => {
    setImageEdits(prev => ({
      ...prev,
      textOverlays: prev.textOverlays.map(overlay => 
        overlay.id === id
          ? { ...overlay, text }
          : overlay
      )
    }));
  };

  const handleTextEditComplete = (id: string) => {
    setImageEdits(prev => ({
      ...prev,
      textOverlays: prev.textOverlays.map(overlay => 
        overlay.id === id
          ? { ...overlay, isEditing: false }
          : overlay
      )
    }));
  };

  const handleCropApply = () => {
    if (!canvasRef.current || !originalImage) return;
    
    // Calculate the crop coordinates relative to the original image
    const scaleX = originalImage.width / canvasDimensions.width;
    const scaleY = originalImage.height / canvasDimensions.height;
    
    const cropX = Math.min(cropArea.startX, cropArea.endX);
    const cropY = Math.min(cropArea.startY, cropArea.endY);
    const cropWidth = Math.abs(cropArea.endX - cropArea.startX);
    const cropHeight = Math.abs(cropArea.endY - cropArea.startY);
    
    // Apply the crop
    setImageEdits(prev => ({
      ...prev,
      crop: {
        x: cropX * scaleX,
        y: cropY * scaleY,
        width: cropWidth * scaleX,
        height: cropHeight * scaleY
      }
    }));
    
    // Reset crop tool
    setActiveTool(null);
    setCropArea({ startX: 0, startY: 0, endX: 0, endY: 0 });
  };

  const handleCropCancel = () => {
    setActiveTool(null);
    setCropArea({ startX: 0, startY: 0, endX: 0, endY: 0 });
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    
    // Get the edited image data
    const editedImageData = canvasRef.current.toDataURL('image/png');
    
    // Call the onSave callback with the edited image data and edits
    onSave(editedImageData, imageEdits);
  };

  // Render the image editor
  return (
    <EditorContainer>
      <CanvasContainer 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <EditorCanvas 
          ref={canvasRef} 
          width={canvasDimensions.width} 
          height={canvasDimensions.height}
        />
        
        {/* Crop overlay */}
        {activeTool === 'crop' && (
          <>
            <CropOverlay dimensions={cropArea} />
            {isDragging && (
              <div style={{ position: 'absolute', top: 10, right: 10, color: 'white' }}>
                {Math.abs(cropArea.endX - cropArea.startX)} x {Math.abs(cropArea.endY - cropArea.startY)}
              </div>
            )}
          </>
        )}
        
        {/* Text overlays editor */}
        {imageEdits.textOverlays.map(overlay => (
          overlay.isEditing ? (
            <TextInput
              key={overlay.id}
              style={{
                top: overlay.y - overlay.fontSize,
                left: overlay.x,
                fontSize: `${overlay.fontSize}px`,
                color: overlay.color,
              }}
              value={overlay.text}
              onChange={(e) => handleTextChange(overlay.id, e.target.value)}
              onBlur={() => handleTextEditComplete(overlay.id)}
              autoFocus
            />
          ) : (
            <TextOverlayElement
              key={overlay.id}
              x={overlay.x}
              y={overlay.y - overlay.fontSize}
              isSelected={selectedTextId === overlay.id}
              onDoubleClick={() => handleDoubleClickText(overlay.id)}
            />
          )
        ))}
      </CanvasContainer>
      
      {/* Toolbar */}
      <ToolbarContainer>
        <ToolButton 
          onClick={() => handleToolSelect('crop')}
          active={activeTool === 'crop'}
          title="Crop"
        >
          <FaCrop />
        </ToolButton>
        
        <ToolButton 
          onClick={handleFlipHorizontal}
          active={imageEdits.flip.horizontal}
          title="Flip Horizontal"
        >
          <FaExchangeAlt style={{ transform: 'rotate(90deg)' }} />
        </ToolButton>
        
        <ToolButton 
          onClick={handleFlipVertical}
          active={imageEdits.flip.vertical}
          title="Flip Vertical"
        >
          <FaExchangeAlt />
        </ToolButton>
        
        <ToolSeparator />
        
        <ToolButton 
          onClick={() => handleToolSelect('filter')}
          active={activeTool === 'filter'}
          title="Filters"
        >
          <FaSlidersH />
        </ToolButton>
        
        <ToolButton 
          onClick={() => handleToolSelect('text')}
          active={activeTool === 'text'}
          title="Add Text"
        >
          <FaFont />
        </ToolButton>
        
        <ToolSeparator />
        
        {activeTool === 'crop' ? (
          <>
            <ToolButton onClick={handleCropApply} title="Apply Crop">
              <FaCheck />
            </ToolButton>
            <ToolButton onClick={handleCropCancel} title="Cancel Crop">
              <FaTimes />
            </ToolButton>
          </>
        ) : (
          <>
            <ToolButton onClick={handleSave} title="Save Changes">
              <FaCheck />
            </ToolButton>
            <ToolButton onClick={onCancel} title="Cancel">
              <FaTimes />
            </ToolButton>
          </>
        )}
      </ToolbarContainer>
      
      {/* Filter controls */}
      {showFilterControls && (
        <FilterControlsContainer>
          <FilterSlider>
            <SliderLabel>
              Brightness <span>{imageEdits.filter.brightness}%</span>
            </SliderLabel>
            <Slider 
              type="range" 
              min="0" 
              max="200" 
              value={imageEdits.filter.brightness}
              onChange={(e) => handleFilterChange('brightness', parseInt(e.target.value))}
            />
          </FilterSlider>
          
          <FilterSlider>
            <SliderLabel>
              Contrast <span>{imageEdits.filter.contrast}%</span>
            </SliderLabel>
            <Slider 
              type="range" 
              min="0" 
              max="200" 
              value={imageEdits.filter.contrast}
              onChange={(e) => handleFilterChange('contrast', parseInt(e.target.value))}
            />
          </FilterSlider>
          
          <FilterSlider>
            <SliderLabel>
              Grayscale <span>{imageEdits.filter.grayscale}%</span>
            </SliderLabel>
            <Slider 
              type="range" 
              min="0" 
              max="100" 
              value={imageEdits.filter.grayscale}
              onChange={(e) => handleFilterChange('grayscale', parseInt(e.target.value))}
            />
          </FilterSlider>
        </FilterControlsContainer>
      )}
    </EditorContainer>
  );
};

export default ImageEditor; 