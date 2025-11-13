/**
 * Custom hook for managing application state
 * Provides centralized state management for the UI
 */

import { useState, useCallback, useEffect } from 'react';
import { useWorker } from '../contexts/WorkerContext';

// Category constants (matching backend)
const ThingCategory = {
  ITEM: 'item',
  OUTFIT: 'outfit',
  EFFECT: 'effect',
  MISSILE: 'missile',
};

interface ClientInfo {
  loaded: boolean;
  clientVersion?: string;
  datSignature?: number;
  sprSignature?: number;
  itemsCount?: number;
  outfitsCount?: number;
  effectsCount?: number;
  missilesCount?: number;
  spritesCount?: number;
  extended?: boolean;
  transparency?: boolean;
  improvedAnimations?: boolean;
  frameGroups?: boolean;
  changed?: boolean;
  isTemporary?: boolean;
}

interface AppState {
  clientInfo: ClientInfo | null;
  currentCategory: string;
  selectedThingIds: number[];
  selectedSpriteIds: number[];
  loading: boolean;
  error: string | null;
}

export const useAppState = () => {
  const worker = useWorker();
  const [state, setState] = useState<AppState>({
    clientInfo: null,
    currentCategory: ThingCategory.ITEM,
    selectedThingIds: [],
    selectedSpriteIds: [],
    loading: false,
    error: null,
  });

  // Listen for commands from worker
  useEffect(() => {
    const handleCommand = (command: any) => {
      // Handle different command types
      if (command.type === 'SetClientInfoCommand') {
        console.log('[useAppState] Received SetClientInfoCommand:', command);
        console.log('[useAppState] clientInfo.loaded:', command.data?.loaded);
        setState(prev => ({
          ...prev,
          clientInfo: command.data,
        }));
      } else if (command.type === 'SetThingListCommand') {
        console.log('[useAppState] Received SetThingListCommand:', command);
        // Update selected thing IDs
        setState(prev => ({
          ...prev,
          selectedThingIds: command.data.selectedIds || [],
        }));
      } else if (command.type === 'SetSpriteListCommand') {
        // Update selected sprite IDs
        setState(prev => ({
          ...prev,
          selectedSpriteIds: command.data.selectedIds || [],
        }));
      }
    };

    worker.onCommand(handleCommand);

    return () => {
      // Cleanup if needed
    };
  }, [worker]);

  const setCategory = useCallback((category: string) => {
    setState(prev => ({
      ...prev,
      currentCategory: category,
      selectedThingIds: [],
    }));
  }, []);

  const setSelectedThingIds = useCallback((ids: number[]) => {
    setState(prev => ({
      ...prev,
      selectedThingIds: ids,
    }));
  }, []);

  const setSelectedSpriteIds = useCallback((ids: number[]) => {
    setState(prev => ({
      ...prev,
      selectedSpriteIds: ids,
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      loading,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
    }));
  }, []);

  return {
    ...state,
    setCategory,
    setSelectedThingIds,
    setSelectedSpriteIds,
    setLoading,
    setError,
  };
};

