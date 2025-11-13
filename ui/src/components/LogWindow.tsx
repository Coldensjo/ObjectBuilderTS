import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { useWorker } from '../contexts/WorkerContext';
import { logger, LogEntry, LogLevel } from '../services/LoggingService';
import './LogWindow.css';

interface LogWindowProps {
  open: boolean;
  onClose: () => void;
}

export const LogWindow: React.FC<LogWindowProps> = ({ open, onClose }) => {
  const worker = useWorker();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | LogLevel>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to logging service
  useEffect(() => {
    if (!open) return;

    // Load existing logs
    setLogs(logger.getLogs());

    const unsubscribe = logger.subscribe((entry: LogEntry) => {
      setLogs(prev => {
        // Avoid duplicates
        if (prev.find(log => log.id === entry.id)) {
          return prev;
        }
        return [...prev, entry];
      });
    });

    return unsubscribe;
  }, [open]);

  // Also listen for log commands from backend - use worker context so it works even when closed
  useEffect(() => {
    const handleCommand = (command: any) => {
      if (command.type === 'LogCommand' || command.type === 'log') {
        const levelMap: { [key: number]: LogLevel } = {
          2: LogLevel.DEBUG,
          4: LogLevel.INFO,
          6: LogLevel.WARN,
          8: LogLevel.ERROR,
          1000: LogLevel.FATAL
        };

        // LogCommand is serialized directly, not in data wrapper
        const level = levelMap[command.level] || LogLevel.INFO;
        const message = command.message || JSON.stringify(command);
        const stack = command.stack;
        const source = command.source;

        // Add to logging service
        if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
          logger.error(message, stack ? new Error(stack) : undefined, source);
        } else if (level === LogLevel.WARN) {
          logger.warn(message, source);
        } else if (level === LogLevel.DEBUG) {
          logger.debug(message, source);
        } else {
          logger.info(message, source);
        }
      }
    };

    // Use worker context to listen for commands
    worker.onCommand(handleCommand);
  }, [worker]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter);

  const handleClear = () => {
    logger.clear();
    setLogs([]);
    setExpandedLogs(new Set());
  };

  const handleExport = () => {
    const logText = filteredLogs
      .map(log => {
        let text = `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}]`;
        if (log.source) {
          text += ` [${log.source}]`;
        }
        text += ` ${log.message}`;
        if (log.stack) {
          text += `\n${log.stack}`;
        }
        if (log.context) {
          text += `\nContext: ${JSON.stringify(log.context, null, 2)}`;
        }
        return text;
      })
      .join('\n\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `objectbuilder-log-${new Date().toISOString().replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (logId: number) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  const getLogLevelClass = (level: LogLevel) => {
    return `log-entry log-entry-${level}`;
  };

  const getErrorCount = () => {
    return logs.filter(log => log.level === LogLevel.ERROR || log.level === LogLevel.FATAL).length;
  };

  const getWarningCount = () => {
    return logs.filter(log => log.level === LogLevel.WARN).length;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Log Window"
      width={800}
      height={600}
      modal={false}
      footer={
        <>
          <Button variant="secondary" onClick={handleClear}>
            Clear
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            Export
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div className="log-window">
        <div className="log-toolbar">
          <div className="log-filters">
            <label>Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value={LogLevel.DEBUG}>Debug</option>
              <option value={LogLevel.INFO}>Info</option>
              <option value={LogLevel.WARN}>Warning ({getWarningCount()})</option>
              <option value={LogLevel.ERROR}>Error ({getErrorCount()})</option>
              <option value={LogLevel.FATAL}>Fatal</option>
            </select>
          </div>
          <div className="log-stats">
            <span className="log-stat-error" title="Errors">
              ⚠ {getErrorCount()}
            </span>
            <span className="log-stat-warn" title="Warnings">
              ⚡ {getWarningCount()}
            </span>
            <span className="log-count">
              {filteredLogs.length} / {logs.length} entries
            </span>
          </div>
        </div>
        <div className="log-container" ref={logContainerRef}>
          {filteredLogs.length === 0 ? (
            <div className="log-empty">
              <p>No log entries</p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const isExpanded = expandedLogs.has(log.id);
              const hasDetails = !!(log.stack || log.source || log.context);
              
              return (
                <div key={log.id} className={getLogLevelClass(log.level)}>
                  <div className="log-entry-header" onClick={() => hasDetails && toggleExpand(log.id)}>
                    <span className="log-timestamp">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="log-level">{log.level.toUpperCase()}</span>
                    {log.source && (
                      <span className="log-source" title={log.source}>
                        {log.source}
                      </span>
                    )}
                    <span className="log-message">{log.message}</span>
                    {hasDetails && (
                      <span className="log-expand-icon">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    )}
                  </div>
                  {isExpanded && hasDetails && (
                    <div className="log-entry-details">
                      {log.stack && (
                        <div className="log-stack">
                          <div className="log-stack-label">Stack Trace:</div>
                          <pre className="log-stack-content">{log.stack}</pre>
                        </div>
                      )}
                      {log.context && (
                        <div className="log-context">
                          <div className="log-context-label">Context:</div>
                          <pre className="log-context-content">
                            {JSON.stringify(log.context, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Dialog>
  );
};

