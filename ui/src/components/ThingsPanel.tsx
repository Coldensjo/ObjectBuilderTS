import React from 'react';
import { ThingList } from './ThingList';
import { Panel } from './Panel';
import './Panel.css';

interface ThingsPanelProps {
  onClose: () => void;
}

export const ThingsPanel: React.FC<ThingsPanelProps> = ({ onClose }) => {
  return (
    <Panel
      title="Things Panel"
      className="things-panel"
      onClose={onClose}
      collapsible={true}
    >
      <ThingList />
    </Panel>
  );
};

