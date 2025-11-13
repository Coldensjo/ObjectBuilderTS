import React, { useState, useEffect, useRef } from 'react';
import { useWorker } from '../contexts/WorkerContext';
import { useAppStateContext } from '../contexts/AppStateContext';
import { useToast } from '../hooks/useToast';
import { CommandFactory } from '../services/CommandFactory';
import './ThingEditor.css';

interface ThingData {
  id: number;
  category: string;
  thing?: {
    id: number;
    category: string;
    isGround?: boolean;
    groundSpeed?: number;
    stackable?: boolean;
    pickupable?: boolean;
    hasLight?: boolean;
    lightLevel?: number;
    lightColor?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export const ThingEditor: React.FC = () => {
  const worker = useWorker();
  const { selectedThingIds, currentCategory } = useAppStateContext();
  const { showSuccess, showError } = useToast();
  const [thingData, setThingData] = useState<ThingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Cache to prevent duplicate requests
  const loadingThingRef = useRef<number | null>(null);
  
  // Load thing when selection changes (debounced)
  useEffect(() => {
    if (selectedThingIds.length > 0) {
      const id = selectedThingIds[0];
      // Prevent duplicate requests
      if (loadingThingRef.current === id) {
        return;
      }
      loadingThingRef.current = id;
      // Debounce to prevent rapid reloads
      const timeoutId = setTimeout(() => {
        loadThing(id);
      }, 100);
      return () => clearTimeout(timeoutId);
    } else {
      setThingData(null);
      setFormData({});
      loadingThingRef.current = null;
    }
  }, [selectedThingIds, currentCategory]);

  // Listen for SetThingDataCommand
  useEffect(() => {
    const handleCommand = (command: any) => {
      if (command.type === 'SetThingDataCommand') {
        const thingId = command.data?.thing?.id;
        const thingCategory = command.data?.thing?.category;
        
        // Only update if this matches the current selection
        if (thingId && selectedThingIds.length > 0 && selectedThingIds[0] === thingId && 
            thingCategory === currentCategory) {
          setThingData(command.data);
          if (command.data && command.data.thing) {
            setFormData(command.data.thing);
          }
          setLoading(false);
          loadingThingRef.current = null; // Clear loading flag
        }
      }
    };

    worker.onCommand(handleCommand);
  }, [worker, selectedThingIds, currentCategory]);

  const loadThing = async (id: number) => {
    setLoading(true);
    try {
      const command = CommandFactory.createGetThingCommand(id, currentCategory);
      await worker.sendCommand(command);
    } catch (error) {
      console.error('Failed to load thing:', error);
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!thingData) return;
    
    setSaving(true);
    try {
      const command = CommandFactory.createUpdateThingCommand(
        thingData.id,
        thingData.category,
        formData
      );
      const result = await worker.sendCommand(command);
      
      if (result.success) {
        showSuccess(`Thing #${thingData.id} saved successfully`);
      } else {
        showError(result.error || 'Failed to save thing');
      }
    } catch (error: any) {
      console.error('Failed to save thing:', error);
      showError(error.message || 'Failed to save thing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="thing-editor">
        <div className="editor-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!thingData) {
    return (
      <div className="thing-editor">
        <div className="editor-content">
          <p className="placeholder-text">Select a thing to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="thing-editor">
      <div className="editor-header">
        <h3>Thing #{thingData.id}</h3>
        <button 
          className="save-button" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div className="editor-content">
        <div className="editor-section">
          <h4>Basic Properties</h4>
          <div className="form-group">
            <label>ID:</label>
            <input type="number" value={thingData.id} disabled />
          </div>
          <div className="form-group">
            <label>Category:</label>
            <input type="text" value={thingData.category} disabled />
          </div>
        </div>

        <div className="editor-section">
          <h4>Ground Properties</h4>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isGround || false}
                onChange={(e) => handleFieldChange('isGround', e.target.checked)}
              />
              Is Ground
            </label>
          </div>
          {formData.isGround && (
            <div className="form-group">
              <label>Ground Speed:</label>
              <input
                type="number"
                value={formData.groundSpeed || 0}
                onChange={(e) => handleFieldChange('groundSpeed', parseInt(e.target.value) || 0)}
                min="0"
                max="1000"
              />
            </div>
          )}
        </div>

        <div className="editor-section">
          <h4>Item Properties</h4>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.stackable || false}
                onChange={(e) => handleFieldChange('stackable', e.target.checked)}
              />
              Stackable
            </label>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.pickupable || false}
                onChange={(e) => handleFieldChange('pickupable', e.target.checked)}
              />
              Pickupable
            </label>
          </div>
        </div>

        <div className="editor-section">
          <h4>Light Properties</h4>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.hasLight || false}
                onChange={(e) => handleFieldChange('hasLight', e.target.checked)}
              />
              Has Light
            </label>
          </div>
          {formData.hasLight && (
            <>
              <div className="form-group">
                <label>Light Level:</label>
                <input
                  type="number"
                  value={formData.lightLevel || 0}
                  onChange={(e) => handleFieldChange('lightLevel', parseInt(e.target.value) || 0)}
                  min="0"
                  max="255"
                />
              </div>
              <div className="form-group">
                <label>Light Color:</label>
                  <input
                    type="number"
                    value={formData.lightColor || 0}
                    onChange={(e) => handleFieldChange('lightColor', parseInt(e.target.value) || 0)}
                    min="0"
                    max="255"
                  />
              </div>
            </>
          )}
        </div>

        <div className="editor-section">
          <h4>Movement Properties</h4>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isUnpassable || false}
                onChange={(e) => handleFieldChange('isUnpassable', e.target.checked)}
              />
              Unpassable
            </label>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isUnmoveable || false}
                onChange={(e) => handleFieldChange('isUnmoveable', e.target.checked)}
              />
              Unmoveable
            </label>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.blockMissile || false}
                onChange={(e) => handleFieldChange('blockMissile', e.target.checked)}
              />
              Block Missile
            </label>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.blockPathfind || false}
                onChange={(e) => handleFieldChange('blockPathfind', e.target.checked)}
              />
              Block Pathfind
            </label>
          </div>
        </div>

        <div className="editor-section">
          <h4>Container Properties</h4>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isContainer || false}
                onChange={(e) => handleFieldChange('isContainer', e.target.checked)}
              />
              Is Container
            </label>
          </div>
        </div>

        <div className="editor-section">
          <h4>Writable Properties</h4>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.writable || false}
                onChange={(e) => handleFieldChange('writable', e.target.checked)}
              />
              Writable
            </label>
          </div>
          {formData.writable && (
            <div className="form-group">
              <label>Max Text Length:</label>
              <input
                type="number"
                value={formData.maxTextLength || 0}
                onChange={(e) => handleFieldChange('maxTextLength', parseInt(e.target.value) || 0)}
                min="0"
                max="255"
              />
            </div>
          )}
        </div>

        <div className="editor-section">
          <h4>Offset & Elevation</h4>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.hasOffset || false}
                onChange={(e) => handleFieldChange('hasOffset', e.target.checked)}
              />
              Has Offset
            </label>
          </div>
          {formData.hasOffset && (
            <>
              <div className="form-group">
                <label>Offset X:</label>
                <input
                  type="number"
                  value={formData.offsetX || 0}
                  onChange={(e) => handleFieldChange('offsetX', parseInt(e.target.value) || 0)}
                  min="-128"
                  max="127"
                />
              </div>
              <div className="form-group">
                <label>Offset Y:</label>
                <input
                  type="number"
                  value={formData.offsetY || 0}
                  onChange={(e) => handleFieldChange('offsetY', parseInt(e.target.value) || 0)}
                  min="-128"
                  max="127"
                />
              </div>
            </>
          )}
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.hasElevation || false}
                onChange={(e) => handleFieldChange('hasElevation', e.target.checked)}
              />
              Has Elevation
            </label>
          </div>
          {formData.hasElevation && (
            <div className="form-group">
              <label>Elevation:</label>
              <input
                type="number"
                value={formData.elevation || 0}
                onChange={(e) => handleFieldChange('elevation', parseInt(e.target.value) || 0)}
                min="0"
                max="32"
              />
            </div>
          )}
        </div>

        <div className="editor-section">
          <h4>Minimap Properties</h4>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.miniMap || false}
                onChange={(e) => handleFieldChange('miniMap', e.target.checked)}
              />
              Show on Minimap
            </label>
          </div>
          {formData.miniMap && (
            <div className="form-group">
              <label>Minimap Color:</label>
              <input
                type="number"
                value={formData.miniMapColor || 0}
                onChange={(e) => handleFieldChange('miniMapColor', parseInt(e.target.value) || 0)}
                min="0"
                max="255"
              />
            </div>
          )}
        </div>

        {currentCategory === 'item' && (
          <div className="editor-section">
            <h4>Market Properties</h4>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isMarketItem || false}
                  onChange={(e) => handleFieldChange('isMarketItem', e.target.checked)}
                />
                Market Item
              </label>
            </div>
            {formData.isMarketItem && (
              <>
                <div className="form-group">
                  <label>Market Name:</label>
                  <input
                    type="text"
                    value={formData.marketName || ''}
                    onChange={(e) => handleFieldChange('marketName', e.target.value)}
                    placeholder="Item name"
                  />
                </div>
                <div className="form-group">
                  <label>Market Category:</label>
                  <input
                    type="number"
                    value={formData.marketCategory || 0}
                    onChange={(e) => handleFieldChange('marketCategory', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
