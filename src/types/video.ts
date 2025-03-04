/**
 * Video-related type definitions for the application
 */

/**
 * Represents the available resize presets for video output
 */
export type ResizePreset = 'instagram' | 'youtube' | 'tiktok';

/**
 * Video dimensions interface
 */
export interface VideoDimensions {
  width: number;
  height: number;
}

/**
 * Video trim range interface
 */
export interface TrimRange {
  start: number;
  end: number;
}

/**
 * Text overlay configuration
 */
export interface TextOverlay {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily?: string;
}

/**
 * Audio mix configuration
 */
export interface AudioMix {
  audioFile: File;
  volume: number;
  startTime: number;
}

/**
 * Video edit operation types
 */
export type VideoEditOperation = 
  | { type: 'trim', range: TrimRange }
  | { type: 'resize', preset: ResizePreset, dimensions: VideoDimensions }
  | { type: 'text', overlay: TextOverlay }
  | { type: 'audio', mix: AudioMix };

/**
 * Video project state
 */
export interface VideoProject {
  sourceFile: File;
  operations: VideoEditOperation[];
  currentTime: number;
  duration: number;
} 