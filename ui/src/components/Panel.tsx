import React, { useState } from 'react';
import './Panel.css';

interface PanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onClose?: () => void;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  children,
  className = '',
  collapsible = true,
  defaultCollapsed = false,
  onClose,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const handleToggle = () => {
    if (collapsible) {
      setCollapsed(prev => !prev);
    }
  };

  return (
    <div className={`panel ${className} ${collapsed ? 'collapsed' : ''}`} title="Panel component">
      <div className="panel-header" title="panel-header">
        <button
          className="panel-toggle"
          onClick={handleToggle}
          aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
          disabled={!collapsible}
          title="panel-toggle"
        >
          <span className={`panel-toggle-icon ${collapsed ? 'collapsed' : ''}`} title="panel-toggle-icon">
            ▼
          </span>
        </button>
        <span className="panel-title" title="panel-title">{title}</span>
        {onClose && (
          <button
            className="panel-close"
            onClick={onClose}
            aria-label="Close panel"
            title="panel-close"
          >
            ×
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="panel-content" title="panel-content">
          {children}
        </div>
      )}
    </div>
  );
};

