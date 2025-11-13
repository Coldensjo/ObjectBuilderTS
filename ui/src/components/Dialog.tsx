import React, { useEffect } from 'react';
import './Dialog.css';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
  height?: number;
  footer?: React.ReactNode;
  modal?: boolean; // If false, dialog won't block interaction with background
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  children,
  width = 500,
  height = 400,
  footer,
  modal = true, // Default to modal behavior
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      if (modal) {
        document.body.style.overflow = 'hidden';
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (modal) {
        document.body.style.overflow = '';
      }
    };
  }, [open, onClose, modal]);

  if (!open) return null;

  return (
    <div 
      className={`dialog-overlay ${modal ? 'dialog-modal' : 'dialog-non-modal'}`} 
      onClick={modal ? onClose : undefined}
    >
      <div
        className="dialog-container"
        style={{ width: `${width}px`, height: `${height}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 className="dialog-title">{title}</h2>
          <button className="dialog-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="dialog-content">{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </div>
  );
};

