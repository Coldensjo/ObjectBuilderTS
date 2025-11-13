import React, { useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { useWorker } from '../contexts/WorkerContext';
import { useAppStateContext } from '../contexts/AppStateContext';
import { CommandFactory } from '../services/CommandFactory';
import { useToast } from '../hooks/useToast';
import './FindDialog.css';

interface FindDialogProps {
  open: boolean;
  onClose: () => void;
}

export const FindDialog: React.FC<FindDialogProps> = ({ open, onClose }) => {
  const worker = useWorker();
  const { currentCategory, setSelectedThingIds } = useAppStateContext();
  const { showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      showError('Please enter a search term');
      return;
    }

    setSearching(true);
    setResults([]);

    try {
      // Create search properties
      // For now, search by ID if it's a number, otherwise search by name
      const properties: any[] = [];
      const searchValue = searchTerm.trim();
      
      if (!isNaN(Number(searchValue))) {
        // Search by ID
        properties.push({
          property: 'id',
          value: parseInt(searchValue),
        });
      } else {
        // Search by name (if name property exists)
        properties.push({
          property: 'name',
          value: searchValue,
        });
      }

      const command = CommandFactory.createFindThingCommand(currentCategory, properties);
      await worker.sendCommand(command);
      
      // Results will come via FindResultCommand
      // For now, we'll wait for the response
    } catch (error: any) {
      setSearching(false);
      showError(error.message || 'Search failed');
    }
  };

  // Listen for FindResultCommand
  React.useEffect(() => {
    const handleCommand = (command: any) => {
      if (command.type === 'FindResultCommand') {
        if (command.data.type === 'things') {
          setResults(command.data.list || []);
        }
        setSearching(false);
      }
    };

    worker.onCommand(handleCommand);
  }, [worker]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleResultClick = async (result: any) => {
    if (result && result.id !== undefined) {
      // Set the selected thing ID to navigate to it
      setSelectedThingIds([result.id]);
      
      // Load the thing data
      try {
        const command = CommandFactory.createGetThingCommand(result.id, currentCategory);
        await worker.sendCommand(command);
      } catch (error: any) {
        console.error('Failed to load thing:', error);
        showError('Failed to load thing');
      }
      
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Find Things"
      width={600}
      height={500}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="find-dialog-content">
        <div className="find-search-section">
          <div className="find-input-group">
            <input
              type="text"
              className="find-input"
              placeholder="Enter search term..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={searching}
              autoFocus
            />
            <Button onClick={handleSearch} disabled={searching || !searchTerm.trim()}>
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>
          <div className="find-category-info">
            Searching in: <strong>{currentCategory}</strong>
          </div>
        </div>

        <div className="find-results-section">
          {searching ? (
            <div className="find-loading">Searching...</div>
          ) : results.length === 0 && searchTerm ? (
            <div className="find-no-results">No results found</div>
          ) : results.length === 0 ? (
            <div className="find-placeholder">Enter a search term to find things</div>
          ) : (
            <div className="find-results-list">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="find-result-item"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="find-result-id">#{result.id}</div>
                  <div className="find-result-name">{result.name || 'Unnamed'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};

