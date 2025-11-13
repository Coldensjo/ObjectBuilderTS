import React, { useState, useEffect } from 'react';
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
import { AppStateProvider } from '../contexts/AppStateContext';
import { ProgressProvider } from '../contexts/ProgressContext';
import { CommandFactory } from '../services/CommandFactory';
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
  const [exportType, setExportType] = useState<'things' | 'sprites'>('things');

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
      <div className="main-window">
        <Toolbar />
        <div className="main-content">
          {showPreviewPanel && (
            <PreviewPanel
              onClose={() => setShowPreviewPanel(false)}
            />
          )}
          <div className="main-editor-area">
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
          // TODO: Save settings to backend
          console.log('Saving preferences:', settings);
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
              // Import sprites from image files
              const command = CommandFactory.createImportSpritesFromFilesCommand(options.files);
              const result = await worker.sendCommand(command);
              hideProgress();
              if (result.success) {
                showSuccess(`Successfully imported ${options.files.length} sprite file(s)`);
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

