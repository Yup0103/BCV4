/**
 * Utilities for working with the File System Access API
 * This allows users to save and load projects directly from their file system
 */

// Type definitions for project data
export interface VideoProject {
  name: string;
  videoFile: File | null;
  audioFiles: File[];
  edits: EditOperation[];
  duration: number;
  created: string;
  lastModified: string;
}

// Different types of edits that can be applied to a video
export type EditOperation = 
  | { type: 'trim', startTime: number, endTime: number }
  | { type: 'textOverlay', text: string, fontColor: string, fontSize: number, position: { x: number, y: number }, startTime: number, endTime: number }
  | { type: 'audioMix', audioFileIndex: number, volume: number }
  | { type: 'resize', width: number, height: number };

// Store file handle for the project directory
let projectDirectoryHandle: FileSystemDirectoryHandle | null = null;

/**
 * Check if the File System Access API is supported
 */
export const isFileSystemApiSupported = (): boolean => {
  return 'showDirectoryPicker' in window && 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
};

/**
 * Request permission to access a directory for saving project files
 */
export const selectProjectDirectory = async (): Promise<FileSystemDirectoryHandle | null> => {
  if (!isFileSystemApiSupported()) {
    console.error('File System Access API is not supported in this browser');
    return null;
  }

  try {
    const dirHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    });
    
    projectDirectoryHandle = dirHandle;
    return dirHandle;
  } catch (error) {
    console.error('Error selecting directory:', error);
    return null;
  }
};

/**
 * Save a file to the selected project directory
 */
export const saveFileToProject = async (
  fileName: string,
  fileData: Blob
): Promise<boolean> => {
  if (!projectDirectoryHandle) {
    console.error('No project directory selected');
    return false;
  }

  try {
    // Create a file in the directory
    const fileHandle = await projectDirectoryHandle.getFileHandle(fileName, { create: true });
    
    // Write to the file
    const writable = await fileHandle.createWritable();
    await writable.write(fileData);
    await writable.close();
    
    return true;
  } catch (error) {
    console.error('Error saving file to project:', error);
    return false;
  }
};

/**
 * Save project metadata to the selected directory
 */
export const saveProjectMetadata = async (
  project: VideoProject
): Promise<boolean> => {
  if (!projectDirectoryHandle) {
    console.error('No project directory selected');
    return false;
  }

  try {
    // Create project.json with metadata
    const projectData = {
      name: project.name,
      videoFileName: project.videoFile ? project.videoFile.name : null,
      audioFileNames: project.audioFiles.map(file => file.name),
      edits: project.edits,
      duration: project.duration,
      created: project.created,
      lastModified: new Date().toISOString()
    };
    
    const json = JSON.stringify(projectData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    
    return await saveFileToProject('project.json', blob);
  } catch (error) {
    console.error('Error saving project metadata:', error);
    return false;
  }
};

/**
 * Load a project from a selected directory
 */
export const loadProject = async (): Promise<VideoProject | null> => {
  if (!isFileSystemApiSupported()) {
    console.error('File System Access API is not supported in this browser');
    return null;
  }

  try {
    // Let the user select a directory
    const dirHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    });
    
    projectDirectoryHandle = dirHandle;
    
    // Try to load project.json
    let projectFileHandle;
    try {
      projectFileHandle = await dirHandle.getFileHandle('project.json');
    } catch (e) {
      console.error('Project file not found in the selected directory');
      return null;
    }
    
    // Read project metadata
    const file = await projectFileHandle.getFile();
    const content = await file.text();
    const projectData = JSON.parse(content);
    
    // Load video file
    let videoFile = null;
    if (projectData.videoFileName) {
      try {
        const videoFileHandle = await dirHandle.getFileHandle(projectData.videoFileName);
        videoFile = await videoFileHandle.getFile();
      } catch (e) {
        console.warn('Video file not found:', projectData.videoFileName);
      }
    }
    
    // Load audio files
    const audioFiles: File[] = [];
    for (const audioFileName of projectData.audioFileNames) {
      try {
        const audioFileHandle = await dirHandle.getFileHandle(audioFileName);
        const audioFile = await audioFileHandle.getFile();
        audioFiles.push(audioFile);
      } catch (e) {
        console.warn('Audio file not found:', audioFileName);
      }
    }
    
    // Construct the project object
    const project: VideoProject = {
      name: projectData.name,
      videoFile,
      audioFiles,
      edits: projectData.edits,
      duration: projectData.duration,
      created: projectData.created,
      lastModified: projectData.lastModified
    };
    
    return project;
  } catch (error) {
    console.error('Error loading project:', error);
    return null;
  }
}; 