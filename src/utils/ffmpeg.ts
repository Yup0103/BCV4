import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Define the FFmpeg instance and loading state
let ffmpeg: FFmpeg | null = null;
let loaded = false;
let loadingPromise: Promise<FFmpeg> | null = null;

/**
 * Loads the FFmpeg library with the required core and WASM files
 * Returns the FFmpeg instance and loading status
 */
export const loadFFmpeg = async (
  progressCallback?: (progress: { ratio: number }) => void
): Promise<FFmpeg> => {
  console.log('🔍 Starting FFmpeg loading process...');
  
  // If already loaded, return the instance
  if (ffmpeg && loaded) {
    console.log('✅ FFmpeg already loaded, returning existing instance');
    return ffmpeg;
  }
  
  // If currently loading, return the existing promise
  if (loadingPromise) {
    console.log('⏳ FFmpeg loading in progress, returning existing promise');
    return loadingPromise;
  }

  // Create a new loading promise
  loadingPromise = (async () => {
    try {
      console.log('🔧 Creating new FFmpeg instance');
      ffmpeg = new FFmpeg();
      
      if (progressCallback) {
        console.log('📊 Setting up progress callback');
        ffmpeg.on('progress', (event) => {
          progressCallback({ ratio: event.progress });
        });
      }
      
      // Try loading with different methods
      try {
        // First try: Load from local files in public directory (preferred method)
        const baseURL = '/ffmpeg';
        console.log(`🌐 Loading FFmpeg from local files: ${baseURL}`);
        
        try {
          console.log('📦 Converting core URL to blob URL');
          const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
          
          console.log('📦 Converting WASM URL to blob URL');
          const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
          
          console.log('⏳ Loading FFmpeg with local core and WASM URLs');
          await ffmpeg.load({
            coreURL,
            wasmURL,
          });
          
          console.log('✅ FFmpeg loaded successfully from local files');
          loaded = true;
          return ffmpeg;
        } catch (localLoadError) {
          console.warn('⚠️ Local loading failed, trying with direct load', localLoadError);
          
          // Second try: Load directly (uses default paths)
          console.log('⏳ Attempting to load FFmpeg with default configuration');
          await ffmpeg.load();
          
          console.log('✅ FFmpeg loaded successfully with default configuration');
          loaded = true;
          return ffmpeg;
        }
      } catch (directLoadError) {
        console.warn('⚠️ Default loading failed, trying with CDN', directLoadError);
        
        // Third try: Load from CDN as last resort
        try {
          const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd';
          console.log(`🌐 Loading FFmpeg from CDN: ${baseURL}`);
          
          console.log('📦 Converting core URL to blob URL');
          const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
          
          console.log('📦 Converting WASM URL to blob URL');
          const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
          
          console.log('⏳ Loading FFmpeg with CDN core and WASM URLs');
          await ffmpeg.load({
            coreURL,
            wasmURL,
          });
          
          console.log('✅ FFmpeg loaded successfully from CDN');
          loaded = true;
          return ffmpeg;
        } catch (cdnLoadError) {
          console.error('❌ All loading methods failed:', cdnLoadError);
          throw new Error('Failed to load FFmpeg after trying all methods');
        }
      }
    } catch (error) {
      console.error('❌ Error loading FFmpeg:', error);
      loadingPromise = null; // Reset the promise so we can try again
      throw error;
    }
  })();

  return loadingPromise;
};

/**
 * Trims a video to the specified start and end times
 */
export const trimVideo = async (
  ffmpeg: FFmpeg,
  inputFile: File,
  startTime: number,
  endTime: number,
  outputFileName: string = 'trimmed.mp4',
  progressCallback?: (progress: { ratio: number }) => void
): Promise<Blob> => {
  try {
    // Write the input file to memory
    await ffmpeg.writeFile('input.mp4', await fetchFile(inputFile));
    
    // Set progress callback if provided
    if (progressCallback) {
      ffmpeg.on('progress', (event) => {
        progressCallback({ ratio: event.progress });
      });
    }
    
    // Execute the trim command
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-ss', startTime.toString(),
      '-to', endTime.toString(),
      '-c:v', 'copy',
      '-c:a', 'copy',
      outputFileName
    ]);
    
    // Read the output file from memory
    const data = await ffmpeg.readFile(outputFileName);
    return new Blob([data], { type: 'video/mp4' });
  } catch (error) {
    console.error('Error trimming video:', error);
    throw error;
  }
};

/**
 * Adds text overlay to a video
 */
export const addTextToVideo = async (
  ffmpeg: FFmpeg,
  inputFile: File,
  text: string,
  fontColor: string = 'white',
  fontSize: number = 24,
  position: { x: number, y: number } = { x: 10, y: 10 },
  outputFileName: string = 'text_overlay.mp4',
  progressCallback?: (progress: { ratio: number }) => void
): Promise<Blob> => {
  try {
    // Write the input file to memory
    await ffmpeg.writeFile('input.mp4', await fetchFile(inputFile));
    
    // Set progress callback if provided
    if (progressCallback) {
      ffmpeg.on('progress', (event) => {
        progressCallback({ ratio: event.progress });
      });
    }
    
    // Create the drawtext filter
    const drawTextFilter = `drawtext=text='${text}':fontcolor=${fontColor}:fontsize=${fontSize}:x=${position.x}:y=${position.y}`;
    
    // Execute the command to add text
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-vf', drawTextFilter,
      '-c:a', 'copy',
      outputFileName
    ]);
    
    // Read the output file from memory
    const data = await ffmpeg.readFile(outputFileName);
    return new Blob([data], { type: 'video/mp4' });
  } catch (error) {
    console.error('Error adding text to video:', error);
    throw error;
  }
};

/**
 * Mix audio with video
 */
export const mixAudioWithVideo = async (
  ffmpeg: FFmpeg,
  videoFile: File,
  audioFile: File,
  outputFileName: string = 'audio_mixed.mp4',
  volume: number = 1.0,
  progressCallback?: (progress: { ratio: number }) => void
): Promise<Blob> => {
  try {
    // Write the input files to memory
    await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
    await ffmpeg.writeFile('audio.mp3', await fetchFile(audioFile));
    
    // Set progress callback if provided
    if (progressCallback) {
      ffmpeg.on('progress', (event) => {
        progressCallback({ ratio: event.progress });
      });
    }
    
    // Execute the command to mix audio
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-i', 'audio.mp3',
      '-filter_complex', `[1:a]volume=${volume}[a1];[0:a][a1]amix=inputs=2:duration=shortest[a]`,
      '-map', '0:v',
      '-map', '[a]',
      '-c:v', 'copy',
      outputFileName
    ]);
    
    // Read the output file from memory
    const data = await ffmpeg.readFile(outputFileName);
    return new Blob([data], { type: 'video/mp4' });
  } catch (error) {
    console.error('Error mixing audio with video:', error);
    throw error;
  }
};

/**
 * Resize/crop video to different dimensions
 */
export const resizeVideo = async (
  ffmpeg: FFmpeg,
  inputFile: File,
  width: number,
  height: number,
  outputFileName: string = 'resized.mp4',
  progressCallback?: (progress: { ratio: number }) => void
): Promise<Blob> => {
  try {
    // Write the input file to memory
    await ffmpeg.writeFile('input.mp4', await fetchFile(inputFile));
    
    // Set progress callback if provided
    if (progressCallback) {
      ffmpeg.on('progress', (event) => {
        progressCallback({ ratio: event.progress });
      });
    }
    
    // Execute the command to resize
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-vf', `scale=${width}:${height}`,
      '-c:a', 'copy',
      outputFileName
    ]);
    
    // Read the output file from memory
    const data = await ffmpeg.readFile(outputFileName);
    return new Blob([data], { type: 'video/mp4' });
  } catch (error) {
    console.error('Error resizing video:', error);
    throw error;
  }
};

/**
 * Add a transition between two video clips
 */
export const addTransition = async (
  ffmpeg: FFmpeg,
  firstClip: File,
  secondClip: File,
  transitionType: 'fade' | 'dissolve' | 'wipe' = 'fade',
  transitionDuration: number = 1.0, // in seconds
  outputFileName: string = 'transition.mp4',
  progressCallback?: (progress: { ratio: number }) => void
): Promise<Blob> => {
  try {
    // Write the input files to memory
    await ffmpeg.writeFile('first.mp4', await fetchFile(firstClip));
    await ffmpeg.writeFile('second.mp4', await fetchFile(secondClip));
    
    // Set progress callback if provided
    if (progressCallback) {
      ffmpeg.on('progress', (event) => {
        progressCallback({ ratio: event.progress });
      });
    }
    
    let filterComplex = '';
    
    switch (transitionType) {
      case 'fade':
        filterComplex = `[0:v]format=yuva420p,fade=t=out:st=0:d=${transitionDuration}:alpha=1[fv0];` +
                        `[1:v]format=yuva420p,fade=t=in:st=0:d=${transitionDuration}:alpha=1[fv1];` +
                        `[fv0][fv1]overlay[outv]`;
        break;
      case 'dissolve':
        filterComplex = `[0:v][1:v]xfade=transition=fade:duration=${transitionDuration}[outv]`;
        break;
      case 'wipe':
        filterComplex = `[0:v][1:v]xfade=transition=wiperight:duration=${transitionDuration}[outv]`;
        break;
      default:
        filterComplex = `[0:v][1:v]xfade=transition=fade:duration=${transitionDuration}[outv]`;
    }
    
    // Execute the command to add transition
    await ffmpeg.exec([
      '-i', 'first.mp4',
      '-i', 'second.mp4',
      '-filter_complex', filterComplex,
      '-map', '[outv]',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      outputFileName
    ]);
    
    // Read the output file from memory
    const data = await ffmpeg.readFile(outputFileName);
    return new Blob([data], { type: 'video/mp4' });
  } catch (error) {
    console.error('Error adding transition:', error);
    throw error;
  }
};

/**
 * Apply a filter to video (brightness, contrast, saturation)
 */
export const applyVideoFilter = async (
  ffmpeg: FFmpeg,
  inputFile: File,
  filterType: 'brightness' | 'contrast' | 'saturation' | 'sepia' | 'grayscale',
  value: number = 1.0, // For brightness/contrast/saturation: 0-2 (1 is normal)
  outputFileName: string = 'filtered.mp4',
  progressCallback?: (progress: { ratio: number }) => void
): Promise<Blob> => {
  try {
    // Write the input file to memory
    await ffmpeg.writeFile('input.mp4', await fetchFile(inputFile));
    
    // Set progress callback if provided
    if (progressCallback) {
      ffmpeg.on('progress', (event) => {
        progressCallback({ ratio: event.progress });
      });
    }
    
    let filterString = '';
    
    switch (filterType) {
      case 'brightness':
        filterString = `eq=brightness=${value - 1}`;
        break;
      case 'contrast':
        filterString = `eq=contrast=${value}`;
        break;
      case 'saturation':
        filterString = `eq=saturation=${value}`;
        break;
      case 'sepia':
        filterString = 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131';
        break;
      case 'grayscale':
        filterString = 'colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3';
        break;
      default:
        filterString = `eq=brightness=0:contrast=1:saturation=1`;
    }
    
    // Execute the command to apply filter
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-vf', filterString,
      '-c:a', 'copy',
      outputFileName
    ]);
    
    // Read the output file from memory
    const data = await ffmpeg.readFile(outputFileName);
    return new Blob([data], { type: 'video/mp4' });
  } catch (error) {
    console.error('Error applying video filter:', error);
    throw error;
  }
};

/**
 * Split a video into multiple clips
 */
export const splitVideo = async (
  ffmpeg: FFmpeg,
  inputFile: File,
  splitPoints: number[], // Array of timestamps in seconds where to split
  outputFilePrefix: string = 'split_',
  progressCallback?: (progress: { ratio: number }) => void
): Promise<Blob[]> => {
  try {
    // Write the input file to memory
    await ffmpeg.writeFile('input.mp4', await fetchFile(inputFile));
    
    // Set progress callback if provided
    if (progressCallback) {
      ffmpeg.on('progress', (event) => {
        progressCallback({ ratio: event.progress });
      });
    }
    
    const results: Blob[] = [];
    
    // Sort split points in ascending order
    const sortedSplitPoints = [...splitPoints].sort((a, b) => a - b);
    
    // Add 0 at the beginning if not present
    if (sortedSplitPoints[0] !== 0) {
      sortedSplitPoints.unshift(0);
    }
    
    // Process each segment
    for (let i = 0; i < sortedSplitPoints.length; i++) {
      const startTime = sortedSplitPoints[i];
      const endTime = (i < sortedSplitPoints.length - 1) ? sortedSplitPoints[i + 1] : null;
      
      const outputFileName = `${outputFilePrefix}${i}.mp4`;
      
      if (endTime === null) {
        // Last segment, just trim from start time to end
        await ffmpeg.exec([
          '-i', 'input.mp4',
          '-ss', startTime.toString(),
          '-c:v', 'copy',
          '-c:a', 'copy',
          outputFileName
        ]);
      } else {
        // Middle segment, trim from start time to end time
        await ffmpeg.exec([
          '-i', 'input.mp4',
          '-ss', startTime.toString(),
          '-to', endTime.toString(),
          '-c:v', 'copy',
          '-c:a', 'copy',
          outputFileName
        ]);
      }
      
      // Read the output file from memory
      const data = await ffmpeg.readFile(outputFileName);
      results.push(new Blob([data], { type: 'video/mp4' }));
    }
    
    return results;
  } catch (error) {
    console.error('Error splitting video:', error);
    throw error;
  }
};

/**
 * Export video with specific quality settings
 */
export const exportVideo = async (
  ffmpeg: FFmpeg,
  inputFile: File,
  format: 'mp4' | 'webm' = 'mp4',
  quality: 'low' | 'medium' | 'high' = 'medium',
  outputFileName?: string,
  progressCallback?: (progress: { ratio: number }) => void
): Promise<Blob> => {
  try {
    // Write the input file to memory
    await ffmpeg.writeFile('input.mp4', await fetchFile(inputFile));
    
    // Set progress callback if provided
    if (progressCallback) {
      ffmpeg.on('progress', (event) => {
        progressCallback({ ratio: event.progress });
      });
    }
    
    // Determine output filename based on format
    const finalOutputFileName = outputFileName || `output.${format}`;
    
    // Set quality parameters
    let qualityParams: string[] = [];
    
    if (format === 'mp4') {
      switch (quality) {
        case 'low':
          qualityParams = ['-crf', '28', '-preset', 'fast'];
          break;
        case 'medium':
          qualityParams = ['-crf', '23', '-preset', 'medium'];
          break;
        case 'high':
          qualityParams = ['-crf', '18', '-preset', 'slow'];
          break;
      }
    } else if (format === 'webm') {
      switch (quality) {
        case 'low':
          qualityParams = ['-crf', '35', '-b:v', '1M'];
          break;
        case 'medium':
          qualityParams = ['-crf', '30', '-b:v', '2M'];
          break;
        case 'high':
          qualityParams = ['-crf', '25', '-b:v', '4M'];
          break;
      }
    }
    
    // Build the command
    const command = [
      '-i', 'input.mp4',
      ...qualityParams,
      finalOutputFileName
    ];
    
    // Execute the command
    await ffmpeg.exec(command);
    
    // Read the output file from memory
    const data = await ffmpeg.readFile(finalOutputFileName);
    return new Blob([data], { type: format === 'mp4' ? 'video/mp4' : 'video/webm' });
  } catch (error) {
    console.error('Error exporting video:', error);
    throw error;
  }
}; 