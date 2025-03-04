import { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';

const CanvasContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--background-dark);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-md);
`;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #000;
`;

const ImageElement = styled.img`
  position: absolute;
  cursor: move;
  user-select: none;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  border: 2px solid transparent;
  
  &.selected {
    border: 2px solid var(--primary-color);
  }
`;

const ResizeHandle = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: var(--primary-color);
  border-radius: 50%;
  z-index: 10;
  
  &.top-left {
    top: -5px;
    left: -5px;
    cursor: nwse-resize;
  }
  
  &.top-right {
    top: -5px;
    right: -5px;
    cursor: nesw-resize;
  }
  
  &.bottom-left {
    bottom: -5px;
    left: -5px;
    cursor: nesw-resize;
  }
  
  &.bottom-right {
    bottom: -5px;
    right: -5px;
    cursor: nwse-resize;
  }
`;

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

export interface ImageItem {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface ImageCanvasProps {
  images: ImageItem[];
  onImageUpdate: (updatedImage: ImageItem) => void;
  onImageSelect: (id: string | null) => void;
  selectedImageId: string | null;
  canvasWidth: number;
  canvasHeight: number;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({
  images,
  onImageUpdate,
  onImageSelect,
  selectedImageId,
  canvasWidth,
  canvasHeight
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartDims, setResizeStartDims] = useState({ width: 0, height: 0 });
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const [rotateStartAngle, setRotateStartAngle] = useState(0);
  
  // Handle image selection
  const handleImageClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onImageSelect(id);
  };
  
  // Handle background click to deselect
  const handleBackgroundClick = () => {
    onImageSelect(null);
  };
  
  // Start dragging an image
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedImageId) return;
    
    setIsDragging(true);
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  // Start resizing an image
  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedImageId) return;
    
    const selectedImage = images.find(img => img.id === selectedImageId);
    if (!selectedImage) return;
    
    setIsResizing(true);
    setResizeCorner(corner);
    setResizeStartDims({
      width: selectedImage.width,
      height: selectedImage.height
    });
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  // Start rotating an image
  const handleRotateStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedImageId) return;
    
    const selectedImage = images.find(img => img.id === selectedImageId);
    if (!selectedImage) return;
    
    setIsRotating(true);
    setRotateStartAngle(selectedImage.rotation);
    
    // Calculate center of the image
    const rect = (e.currentTarget.parentNode as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate initial angle
    const initialAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    setDragStartPos({
      x: initialAngle,
      y: 0
    });
  };
  
  // Handle mouse move for dragging, resizing, or rotating
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!selectedImageId) return;
      
      const selectedImage = images.find(img => img.id === selectedImageId);
      if (!selectedImage) return;
      
      if (isDragging) {
        // Calculate new position
        const deltaX = e.clientX - dragStartPos.x;
        const deltaY = e.clientY - dragStartPos.y;
        
        onImageUpdate({
          ...selectedImage,
          x: selectedImage.x + deltaX,
          y: selectedImage.y + deltaY
        });
        
        setDragStartPos({
          x: e.clientX,
          y: e.clientY
        });
      } else if (isResizing && resizeCorner) {
        // Calculate new dimensions based on resize corner
        const deltaX = e.clientX - dragStartPos.x;
        const deltaY = e.clientY - dragStartPos.y;
        let newWidth = resizeStartDims.width;
        let newHeight = resizeStartDims.height;
        let newX = selectedImage.x;
        let newY = selectedImage.y;
        
        // Maintain aspect ratio
        const aspectRatio = resizeStartDims.width / resizeStartDims.height;
        
        switch (resizeCorner) {
          case 'bottom-right':
            newWidth = resizeStartDims.width + deltaX;
            newHeight = newWidth / aspectRatio;
            break;
          case 'bottom-left':
            newWidth = resizeStartDims.width - deltaX;
            newHeight = newWidth / aspectRatio;
            newX = selectedImage.x + (resizeStartDims.width - newWidth);
            break;
          case 'top-right':
            newWidth = resizeStartDims.width + deltaX;
            newHeight = newWidth / aspectRatio;
            newY = selectedImage.y + (resizeStartDims.height - newHeight);
            break;
          case 'top-left':
            newWidth = resizeStartDims.width - deltaX;
            newHeight = newWidth / aspectRatio;
            newX = selectedImage.x + (resizeStartDims.width - newWidth);
            newY = selectedImage.y + (resizeStartDims.height - newHeight);
            break;
        }
        
        // Ensure minimum size
        if (newWidth < 20) newWidth = 20;
        if (newHeight < 20) newHeight = 20;
        
        onImageUpdate({
          ...selectedImage,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight
        });
      } else if (isRotating) {
        // Calculate center of the image
        const imgElement = document.getElementById(`image-${selectedImageId}`);
        if (!imgElement) return;
        
        const rect = imgElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate new angle
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        const deltaAngle = currentAngle - dragStartPos.x;
        
        onImageUpdate({
          ...selectedImage,
          rotation: (rotateStartAngle + deltaAngle) % 360
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
  }, [isDragging, isResizing, isRotating, dragStartPos, resizeStartDims, resizeCorner, rotateStartAngle, selectedImageId, images, onImageUpdate]);
  
  return (
    <CanvasContainer ref={containerRef} onClick={handleBackgroundClick}>
      {images.map((image) => (
        <div 
          key={image.id}
          style={{
            position: 'absolute',
            left: `${image.x}px`,
            top: `${image.y}px`,
            width: `${image.width}px`,
            height: `${image.height}px`,
            transform: `rotate(${image.rotation}deg)`,
            transformOrigin: 'center center',
          }}
        >
          <ImageElement
            id={`image-${image.id}`}
            src={image.src}
            className={selectedImageId === image.id ? 'selected' : ''}
            onClick={(e) => handleImageClick(e, image.id)}
            onMouseDown={handleDragStart}
            style={{
              width: '100%',
              height: '100%',
            }}
            draggable={false}
          />
          
          {selectedImageId === image.id && (
            <>
              <ResizeHandle 
                className="top-left" 
                onMouseDown={(e) => handleResizeStart(e, 'top-left')}
              />
              <ResizeHandle 
                className="top-right" 
                onMouseDown={(e) => handleResizeStart(e, 'top-right')}
              />
              <ResizeHandle 
                className="bottom-left" 
                onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
              />
              <ResizeHandle 
                className="bottom-right" 
                onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
              />
              <RotateHandle onMouseDown={handleRotateStart}>⟳</RotateHandle>
            </>
          )}
        </div>
      ))}
    </CanvasContainer>
  );
};

export default ImageCanvas; 