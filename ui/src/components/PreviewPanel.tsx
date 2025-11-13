import React, { useState, useEffect } from 'react';
import { useAppStateContext } from '../contexts/AppStateContext';
import { useWorker } from '../contexts/WorkerContext';
import { PreviewCanvas } from './PreviewCanvas';
import './Panel.css';

interface PreviewPanelProps {
  onClose: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ onClose }) => {
  const { selectedThingIds } = useAppStateContext();
  const worker = useWorker();
  const [thingData, setThingData] = useState<any>(null);
  const [frameGroupType, setFrameGroupType] = useState(0); // DEFAULT
  const [patternX, setPatternX] = useState(0);
  const [patternY, setPatternY] = useState(0);
  const [patternZ, setPatternZ] = useState(0);
  const [animate, setAnimate] = useState(false);

  // Listen for SetThingDataCommand to update preview
  useEffect(() => {
    const handleCommand = (command: any) => {
      if (command.type === 'SetThingDataCommand') {
        setThingData(command.data);
        // Reset pattern values when thing changes
        setPatternX(0);
        setPatternY(0);
        setPatternZ(0);
        setFrameGroupType(0); // DEFAULT
      }
    };

    worker.onCommand(handleCommand);
  }, [worker]);

  // Get available frame groups
  const frameGroups = thingData?.thing?.frameGroups || [];
  const availableFrameGroups: { type: number; name: string }[] = [];
  if (frameGroups[0]) availableFrameGroups.push({ type: 0, name: 'Default' });
  if (frameGroups[1]) availableFrameGroups.push({ type: 1, name: 'Walking' });

  // Check if thing has animation
  const hasAnimation = thingData?.thing?.frameGroups?.[frameGroupType]?.isAnimation || false;
  const frameGroup = thingData?.thing?.frameGroups?.[frameGroupType];

  return (
    <div className="panel preview-panel">
      <div className="panel-header">
        <span>Preview</span>
        <button className="panel-close" onClick={onClose}>×</button>
      </div>
      <div className="panel-content">
        <div className="preview-container">
          {thingData ? (
            <>
              <PreviewCanvas
                thingData={thingData}
                width={256}
                height={256}
                frameGroupType={frameGroupType}
                patternX={patternX}
                patternY={patternY}
                patternZ={patternZ}
                animate={animate}
              />
              <div className="preview-controls">
                {availableFrameGroups.length > 1 && (
                  <div className="preview-control-group">
                    <label>Frame Group:</label>
                    <select
                      value={frameGroupType}
                      onChange={(e) => {
                        const newType = parseInt(e.target.value);
                        setFrameGroupType(newType);
                        // Reset patterns when switching frame groups
                        setPatternX(0);
                        setPatternY(0);
                        setPatternZ(0);
                      }}
                    >
                      {availableFrameGroups.map((fg) => (
                        <option key={fg.type} value={fg.type}>
                          {fg.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {frameGroup && (
                  <>
                    {frameGroup.patternX > 1 && (
                      <div className="preview-control-group">
                        <label>Pattern X:</label>
                        <input
                          type="number"
                          min="0"
                          max={frameGroup.patternX - 1}
                          value={patternX}
                          onChange={(e) => setPatternX(parseInt(e.target.value) || 0)}
                        />
                      </div>
                    )}
                    {frameGroup.patternY > 1 && (
                      <div className="preview-control-group">
                        <label>Pattern Y:</label>
                        <input
                          type="number"
                          min="0"
                          max={frameGroup.patternY - 1}
                          value={patternY}
                          onChange={(e) => setPatternY(parseInt(e.target.value) || 0)}
                        />
                      </div>
                    )}
                    {frameGroup.patternZ > 1 && (
                      <div className="preview-control-group">
                        <label>Pattern Z:</label>
                        <input
                          type="number"
                          min="0"
                          max={frameGroup.patternZ - 1}
                          value={patternZ}
                          onChange={(e) => setPatternZ(parseInt(e.target.value) || 0)}
                        />
                      </div>
                    )}
                    {hasAnimation && (
                      <div className="preview-control-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={animate}
                            onChange={(e) => setAnimate(e.target.checked)}
                          />
                          {' '}Animate
                        </label>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="preview-placeholder">
              <p>Select a thing to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

