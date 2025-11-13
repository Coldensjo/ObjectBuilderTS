import React, { useState, useEffect } from 'react';
import { WorkerProvider, useWorker } from './contexts/WorkerContext';
import { MainWindow } from './components/MainWindow';
import { SplashScreen } from './components/SplashScreen';
import { useToast } from './hooks/useToast';
import { ErrorBoundary } from './ErrorBoundary';
import { logger } from './services/LoggingService';
import './App.css';

// Set up global error handlers
if (typeof window !== 'undefined') {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    logger.error(
      `Unhandled error: ${event.message}`,
      event.error || new Error(event.message),
      event.filename || 'Unknown',
      {
        lineno: event.lineno,
        colno: event.colno,
        filename: event.filename
      }
    );
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error(
      'Unhandled promise rejection',
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      'Promise',
      {
        reason: event.reason
      }
    );
  });

  // Intercept console methods to also log to our logging service
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  console.error = (...args: any[]) => {
    originalConsoleError.apply(console, args);
    const message = args.map(arg => {
      if (arg instanceof Error) {
        return arg.message;
      }
      return String(arg);
    }).join(' ');
    const error = args.find(arg => arg instanceof Error) as Error | undefined;
    logger.error(message, error, 'Console');
  };

  console.warn = (...args: any[]) => {
    originalConsoleWarn.apply(console, args);
    const message = args.map(arg => String(arg)).join(' ');
    logger.warn(message, 'Console');
  };

  console.log = (...args: any[]) => {
    originalConsoleLog.apply(console, args);
    // Only log to our service in development or if explicitly enabled
    if (process.env.NODE_ENV === 'development') {
      const message = args.map(arg => String(arg)).join(' ');
      logger.debug(message, 'Console');
    }
  };
}

const AppContent: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const worker = useWorker();
  const { ToastContainer } = useToast();

  useEffect(() => {
    console.log('AppContent mounted, worker initialized:', worker.initialized);
    const initialize = async () => {
      try {
        // WorkerContext already connects, just wait for it
        // Wait for worker to be initialized
        let attempts = 0;
        while (!worker.initialized && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        console.log('Worker initialized, connected:', worker.connected);
        // Give a moment for everything to settle
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error('Failed to initialize:', error);
        logger.error('Failed to initialize app', error as Error, 'App');
      } finally {
        setLoading(false);
        console.log('Loading complete');
      }
    };

    if (worker.initialized) {
      setLoading(false);
    } else {
      initialize();
    }
  }, [worker.initialized, worker.connected]);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <>
      <MainWindow />
      <ToastContainer />
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <WorkerProvider>
        <AppContent />
      </WorkerProvider>
    </ErrorBoundary>
  );
}

export default App;
