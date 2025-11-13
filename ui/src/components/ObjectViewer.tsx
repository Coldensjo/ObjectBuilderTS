import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWorker } from '../contexts/WorkerContext';
import { useAppStateContext } from '../contexts/AppStateContext';
import { PreviewCanvas } from './PreviewCanvas';
import { Button } from './Button';
import { FileDialogService } from '../services/FileDialogService';
import { CommandFactory } from '../services/CommandFactory';
import { useToast } from '../hooks/useToast';
import './ObjectViewer.css';

interface OBDFile {
  path: string;
  name: string;
}

interface ThingData {
  thing?: {
    id: number;
    category: string;
    frameGroups?: {
      [key: number]: any;
    };
  };
  sprites?: Map<number, any[]> | any;
  obdVersion?: number;
  clientVersion?: number;
}

export const ObjectViewer: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const worker = useWorker();
  const { clientLoaded } = useAppStateContext();
  const { showSuccess, showError, showInfo } = useToast();
  const [files, setFiles] = useState<OBDFile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [thingData, setThingData] = useState<ThingData | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [showBackgroundColor, setShowBackgroundColor] = useState<boolean>(false);
  const [backgroundColor, setBackgroundColor] = useState<number>(0x636363);
  const [frameGroupType, setFrameGroupType] = useState<number>(0);
  const [lastDirectory, setLastDirectory] = useState<string | null>(null);
  const fileListRef = useRef<HTMLDivElement>(null);

  // Load OBD files from directory
  const loadFilesFromDirectory = useCallback(async (dirPath: string) => {
    try {
      // Use Node.js fs module via require (available in Electron renderer with nodeIntegration)
      // For security, we should use IPC, but for now this works
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && electronAPI.readDirectory) {
        // Use IPC if available
        const result = await electronAPI.readDirectory(dirPath);
        if (result.success) {
          const obdFiles = result.files.filter((f: string) => f.toLowerCase().endsWith('.obd'));
          const path = (window as any).require ? (window as any).require('path') : null;
          const join = path ? path.join : ((dir: string, file: string) => `${dir}/${file}`);
          const files: OBDFile[] = obdFiles.map((f: string) => ({
            path: join(dirPath, f),
            name: f,
          }));
          files.sort((a, b) => a.name.localeCompare(b.name));
          setFiles(files);
          setLastDirectory(dirPath);
          if (files.length > 0 && selectedIndex === -1) {
            setSelectedIndex(0);
          }
          return;
        }
      }

      // Fallback: use require if available (development mode)
      const fs = (window as any).require ? (window as any).require('fs') : null;
      const path = (window as any).require ? (window as any).require('path') : null;
      if (!fs || !path) {
        showError('File system access not available');
        return;
      }

      const files: OBDFile[] = [];
      const entries = fs.readdirSync(dirPath);
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isFile() && entry.toLowerCase().endsWith('.obd')) {
          files.push({
            path: fullPath,
            name: entry,
          });
        }
      }

      // Sort by name
      files.sort((a, b) => a.name.localeCompare(b.name));
      setFiles(files);
      setLastDirectory(dirPath);
      
      if (files.length > 0 && selectedIndex === -1) {
        setSelectedIndex(0);
      }
    } catch (error: any) {
      showError(`Failed to load directory: ${error.message}`);
    }
  }, [selectedIndex, showError]);

  // Load thing data from OBD file
  const loadThingData = useCallback(async (filePath: string) => {
    try {
      
      // Use IPC to load OBD file directly
      const electronAPI = (window as any).electronAPI;
      if (!electronAPI || !electronAPI.loadOBDFile) {
        throw new Error('Electron API not available');
      }

      const result = await electronAPI.loadOBDFile(filePath);

      if (result.success && result.data) {
        setThingData(result.data);
        
        // Set frame group type based on thing data
        if (result.data.thing?.frameGroups) {
          if (result.data.thing.frameGroups['1'] || result.data.thing.frameGroups[1]) { // WALKING
            setFrameGroupType(1);
          } else {
            setFrameGroupType(0); // DEFAULT
          }
        }
      } else {
        throw new Error(result.error || 'Failed to load OBD file');
      }
    } catch (error: any) {
      showError(`Failed to load OBD file: ${error.message}`);
      setThingData(null);
    }
  }, [showError]);

  // Handle file selection
  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < files.length) {
      const file = files[selectedIndex];
      loadThingData(file.path);
    }
  }, [selectedIndex, files, loadThingData]);

  // Handle open file
  const handleOpenFile = async () => {
    try {
      const fileDialog = FileDialogService.getInstance();
      const result = await fileDialog.openOBDFile();
      
      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const path = (window as any).require ? (window as any).require('path') : null;
        const dirname = path ? path.dirname : ((p: string) => p.substring(0, p.lastIndexOf('/') || p.lastIndexOf('\\')));
        const dirPath = dirname(filePath);
        await loadFilesFromDirectory(dirPath);
        
        // Find and select the opened file
        const index = files.findIndex(f => f.path === filePath);
        if (index >= 0) {
          setSelectedIndex(index);
        } else {
          // File might be in the newly loaded list
          const newFiles = files.filter(f => f.path === filePath);
          if (newFiles.length > 0) {
            setSelectedIndex(files.findIndex(f => f.path === filePath));
          }
        }
      }
    } catch (error: any) {
      showError(`Failed to open file: ${error.message}`);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (selectedIndex < 0 || selectedIndex >= files.length || !clientLoaded) {
      return;
    }

    try {
      const file = files[selectedIndex];
      const command = CommandFactory.createImportThingsFromFilesCommand([file.path]);
      const result = await worker.sendCommand(command);
      
      if (result.success) {
        showSuccess('Thing imported successfully');
      } else {
        showError(result.error || 'Failed to import thing');
      }
    } catch (error: any) {
      showError(`Failed to import: ${error.message}`);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (selectedIndex < 0 || selectedIndex >= files.length || !thingData) {
      return;
    }

    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const fs = (window as any).require ? (window as any).require('fs') : null;
      if (!fs) {
        showError('File system access not available');
        return;
      }

      const file = files[selectedIndex];
      fs.unlinkSync(file.path);
      
      // Remove from list
      const newFiles = files.filter((_, i) => i !== selectedIndex);
      setFiles(newFiles);
      
      // Select next file or previous if at end
      if (newFiles.length > 0) {
        const newIndex = Math.min(selectedIndex, newFiles.length - 1);
        setSelectedIndex(newIndex);
      } else {
        setSelectedIndex(-1);
        setThingData(null);
      }
      
      showSuccess('File deleted successfully');
    } catch (error: any) {
      showError(`Failed to delete file: ${error.message}`);
    }
  };

  // Handle previous/next
  const handlePrevious = () => {
    if (files.length > 0) {
      const newIndex = Math.max(0, selectedIndex - 1);
      setSelectedIndex(newIndex);
    }
  };

  const handleNext = () => {
    if (files.length > 0) {
      const newIndex = Math.min(files.length - 1, selectedIndex + 1);
      setSelectedIndex(newIndex);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'o') {
        event.preventDefault();
        handleOpenFile();
      } else if (event.key === 'ArrowLeft' && files.length > 1) {
        event.preventDefault();
        handlePrevious();
      } else if (event.key === 'ArrowRight' && files.length > 1) {
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files.length, selectedIndex]);

  // Handle zoom change
  const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 1.0 && value <= 5.0) {
      setZoom(value);
    }
  };

  // Handle mouse wheel zoom
  const handleWheel = (event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(1.0, Math.min(5.0, prev + delta)));
    }
  };

  // Ensure selected index is visible
  useEffect(() => {
    if (fileListRef.current && selectedIndex >= 0) {
      const item = fileListRef.current.children[selectedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const selectedFile = selectedIndex >= 0 && selectedIndex < files.length ? files[selectedIndex] : null;
  const statusText = thingData && selectedFile
    ? `Name: ${selectedFile.name} - Type: ${thingData.thing?.category || 'Unknown'} - Client: ${thingData.clientVersion ? (thingData.clientVersion / 100).toFixed(2) : 'N/A'} - OBD: ${thingData.obdVersion ? (thingData.obdVersion / 100).toFixed(2) : 'N/A'}`
    : '';

  return (
    <div className="object-viewer">
      {/* Toolbar */}
      <div className="object-viewer-toolbar">
        <div className="toolbar-left">
          <Button onClick={handleOpenFile} title="Open File (Ctrl+O)">
            Open
          </Button>
        </div>
        <div className="toolbar-right">
          <label className="background-control">
            <input
              type="checkbox"
              checked={showBackgroundColor}
              onChange={(e) => setShowBackgroundColor(e.target.checked)}
            />
            <span>Background</span>
          </label>
          {showBackgroundColor && (
            <input
              type="color"
              value={`#${backgroundColor.toString(16).padStart(6, '0')}`}
              onChange={(e) => setBackgroundColor(parseInt(e.target.value.substring(1), 16))}
              className="color-picker"
            />
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="object-viewer-content">
        {/* File list */}
        <div className="object-viewer-file-list">
          <div ref={fileListRef} className="file-list-items">
            {files.map((file, index) => (
              <div
                key={file.path}
                className={`file-list-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => setSelectedIndex(index)}
              >
                <span className="file-name" title={file.path}>
                  {file.name}
                </span>
              </div>
            ))}
            {files.length === 0 && (
              <div className="file-list-empty">
                No OBD files found. Click "Open" to select a file.
              </div>
            )}
          </div>
        </div>

        {/* Preview area */}
        <div className="object-viewer-preview" onWheel={handleWheel}>
          {thingData ? (
            <div className="preview-container" style={{ transform: `scale(${zoom})` }}>
              <PreviewCanvas
                thingData={thingData}
                width={256}
                height={256}
                frameGroupType={frameGroupType}
                patternX={thingData.thing?.category === 'outfit' ? 2 : 0}
                patternY={0}
                patternZ={0}
                animate={true}
                zoom={1}
              />
            </div>
          ) : (
            <div className="preview-placeholder">
              {selectedFile ? 'Loading...' : 'No file selected'}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="object-viewer-controls">
        <Button
          onClick={handlePrevious}
          disabled={files.length === 0 || selectedIndex <= 0}
          title="Previous (Left Arrow)"
        >
          ◀
        </Button>
        <Button
          onClick={handleImport}
          disabled={!clientLoaded || selectedIndex < 0}
          title="Import into current project"
        >
          Import
        </Button>
        <Button
          onClick={handleDelete}
          disabled={selectedIndex < 0 || !thingData}
          title="Delete file"
        >
          Delete
        </Button>
        <Button
          onClick={handleNext}
          disabled={files.length === 0 || selectedIndex >= files.length - 1}
          title="Next (Right Arrow)"
        >
          ▶
        </Button>
      </div>

      {/* Status bar */}
      <div className="object-viewer-statusbar">
        <div className="status-text">{statusText}</div>
        <div className="status-controls">
          <label>
            Zoom:
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.1"
              value={zoom}
              onChange={handleZoomChange}
              disabled={files.length === 0}
              className="zoom-slider"
            />
            <span className="zoom-value">{zoom.toFixed(1)}x</span>
          </label>
        </div>
      </div>
    </div>
  );
};

