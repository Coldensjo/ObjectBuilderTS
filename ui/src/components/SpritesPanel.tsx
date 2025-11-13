import React from 'react';
import { SpriteList } from './SpriteList';
import { Panel } from './Panel';
import './Panel.css';

interface SpritesPanelProps {
  onClose: () => void;
}

export const SpritesPanel: React.FC<SpritesPanelProps> = ({ onClose }) => {
  return (
    <Panel
      title="Sprites Panel"
      className="sprites-panel"
      onClose={onClose}
      collapsible={true}
    >
      <SpriteList />
    </Panel>
  );
};

