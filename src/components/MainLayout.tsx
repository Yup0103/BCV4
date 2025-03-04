import React, { useEffect } from 'react';
import styled from 'styled-components';
import VideoEditor from './VideoEditor/VideoEditor';

// Main layout container - simplified to remove sidebar
const LayoutContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  height: 100vh;
  width: 100%;
  background-color: #121212;
  overflow: hidden;
  padding: 10px;

  /* Custom styles to align undo/redo buttons and hide help button */
  .undo-redo-container {
    display: flex !important;
    flex-direction: row !important;
    gap: 8px;
  }

  /* Hide keyboard shortcuts button - more specific selectors */
  button[title="Show keyboard shortcuts"],
  button[title="Help"],
  button[title="Keyboard Shortcuts"],
  button[title="Shortcuts"],
  button[title^="keyboard"],
  button[title^="Keyboard"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
  }

  /* Hide icons that may be inside buttons */
  svg[data-testid="HelpIcon"],
  svg[data-testid="KeyboardIcon"] {
    display: none !important;
  }
`;

// Editor content area
const EditorContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

// Main component that integrates with the existing VideoEditor
const MainLayout: React.FC = () => {
  // Add useEffect to apply custom CSS for buttons after component mounts
  useEffect(() => {
    // Allow a moment for the VideoEditor to render
    const timer = setTimeout(() => {
      // Find the undo/redo container if it's available in the DOM
      const undoButtons = document.querySelectorAll('button[title="Undo"], button[title="Redo"]');

      if (undoButtons.length >= 2) {
        // Get the parent container of the first undo/redo button
        const firstButton = undoButtons[0];
        const parentContainer = firstButton.parentElement;

        if (parentContainer) {
          // Add our custom class to the parent container
          parentContainer.classList.add('undo-redo-container');
        }
      }

      // Find and hide keyboard shortcuts button by looking for buttons with specific icons
      const allButtons = document.querySelectorAll('button');
      allButtons.forEach(button => {
        // Check button title
        const buttonTitle = button.getAttribute('title')?.toLowerCase() || '';
        if (buttonTitle.includes('keyboard') || buttonTitle.includes('shortcut') || buttonTitle.includes('help')) {
          button.style.display = 'none';
          button.style.visibility = 'hidden';
          button.style.width = '0';
          button.style.height = '0';
          button.style.padding = '0';
          button.style.margin = '0';
          button.style.overflow = 'hidden';
        }

        // Check if button contains keyboard or help icon
        const svgIcons = button.querySelectorAll('svg');
        svgIcons.forEach(svg => {
          const iconPath = svg.innerHTML.toLowerCase();
          if (iconPath.includes('keyboard') || iconPath.includes('help')) {
            button.style.display = 'none';
            button.style.visibility = 'hidden';
          }
        });
      });

    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LayoutContainer>
      <EditorContent>
        {/* Use the original VideoEditor component to maintain functionality */}
        <VideoEditor />
      </EditorContent>
    </LayoutContainer>
  );
};

export default MainLayout; 