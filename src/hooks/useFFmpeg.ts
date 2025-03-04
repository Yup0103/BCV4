import { useState, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { loadFFmpeg } from '../utils/ffmpeg';

interface UseFFmpegOptions {
  autoLoad?: boolean;
}

interface UseFFmpegReturn {
  ffmpeg: FFmpeg | null;
  isLoaded: boolean;
  isLoading: boolean;
  loadFFmpegInstance: () => Promise<void>;
  progress: number;
  error: Error | null;
}

export function useFFmpeg({ autoLoad = true }: UseFFmpegOptions = {}): UseFFmpegReturn {
  const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const loadFFmpegInstance = useCallback(async () => {
    if (isLoaded || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const instance = await loadFFmpeg((progress) => {
        setProgress(progress.ratio);
      });
      
      setFFmpeg(instance);
      setIsLoaded(true);
    } catch (err) {
      console.error('Failed to load FFmpeg:', err);
      setError(err instanceof Error ? err : new Error('Failed to load FFmpeg'));
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isLoading]);

  useEffect(() => {
    if (autoLoad) {
      loadFFmpegInstance();
    }
  }, [autoLoad, loadFFmpegInstance]);

  return {
    ffmpeg,
    isLoaded,
    isLoading,
    loadFFmpegInstance,
    progress,
    error
  };
} 