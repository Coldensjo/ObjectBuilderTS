import React, { useEffect, useState } from 'react';
import { useWorker } from '../contexts/WorkerContext';
import { useAppStateContext } from '../contexts/AppStateContext';
import { useProgress } from '../contexts/ProgressContext';
import { useToast } from '../hooks/useToast';
import { CommandFactory } from '../services/CommandFactory';
import { FileDialogService } from '../services/FileDialogService';
import { LoadFilesDialog } from './LoadFilesDialog';
import { NewProjectDialog } from './NewProjectDialog';
import { CompileOptionsDialog } from './CompileOptionsDialog';
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
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [compileDialogOpen, setCompileDialogOpen] = useState(false);
  const [selectedDatFile, setSelectedDatFile] = useState<string | undefined>();
  const [selectedSprFile, setSelectedSprFile] = useState<string | undefined>();

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
      const result = await fileDialog.openDatSprFiles();
      
      if (!result.canceled && result.filePaths && result.filePaths.length >= 2) {
        // Find DAT and SPR files
        const datFile = result.filePaths.find(p => p.toLowerCase().endsWith('.dat'));
        const sprFile = result.filePaths.find(p => p.toLowerCase().endsWith('.spr'));
        
        if (datFile && sprFile) {
          setSelectedDatFile(datFile);
          setSelectedSprFile(sprFile);
          setLoadDialogOpen(true);
        } else {
          showError('Please select both DAT and SPR files');
        }
      }
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
    if (!selectedDatFile || !selectedSprFile) return;

    try {
      showProgress('Loading project files...');
      const command = CommandFactory.createLoadFilesCommand(
        selectedDatFile,
        selectedSprFile,
        options.version,
        options.extended,
        options.transparency,
        options.improvedAnimations,
        options.frameGroups
      );
      const loadResult = await worker.sendCommand(command);
      hideProgress();
      if (loadResult.success) {
        showSuccess('Project loaded successfully');
        setLoadDialogOpen(false);
        setSelectedDatFile(undefined);
        setSelectedSprFile(undefined);
      } else {
        showError(loadResult.error || 'Failed to load project');
      }
    } catch (error: any) {
      hideProgress();
      showError(error.message || 'Failed to load project');
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
      showProgress('Compiling project...');
      // TODO: If useCustomLocation, use CompileAsCommand instead
      // For now, just use CompileCommand
      const command = CommandFactory.createCompileCommand();
      const result = await worker.sendCommand(command);
      hideProgress();
      if (result.success) {
        showSuccess('Project compiled successfully');
        setCompileDialogOpen(false);
      } else {
        showError(result.error || 'Failed to compile project');
      }
    } catch (error: any) {
      hideProgress();
      showError(error.message || 'Failed to compile project');
      console.error('Failed to compile:', error);
    }
  };

  const handleCategoryChange = (category: string) => {
    setCategory(category);
    // ThingList component will automatically reload when category changes
    // via its useEffect hook that watches currentCategory
  };

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-section">
          <button className="toolbar-button" title="New Project" onClick={handleNew}>
            <span>New</span>
          </button>
          <button className="toolbar-button" title="Open Project" onClick={handleOpen}>
            <span>Open</span>
          </button>
          <button className="toolbar-button" title="Save Project" disabled>
            <span>Save</span>
          </button>
          <div className="toolbar-separator" />
          <button className="toolbar-button" title="Compile" onClick={handleCompile}>
            <span>Compile</span>
          </button>
        </div>
        <div className="toolbar-section">
          <button
            className={`toolbar-button ${currentCategory === ThingCategory.ITEM ? 'active' : ''}`}
            title="Items"
            onClick={() => handleCategoryChange(ThingCategory.ITEM)}
          >
            <span>Items</span>
          </button>
          <button
            className={`toolbar-button ${currentCategory === ThingCategory.OUTFIT ? 'active' : ''}`}
            title="Outfits"
            onClick={() => handleCategoryChange(ThingCategory.OUTFIT)}
          >
            <span>Outfits</span>
          </button>
          <button
            className={`toolbar-button ${currentCategory === ThingCategory.EFFECT ? 'active' : ''}`}
            title="Effects"
            onClick={() => handleCategoryChange(ThingCategory.EFFECT)}
          >
            <span>Effects</span>
          </button>
          <button
            className={`toolbar-button ${currentCategory === ThingCategory.MISSILE ? 'active' : ''}`}
            title="Missiles"
            onClick={() => handleCategoryChange(ThingCategory.MISSILE)}
          >
            <span>Missiles</span>
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
    </>
  );
};
