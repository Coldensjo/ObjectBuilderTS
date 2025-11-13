import React, { useState, useEffect, useRef } from 'react';
import { useWorker } from '../contexts/WorkerContext';
import { useProgress } from '../contexts/ProgressContext';
import { useToast } from '../hooks/useToast';
import { useAppStateContext } from '../contexts/AppStateContext';
import { Toolbar } from './Toolbar';
import { PreviewPanel } from './PreviewPanel';
import { ThingsPanel } from './ThingsPanel';
import { SpritesPanel } from './SpritesPanel';
import { ThingEditor } from './ThingEditor';
import { AboutDialog } from './AboutDialog';
import { PreferencesDialog } from './PreferencesDialog';
import { FindDialog } from './FindDialog';
import { ImportDialog } from './ImportDialog';
import { ExportDialog } from './ExportDialog';
import { MergeFilesDialog } from './MergeFilesDialog';
import { LogWindow } from './LogWindow';
import { FileInfoPanel } from './FileInfoPanel';
import { ObjectViewer } from './ObjectViewer';
import { AnimationEditor } from './AnimationEditor/AnimationEditor';
import { Button } from './Button';
import { AppStateProvider } from '../contexts/AppStateContext';
import { ProgressProvider } from '../contexts/ProgressContext';
import { CommandFactory } from '../services/CommandFactory';
import { getHotkeyManager } from '../services/HotkeyManager';
import { registerDefaultHotkeys } from '../services/HotkeyRegistration';
import { useHotkey } from '../hooks/useHotkey';
import './MainWindow.css';

const MainWindowContent: React.FC = () => {
  const worker = useWorker();
  const { showProgress, hideProgress } = useProgress();
  const { showSuccess, showError } = useToast();
  const { selectedThingIds, selectedSpriteIds, currentCategory } = useAppStateContext();
  const [showPreviewPanel, setShowPreviewPanel] = useState(true);
  const [showThingsPanel, setShowThingsPanel] = useState(true);
  const [showSpritesPanel, setShowSpritesPanel] = useState(true);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false);
  const [showFindDialog, setShowFindDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [showLogWindow, setShowLogWindow] = useState(false);
  const [showFileInfoPanel, setShowFileInfoPanel] = useState(false); // Off by default
  const [showObjectViewer, setShowObjectViewer] = useState(false);
  const [showAnimationEditor, setShowAnimationEditor] = useState(false);
  const [exportType, setExportType] = useState<'things' | 'sprites'>('things');
  const windowRef = useRef<HTMLDivElement>(null);

  // Initialize hotkey system
  useEffect(() => {
    registerDefaultHotkeys();
    const manager = getHotkeyManager();

    // Load hotkeys from settings (will be loaded when settings are received)
    // For now, just register the defaults

    // Handle keyboard events
    const handleKeyDown = (event: KeyboardEvent) => {
      manager.handleKeyDown(event);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Register hotkey handlers
  useHotkey('VIEW_PREVIEW', () => setShowPreviewPanel(prev => !prev));
  useHotkey('VIEW_OBJECTS', () => setShowThingsPanel(prev => !prev));
  useHotkey('VIEW_SPRITES', () => setShowSpritesPanel(prev => !prev));
  useHotkey('VIEW_FILE_INFO', () => setShowFileInfoPanel(prev => !prev));
  useHotkey('TOOLS_FIND', () => setShowFindDialog(true));
  useHotkey('FILE_IMPORT', () => setShowImportDialog(true));
  useHotkey('FILE_EXPORT', () => {
    if (selectedThingIds.length > 0) {
      setExportType('things');
    } else if (selectedSpriteIds.length > 0) {
      setExportType('sprites');
    }
    setShowExportDialog(true);
  });
  useHotkey('FILE_MERGE', () => setShowMergeDialog(true));
  useHotkey('WINDOW_PREFERENCES', () => setShowPreferencesDialog(true));
  useHotkey('WINDOW_LOG', () => setShowLogWindow(true));
  useHotkey('WINDOW_ABOUT', () => setShowAboutDialog(true));
  useHotkey('TOOLS_ANIMATION_EDITOR', () => setShowAnimationEditor(true));

  // Listen for menu actions
  useEffect(() => {
    const handleMenuAction = (action: string) => {
      switch (action) {
        case 'view-preview':
          setShowPreviewPanel(prev => !prev);
          break;
        case 'view-objects':
          setShowThingsPanel(prev => !prev);
          break;
        case 'view-sprites':
          setShowSpritesPanel(prev => !prev);
          break;
        case 'help-about':
          setShowAboutDialog(true);
          break;
        case 'file-preferences':
          setShowPreferencesDialog(true);
          break;
        case 'tools-find':
          setShowFindDialog(true);
          break;
        case 'tools-object-viewer':
          setShowObjectViewer(true);
          break;
        case 'tools-animation-editor':
          setShowAnimationEditor(true);
          break;
        case 'file-import':
          setShowImportDialog(true);
          break;
        case 'file-export':
          // Determine export type based on what's selected
          if (selectedThingIds.length > 0) {
            setExportType('things');
          } else if (selectedSpriteIds.length > 0) {
            setExportType('sprites');
          }
          setShowExportDialog(true);
          break;
        case 'file-merge':
          setShowMergeDialog(true);
          break;
        case 'window-log':
          setShowLogWindow(true);
          break;
        case 'view-file-info':
          setShowFileInfoPanel(prev => !prev);
          break;
        default:
          break;
      }
    };

    // Listen for menu actions via window.electronAPI
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.onMenuAction) {
      window.electronAPI.onMenuAction(handleMenuAction);
      return () => {
        if (window.electronAPI && window.electronAPI.removeMenuActionListener) {
          window.electronAPI.removeMenuActionListener();
        }
      };
    }
  }, []);

  return (
    <>
      <div className="main-window" title="MainWindow component">
        <Toolbar />
        <div className="main-content" title="main-content">
          <div className="main-left-sidebar" title="main-left-sidebar">
            {showPreviewPanel && (
              <PreviewPanel
                onClose={() => setShowPreviewPanel(false)}
              />
            )}
          </div>
          <div className="main-editor-area" title="main-editor-area">
            {showThingsPanel && (
              <ThingsPanel
                onClose={() => setShowThingsPanel(false)}
              />
            )}
            <ThingEditor />
            {showSpritesPanel && (
              <SpritesPanel
                onClose={() => setShowSpritesPanel(false)}
              />
            )}
          </div>
        </div>
      </div>
      <AboutDialog
        open={showAboutDialog}
        onClose={() => setShowAboutDialog(false)}
      />
      <PreferencesDialog
        open={showPreferencesDialog}
        onClose={() => setShowPreferencesDialog(false)}
        onSave={(settings) => {
          // Settings are saved via SettingsCommand in PreferencesDialog component
          console.log('Preferences saved:', settings);
        }}
      />
      <FindDialog
        open={showFindDialog}
        onClose={() => setShowFindDialog(false)}
      />
      <ImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={async (options) => {
          try {
            showProgress(`Importing ${options.type}...`);
            if (options.type === 'things') {
              // Import things from OBD files
              const command = CommandFactory.createImportThingsFromFilesCommand(options.files);
              const result = await worker.sendCommand(command);
              hideProgress();
              if (result.success) {
                showSuccess(`Successfully imported ${options.files.length} thing file(s)`);
              } else {
                showError(result.error || 'Failed to import things');
              }
            } else {
              // Import sprites from image files or SPR files
              const command = CommandFactory.createImportSpritesFromFilesCommand(options.files);
              const result = await worker.sendCommand(command);
              hideProgress();
              if (result.success) {
                const fileType = options.type === 'sprites-spr' ? 'SPR file(s)' : 'sprite file(s)';
                showSuccess(`Successfully imported ${options.files.length} ${fileType}`);
              } else {
                showError(result.error || 'Failed to import sprites');
              }
            }
            setShowImportDialog(false);
          } catch (error: any) {
            hideProgress();
            showError(error.message || 'Failed to import');
            console.error('Import error:', error);
          }
        }}
      />
      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        exportType={exportType}
        selectedIds={exportType === 'things' ? selectedThingIds : selectedSpriteIds}
        onExport={async (options) => {
          try {
            showProgress(`Exporting ${options.type}...`);
            if (options.type === 'things') {
              // Export things to OBD file
              const ids = selectedThingIds.length > 0 ? selectedThingIds : [];
              if (ids.length === 0) {
                showError('Please select at least one thing to export');
                hideProgress();
                return;
              }
              const command = CommandFactory.createExportThingCommand(
                ids,
                options.outputPath,
                options.obdVersion,
                options.spriteSheetFlag
              );
              const result = await worker.sendCommand(command);
              hideProgress();
              if (result.success) {
                showSuccess(`Successfully exported ${ids.length} thing(s)`);
              } else {
                showError(result.error || 'Failed to export things');
              }
            } else {
              // Export sprites to image file
              const ids = selectedSpriteIds.length > 0 ? selectedSpriteIds : [];
              if (ids.length === 0) {
                showError('Please select at least one sprite to export');
                hideProgress();
                return;
              }
              const command = CommandFactory.createExportSpritesCommand(
                ids,
                options.outputPath,
                options.format,
                options.transparentBackground,
                options.jpegQuality
              );
              const result = await worker.sendCommand(command);
              hideProgress();
              if (result.success) {
                showSuccess(`Successfully exported ${ids.length} sprite(s)`);
              } else {
                showError(result.error || 'Failed to export sprites');
              }
            }
            setShowExportDialog(false);
          } catch (error: any) {
            hideProgress();
            showError(error.message || 'Failed to export');
            console.error('Export error:', error);
          }
        }}
      />
      <MergeFilesDialog
        open={showMergeDialog}
        onClose={() => setShowMergeDialog(false)}
        onMerge={async (options) => {
          try {
            showProgress('Merging files...');
            const command = CommandFactory.createMergeFilesCommand(
              options.datFile,
              options.sprFile,
              options.version,
              options.extended,
              options.transparency,
              options.improvedAnimations,
              options.frameGroups
            );
            const result = await worker.sendCommand(command);
            hideProgress();
            if (result.success) {
              showSuccess('Successfully merged files');
            } else {
              showError(result.error || 'Failed to merge files');
            }
            setShowMergeDialog(false);
          } catch (error: any) {
            hideProgress();
            showError(error.message || 'Failed to merge files');
            console.error('Merge error:', error);
          }
        }}
      />
      <LogWindow
        open={showLogWindow}
        onClose={() => setShowLogWindow(false)}
      />
      {showObjectViewer && (
        <div className="object-viewer-overlay" title="object-viewer-overlay">
          <div className="object-viewer-container" title="object-viewer-container">
            <div className="object-viewer-header" title="object-viewer-header">
              <h2 title="h2">Object Viewer</h2>
              <Button variant="secondary" onClick={() => setShowObjectViewer(false)}>
                Close
              </Button>
            </div>
            <div className="object-viewer-content-wrapper" title="object-viewer-content-wrapper">
              <ObjectViewer onClose={() => setShowObjectViewer(false)} />
            </div>
          </div>
        </div>
      )}
      {showAnimationEditor && (
        <div className="object-viewer-overlay" title="object-viewer-overlay">
          <div className="object-viewer-container" title="object-viewer-container">
            <div className="object-viewer-header" title="object-viewer-header">
              <h2 title="h2">Animation Editor</h2>
              <Button variant="secondary" onClick={() => setShowAnimationEditor(false)}>
                Close
              </Button>
            </div>
            <div className="object-viewer-content-wrapper" title="object-viewer-content-wrapper">
              <AnimationEditor onClose={() => setShowAnimationEditor(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const MainWindow: React.FC = () => {
  return (
    <AppStateProvider>
      <ProgressProvider>
        <MainWindowContent />
      </ProgressProvider>
    </AppStateProvider>
  );
};

