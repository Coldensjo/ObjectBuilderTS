import React from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import './AboutDialog.css';

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="About Object Builder"
      width={450}
      height={300}
      footer={
        <Button onClick={onClose}>Close</Button>
      }
    >
      <div className="about-content">
        <div className="about-header">
          <h3>ObjectBuilder</h3>
          <p className="version">Version 1.0.0</p>
        </div>
        <div className="about-body">
          <p>
            A complete TypeScript conversion of the Adobe AIR/Flash-based Object Builder
            application for Open Tibia client file editing.
          </p>
          <p>
            This application allows you to edit client files (.dat and .spr) for Open Tibia servers.
          </p>
          <div className="about-links">
            <p>
              <strong>License:</strong> MIT
            </p>
            <p>
              <strong>Built with:</strong> TypeScript, React, Electron, Node.js
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

