/*
*  Object Builder - Main Application Entry Point
*  TypeScript version
*/

import * as path from "path";
import * as fs from "fs";
import { ObjectBuilderWorker } from "./ob/workers/ObjectBuilderWorker";
import { WorkerCommunicator } from "./workers/WorkerCommunicator";
import { ObjectBuilderSettings } from "./ob/settings/ObjectBuilderSettings";
import { SettingsManager } from "./otlib/settings/SettingsManager";
import { VersionStorage } from "./otlib/core/VersionStorage";
import { SpriteDimensionStorage } from "./otlib/core/SpriteDimensionStorage";
// import { Resources } from "./otlib/resources/Resources"; // Unused for now
import { SettingsCommand } from "./ob/commands/SettingsCommand";
import { LoadVersionsCommand } from "./ob/commands/LoadVersionsCommand";
import { LoadSpriteDimensionsCommand } from "./ob/commands/LoadSpriteDimensionsCommand";
import { WorkerCommand } from "./workers/WorkerCommand";

export class ObjectBuilderApp {
    private _worker: ObjectBuilderWorker | null = null;
    private _communicator: WorkerCommunicator | null = null;
    private _settings: ObjectBuilderSettings | null = null;
    private _settingsManager: SettingsManager | null = null;
    private _versionStorage: VersionStorage | null = null;
    private _spriteDimensionStorage: SpriteDimensionStorage | null = null;
    private _initialized: boolean = false;

    constructor() {
        // Initialize asynchronously to avoid blocking
        // This allows Electron window to be created first
        setImmediate(() => {
            this.initialize();
        });
    }

    private initialize(): void {
        console.log("Initializing Object Builder...");

        try {
            // Initialize resources
            this.initializeResources();

            // Initialize storage
            this.initializeStorage();

            // Initialize settings
            this.initializeSettings();

            // Create worker
            this.createWorker();

            // Load initial data
            this.loadInitialData();

            this._initialized = true;
            console.log("Object Builder initialized successfully");
        } catch (error: any) {
            console.error("Failed to initialize Object Builder:", error);
            throw error;
        }
    }

    private initializeResources(): void {
        // Set up resources (localization)
        // For now, use default English
        console.log("Initializing resources...");
    }

    private initializeStorage(): void {
        console.log("Initializing storage...");
        this._versionStorage = VersionStorage.getInstance() as VersionStorage;
        this._spriteDimensionStorage = SpriteDimensionStorage.getInstance() as SpriteDimensionStorage;
    }

    private initializeSettings(): void {
        console.log("Initializing settings...");
        this._settingsManager = SettingsManager.getInstance() as SettingsManager;
        this._settings = new ObjectBuilderSettings();
        
        // Try to load settings from file
        if (this._settingsManager && !this._settingsManager.loadSettings(this._settings)) {
            console.log("No existing settings found, using defaults");
        } else {
            console.log("Settings loaded successfully");
        }
    }

    private createWorker(): void {
        console.log("Creating worker...");
        
        if (!this._settings) {
            throw new Error("Settings must be initialized before creating worker");
        }

        this._worker = new ObjectBuilderWorker();
        
        // Get the communicator from the worker (it creates its own)
        const workerCommunicator = (this._worker as any)._communicator as WorkerCommunicator | null;
        
        if (!workerCommunicator) {
            throw new Error("Failed to get communicator from worker");
        }
        
        this._communicator = workerCommunicator;
        
        // Initialize worker with settings
        if (this._worker && this._settings) {
            // Set settings using the settingsCallback method
            const SettingsCommand = require("./ob/commands/SettingsCommand").SettingsCommand;
            const settingsCommand = new SettingsCommand(this._settings);
            workerCommunicator.handleCommand(settingsCommand);
        }
        
        // Register callbacks - this is critical! (register() is called in constructor, but ensure it happened)
        if (this._worker) {
            console.log("Worker created and registered successfully");
        }
        
        // Initialize Logger with communicator
        const { Logger } = require("./ob/utils/Logger");
        Logger.setCommunicator(this._communicator);
        
        // Set up command handling
        // Note: This listener is for logging only
        // The Electron main process also listens to this same communicator instance
        // to forward commands to the renderer
        this._communicator.on("command", (command: WorkerCommand) => {
            this.handleCommand(command);
        });
        
        console.log("Command listener set up on communicator. Event listeners:", (this._communicator as any).listenerCount('command'));

        // Start the communicator
        this._communicator.start();
    }

    private loadInitialData(): void {
        console.log("Loading initial data...");

        if (!this._settings || !this._communicator) {
            throw new Error("Settings and communicator must be initialized");
        }

        // Send settings to worker
        this._communicator.sendCommand(new SettingsCommand(this._settings));

        // Load versions
        // Try multiple possible paths:
        // 1. From dist/electron/electron: ../../firstRun/versions.xml -> dist/firstRun/versions.xml
        // 2. From dist/main.js: ../firstRun/versions.xml -> firstRun/versions.xml (source)
        // 3. From dist/src/main.js: ../firstRun/versions.xml -> src/firstRun/versions.xml (source)
        // 4. Absolute path from project root
        let versionsPath: string | null = null;
        const possiblePaths = [
            path.join(__dirname, "../../firstRun/versions.xml"), // From dist/electron/electron
            path.join(__dirname, "../firstRun/versions.xml"),  // From dist/main.js or dist/src/main.js
            path.join(__dirname, "../../src/firstRun/versions.xml"), // From dist/electron/electron to source
            path.join(process.cwd(), "src/firstRun/versions.xml"), // From project root
            path.join(process.cwd(), "firstRun/versions.xml"), // From project root (if copied)
        ];

        for (const testPath of possiblePaths) {
            if (fs.existsSync(testPath)) {
                versionsPath = testPath;
                break;
            }
        }

        if (versionsPath && fs.existsSync(versionsPath)) {
            if (this._versionStorage && this._communicator) {
                // Load versions asynchronously to avoid blocking the event loop
                // This allows the Electron window to appear immediately
                const storage = this._versionStorage;
                const communicator = this._communicator;
                const path = versionsPath;
                setImmediate(() => {
                    try {
                        storage.load(path);
                        communicator.sendCommand(new LoadVersionsCommand(path));
                        console.log("Loaded versions from:", path);
                    } catch (error: any) {
                        console.error("Failed to load versions:", error);
                    }
                });
            }
        } else {
            console.warn("versions.xml not found. Tried paths:", possiblePaths);
        }

        // Load sprite dimensions
        // TODO: Load sprite dimensions if file exists
        // For now, use defaults
    }

    private handleCommand(command: WorkerCommand): void {
        // Handle commands from the worker
        // Commands are automatically forwarded to Electron main process via the communicator event
        // This method is just for logging/debugging
        const commandName = command.constructor.name;
        
        // Don't log ProgressCommand spam - it's sent very frequently during loading
        if (commandName !== 'ProgressCommand') {
            console.log("Received command from worker:", commandName);
        }
        
        // Commands are forwarded to Electron main process via communicator.on('command') listener
        // which is set up in electron/main.ts initializeBackend()
    }

    public get worker(): ObjectBuilderWorker | null {
        return this._worker;
    }

    public get communicator(): WorkerCommunicator | null {
        return this._communicator;
    }

    public get settings(): ObjectBuilderSettings | null {
        return this._settings;
    }

    public get initialized(): boolean {
        return this._initialized;
    }

    public get versionStorage(): VersionStorage | null {
        return this._versionStorage;
    }

    public shutdown(): void {
        console.log("Shutting down Object Builder...");
        
        // Save settings
        if (this._settings && this._settingsManager) {
            this._settingsManager.saveSettings(this._settings);
            console.log("Settings saved");
        }
        
        // TODO: Cleanup other resources
        
        if (this._worker) {
            // Cleanup worker if needed
        }
        
        console.log("Object Builder shut down");
    }
}

// Export singleton instance
let appInstance: ObjectBuilderApp | null = null;

export function getApp(): ObjectBuilderApp {
    if (!appInstance) {
        appInstance = new ObjectBuilderApp();
    }
    return appInstance;
}

// Start the application if this is the main module
if (require.main === module) {
    console.log("========================================");
    console.log("Object Builder - TypeScript Version");
    console.log("========================================");
    
    try {
        const app = getApp();
        console.log("Application started successfully");
        console.log("Worker initialized:", app.worker !== null);
        console.log("Communicator initialized:", app.communicator !== null);
        console.log("Settings initialized:", app.settings !== null);
        
        // Keep the process alive (in a real UI app, this would be handled by the UI framework)
        // For CLI/testing, we keep running until explicitly stopped
        console.log("\nApplication is ready. Press Ctrl+C to exit.");
        
        // Keep the process alive by setting up an interval
        // This prevents the process from exiting when there are no active handles
        const keepAliveInterval = setInterval(() => {
            // Just keep the event loop alive
        }, 1000);
        
        // Handle graceful shutdown
        const shutdown = () => {
            console.log("\nShutting down...");
            clearInterval(keepAliveInterval);
            app.shutdown();
            process.exit(0);
        };
        
        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    } catch (error: any) {
        console.error("Failed to start application:", error);
        process.exit(1);
    }
}

