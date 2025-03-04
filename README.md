# Modern Browser-Based Video Editor

A powerful front-end based video editing application that runs entirely in the browser. Designed for marketers and solopreneurs who need to create engaging video content without complex video editing software.

## Features

- **Entirely Client-Side Processing**: All video editing happens in your browser using FFmpeg.wasm
- **No Server Uploads**: Your videos never leave your computer
- **Intuitive Timeline Interface**: Easy trimming and editing with visual controls
- **Text Overlays**: Add text with customizable fonts and colors
- **Audio Mixing**: Add background music or voiceovers to your videos
- **Video Resizing**: Export in different dimensions for various platforms
- **Project Saving**: Save your projects locally using the File System Access API
- **Modern UI**: Clean, responsive interface that works on desktop and tablet

## Getting Started

### Prerequisites

- A modern browser (Chrome, Firefox, or Edge recommended)
- Sufficient RAM for video processing (4GB minimum, 8GB+ recommended)

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/browser-video-editor.git
   ```

2. Navigate to the project directory:
   ```
   cd browser-video-editor
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Upload a Video**: Click the "Upload Video" button to select a video file from your computer.

2. **Trim Video**: Use the timeline controls to set start and end points for your video.

3. **Add Text**: Click "Add Text" to insert text overlays at the current playback position.

4. **Add Audio**: Click "Add Audio" to upload and mix background music with your video.

5. **Resize**: Choose from preset dimensions or set custom sizes for different platforms.

6. **Export**: Click "Export Video" to process your edits and download the final result.

7. **Save Project**: Save your work to continue editing later.

## Technical Details

This application is built with:

- **React**: For the UI components and state management
- **FFmpeg.wasm**: For video processing directly in the browser
- **File System Access API**: For saving projects locally
- **TypeScript**: For type safety and better developer experience
- **Vite**: For fast development and optimized production builds

## Performance Considerations

- Processing time depends on your device's capabilities
- For best performance, use videos under 5 minutes or 100MB
- Keep browser tabs closed during export for better performance
- Allow sufficient memory allocation when prompted by your browser

## Browser Compatibility

- Chrome 86+
- Edge 86+
- Firefox 90+
- Safari 15.4+ (partial support)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- FFmpeg.wasm team for making browser-based video editing possible
- React and the open-source community for excellent tools

---

Built with ❤️ for content creators who need simple video editing tools.
