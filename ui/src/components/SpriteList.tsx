import React, { useEffect, useState } from 'react';
import { useWorker } from '../contexts/WorkerContext';
import { useAppStateContext } from '../contexts/AppStateContext';
import { CommandFactory } from '../services/CommandFactory';
import { SpriteThumbnail } from './SpriteThumbnail';
import './SpriteList.css';

interface SpriteListItem {
  id: number;
  pixels?: any;
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
        setSprites(command.data.list || []);
        if (command.data.selectedIds) {
          setSelectedSpriteIds(command.data.selectedIds);
        }
        setLoading(false);
      }
    };

    worker.onCommand(handleCommand);
  }, [worker, setSelectedSpriteIds]);

  // Load sprite list when thing is selected
  useEffect(() => {
    const handleCommand = (command: any) => {
      if (command.type === 'SetThingDataCommand') {
        // Extract sprite IDs from thing data
        const thingData = command.data;
        if (thingData && thingData.sprites) {
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
            loadSpriteList(spriteIds[0]);
          } else {
            setSprites([]);
            setLoading(false);
          }
        } else {
          setSprites([]);
          setLoading(false);
        }
      }
    };

    worker.onCommand(handleCommand);
  }, [worker]);

  const loadSpriteList = async (targetId: number) => {
    setLoading(true);
    try {
      const command = CommandFactory.createGetSpriteListCommand(targetId);
      await worker.sendCommand(command);
    } catch (error) {
      console.error('Failed to load sprite list:', error);
      setLoading(false);
    }
  };

  const handleSpriteClick = (id: number) => {
    setSelectedSpriteIds([id]);
  };

  if (loading) {
    return (
      <div className="sprite-list-loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="sprite-list">
      {sprites.length === 0 ? (
        <div className="sprite-list-empty">
          <p>No sprites found</p>
        </div>
      ) : (
        <div className="sprite-list-items">
          {sprites.map((sprite) => (
            <div
              key={sprite.id}
              className={`sprite-list-item ${
                selectedSpriteIds.includes(sprite.id) ? 'selected' : ''
              }`}
              onClick={() => handleSpriteClick(sprite.id)}
            >
              <div className="sprite-list-item-preview">
                {sprite.pixels ? (
                  <SpriteThumbnail pixels={sprite.pixels} size={32} scale={2} />
                ) : (
                  <div className="sprite-list-item-placeholder">#{sprite.id}</div>
                )}
              </div>
              <div className="sprite-list-item-id">#{sprite.id}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

