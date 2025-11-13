import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { useWorker } from '../contexts/WorkerContext';
import { CommandFactory } from '../services/CommandFactory';
import { useToast } from '../hooks/useToast';
import './LoadFilesDialog.css';

interface Version {
  value: number;
  valueStr: string;
  datSignature: number;
  sprSignature: number;
  otbVersion: number;
}

interface LoadFilesDialogProps {
  open: boolean;
  onClose: () => void;
  onLoad: (options: {
    version: Version | null;
    extended: boolean;
    transparency: boolean;
    improvedAnimations: boolean;
    frameGroups: boolean;
  }) => void;
  datFile?: string;
  sprFile?: string;
}

export const LoadFilesDialog: React.FC<LoadFilesDialogProps> = ({
  open,
  onClose,
  onLoad,
  datFile,
  sprFile,
}) => {
  const worker = useWorker();
  const { showError } = useToast();
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{dat?: string; spr?: string}>({});
  const versionsReceivedRef = useRef(false);
  const [options, setOptions] = useState({
    extended: false,
    transparency: false,
    improvedAnimations: false,
    frameGroups: false,
  });

  useEffect(() => {
    if (open) {
      loadVersions();
    }
  }, [open]);

  // Listen for versions data from backend
  useEffect(() => {
    const handleCommand = (command: any) => {
      // Listen for any command that might contain versions
      // Versions might be sent via a SetVersionsCommand or similar
      if (command.type === 'SetVersionsCommand') {
        console.log('[LoadFilesDialog] Received SetVersionsCommand:', command);
        versionsReceivedRef.current = true;
        // Versions can be in command.data.versions or command.versions
        const versionsList = command.data?.versions || command.versions || [];
        if (versionsList.length > 0) {
          console.log('[LoadFilesDialog] Setting versions:', versionsList.length);
          setVersions(versionsList);
          setLoading(false);
        } else {
          console.warn('[LoadFilesDialog] SetVersionsCommand received but no versions found');
          setLoading(false);
        }
      }
    };

    worker.onCommand(handleCommand);
  }, [worker]);

  const loadVersions = async () => {
    setLoading(true);
    versionsReceivedRef.current = false;
    try {
      // Request versions list from backend
      const command = CommandFactory.createGetVersionsListCommand();
      await worker.sendCommand(command);
      // Versions will be received via SetVersionsCommand in the useEffect listener
      
      // Set a timeout to stop loading after 5 seconds if no response
      setTimeout(() => {
        if (!versionsReceivedRef.current) {
          console.warn('[LoadFilesDialog] Timeout waiting for versions, continuing with empty list');
          setLoading(false);
        }
      }, 5000);
    } catch (error) {
      console.error('Failed to load versions:', error);
      setLoading(false);
    }
  };

  const validateFiles = async (): Promise<boolean> => {
    setValidating(true);
    setValidationErrors({});
    
    try {
      const fs = (window as any).require ? (window as any).require('fs') : null;
      if (!fs) {
        // Can't validate without fs, but continue anyway
        setValidating(false);
        return true;
      }

      const errors: {dat?: string; spr?: string} = {};

      // Validate DAT file
      if (datFile) {
        if (!fs.existsSync(datFile)) {
          errors.dat = 'File does not exist';
        } else {
          const stats = fs.statSync(datFile);
          if (stats.size === 0) {
            errors.dat = 'File is empty';
          } else if (!datFile.toLowerCase().endsWith('.dat')) {
            errors.dat = 'Not a DAT file';
          }
        }
      }

      // Validate SPR file
      if (sprFile) {
        if (!fs.existsSync(sprFile)) {
          errors.spr = 'File does not exist';
        } else {
          const stats = fs.statSync(sprFile);
          if (stats.size === 0) {
            errors.spr = 'File is empty';
          } else if (!sprFile.toLowerCase().endsWith('.spr')) {
            errors.spr = 'Not an SPR file';
          }
        }
      }

      setValidationErrors(errors);
      setValidating(false);

      if (Object.keys(errors).length > 0) {
        showError('File validation failed. Please check the selected files.');
        return false;
      }

      return true;
    } catch (error: any) {
      setValidating(false);
      showError(`Validation error: ${error.message}`);
      return false;
    }
  };

  const handleLoad = async () => {
    console.log('[LoadFilesDialog] handleLoad called', { datFile, sprFile, selectedVersion, options });
    
    if (!datFile || !sprFile) {
      showError('Please select both DAT and SPR files');
      return;
    }

    // Version can be null for auto-detect - that's allowed
    // if (!selectedVersion) {
    //   showError('Please select a version');
    //   return;
    // }

    // Validate files before loading
    const isValid = await validateFiles();
    if (!isValid) {
      return;
    }
    
    console.log('[LoadFilesDialog] Calling onLoad with:', { version: selectedVersion, ...options });
    onLoad({
      version: selectedVersion, // Can be null for auto-detect
      ...options,
    });
    onClose();
  };

  const handleOptionChange = (key: keyof typeof options, value: boolean) => {
    setOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Load Project Files"
      width={550}
      height={500}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleLoad} disabled={!datFile || !sprFile}>
            Load
          </Button>
        </>
      }
    >
      <div className="load-files-content">
        <div className="load-files-section">
          <h4>Files</h4>
          <div className="load-files-field">
            <label>DAT File:</label>
            <div className={`file-path ${datFile && !validationErrors.dat ? 'file-path-valid' : validationErrors.dat ? 'file-path-error' : 'file-path-invalid'}`}>
              {datFile ? (
                <>
                  <span className="file-path-text" title={datFile}>
                    {datFile.split(/[/\\]/).pop() || datFile}
                  </span>
                  {validationErrors.dat ? (
                    <span className="file-path-icon error" title={validationErrors.dat}>⚠</span>
                  ) : (
                    <span className="file-path-icon">✓</span>
                  )}
                </>
              ) : (
                <span className="file-path-placeholder">Not selected</span>
              )}
            </div>
            {validationErrors.dat && (
              <div className="file-error-message">{validationErrors.dat}</div>
            )}
          </div>
          <div className="load-files-field">
            <label>SPR File:</label>
            <div className={`file-path ${sprFile && !validationErrors.spr ? 'file-path-valid' : validationErrors.spr ? 'file-path-error' : 'file-path-invalid'}`}>
              {sprFile ? (
                <>
                  <span className="file-path-text" title={sprFile}>
                    {sprFile.split(/[/\\]/).pop() || sprFile}
                  </span>
                  {validationErrors.spr ? (
                    <span className="file-path-icon error" title={validationErrors.spr}>⚠</span>
                  ) : (
                    <span className="file-path-icon">✓</span>
                  )}
                </>
              ) : (
                <span className="file-path-placeholder">Not selected</span>
              )}
            </div>
            {validationErrors.spr && (
              <div className="file-error-message">{validationErrors.spr}</div>
            )}
          </div>
          {validating && (
            <div className="load-files-validating">
              <p>Validating files...</p>
            </div>
          )}
        </div>

        <div className="load-files-section">
          <h4>Client Version</h4>
          {loading ? (
            <div className="loading-versions">Loading versions...</div>
          ) : versions.length > 0 ? (
            <select
              className="version-select"
              value={selectedVersion?.valueStr || ''}
              onChange={(e) => {
                const version = versions.find((v) => v.valueStr === e.target.value);
                setSelectedVersion(version || null);
              }}
            >
              <option value="">Auto-detect (recommended)</option>
              {versions.map((version) => (
                <option key={version.valueStr} value={version.valueStr}>
                  {version.valueStr} (Client {version.value})
                </option>
              ))}
            </select>
          ) : (
            <div className="version-info">
              <p>Version will be auto-detected from file signatures.</p>
              <p className="version-hint">
                If you need to specify a version, ensure versions.xml is loaded.
              </p>
            </div>
          )}
        </div>

        <div className="load-files-section">
          <h4>Load Options</h4>
          <div className="load-files-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.extended}
                onChange={(e) => handleOptionChange('extended', e.target.checked)}
              />
              <span>Extended (8.60+)</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.transparency}
                onChange={(e) => handleOptionChange('transparency', e.target.checked)}
              />
              <span>Transparency</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.improvedAnimations}
                onChange={(e) => handleOptionChange('improvedAnimations', e.target.checked)}
              />
              <span>Improved Animations</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.frameGroups}
                onChange={(e) => handleOptionChange('frameGroups', e.target.checked)}
              />
              <span>Frame Groups</span>
            </label>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

