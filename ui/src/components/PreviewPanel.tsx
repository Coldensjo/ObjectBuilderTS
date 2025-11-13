import React, { useState, useEffect } from 'react';
import { useWorker } from '../contexts/WorkerContext';
import { PreviewCanvas } from './PreviewCanvas';
import { Panel } from './Panel';
import './Panel.css';

interface PreviewPanelProps {
  onClose: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ onClose }) => {
  const worker = useWorker();
  const [thingData, setThingData] = useState<any>(null);
  const [frameGroupType, setFrameGroupType] = useState(0); // DEFAULT
  const [patternX, setPatternX] = useState(0);
  const [patternY, setPatternY] = useState(0);
  const [patternZ, setPatternZ] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [currentFrame, setCurrentFrame] = useState(0);
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
  const totalFrames = frameGroup?.frames || 1;
  const spriteCount = thingData?.sprites ? (
    thingData.sprites instanceof Map ? 
      thingData.sprites.get(frameGroupType)?.length || 0 :
      Array.isArray(thingData.sprites) ? thingData.sprites.length :
      Object.keys(thingData.sprites).length
  ) : 0;

  // Frame navigation handlers
  const handlePreviousFrame = () => {
    if (!animate && totalFrames > 1) {
      setCurrentFrame((prev) => (prev - 1 + totalFrames) % totalFrames);
    }
  };

  const handleNextFrame = () => {
    if (!animate && totalFrames > 1) {
      setCurrentFrame((prev) => (prev + 1) % totalFrames);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.25));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  // Reset frame when thing or frame group changes
  useEffect(() => {
    setCurrentFrame(0);
  }, [thingData, frameGroupType]);

  return (
    <Panel
      title="Preview Panel"
      className="preview-panel"
      onClose={onClose}
      collapsible={true}
    >
        <div className="preview-container">
          {thingData ? (
            <>
              <div className="preview-canvas-section">
                <PreviewCanvas
                  thingData={thingData}
                  width={280}
                  height={280}
                  frameGroupType={frameGroupType}
                  patternX={patternX}
                  patternY={patternY}
                  patternZ={patternZ}
                  animate={animate}
                  zoom={zoom}
                  currentFrame={currentFrame}
                />
                {/* Zoom controls */}
                <div className="preview-zoom-controls">
                  <button 
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.25}
                    title="Zoom Out"
                    className="preview-zoom-btn"
                  >
                    −
                  </button>
                  <span className="preview-zoom-value">{Math.round(zoom * 100)}%</span>
                  <button 
                    onClick={handleZoomIn}
                    disabled={zoom >= 4}
                    title="Zoom In"
                    className="preview-zoom-btn"
                  >
                    +
                  </button>
                  <button 
                    onClick={handleZoomReset}
                    title="Reset Zoom"
                    className="preview-zoom-btn"
                  >
                    ⟲
                  </button>
                </div>
              </div>
              {/* Sprite Info */}
              {frameGroup && (
                <div className="preview-info">
                  <div className="preview-info-item">
                    <span className="preview-info-label">Sprites:</span>
                    <span className="preview-info-value">{spriteCount}</span>
                  </div>
                  <div className="preview-info-item">
                    <span className="preview-info-label">Size:</span>
                    <span className="preview-info-value">
                      {frameGroup.width || 1}×{frameGroup.height || 1}
                    </span>
                  </div>
                  {totalFrames > 1 && (
                    <div className="preview-info-item">
                      <span className="preview-info-label">Frames:</span>
                      <span className="preview-info-value">
                        {currentFrame + 1} / {totalFrames}
                      </span>
                    </div>
                  )}
                </div>
              )}

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
                    {/* Frame Navigation */}
                    {totalFrames > 1 && !animate && (
                      <div className="preview-control-group">
                        <label>Frame:</label>
                        <div className="preview-frame-controls">
                          <button 
                            onClick={handlePreviousFrame}
                            className="preview-frame-btn"
                            title="Previous Frame"
                          >
                            ◀
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={totalFrames - 1}
                            value={currentFrame}
                            onChange={(e) => {
                              const frame = parseInt(e.target.value) || 0;
                              setCurrentFrame(Math.max(0, Math.min(frame, totalFrames - 1)));
                            }}
                            className="preview-frame-input"
                          />
                          <button 
                            onClick={handleNextFrame}
                            className="preview-frame-btn"
                            title="Next Frame"
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Pattern Controls with Sliders */}
                    {frameGroup.patternX > 1 && (
                      <div className="preview-control-group">
                        <label>
                          Pattern X: {patternX} / {frameGroup.patternX - 1}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max={frameGroup.patternX - 1}
                          value={patternX}
                          onChange={(e) => setPatternX(parseInt(e.target.value) || 0)}
                          className="preview-pattern-slider"
                        />
                      </div>
                    )}
                    {frameGroup.patternY > 1 && (
                      <div className="preview-control-group">
                        <label>
                          Pattern Y: {patternY} / {frameGroup.patternY - 1}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max={frameGroup.patternY - 1}
                          value={patternY}
                          onChange={(e) => setPatternY(parseInt(e.target.value) || 0)}
                          className="preview-pattern-slider"
                        />
                      </div>
                    )}
                    {frameGroup.patternZ > 1 && (
                      <div className="preview-control-group">
                        <label>
                          Pattern Z: {patternZ} / {frameGroup.patternZ - 1}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max={frameGroup.patternZ - 1}
                          value={patternZ}
                          onChange={(e) => setPatternZ(parseInt(e.target.value) || 0)}
                          className="preview-pattern-slider"
                        />
                      </div>
                    )}
                    {hasAnimation && (
                      <div className="preview-control-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={animate}
                            onChange={(e) => {
                              setAnimate(e.target.checked);
                              if (e.target.checked) {
                                setCurrentFrame(0);
                              }
                            }}
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
    </Panel>
  );
};

