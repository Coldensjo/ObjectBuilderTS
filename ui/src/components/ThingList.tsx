import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useWorker } from '../contexts/WorkerContext';
import { useAppStateContext } from '../contexts/AppStateContext';
import { CommandFactory } from '../services/CommandFactory';
import { SpriteThumbnail } from './SpriteThumbnail';
import './ThingList.css';

interface ThingListItem {
  id?: number;
  thing?: {
    id: number;
    category?: string;
    [key: string]: any;
  };
  frameGroup?: any;
  pixels?: Uint8Array | ArrayBuffer | Buffer | any;
  name?: string;
  spriteId?: number;
  spritePixels?: any;
}

interface ThingListProps {
	onPaginationChange?: (pagination: {
		totalCount: number;
		minId: number;
		maxId: number;
		currentMin: number;
		currentMax: number;
	} | null) => void;
	onNavigate?: (navigateFn: (targetId: number) => void) => void;
}

export const ThingList: React.FC<ThingListProps> = ({ onPaginationChange, onNavigate }) => {
  const worker = useWorker();
  const { currentCategory, selectedThingIds, setSelectedThingIds, clientInfo } = useAppStateContext();
  const [things, setThings] = useState<ThingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<{
    totalCount: number;
    minId: number;
    maxId: number;
    currentMin: number;
    currentMax: number;
  } | null>(null);
  const clientLoaded = clientInfo?.loaded || false;

  const loadThingList = useCallback(async (targetId?: number) => {
    if (!clientLoaded) {
      console.log('[ThingList] Not loading - client not loaded');
      return;
    }
    
    setLoading(true);
    try {
      // Use appropriate starting ID based on category
      // Items start at 100, outfits/effects/missiles start at 1
      const defaultTargetId = currentCategory === 'item' ? 100 : 1;
      const finalTargetId = targetId !== undefined ? targetId : defaultTargetId;
      console.log(`[ThingList] Loading thing list: category=${currentCategory}, targetId=${finalTargetId}`);
      const command = CommandFactory.createGetThingListCommand(finalTargetId, currentCategory);
      await worker.sendCommand(command);
    } catch (error) {
      console.error('[ThingList] Failed to load thing list:', error);
      setLoading(false);
    }
  }, [currentCategory, worker, clientLoaded]);

  useEffect(() => {
    // Load thing list when category changes
    setPagination(null);
    loadThingList();
  }, [currentCategory, loadThingList]);

  // Reload thing list when client becomes loaded
  useEffect(() => {
    if (clientLoaded) {
      loadThingList();
    } else {
      // Clear things when client is unloaded
      setThings([]);
    }
  }, [clientLoaded, loadThingList]);

  // Listen for SetThingListCommand
  useEffect(() => {
    const handleCommand = (command: any) => {
      if (command.type === 'SetThingListCommand') {
        console.log('[ThingList] Received SetThingListCommand:', command);
        console.log('[ThingList] Full command structure:', JSON.stringify(command, null, 2));
        // Extract thing list from command
        // Command structure: { type, data: { selectedIds, list: ThingListItem[] } }
        // Or: { type, selectedIds, things: ThingListItem[] }
        let thingList: ThingListItem[] = [];
        let selectedIds: number[] = [];
        
        if (command.data) {
          thingList = command.data.list || command.data.things || [];
          selectedIds = command.data.selectedIds || [];
          console.log('[ThingList] Extracted from data:', { thingListLength: thingList.length, selectedIds });
        } else if (command.things) {
          thingList = command.things;
          selectedIds = command.selectedIds || [];
          console.log('[ThingList] Extracted from things:', { thingListLength: thingList.length, selectedIds });
        } else {
          console.warn('[ThingList] No data or things found in command:', command);
        }
        
        // Transform ThingListItem objects to UI format
        const transformedList = thingList.map((item: any) => {
          // Extract ID from thing object or item itself
          const id = item.thing?.id || item.id || 0;
          
          // Extract pixels - should be ArrayBuffer after Electron IPC serialization
          let pixels = null;
          if (item.pixels) {
            // After Electron IPC, pixels should be ArrayBuffer
            if (item.pixels instanceof ArrayBuffer) {
              pixels = item.pixels;
            } else if (item.pixels instanceof Uint8Array) {
              pixels = item.pixels;
            } else if (item.pixels.buffer instanceof ArrayBuffer) {
              // Typed array view
              pixels = item.pixels.buffer;
            } else if (typeof item.pixels === 'object' && item.pixels.byteLength !== undefined) {
              // ArrayBuffer-like object
              pixels = item.pixels;
            } else {
              // Fallback: try to use as-is
              pixels = item.pixels;
            }
          }
          
          return {
            id,
            name: item.thing?.name || item.name,
            pixels,
            spriteId: item.spriteId,
            spritePixels: item.spritePixels,
          };
        });
        
        console.log('[ThingList] Setting things:', transformedList.length, 'items');
        setThings(transformedList);
        if (selectedIds.length > 0) {
          setSelectedThingIds(selectedIds);
        }
        
        // Update pagination info if available
        // Check both direct properties and data wrapper
        const paginationData = command.data || command;
        if (paginationData.totalCount !== undefined || paginationData.minId !== undefined) {
          const newPagination = {
            totalCount: paginationData.totalCount || 0,
            minId: paginationData.minId || 0,
            maxId: paginationData.maxId || 0,
            currentMin: paginationData.currentMin || 0,
            currentMax: paginationData.currentMax || 0,
          };
          setPagination(newPagination);
          onPaginationChange?.(newPagination);
        } else {
          // Clear pagination if not available
          setPagination(null);
          onPaginationChange?.(null);
        }
        
        setLoading(false);
      } else if (command.type === 'SetThingDataCommand') {
        // Clear loading flag when thing data is received
        loadingThingRef.current = null;
      }
    };

    worker.onCommand(handleCommand);
  }, [worker, setSelectedThingIds]);

  const handleThingClick = (id: number, e?: React.MouseEvent) => {
    if (e && (e.ctrlKey || e.metaKey)) {
      // Multi-select: toggle this thing
      setSelectedThingIds(prev => {
        if (prev.includes(id)) {
          return prev.filter(tid => tid !== id);
        } else {
          return [...prev, id];
        }
      });
    } else if (e && e.shiftKey && selectedThingIds.length > 0) {
      // Range select: select from last selected to this one
      const currentIndex = things.findIndex(t => t.id === id);
      const lastSelectedIndex = things.findIndex(t => t.id === selectedThingIds[selectedThingIds.length - 1]);
      if (currentIndex >= 0 && lastSelectedIndex >= 0) {
        const start = Math.min(currentIndex, lastSelectedIndex);
        const end = Math.max(currentIndex, lastSelectedIndex);
        const rangeIds = things.slice(start, end + 1).map(t => t.id).filter((id): id is number => id !== undefined);
        setSelectedThingIds(prev => {
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
      setSelectedThingIds([id]);
      // Load thing data
      loadThing(id);
    }
  };

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; thingId: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, thingId: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, thingId });
  };

  const handleContextMenuAction = async (action: string) => {
    if (!contextMenu) return;
    
    const thingId = contextMenu.thingId;
    const idsToUse = selectedThingIds.includes(thingId) ? selectedThingIds : [thingId];
    
    switch (action) {
      case 'edit':
        // Select the thing and trigger sprite reload
        setSelectedThingIds([thingId]);
        // Dispatch event to trigger sprite reload BEFORE loading thing data
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('reload-sprites-request', { detail: { thingId } }));
        }
        loadThing(thingId);
        break;
      case 'export':
        // Trigger export dialog
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('export-things', { detail: { ids: idsToUse } }));
        }
        break;
      case 'duplicate':
        // Duplicate things
        console.log('Duplicate things:', idsToUse);
        // This would need a DuplicateThingCommand
        break;
      case 'delete':
        if (confirm(`Delete ${idsToUse.length} thing(s)?`)) {
          // This would need a RemoveThingCommand
          console.log('Delete things:', idsToUse);
        }
        break;
    }
    
    setContextMenu(null);
  };

  const handleThingDoubleClick = (id: number) => {
    // Select the thing and trigger sprite reload
    setSelectedThingIds([id]);
    // Dispatch event to trigger sprite reload BEFORE loading thing data
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('reload-sprites-request', { detail: { thingId: id } }));
    }
    loadThing(id);
  };

  // Keyboard navigation (only when list container is focused)
  const listRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if list is focused or contains focused element
      if (!listElement.contains(document.activeElement)) return;
      if (things.length === 0) return;
      
      const selectedIndex = things.findIndex(t => selectedThingIds.includes(t.id));
      if (selectedIndex < 0 && things.length > 0) {
        // No selection, select first item
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          handleThingClick(things[0].id);
        }
        return;
      }

      let newIndex = selectedIndex;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (e.key === 'ArrowDown') {
          newIndex = Math.min(selectedIndex + 1, things.length - 1);
        } else {
          newIndex = Math.max(selectedIndex - 1, 0);
        }
        
        if (newIndex >= 0 && newIndex < things.length) {
          const thing = things[newIndex];
          handleThingClick(thing.id);
          // Scroll into view
          setTimeout(() => {
            const element = document.querySelector(`[data-thing-id="${thing.id}"]`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 0);
        }
      }
    };

    listElement.addEventListener('keydown', handleKeyDown);
    return () => listElement.removeEventListener('keydown', handleKeyDown);
  }, [things, selectedThingIds]);

  // Cache to prevent duplicate requests
  const loadingThingRef = useRef<number | null>(null);
  
  const loadThing = async (id: number) => {
    // Prevent duplicate requests for the same thing
    if (loadingThingRef.current === id) {
      return;
    }
    
    loadingThingRef.current = id;
    try {
      const command = CommandFactory.createGetThingCommand(id, currentCategory);
      await worker.sendCommand(command);
    } catch (error) {
      console.error('Failed to load thing:', error);
      loadingThingRef.current = null;
    }
  };

  // Expose navigation function for external pagination component
  useEffect(() => {
    if (onNavigate) {
      onNavigate(loadThingList);
    }
  }, [onNavigate, loadThingList]);

  if (loading) {
    return (
      <div className="thing-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading {currentCategory}...</p>
      </div>
    );
  }

  return (
    <div className="thing-list" ref={listRef} tabIndex={0}>
      {things.length === 0 ? (
        <div className="thing-list-empty">
          <p>No {currentCategory} found</p>
          <p className="thing-list-empty-hint">
            {currentCategory === 'item' && 'Load a project to see items'}
            {currentCategory === 'outfit' && 'Load a project to see outfits'}
            {currentCategory === 'effect' && 'Load a project to see effects'}
            {currentCategory === 'missile' && 'Load a project to see missiles'}
          </p>
        </div>
      ) : (
        <>
          <div className="thing-list-header">
            <span className="thing-list-count">
              {pagination ? (
                <>
                  {pagination.currentMin}-{pagination.currentMax} of {pagination.totalCount} {currentCategory}
                </>
              ) : (
                <>
                  {things.length} {currentCategory}
                </>
              )}
            </span>
          </div>
          <div className="thing-list-items">
            {things.map((thing) => (
              <div
                key={thing.id}
                data-thing-id={thing.id}
                className={`thing-list-item ${
                  selectedThingIds.includes(thing.id) ? 'selected' : ''
                }`}
                onClick={(e) => handleThingClick(thing.id, e)}
                onDoubleClick={() => handleThingDoubleClick(thing.id)}
                onContextMenu={(e) => handleContextMenu(e, thing.id)}
                title={`Thing #${thing.id}${selectedThingIds.length > 1 ? ` (${selectedThingIds.length} selected)` : ''}${thing.name ? ` - ${thing.name}` : ''}`}
              >
                <div className="thing-list-item-preview">
                  {thing.spritePixels || thing.pixels ? (
                    <SpriteThumbnail 
                      pixels={thing.spritePixels || thing.pixels} 
                      size={32} 
                      scale={2}
                      format={thing.spritePixels ? 'argb' : 'rgba'} // spritePixels are ARGB; bitmap pixels are RGBA
                    />
                  ) : (
                    <div className="thing-list-item-placeholder">#{thing.id}</div>
                  )}
                </div>
                <div className="thing-list-item-info">
                  <div className="thing-list-item-id">#{thing.id}</div>
                  {thing.name && (
                    <div className="thing-list-item-name">{thing.name}</div>
                  )}
                </div>
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
          <div className="context-menu-item" onClick={() => handleContextMenuAction('edit')}>
            Edit
          </div>
          <div className="context-menu-separator"></div>
          <div className="context-menu-item" onClick={() => handleContextMenuAction('export')}>
            Export Thing{selectedThingIds.length > 1 ? 's' : ''}
          </div>
          <div className="context-menu-item" onClick={() => handleContextMenuAction('duplicate')}>
            Duplicate Thing{selectedThingIds.length > 1 ? 's' : ''}
          </div>
          <div className="context-menu-separator"></div>
          <div className="context-menu-item" onClick={() => handleContextMenuAction('delete')}>
            Delete Thing{selectedThingIds.length > 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

