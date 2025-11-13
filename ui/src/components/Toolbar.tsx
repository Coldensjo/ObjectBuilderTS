import React, { useEffect, useState } from 'react';
import { useWorker } from '../contexts/WorkerContext';
import { useAppStateContext } from '../contexts/AppStateContext';
import { useProgress } from '../contexts/ProgressContext';
import { useToast } from '../hooks/useToast';
import { useThingEditor } from '../contexts/ThingEditorContext';
import { CommandFactory } from '../services/CommandFactory';
import { FileDialogService } from '../services/FileDialogService';
import { LoadFilesDialog } from './LoadFilesDialog';
import { NewProjectDialog } from './NewProjectDialog';
import { CompileOptionsDialog } from './CompileOptionsDialog';
import { ConfirmDialog } from './ConfirmDialog';
import './Toolbar.css';

// Category constants (matching backend)
const ThingCategory = {
  ITEM: 'item',
  OUTFIT: 'outfit',
  EFFECT: 'effect',
  MISSILE: 'missile',
};

export const Toolbar: React.FC = () => {
  const worker = useWorker();
  const { currentCategory, setCategory } = useAppStateContext();
  const { showProgress, hideProgress } = useProgress();
  const { showSuccess, showError } = useToast();
  const { saveThingChanges } = useThingEditor();
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [compileDialogOpen, setCompileDialogOpen] = useState(false);
  const [unloadConfirmOpen, setUnloadConfirmOpen] = useState(false);
  const [selectedDatFile, setSelectedDatFile] = useState<string | undefined>();
  const [selectedSprFile, setSelectedSprFile] = useState<string | undefined>();
  const [clientChanged, setClientChanged] = useState(false);
  const [clientLoaded, setClientLoaded] = useState(false);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [settings, setSettings] = useState<any>({ autosaveThingChanges: false });

  // Listen for client info changes and settings
  useEffect(() => {
    const handleCommand = (command: any) => {
      if (command.type === 'SetClientInfoCommand' && command.data) {
        setClientLoaded(command.data.loaded || false);
        setClientChanged(command.data.changed || false);
        setClientInfo(command.data);
      } else if (command.type === 'SettingsCommand' && command.data && command.data.settings) {
        setSettings(command.data.settings);
      }
    };

    worker.onCommand(handleCommand);
  }, [worker]);

  // Listen for menu actions
  useEffect(() => {
    const handleMenuAction = (action: string) => {
      switch (action) {
        case 'file-new':
          handleNew();
          break;
        case 'file-open':
          handleOpen();
          break;
        case 'file-compile':
          handleCompile();
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

  const handleNew = () => {
    setNewProjectDialogOpen(true);
  };

  const handleCreateNewProject = async (options: {
    datSignature: number;
    sprSignature: number;
    extended: boolean;
    transparency: boolean;
    improvedAnimations: boolean;
    frameGroups: boolean;
  }) => {
    try {
      showProgress('Creating new project...');
      const command = CommandFactory.createCreateNewFilesCommand(
        options.datSignature,
        options.sprSignature,
        options.extended,
        options.transparency,
        options.improvedAnimations,
        options.frameGroups
      );
      const result = await worker.sendCommand(command);
      hideProgress();
      if (result.success) {
        showSuccess('New project created successfully');
        setNewProjectDialogOpen(false);
      } else {
        showError(result.error || 'Failed to create new project');
      }
    } catch (error: any) {
      hideProgress();
      showError(error.message || 'Failed to create new project');
      console.error('Failed to create new project:', error);
    }
  };

  const handleOpen = async () => {
    try {
      const fileDialog = FileDialogService.getInstance();
      
      // First, try to get both files at once
      let result = await fileDialog.openDatSprFiles();
      
      if (result.canceled) {
        return;
      }
      
      if (!result.filePaths || result.filePaths.length === 0) {
        return;
      }
      
      // Find DAT and SPR files from selection
      let datFile = result.filePaths.find(p => p.toLowerCase().endsWith('.dat'));
      let sprFile = result.filePaths.find(p => p.toLowerCase().endsWith('.spr'));
      
      // If only one file type is selected, prompt for the other
      if (!datFile && !sprFile) {
        showError('Please select at least one .dat or .spr file');
        return;
      }
      
      // Get directory from first selected file for subsequent dialogs
      const path = (window as any).require ? (window as any).require('path') : null;
      const dirname = path ? path.dirname : ((p: string) => p.substring(0, p.lastIndexOf('/') || p.lastIndexOf('\\')));
      const defaultDir = result.filePaths.length > 0 ? dirname(result.filePaths[0]) : undefined;
      
      // Helper function to find corresponding file using IPC
      const findCorrespondingFile = async (selectedFile: string, targetExt: string): Promise<string | null> => {
        try {
          const electronAPI = (window as any).electronAPI;
          if (electronAPI && electronAPI.findCorrespondingFile) {
            const result = await electronAPI.findCorrespondingFile(selectedFile, targetExt);
            if (result.success && result.exists && result.filePath) {
              console.log(`[Toolbar] Auto-found ${targetExt} file: ${result.filePath}`);
              return result.filePath;
            }
          }
        } catch (error) {
          console.error('Error checking for corresponding file:', error);
        }
        
        return null;
      };
      
      // If DAT file is missing, try to find it automatically from SPR file
      if (!datFile && sprFile) {
        const autoDatFile = await findCorrespondingFile(sprFile, '.dat');
        if (autoDatFile) {
          datFile = autoDatFile;
        }
      }
      
      // If SPR file is missing, try to find it automatically from DAT file
      if (!sprFile && datFile) {
        const autoSprFile = await findCorrespondingFile(datFile, '.spr');
        if (autoSprFile) {
          sprFile = autoSprFile;
        }
      }
      
      // If DAT file is still missing, prompt for it
      if (!datFile) {
        const datResult = await fileDialog.showOpenDialog({
          title: 'Select DAT File',
          defaultPath: defaultDir,
          filters: [
            { name: 'DAT Files', extensions: ['dat'] },
            { name: 'All Files', extensions: ['*'] },
          ],
          properties: ['openFile'],
        });
        
        if (datResult.canceled || !datResult.filePaths || datResult.filePaths.length === 0) {
          return;
        }
        
        datFile = datResult.filePaths[0];
        if (!datFile.toLowerCase().endsWith('.dat')) {
          showError('Invalid DAT file. Please select a file with .dat extension');
          return;
        }
      }
      
      // If SPR file is still missing, prompt for it
      if (!sprFile) {
        const sprResult = await fileDialog.showOpenDialog({
          title: 'Select SPR File',
          defaultPath: defaultDir,
          filters: [
            { name: 'SPR Files', extensions: ['spr'] },
            { name: 'All Files', extensions: ['*'] },
          ],
          properties: ['openFile'],
        });
        
        if (sprResult.canceled || !sprResult.filePaths || sprResult.filePaths.length === 0) {
          return;
        }
        
        sprFile = sprResult.filePaths[0];
        if (!sprFile.toLowerCase().endsWith('.spr')) {
          showError('Invalid SPR file. Please select a file with .spr extension');
          return;
        }
      }
      
      setSelectedDatFile(datFile);
      setSelectedSprFile(sprFile);
      setLoadDialogOpen(true);
    } catch (error: any) {
      showError(error.message || 'Failed to open project');
      console.error('Failed to open project:', error);
    }
  };

  const handleLoadFiles = async (options: {
    version: any;
    extended: boolean;
    transparency: boolean;
    improvedAnimations: boolean;
    frameGroups: boolean;
  }) => {
    console.log('[Toolbar] handleLoadFiles called with:', options);
    
    if (!selectedDatFile || !selectedSprFile) {
      showError('Please select both DAT and SPR files');
      return;
    }

    // Version can be null for auto-detect - backend will auto-detect from file signatures
    // if (!options.version) {
    //   showError('Please select a version');
    //   return;
    // }

    try {
      showProgress('Loading project files...');
      console.log('[Toolbar] Creating LoadFilesCommand:', {
        datFile: selectedDatFile,
        sprFile: selectedSprFile,
        version: options.version,
        extended: options.extended,
        transparency: options.transparency,
        improvedAnimations: options.improvedAnimations,
        frameGroups: options.frameGroups,
      });
      
      const command = CommandFactory.createLoadFilesCommand(
        selectedDatFile,
        selectedSprFile,
        options.version,
        options.extended,
        options.transparency,
        options.improvedAnimations,
        options.frameGroups
      );
      
      console.log('[Toolbar] Sending command:', command);
      const loadResult = await worker.sendCommand(command);
      console.log('[Toolbar] Received result:', loadResult);
      hideProgress();
      if (loadResult.success) {
        // Get client info for success message (may not be available immediately)
        const info = clientInfo || loadResult.data?.clientInfo;
        const spriteCount = info?.spritesCount || info?.maxSpriteId || 0;
        const thingCount = (info?.itemsCount || info?.maxItemId || 0) + 
                          (info?.outfitsCount || info?.maxOutfitId || 0) + 
                          (info?.effectsCount || info?.maxEffectId || 0) + 
                          (info?.missilesCount || info?.maxMissileId || 0);
        const successMsg = thingCount > 0 || spriteCount > 0
          ? `Project loaded successfully - ${spriteCount} sprites, ${thingCount} things`
          : 'Project loaded successfully';
        showSuccess(successMsg);
        setLoadDialogOpen(false);
        setSelectedDatFile(undefined);
        setSelectedSprFile(undefined);
      } else {
        const errorMsg = loadResult.error || 'Failed to load project';
        // Provide more specific error messages
        let detailedError = errorMsg;
        if (errorMsg.includes('SPR') || errorMsg.includes('spr')) {
          detailedError = `SPR file error: ${errorMsg}. Please check if the SPR file is valid and not corrupted.`;
        } else if (errorMsg.includes('DAT') || errorMsg.includes('dat')) {
          detailedError = `DAT file error: ${errorMsg}. Please check if the DAT file is valid and not corrupted.`;
        }
        showError(detailedError);
      }
    } catch (error: any) {
      hideProgress();
      const errorMessage = error.message || 'Failed to load project';
      
      // Provide helpful error messages
      let detailedError = errorMessage;
      if (errorMessage.includes('ENOENT') || errorMessage.includes('not found')) {
        detailedError = 'File not found. Please check if the DAT and SPR files exist and are accessible.';
      } else if (errorMessage.includes('permission')) {
        detailedError = 'Permission denied. Please check file permissions.';
      } else if (errorMessage.includes('corrupt') || errorMessage.includes('invalid')) {
        detailedError = 'File appears to be corrupted or invalid. Please verify the files are valid Tibia client files.';
      } else if (errorMessage.includes('SPR') || errorMessage.includes('spr')) {
        detailedError = `SPR file error: ${errorMessage}. Please check if the SPR file is valid and not corrupted.`;
      } else if (errorMessage.includes('DAT') || errorMessage.includes('dat')) {
        detailedError = `DAT file error: ${errorMessage}. Please check if the DAT file is valid and not corrupted.`;
      }
      
      showError(detailedError);
      console.error('Failed to load project:', error);
    }
  };

  const handleCompile = () => {
    setCompileDialogOpen(true);
  };

  const handleCompileWithOptions = async (options: {
    useCustomLocation: boolean;
    datFile?: string;
    sprFile?: string;
  }) => {
    try {
      // Auto-save thing changes if enabled
      if (settings.autosaveThingChanges) {
        await saveThingChanges();
      }
      
      showProgress('Compiling project...');
      
      if (options.useCustomLocation && options.datFile && options.sprFile && clientInfo) {
        // Use CompileAsCommand for custom location
        const command = CommandFactory.createCompileAsCommand(
          options.datFile,
          options.sprFile,
          clientInfo.version || { id: 0, name: 'Unknown' },
          clientInfo.extended || false,
          clientInfo.transparency || false,
          clientInfo.improvedAnimations || false,
          clientInfo.frameGroups || false
        );
        const result = await worker.sendCommand(command);
        hideProgress();
        if (result.success) {
          showSuccess('Project compiled successfully');
          setCompileDialogOpen(false);
        } else {
          showError(result.error || 'Failed to compile project');
        }
      } else {
        // Use regular CompileCommand for default location
        const command = CommandFactory.createCompileCommand();
        const result = await worker.sendCommand(command);
        hideProgress();
        if (result.success) {
          showSuccess('Project compiled successfully');
          setCompileDialogOpen(false);
        } else {
          showError(result.error || 'Failed to compile project');
        }
      }
    } catch (error: any) {
      hideProgress();
      showError(error.message || 'Failed to compile project');
      console.error('Failed to compile:', error);
    }
  };

  const handleUnload = () => {
    if (!clientLoaded) return;
    
    if (clientChanged) {
      // Show confirmation dialog
      setUnloadConfirmOpen(true);
    } else {
      // No changes, unload directly
      performUnload();
    }
  };

  const performUnload = async () => {
    try {
      showProgress('Unloading project...');
      const command = CommandFactory.createUnloadFilesCommand();
      const result = await worker.sendCommand(command);
      hideProgress();
      if (result.success) {
        showSuccess('Project unloaded successfully');
        setUnloadConfirmOpen(false);
      } else {
        showError(result.error || 'Failed to unload project');
      }
    } catch (error: any) {
      hideProgress();
      showError(error.message || 'Failed to unload project');
      console.error('Failed to unload:', error);
    }
  };

  const handleUnloadConfirm = () => {
    // User confirmed, unload without saving
    performUnload();
  };

  const handleUnloadCancel = () => {
    setUnloadConfirmOpen(false);
  };

  const handleCategoryChange = (category: string) => {
    setCategory(category);
    // ThingList component will automatically reload when category changes
    // via its useEffect hook that watches currentCategory
  };

  return (
    <>
      <div className="toolbar" title="Toolbar component">
        <div className="toolbar-section" title="toolbar-section">
          <button className="toolbar-button" title="toolbar-button (New Project)" onClick={handleNew}>
            <span title="span">New</span>
          </button>
          <button className="toolbar-button" title="toolbar-button (Open Project)" onClick={handleOpen}>
            <span title="span">Open</span>
          </button>
          <button className="toolbar-button" title="toolbar-button (Save Project)" disabled>
            <span title="span">Save</span>
          </button>
          <button 
            className="toolbar-button" 
            title="toolbar-button (Unload Project)" 
            onClick={handleUnload}
            disabled={!clientLoaded}
          >
            <span title="span">Unload</span>
          </button>
          <div className="toolbar-separator" title="toolbar-separator" />
          <button className="toolbar-button" title="toolbar-button (Compile)" onClick={handleCompile}>
            <span title="span">Compile</span>
          </button>
        </div>
        <div className="toolbar-section" title="toolbar-section">
          <button
            className={`toolbar-button ${currentCategory === ThingCategory.ITEM ? 'active' : ''}`}
            title="toolbar-button (Items category)"
            onClick={() => handleCategoryChange(ThingCategory.ITEM)}
          >
            <span title="span">Items</span>
          </button>
          <button
            className={`toolbar-button ${currentCategory === ThingCategory.OUTFIT ? 'active' : ''}`}
            title="toolbar-button (Outfits category)"
            onClick={() => handleCategoryChange(ThingCategory.OUTFIT)}
          >
            <span title="span">Outfits</span>
          </button>
          <button
            className={`toolbar-button ${currentCategory === ThingCategory.EFFECT ? 'active' : ''}`}
            title="toolbar-button (Effects category)"
            onClick={() => handleCategoryChange(ThingCategory.EFFECT)}
          >
            <span title="span">Effects</span>
          </button>
          <button
            className={`toolbar-button ${currentCategory === ThingCategory.MISSILE ? 'active' : ''}`}
            title="toolbar-button (Missiles category)"
            onClick={() => handleCategoryChange(ThingCategory.MISSILE)}
          >
            <span title="span">Missiles</span>
          </button>
        </div>
      </div>
      <LoadFilesDialog
        open={loadDialogOpen}
        onClose={() => {
          setLoadDialogOpen(false);
          setSelectedDatFile(undefined);
          setSelectedSprFile(undefined);
        }}
        onLoad={handleLoadFiles}
        datFile={selectedDatFile}
        sprFile={selectedSprFile}
      />
      <NewProjectDialog
        open={newProjectDialogOpen}
        onClose={() => setNewProjectDialogOpen(false)}
        onCreate={handleCreateNewProject}
      />
      <CompileOptionsDialog
        open={compileDialogOpen}
        onClose={() => setCompileDialogOpen(false)}
        onCompile={handleCompileWithOptions}
      />
      <ConfirmDialog
        open={unloadConfirmOpen}
        title="Unload Project"
        message="You have unsaved changes. Are you sure you want to unload the project? All unsaved changes will be lost."
        confirmLabel="Unload"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleUnloadConfirm}
        onCancel={handleUnloadCancel}
      />
    </>
  );
};
