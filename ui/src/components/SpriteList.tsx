import React, { useEffect, useState, useRef } from 'react';
import { useWorker } from '../contexts/WorkerContext';
import { useAppStateContext } from '../contexts/AppStateContext';
import { CommandFactory } from '../services/CommandFactory';
import { SpriteThumbnail } from './SpriteThumbnail';
import './SpriteList.css';

interface SpriteListItem {
  id: number;
  pixels?: Uint8Array | ArrayBuffer | Buffer | any;
}

export const SpriteList: React.FC = () => {
  const worker = useWorker();
  const { selectedSpriteIds, setSelectedSpriteIds } = useAppStateContext();
  const [sprites, setSprites] = useState<SpriteListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Listen for SetSpriteListCommand
  useEffect(() => {
    const handleCommand = (command: any) => {
      if (command.type === 'SetSpriteListCommand') {
        // Extract sprite list from command
        // Command structure: { type, data: { selectedIds, list: SpriteData[] } }
        // Or: { type, selectedIds, sprites: SpriteData[] }
        let spriteList: SpriteListItem[] = [];
        let selectedIds: number[] = [];
        
        if (command.data) {
          spriteList = command.data.list || command.data.sprites || [];
          selectedIds = command.data.selectedIds || [];
        } else if (command.sprites) {
          spriteList = command.sprites;
          selectedIds = command.selectedIds || [];
        }
        
        // Transform SpriteData objects to UI format
        const transformedList = spriteList.map((sprite: any) => {
          const id = sprite.id || 0;
          
          // Extract pixels - should be ArrayBuffer after Electron IPC serialization
          let pixels = null;
          if (sprite.pixels) {
            // After Electron IPC, pixels should be ArrayBuffer
            if (sprite.pixels instanceof ArrayBuffer) {
              pixels = sprite.pixels;
            } else if (sprite.pixels instanceof Uint8Array) {
              pixels = sprite.pixels;
            } else if (sprite.pixels.buffer instanceof ArrayBuffer) {
              // Typed array view
              pixels = sprite.pixels.buffer;
            } else if (typeof sprite.pixels === 'object' && sprite.pixels.byteLength !== undefined) {
              // ArrayBuffer-like object
              pixels = sprite.pixels;
            } else {
              // Fallback: try to use as-is
              pixels = sprite.pixels;
            }
          }
          
          return {
            id,
            pixels,
          };
        });
        
        setSprites(transformedList);
        if (selectedIds.length > 0) {
          setSelectedSpriteIds(selectedIds);
        }
        setLoading(false);
        loadingSpriteRef.current = null; // Clear loading flag
      }
    };

    worker.onCommand(handleCommand);
  }, [worker, setSelectedSpriteIds]);

  // Track last loaded thing to prevent duplicate reloads
  const lastThingRef = useRef<{ id: number; category: string } | null>(null);
  
  // Load sprite list when thing is selected
  useEffect(() => {
    const handleCommand = (command: any) => {
      if (command.type === 'SetThingDataCommand') {
        // Extract sprite IDs from thing data
        const thingData = command.data;
        if (thingData && thingData.thing) {
          const thingId = thingData.thing.id;
          const thingCategory = thingData.thing.category;
          
          // Prevent reloading if it's the same thing and category
          if (lastThingRef.current && 
              lastThingRef.current.id === thingId && 
              lastThingRef.current.category === thingCategory) {
            return;
          }
          lastThingRef.current = { id: thingId, category: thingCategory };
          
          if (thingData.sprites) {
            // Get sprites from the DEFAULT frame group (or first available)
            let spriteIds: number[] = [];
            
            // Try to get sprites from frame groups
            if (thingData.sprites instanceof Map) {
              // If it's a Map, get sprites from DEFAULT frame group (0)
              const defaultSprites = thingData.sprites.get(0) || [];
              spriteIds = defaultSprites.map((s: any) => s.id).filter((id: number) => id > 0);
            } else if (Array.isArray(thingData.sprites)) {
              // If it's an array, use it directly
              spriteIds = thingData.sprites.map((s: any) => s.id).filter((id: number) => id > 0);
            } else if (thingData.sprites[0]) {
              // If it's an object with numeric keys
              const defaultSprites = thingData.sprites[0] || [];
              spriteIds = defaultSprites.map((s: any) => s.id).filter((id: number) => id > 0);
            }
            
            // Load sprite list with first sprite ID if available
            if (spriteIds.length > 0) {
              const firstSpriteId = spriteIds[0];
              loadSpriteList(firstSpriteId);
              // Select the first sprite in the list
              setSelectedSpriteIds([firstSpriteId]);
            } else {
              setSprites([]);
              setSelectedSpriteIds([]);
              setLoading(false);
            }
          } else {
            setSprites([]);
            setLoading(false);
          }
        }
      }
    };

    worker.onCommand(handleCommand);
  }, [worker]);

  // Cache to prevent duplicate requests
  const loadingSpriteRef = useRef<number | null>(null);
  
  const loadSpriteList = async (targetId: number) => {
    // Prevent duplicate requests for the same sprite
    if (loadingSpriteRef.current === targetId) {
      return;
    }
    
    loadingSpriteRef.current = targetId;
    setLoading(true);
    try {
      const command = CommandFactory.createGetSpriteListCommand(targetId);
      await worker.sendCommand(command);
    } catch (error) {
      console.error('Failed to load sprite list:', error);
      setLoading(false);
      loadingSpriteRef.current = null;
    }
  };

  const handleSpriteClick = (id: number, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Multi-select: toggle this sprite
      setSelectedSpriteIds(prev => {
        if (prev.includes(id)) {
          return prev.filter(sid => sid !== id);
        } else {
          return [...prev, id];
        }
      });
    } else if (e.shiftKey && selectedSpriteIds.length > 0) {
      // Range select: select from last selected to this one
      const currentIndex = sprites.findIndex(s => s.id === id);
      const lastSelectedIndex = sprites.findIndex(s => s.id === selectedSpriteIds[selectedSpriteIds.length - 1]);
      if (currentIndex >= 0 && lastSelectedIndex >= 0) {
        const start = Math.min(currentIndex, lastSelectedIndex);
        const end = Math.max(currentIndex, lastSelectedIndex);
        const rangeIds = sprites.slice(start, end + 1).map(s => s.id);
        setSelectedSpriteIds(prev => {
          const newIds = [...prev];
          rangeIds.forEach(rid => {
            if (!newIds.includes(rid)) {
              newIds.push(rid);
            }
          });
          return newIds;
        });
      }
    } else {
      // Single select
      setSelectedSpriteIds([id]);
    }
  };

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; spriteId: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, spriteId: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, spriteId });
  };

  const handleContextMenuAction = async (action: string) => {
    if (!contextMenu) return;
    
    const spriteId = contextMenu.spriteId;
    const idsToUse = selectedSpriteIds.includes(spriteId) ? selectedSpriteIds : [spriteId];
    
    switch (action) {
      case 'export':
        // Trigger export dialog - this would need to be handled by parent
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('export-sprites', { detail: { ids: idsToUse } }));
        }
        break;
      case 'replace':
        // Trigger replace dialog
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('replace-sprites', { detail: { ids: idsToUse } }));
        }
        break;
      case 'delete':
        if (confirm(`Delete ${idsToUse.length} sprite(s)?`)) {
          // This would need a RemoveSpritesCommand
          console.log('Delete sprites:', idsToUse);
        }
        break;
    }
    
    setContextMenu(null);
  };

  // Keyboard navigation (only when list container is focused)
  const listRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if list is focused or contains focused element
      if (!listElement.contains(document.activeElement)) return;
      if (sprites.length === 0) return;
      
      const selectedIndex = sprites.findIndex(s => selectedSpriteIds.includes(s.id));
      if (selectedIndex < 0 && sprites.length > 0) {
        // No selection, select first item
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          handleSpriteClick(sprites[0].id);
        }
        return;
      }

      let newIndex = selectedIndex;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (e.key === 'ArrowDown') {
          newIndex = Math.min(selectedIndex + 1, sprites.length - 1);
        } else {
          newIndex = Math.max(selectedIndex - 1, 0);
        }
        
        if (newIndex >= 0 && newIndex < sprites.length) {
          const sprite = sprites[newIndex];
          handleSpriteClick(sprite.id);
          // Scroll into view
          setTimeout(() => {
            const element = document.querySelector(`[data-sprite-id="${sprite.id}"]`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 0);
        }
      }
    };

    listElement.addEventListener('keydown', handleKeyDown);
    return () => listElement.removeEventListener('keydown', handleKeyDown);
  }, [sprites, selectedSpriteIds]);

  if (loading) {
    return (
      <div className="sprite-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading sprites...</p>
      </div>
    );
  }

  return (
    <div className="sprite-list" ref={listRef} tabIndex={0}>
      {sprites.length === 0 ? (
        <div className="sprite-list-empty">
          <p>No sprites found</p>
          <p className="sprite-list-empty-hint">
            Select a thing to view its sprites
          </p>
        </div>
      ) : (
        <>
          <div className="sprite-list-header">
            <span className="sprite-list-count">{sprites.length} sprite{sprites.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="sprite-list-items">
          {sprites.map((sprite) => (
            <div
              key={sprite.id}
              data-sprite-id={sprite.id}
              className={`sprite-list-item ${
                selectedSpriteIds.includes(sprite.id) ? 'selected' : ''
              }`}
              onClick={(e) => handleSpriteClick(sprite.id, e)}
              onContextMenu={(e) => handleContextMenu(e, sprite.id)}
              title={`Sprite #${sprite.id}${selectedSpriteIds.length > 1 ? ` (${selectedSpriteIds.length} selected)` : ''}`}
            >
                <div className="sprite-list-item-preview">
                  {sprite.pixels ? (
                    <SpriteThumbnail 
                      pixels={sprite.pixels} 
                      size={32} 
                      scale={2}
                      format="argb" // Sprite pixels from Sprite.getPixels() are in ARGB format
                    />
                  ) : (
                    <div className="sprite-list-item-placeholder">#{sprite.id}</div>
                  )}
                </div>
                <div className="sprite-list-item-id">#{sprite.id}</div>
              </div>
            ))}
          </div>
        </>
      )}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <div className="context-menu-item" onClick={() => handleContextMenuAction('export')}>
            Export Sprite{selectedSpriteIds.length > 1 ? 's' : ''}
          </div>
          <div className="context-menu-item" onClick={() => handleContextMenuAction('replace')}>
            Replace Sprite{selectedSpriteIds.length > 1 ? 's' : ''}
          </div>
          <div className="context-menu-separator"></div>
          <div className="context-menu-item" onClick={() => handleContextMenuAction('delete')}>
            Delete Sprite{selectedSpriteIds.length > 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

