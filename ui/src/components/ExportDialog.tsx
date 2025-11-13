import React, { useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { FileDialogService } from '../services/FileDialogService';
import { useAppStateContext } from '../contexts/AppStateContext';
import './ExportDialog.css';

type ExportType = 'things' | 'sprites';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (options: {
    type: ExportType;
    category?: string;
    outputPath: string;
    format: string;
    transparentBackground: boolean;
    jpegQuality: number;
    obdVersion?: number;
    spriteSheetFlag?: number;
  }) => void;
  exportType?: ExportType;
  selectedIds?: number[];
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  onExport,
  exportType = 'things',
  selectedIds = [],
}) => {
  const { currentCategory } = useAppStateContext();
  const [type, setType] = useState<ExportType>(exportType);
  const [category, setCategory] = useState<string>(currentCategory);
  const [outputPath, setOutputPath] = useState<string>('');
  const [format, setFormat] = useState<string>('obd');
  const [transparentBackground, setTransparentBackground] = useState<boolean>(true);
  const [jpegQuality, setJpegQuality] = useState<number>(90);
  const [obdVersion, setObdVersion] = useState<number>(3);
  const [spriteSheetFlag, setSpriteSheetFlag] = useState<number>(0);

  const handleBrowseOutput = async () => {
    try {
      const fileDialog = FileDialogService.getInstance();
      let result;
      
      if (type === 'things') {
        result = await fileDialog.showSaveDialog({
          title: 'Export Thing',
          defaultPath: outputPath || 'thing.obd',
          filters: [
            { name: 'OBD Files', extensions: ['obd'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        });
      } else {
        result = await fileDialog.showSaveDialog({
          title: 'Export Sprite',
          defaultPath: outputPath || 'sprite.png',
          filters: [
            { name: 'PNG Files', extensions: ['png'] },
            { name: 'JPEG Files', extensions: ['jpg', 'jpeg'] },
            { name: 'BMP Files', extensions: ['bmp'] },
            { name: 'GIF Files', extensions: ['gif'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        });
      }

      if (!result.canceled && result.filePath) {
        setOutputPath(result.filePath);
        // Auto-detect format from extension
        const ext = result.filePath.split('.').pop()?.toLowerCase();
        if (ext && ['png', 'jpg', 'jpeg', 'bmp', 'gif'].includes(ext)) {
          setFormat(ext === 'jpg' ? 'jpeg' : ext);
        }
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error);
    }
  };

  const handleExport = () => {
    if (!outputPath) {
      alert('Please select an output file.');
      return;
    }

    onExport({
      type,
      category: type === 'things' ? category : undefined,
      outputPath,
      format,
      transparentBackground,
      jpegQuality,
      obdVersion: type === 'things' ? obdVersion : undefined,
      spriteSheetFlag: type === 'things' ? spriteSheetFlag : undefined,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Export"
      width={550}
      height={type === 'things' ? 600 : 500}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={!outputPath}>
            Export
          </Button>
        </>
      }
    >
      <div className="export-content">
        {selectedIds.length > 0 ? (
          <div className="export-info">
            <p>{selectedIds.length} {type === 'things' ? 'thing(s)' : 'sprite(s)'} selected</p>
          </div>
        ) : (
          <div className="export-warning">
            <p>No {type === 'things' ? 'things' : 'sprites'} selected. Please select items to export.</p>
          </div>
        )}
        <div className="export-section">
          <h4>Export Type</h4>
          <div className="export-type-options">
            <label className="radio-label">
              <input
                type="radio"
                name="exportType"
                value="things"
                checked={type === 'things'}
                onChange={(e) => {
                  setType(e.target.value as ExportType);
                  setFormat('obd');
                  setOutputPath('');
                }}
              />
              <span>Things</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="exportType"
                value="sprites"
                checked={type === 'sprites'}
                onChange={(e) => {
                  setType(e.target.value as ExportType);
                  setFormat('png');
                  setOutputPath('');
                }}
              />
              <span>Sprites</span>
            </label>
          </div>
        </div>

        {type === 'things' && (
          <div className="export-section">
            <h4>Thing Options</h4>
            <div className="export-field">
              <label>
                Category:
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="export-select"
                >
                  <option value="item">Item</option>
                  <option value="outfit">Outfit</option>
                  <option value="effect">Effect</option>
                  <option value="missile">Missile</option>
                </select>
              </label>
            </div>
            <div className="export-field">
              <label>
                OBD Version:
                <input
                  type="number"
                  value={obdVersion}
                  onChange={(e) => setObdVersion(parseInt(e.target.value) || 3)}
                  min="2"
                  max="3"
                  className="export-input"
                />
              </label>
            </div>
            <div className="export-field">
              <label>
                Sprite Sheet Flag:
                <input
                  type="number"
                  value={spriteSheetFlag}
                  onChange={(e) => setSpriteSheetFlag(parseInt(e.target.value) || 0)}
                  min="0"
                  max="3"
                  className="export-input"
                />
              </label>
            </div>
          </div>
        )}

        <div className="export-section">
          <h4>Output</h4>
          <div className="export-field">
            <label>Output File:</label>
            <div className="file-input-group">
              <input
                type="text"
                value={outputPath}
                onChange={(e) => setOutputPath(e.target.value)}
                placeholder="Select output file..."
                className="file-path-input"
              />
              <Button variant="secondary" onClick={handleBrowseOutput}>
                Browse...
              </Button>
            </div>
          </div>
          {type === 'sprites' && (
            <div className="export-field">
              <label>
                Format:
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="export-select"
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="bmp">BMP</option>
                  <option value="gif">GIF</option>
                </select>
              </label>
            </div>
          )}
        </div>

        {type === 'sprites' && (
          <div className="export-section">
            <h4>Image Options</h4>
            <div className="export-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={transparentBackground}
                  onChange={(e) => setTransparentBackground(e.target.checked)}
                />
                <span>Transparent Background</span>
              </label>
              {format === 'jpeg' && (
                <div className="export-field">
                  <label>
                    JPEG Quality (1-100):
                    <input
                      type="number"
                      value={jpegQuality}
                      onChange={(e) => setJpegQuality(parseInt(e.target.value) || 90)}
                      min="1"
                      max="100"
                      className="export-input"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};

