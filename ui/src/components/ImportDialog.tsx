import React, { useState, useEffect } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { FileDialogService } from '../services/FileDialogService';
import './ImportDialog.css';

type ImportType = 'things' | 'sprites' | 'sprites-spr';

interface FileInfo {
  path: string;
  name: string;
  size?: number;
  valid?: boolean;
  error?: string;
}

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (options: {
    type: ImportType;
    files: string[];
  }) => void;
  importType?: ImportType;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  open,
  onClose,
  onImport,
  importType = 'things',
}) => {
  const [type, setType] = useState<ImportType>(importType);
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [validating, setValidating] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = async (filePath: string): Promise<{ valid: boolean; error?: string; size?: number }> => {
    try {
      const fs = (window as any).require ? (window as any).require('fs') : null;
      if (!fs) {
        return { valid: true }; // Can't validate without fs
      }

      const stats = fs.statSync(filePath);
      const size = stats.size;
      
      // Basic validation
      if (size === 0) {
        return { valid: false, error: 'File is empty', size };
      }

      // Type-specific validation
      const ext = filePath.split('.').pop()?.toLowerCase();
      if (type === 'things' && ext !== 'obd') {
        return { valid: false, error: 'Not an OBD file', size };
      }
      if (type === 'sprites-spr' && ext !== 'spr') {
        return { valid: false, error: 'Not an SPR file', size };
      }
      if (type === 'sprites' && !['png', 'jpg', 'jpeg', 'bmp', 'gif'].includes(ext || '')) {
        return { valid: false, error: 'Not a supported image format', size };
      }

      return { valid: true, size };
    } catch (error: any) {
      return { valid: false, error: error.message || 'Validation failed' };
    }
  };

  const handleBrowseFiles = async () => {
    try {
      const fileDialog = FileDialogService.getInstance();
      let result;
      
      if (type === 'things') {
        result = await fileDialog.openOBDFile();
      } else if (type === 'sprites-spr') {
        result = await fileDialog.openSprFiles();
      } else {
        result = await fileDialog.openImageFiles();
      }

      if (!result.canceled && result.filePaths) {
        setValidating(true);
        const fileInfos: FileInfo[] = [];
        
        for (const filePath of result.filePaths) {
          const validation = await validateFile(filePath);
          const name = filePath.split(/[/\\]/).pop() || filePath;
          fileInfos.push({
            path: filePath,
            name,
            size: validation.size,
            valid: validation.valid,
            error: validation.error,
          });
        }
        
        setSelectedFiles(fileInfos);
        setValidating(false);
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error);
      setValidating(false);
    }
  };

  const handleImport = () => {
    const validFiles = selectedFiles.filter(f => f.valid !== false);
    
    if (validFiles.length === 0) {
      alert('Please select at least one valid file to import.');
      return;
    }

    if (validFiles.length < selectedFiles.length) {
      const invalidCount = selectedFiles.length - validFiles.length;
      if (!confirm(`${invalidCount} file(s) are invalid and will be skipped. Continue?`)) {
        return;
      }
    }

    onImport({
      type,
      files: validFiles.map(f => f.path),
    });
    onClose();
  };

  // Reset files when type changes
  useEffect(() => {
    setSelectedFiles([]);
  }, [type]);

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Import"
      width={600}
      height={500}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={selectedFiles.length === 0}>
            Import
          </Button>
        </>
      }
    >
      <div className="import-content">
        <div className="import-section">
          <h4>Import Type</h4>
          <div className="import-type-options">
            <label className="radio-label">
              <input
                type="radio"
                name="importType"
                value="things"
                checked={type === 'things'}
                onChange={(e) => {
                  setType(e.target.value as ImportType);
                  setSelectedFiles([]);
                }}
              />
              <span>Things (.obd files)</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="importType"
                value="sprites"
                checked={type === 'sprites'}
                onChange={(e) => {
                  setType(e.target.value as ImportType);
                  setSelectedFiles([]);
                }}
              />
              <span>Sprites (Image files)</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="importType"
                value="sprites-spr"
                checked={type === 'sprites-spr'}
                onChange={(e) => {
                  setType(e.target.value as ImportType);
                  setSelectedFiles([]);
                }}
              />
              <span>Sprites (SPR files)</span>
            </label>
          </div>
        </div>

        <div className="import-section">
          <h4>Files</h4>
          <div className="import-files-controls">
            <Button variant="secondary" onClick={handleBrowseFiles}>
              Browse Files...
            </Button>
            {selectedFiles.length > 0 && (
              <span className="file-count">{selectedFiles.length} file(s) selected</span>
            )}
          </div>
          {validating && (
            <div className="import-validating">
              <p>Validating files...</p>
            </div>
          )}
          {selectedFiles.length > 0 && (
            <div className="import-files-list">
              {selectedFiles.map((file, index) => (
                <div 
                  key={index} 
                  className={`import-file-item ${file.valid === false ? 'invalid' : ''}`}
                >
                  <div className="file-info">
                    <span className="file-name" title={file.path}>
                      {file.name}
                    </span>
                    {file.size !== undefined && (
                      <span className="file-size">{formatFileSize(file.size)}</span>
                    )}
                    {file.valid === false && file.error && (
                      <span className="file-error" title={file.error}>
                        ⚠ {file.error}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="remove-file-button"
                    onClick={() => handleRemoveFile(index)}
                    aria-label="Remove file"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="import-section">
          <div className="import-info">
            <p>
              {type === 'things' ? (
                <>
                  Select one or more .obd files to import things into the current project.
                  Each file should contain thing data in Object Builder format.
                </>
              ) : type === 'sprites-spr' ? (
                <>
                  Select one or more .spr files to import sprites into the current project.
                  SPR files contain sprite data in Tibia client format. The current project's version settings will be used to read the SPR files.
                </>
              ) : (
                <>
                  Select one or more image files (PNG, JPEG, BMP, GIF) to import as sprites.
                  Images will be converted to 32x32 sprites.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

