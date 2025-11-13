import React, { useState, useEffect } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { useWorker } from '../contexts/WorkerContext';
import { useToast } from '../hooks/useToast';
import { CommandFactory } from '../services/CommandFactory';
import './PreferencesDialog.css';

interface PreferencesDialogProps {
  open: boolean;
  onClose: () => void;
  onSave?: (settings: any) => void;
}

export const PreferencesDialog: React.FC<PreferencesDialogProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const worker = useWorker();
  const { showSuccess, showError } = useToast();
  const [settings, setSettings] = useState({
    objectsListAmount: 100,
    spritesListAmount: 100,
    autosaveThingChanges: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen for settings from backend
    // Settings are sent via SettingsCommand when app initializes
    const handleCommand = (command: any) => {
      if (command.type === 'SettingsCommand' && command.data && command.data.settings) {
        const settingsData = command.data.settings;
        setSettings({
          objectsListAmount: settingsData.objectsListAmount || 100,
          spritesListAmount: settingsData.spritesListAmount || 100,
          autosaveThingChanges: settingsData.autosaveThingChanges || false,
        });
      }
    };

    worker.onCommand(handleCommand);
    
    // Request current settings (if available)
    // Note: This might not work if there's no GetSettingsCommand
    // Settings will be loaded when backend sends them
  }, [open, worker]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Create settings object matching ObjectBuilderSettings structure
      const settingsData = {
        objectsListAmount: settings.objectsListAmount,
        spritesListAmount: settings.spritesListAmount,
        autosaveThingChanges: settings.autosaveThingChanges,
      };

      // Send settings to backend via SettingsCommand
      const command = CommandFactory.createSettingsCommand(settingsData);
      const result = await worker.sendCommand(command);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save settings');
      }
      
      if (onSave) {
        onSave(settingsData);
      }
      
      showSuccess('Preferences saved');
      onClose();
    } catch (error: any) {
      showError(error.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Preferences"
      width={500}
      height={400}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="preferences-content">
        <div className="preferences-section">
          <h4>List Settings</h4>
          <div className="preferences-field">
            <label>
              Objects List Amount:
              <input
                type="number"
                value={settings.objectsListAmount}
                onChange={(e) =>
                  handleChange('objectsListAmount', parseInt(e.target.value) || 100)
                }
                min="10"
                max="1000"
              />
            </label>
          </div>
          <div className="preferences-field">
            <label>
              Sprites List Amount:
              <input
                type="number"
                value={settings.spritesListAmount}
                onChange={(e) =>
                  handleChange('spritesListAmount', parseInt(e.target.value) || 100)
                }
                min="10"
                max="1000"
              />
            </label>
          </div>
        </div>

        <div className="preferences-section">
          <h4>Editor Settings</h4>
          <div className="preferences-field checkbox-field">
            <label>
              <input
                type="checkbox"
                checked={settings.autosaveThingChanges}
                onChange={(e) => handleChange('autosaveThingChanges', e.target.checked)}
              />
              Auto-save thing changes
            </label>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

