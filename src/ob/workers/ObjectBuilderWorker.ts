/*
*  Copyright (c) 2014-2023 Object Builder <https://github.com/ottools/ObjectBuilder>
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the "Software"), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/

import { EventEmitter } from "events";
import { IWorkerCommunicator } from "../../workers/IWorkerCommunicator";
import { WorkerCommunicator } from "../../workers/WorkerCommunicator";
import { WorkerCommand } from "../../workers/WorkerCommand";
import { ByteArray } from "../../otlib/utils/ByteArray";
import { ThingTypeStorage } from "../../otlib/things/ThingTypeStorage";
import { SpriteStorage } from "../../otlib/sprites/SpriteStorage";
import { Version } from "../../otlib/core/Version";
import { ObjectBuilderSettings } from "../settings/ObjectBuilderSettings";
import { Resources } from "../../otlib/resources/Resources";
import { ClientInfo } from "../../otlib/utils/ClientInfo";
import { FrameDuration } from "../../otlib/animation/FrameDuration";
import { FrameGroup } from "../../otlib/animation/FrameGroup";
import { PathHelper } from "../../otlib/loaders/PathHelper";
import { SpriteData } from "../../otlib/sprites/SpriteData";
import { ThingData } from "../../otlib/things/ThingData";
import { ThingListItem } from "../../otlib/utils/ThingListItem";
import { ThingProperty } from "../../otlib/things/ThingProperty";
import { ThingType } from "../../otlib/things/ThingType";
import { ThingCategory } from "../../otlib/things/ThingCategory";
import { FrameGroupType } from "../../otlib/things/FrameGroupType";
import { VersionStorage } from "../../otlib/core/VersionStorage";
import { SpriteDimensionStorage } from "../../otlib/core/SpriteDimensionStorage";
import { SpriteExtent } from "../../otlib/utils/SpriteExtent";
import { StorageEvent } from "../../otlib/storages/events/StorageEvent";
import { ProgressEvent } from "../../otlib/events/ProgressEvent";
import { ProgressBarID } from "../commands/ProgressBarID";
import { ProgressCommand } from "../commands/ProgressCommand";
import { HideProgressBarCommand } from "../commands/HideProgressBarCommand";
import { SettingsCommand } from "../commands/SettingsCommand";
import { LoadVersionsCommand } from "../commands/LoadVersionsCommand";
import { GetVersionsListCommand } from "../commands/GetVersionsListCommand";
import { SetVersionsCommand } from "../commands/SetVersionsCommand";
import { LoadSpriteDimensionsCommand } from "../commands/LoadSpriteDimensionsCommand";
import { SetSpriteDimensionCommand } from "../commands/SetSpriteDimensionCommand";
import { CreateNewFilesCommand } from "../commands/files/CreateNewFilesCommand";
import { LoadFilesCommand } from "../commands/files/LoadFilesCommand";
import { MergeFilesCommand } from "../commands/files/MergeFilesCommand";
import { CompileCommand } from "../commands/files/CompileCommand";
import { CompileAsCommand } from "../commands/files/CompileAsCommand";
import { UnloadFilesCommand } from "../commands/files/UnloadFilesCommand";
import { NewThingCommand } from "../commands/things/NewThingCommand";
import { UpdateThingCommand } from "../commands/things/UpdateThingCommand";
import { ImportThingsCommand } from "../commands/things/ImportThingsCommand";
import { ImportThingsFromFilesCommand } from "../commands/things/ImportThingsFromFilesCommand";
import { ExportThingCommand } from "../commands/things/ExportThingCommand";
import { ReplaceThingsCommand } from "../commands/things/ReplaceThingsCommand";
import { ReplaceThingsFromFilesCommand } from "../commands/things/ReplaceThingsFromFilesCommand";
import { DuplicateThingCommand } from "../commands/things/DuplicateThingCommand";
import { RemoveThingCommand } from "../commands/things/RemoveThingCommand";
import { GetThingCommand } from "../commands/things/GetThingCommand";
import { GetThingListCommand } from "../commands/things/GetThingListCommand";
import { FindThingCommand } from "../commands/things/FindThingCommand";
import { OptimizeFrameDurationsCommand } from "../commands/things/OptimizeFrameDurationsCommand";
import { ConvertFrameGroupsCommand } from "../commands/things/ConvertFrameGroupsCommand";
import { NewSpriteCommand } from "../commands/sprites/NewSpriteCommand";
import { ImportSpritesCommand } from "../commands/sprites/ImportSpritesCommand";
import { ImportSpritesFromFileCommand } from "../commands/sprites/ImportSpritesFromFileCommand";
import { ExportSpritesCommand } from "../commands/sprites/ExportSpritesCommand";
import { ReplaceSpritesCommand } from "../commands/sprites/ReplaceSpritesCommand";
import { ReplaceSpritesFromFilesCommand } from "../commands/sprites/ReplaceSpritesFromFilesCommand";
import { RemoveSpritesCommand } from "../commands/sprites/RemoveSpritesCommand";
import { GetSpriteListCommand } from "../commands/sprites/GetSpriteListCommand";
import { FindSpritesCommand } from "../commands/sprites/FindSpritesCommand";
import { OptimizeSpritesCommand } from "../commands/sprites/OptimizeSpritesCommand";
import { NeedToReloadCommand } from "../commands/NeedToReloadCommand";
import { SetClientInfoCommand } from "../commands/SetClientInfoCommand";
import { FindResultCommand } from "../commands/FindResultCommand";
import { SetThingDataCommand } from "../commands/things/SetThingDataCommand";
import { SetThingListCommand } from "../commands/things/SetThingListCommand";
import { SetSpriteListCommand } from "../commands/sprites/SetSpriteListCommand";
import { ClientMerger } from "../../otlib/utils/ClientMerger";
import { OTFI } from "../../otlib/utils/OTFI";
import { OBDVersions } from "../../otlib/obd/OBDVersions";
import { OBDEncoder } from "../../otlib/obd/OBDEncoder";
import { ObUtils } from "../utils/ObUtils";
import { BitmapData } from "../../otlib/utils/BitmapData";
import { ThingDataLoader } from "../../otlib/loaders/ThingDataLoader";
import { ThingUtils } from "../../otlib/utils/ThingUtils";
import { FrameDurationsOptimizer } from "../../otlib/utils/FrameDurationsOptimizer";
import { FrameGroupsConverter } from "../../otlib/utils/FrameGroupsConverter";
import { SpritesFinder } from "../utils/SpritesFinder";
import { SpritesOptimizer } from "../../otlib/utils/SpritesOptimizer";
import { SpriteDataLoader } from "../../otlib/loaders/SpriteDataLoader";
import { Sprite } from "../../otlib/sprites/Sprite";
import { SaveHelper } from "../utils/SaveHelper";
import { ImageCodec } from "../../otlib/utils/ImageCodec";
import { OTFormat } from "../../otlib/utils/OTFormat";
import { OptimizeFrameDurationsResultCommand } from "../commands/things/OptimizeFrameDurationsResultCommand";
import { ConvertFrameGroupsResultCommand } from "../commands/things/ConvertFrameGroupsResultCommand";
import { OptimizeSpritesResultCommand } from "../commands/sprites/OptimizeSpritesResultCommand";
import * as fs from "fs";
import * as path from "path";

export class ObjectBuilderWorker extends EventEmitter {
    //--------------------------------------------------------------------------
    // PROPERTIES
    //--------------------------------------------------------------------------

    private _communicator: IWorkerCommunicator;
    private _things: ThingTypeStorage | null = null;
    private _sprites: SpriteStorage | null = null;
    private _datFile: string | null = null;
    private _sprFile: string | null = null;
    private _version: Version | null = null;
    private _extended: boolean = false;
    private _transparency: boolean = false;
    private _improvedAnimations: boolean = false;
    private _frameGroups: boolean = false;
    private _errorMessage: string | null = null;
    private _compiled: boolean = false;
    private _isTemporary: boolean = false;
    private _thingListAmount: number = 100;
    private _spriteListAmount: number = 100;
    private _settings: ObjectBuilderSettings | null = null;

    //--------------------------------------
    // Getters / Setters
    //--------------------------------------

    public get clientChanged(): boolean {
        return ((this._things && this._things.changed) || (this._sprites && this._sprites.changed)) ?? false;
    }

    public get clientIsTemporary(): boolean {
        return (this._things && this._things.isTemporary && this._sprites && this._sprites.isTemporary) || false;
    }

    public get clientLoaded(): boolean {
        return (this._things && this._things.loaded && this._sprites && this._sprites.loaded) || false;
    }

    //--------------------------------------------------------------------------
    // CONSTRUCTOR
    //--------------------------------------------------------------------------

    constructor() {
        super();

        this._communicator = new WorkerCommunicator();
        this._thingListAmount = 100;
        this._spriteListAmount = 100;

        this.register();
    }

    //--------------------------------------------------------------------------
    // METHODS
    //--------------------------------------------------------------------------

    //--------------------------------------
    // Public
    //--------------------------------------

    // getThingCallback is defined later as private - this public one is for external use
    public getThingCallbackPublic(id: number, category: string): void {
        this.sendThingData(id, category);
    }

    public compileCallback(): void {
        if (this._datFile && this._sprFile && this._version) {
            this.compileAsCallback(
                this._datFile,
                this._sprFile,
                this._version,
                this._extended,
                this._transparency,
                this._improvedAnimations,
                this._frameGroups
            );
        }
    }

    public setSelectedThingIds(value: number[], category: string): void {
        if (value && value.length > 0) {
            if (value.length > 1) {
                value.sort((a, b) => b - a); // DESCENDING
            }

            if (this._things) {
                const max = this._things.getMaxId(category);
                if (value[0] > max) {
                    value = [max];
                }

                this.getThingCallback(value[0], category);
                this.sendThingList(value, category);
            }
        }
    }

    public setSelectedSpriteIds(value: number[]): void {
        if (value && value.length > 0) {
            if (value.length > 1) {
                value.sort((a, b) => b - a); // DESCENDING
            }
            if (this._sprites && value[0] > this._sprites.spritesCount) {
                value = [this._sprites.spritesCount];
            }
            this.sendSpriteList(value);
        }
    }

    public sendCommand(command: WorkerCommand): void {
        this._communicator.sendCommand(command);
    }

    //--------------------------------------
    // Registration
    //--------------------------------------

    public register(): void {
        // Register classes
        this._communicator.registerClass(ByteArray);
        this._communicator.registerClass(ClientInfo);
        this._communicator.registerClass(FrameDuration);
        this._communicator.registerClass(FrameGroup);
        this._communicator.registerClass(ObjectBuilderSettings);
        this._communicator.registerClass(PathHelper);
        this._communicator.registerClass(SpriteData);
        this._communicator.registerClass(ThingData);
        this._communicator.registerClass(ThingListItem);
        this._communicator.registerClass(ThingProperty);
        this._communicator.registerClass(ThingType);
        this._communicator.registerClass(Version);

        // Register callbacks
        this._communicator.registerCallback(SettingsCommand, this.settingsCallback.bind(this));
        this._communicator.registerCallback(LoadVersionsCommand, this.loadClientVersionsCallback.bind(this));
        this._communicator.registerCallback(GetVersionsListCommand, this.getVersionsListCallback.bind(this));
        this._communicator.registerCallback(LoadSpriteDimensionsCommand, this.loadSpriteDimensionsCallback.bind(this));
        this._communicator.registerCallback(SetSpriteDimensionCommand, this.setSpriteDimensionCallback.bind(this));

        // File commands
        this._communicator.registerCallback(CreateNewFilesCommand, this.createNewFilesCallback.bind(this));
        this._communicator.registerCallback(LoadFilesCommand, this.loadFilesCallback.bind(this));
        this._communicator.registerCallback(MergeFilesCommand, this.mergeFilesCallback.bind(this));
        this._communicator.registerCallback(CompileCommand, this.compileCallback.bind(this));
        this._communicator.registerCallback(CompileAsCommand, this.compileAsCallback.bind(this));
        this._communicator.registerCallback(UnloadFilesCommand, this.unloadFilesCallback.bind(this));

        // Thing commands
        this._communicator.registerCallback(NewThingCommand, this.newThingCallback.bind(this));
        this._communicator.registerCallback(UpdateThingCommand, this.updateThingCallback.bind(this));
        this._communicator.registerCallback(ImportThingsCommand, this.importThingsCallback.bind(this));
        this._communicator.registerCallback(ImportThingsFromFilesCommand, this.importThingsFromFilesCallback.bind(this));
        this._communicator.registerCallback(ExportThingCommand, this.exportThingCallback.bind(this));
        this._communicator.registerCallback(ReplaceThingsCommand, this.replaceThingsCallback.bind(this));
        this._communicator.registerCallback(ReplaceThingsFromFilesCommand, this.replaceThingsFromFilesCallback.bind(this));
        this._communicator.registerCallback(DuplicateThingCommand, this.duplicateThingCallback.bind(this));
        this._communicator.registerCallback(RemoveThingCommand, this.removeThingsCallback.bind(this));
        this._communicator.registerCallback(GetThingCommand, this.getThingCallback.bind(this));
        this._communicator.registerCallback(GetThingListCommand, this.getThingListCallback.bind(this));
        this._communicator.registerCallback(FindThingCommand, this.findThingCallback.bind(this));
        this._communicator.registerCallback(OptimizeFrameDurationsCommand, this.optimizeFrameDurationsCallback.bind(this));
        this._communicator.registerCallback(ConvertFrameGroupsCommand, this.convertFrameGroupsCallback.bind(this));

        // Sprite commands
        this._communicator.registerCallback(NewSpriteCommand, this.newSpriteCallback.bind(this));
        this._communicator.registerCallback(ImportSpritesCommand, this.addSpritesCallback.bind(this));
        this._communicator.registerCallback(ImportSpritesFromFileCommand, this.importSpritesFromFilesCallback.bind(this));
        this._communicator.registerCallback(ExportSpritesCommand, this.exportSpritesCallback.bind(this));
        this._communicator.registerCallback(ReplaceSpritesCommand, this.replaceSpritesCallback.bind(this));
        this._communicator.registerCallback(ReplaceSpritesFromFilesCommand, this.replaceSpritesFromFilesCallback.bind(this));
        this._communicator.registerCallback(RemoveSpritesCommand, this.removeSpritesCallback.bind(this));
        this._communicator.registerCallback(GetSpriteListCommand, this.getSpriteListCallback.bind(this));
        this._communicator.registerCallback(FindSpritesCommand, this.findSpritesCallback.bind(this));
        this._communicator.registerCallback(OptimizeSpritesCommand, this.optimizeSpritesCommand.bind(this));

        // General commands
        this._communicator.registerCallback(NeedToReloadCommand, this.needToReloadCallback.bind(this));

        this._communicator.start();
    }

    //--------------------------------------
    // Callback Methods (Placeholder implementations)
    //--------------------------------------

    private loadClientVersionsCallback(filePath: string): void {
        if (!filePath) {
            throw new Error("path cannot be null or empty");
        }
        VersionStorage.getInstance().load(filePath);
        // After loading versions, send them to the UI
        this.getVersionsListCallback();
    }

    private getVersionsListCallback(): void {
        const versionStorage = VersionStorage.getInstance();
        if (versionStorage.loaded) {
            const versions = versionStorage.getList();
            console.log(`[ObjectBuilderWorker] Sending ${versions.length} versions`);
            this.sendCommand(new SetVersionsCommand(versions));
        } else {
            // Try to load versions from default location
            console.log('[ObjectBuilderWorker] Versions not loaded, attempting to load...');
            const path = require("path");
            const fs = require("fs");
            const possiblePaths = [
                path.join(__dirname, "../../firstRun/versions.xml"),
                path.join(__dirname, "../firstRun/versions.xml"),
                path.join(__dirname, "../../src/firstRun/versions.xml"),
                path.join(process.cwd(), "src/firstRun/versions.xml"),
                path.join(process.cwd(), "firstRun/versions.xml"),
            ];
            
            let versionsPath: string | null = null;
            for (const possiblePath of possiblePaths) {
                if (fs.existsSync(possiblePath)) {
                    versionsPath = possiblePath;
                    break;
                }
            }
            
            if (versionsPath) {
                try {
                    versionStorage.load(versionsPath);
                    const versions = versionStorage.getList();
                    console.log(`[ObjectBuilderWorker] Loaded and sending ${versions.length} versions`);
                    this.sendCommand(new SetVersionsCommand(versions));
                } catch (error: any) {
                    console.error('[ObjectBuilderWorker] Failed to load versions:', error);
                    // Send empty list so UI doesn't hang
                    this.sendCommand(new SetVersionsCommand([]));
                }
            } else {
                console.warn('[ObjectBuilderWorker] versions.xml not found, sending empty list');
                // Send empty list so UI doesn't hang
                this.sendCommand(new SetVersionsCommand([]));
            }
        }
    }

    private loadSpriteDimensionsCallback(filePath: string): void {
        if (!filePath) {
            throw new Error("path cannot be null or empty");
        }
        SpriteDimensionStorage.getInstance().load(filePath);
    }

    private setSpriteDimensionCallback(value: string, size: number, dataSize: number): void {
        if (!value) {
            throw new Error("value cannot be null or empty");
        }
        SpriteExtent.DEFAULT_VALUE = value;
        SpriteExtent.DEFAULT_SIZE = size;
        SpriteExtent.DEFAULT_DATA_SIZE = dataSize;
    }

    private settingsCallback(settings: ObjectBuilderSettings): void {
        if (!settings) {
            throw new Error("settings cannot be null or empty");
        }
        Resources.locale = settings.getLanguage()[0];
        this._thingListAmount = settings.objectsListAmount;
        this._spriteListAmount = settings.spritesListAmount;
        this._settings = settings;
    }

    private createNewFilesCallback(datSignature: number,
                                   sprSignature: number,
                                   extended: boolean,
                                   transparency: boolean,
                                   improvedAnimations: boolean,
                                   frameGroups: boolean): void {
        this.unloadFilesCallback();

        const version = VersionStorage.getInstance().getBySignatures(datSignature, sprSignature);
        if (!version) {
            throw new Error(`No version found with signatures dat=${datSignature}, spr=${sprSignature}`);
        }

        this._version = version;
        if (!this._version) {
            throw new Error("Failed to get version");
        }
        this._extended = (extended || this._version.value >= 960);
        this._transparency = transparency;
        this._improvedAnimations = (improvedAnimations || this._version.value >= 1050);
        this._frameGroups = (frameGroups || this._version.value >= 1057);

        this.createStorage();

        // Create things
        if (this._version) {
            this._things!.createNew(this._version, this._extended, this._improvedAnimations, this._frameGroups);

            // Create sprites
            this._sprites!.createNew(this._version, this._extended, this._transparency);
        }

        // Update preview
        const thing = this._things!.getItemType(ThingTypeStorage.MIN_ITEM_ID);
        if (thing) {
            this.getThingCallback(thing.id, thing.category);
        }

        // Send sprites
        this.sendSpriteList([1]);
    }

    private loadFilesCallback(datFile: string,
                             sprFile: string,
                             version: Version | null,
                             extended: boolean,
                             transparency: boolean,
                             improvedAnimations: boolean,
                             frameGroups: boolean): void {
        if (!datFile) {
            throw new Error("datFile cannot be null or empty");
        }

        if (!sprFile) {
            throw new Error("sprFile cannot be null or empty");
        }

        this.unloadFilesCallback();

        // Auto-detect version from file signatures if not provided
        if (!version) {
            console.log('[ObjectBuilderWorker] Version not provided, auto-detecting from file signatures...');
            const fs = require("fs");
            try {
                // Read DAT signature (first 4 bytes)
                const datBuffer = fs.readFileSync(datFile, { start: 0, end: 3 });
                const datSignature = datBuffer.readUInt32LE(0);
                
                // Read SPR signature (first 4 bytes)
                const sprBuffer = fs.readFileSync(sprFile, { start: 0, end: 3 });
                const sprSignature = sprBuffer.readUInt32LE(0);
                
                console.log(`[ObjectBuilderWorker] File signatures: dat=0x${datSignature.toString(16)}, spr=0x${sprSignature.toString(16)}`);
                
                version = VersionStorage.getInstance().getBySignatures(datSignature, sprSignature);
                if (!version) {
                    throw new Error(`No version found with signatures dat=0x${datSignature.toString(16)}, spr=0x${sprSignature.toString(16)}. Please ensure versions.xml is loaded.`);
                }
                console.log(`[ObjectBuilderWorker] Auto-detected version: ${version.valueStr} (${version.value})`);
            } catch (error: any) {
                throw new Error(`Failed to auto-detect version: ${error.message}`);
            }
        }

        this._datFile = datFile;
        this._sprFile = sprFile;
        this._version = version;
        this._extended = (extended || this._version.value >= 960);
        this._transparency = transparency;
        this._improvedAnimations = (improvedAnimations || this._version.value >= 1050);
        this._frameGroups = (frameGroups || this._version.value >= 1057);

        this.createStorage();

        // Load things and sprites
        // Note: load() is synchronous, so we need to check if both are loaded
        // and manually trigger clientLoadComplete if events don't fire
        console.log('[ObjectBuilderWorker] Loading things and sprites...');
        this._things!.load(this._datFile, this._version, this._extended, this._improvedAnimations, this._frameGroups);
        this._sprites!.load(this._sprFile, this._version, this._extended, this._transparency);
        
        console.log(`[ObjectBuilderWorker] After load: things.loaded=${this._things!.loaded}, sprites.loaded=${this._sprites!.loaded}, clientLoaded=${this.clientLoaded}`);
        
        // If both storages are already loaded (synchronous load),
        // manually trigger clientLoadComplete
        // The storageLoadHandler will also handle this, but this ensures it happens
        if (this._things!.loaded && this._sprites!.loaded && this.clientLoaded) {
            console.log('[ObjectBuilderWorker] Both loaded synchronously, calling clientLoadComplete');
            // Use setImmediate to ensure this happens after any event handlers
            setImmediate(() => {
                this.clientLoadComplete();
            });
        }
    }

    private mergeFilesCallback(datFile: string,
                               sprFile: string,
                               version: Version,
                               extended: boolean,
                               transparency: boolean,
                               improvedAnimations: boolean,
                               frameGroups: boolean): void {
        if (!datFile) {
            throw new Error("datFile cannot be null or empty");
        }

        if (!sprFile) {
            throw new Error("sprFile cannot be null or empty");
        }

        if (!version) {
            throw new Error("version cannot be null");
        }

        if (!this._settings) {
            throw new Error("Settings must be set before merging files");
        }

        const extendedFlag = (extended || version.value >= 960);
        const improvedAnimationsFlag = (improvedAnimations || version.value >= 1050);
        const frameGroupsFlag = (frameGroups || version.value >= 1057);

        const merger = new ClientMerger(this._things!, this._sprites!, this._settings);
        merger.on("progress", (event: ProgressEvent) => {
            this.sendCommand(new ProgressCommand(ProgressBarID.DEFAULT, event.loaded, event.total, event.label || ""));
        });

        merger.on("complete", () => {
            let category: string | null = null;
            let id: number = 0;

            if (merger.itemsCount !== 0) {
                category = ThingCategory.ITEM;
            } else if (merger.outfitsCount !== 0) {
                category = ThingCategory.OUTFIT;
            } else if (merger.effectsCount !== 0) {
                category = ThingCategory.EFFECT;
            } else if (merger.missilesCount !== 0) {
                category = ThingCategory.MISSILE;
            }

            if (category || merger.spritesCount !== 0) {
                this.sendClientInfo();

                if (merger.spritesCount !== 0) {
                    id = this._sprites!.spritesCount;
                    this.sendSpriteList([id]);
                }

                if (category) {
                    id = this._things!.getMaxId(category);
                    this.setSelectedThingIds([id], category);
                }
            }

            this.sendCommand(new HideProgressBarCommand(ProgressBarID.DEFAULT));
        });

        merger.start(datFile, sprFile, version, extendedFlag, improvedAnimationsFlag, frameGroupsFlag, transparency);
    }

    private compileAsCallback(datFile: string,
                             sprFile: string,
                             version: Version,
                             extended: boolean,
                             transparency: boolean,
                             improvedAnimations: boolean,
                             frameGroups: boolean): void {
        if (!datFile) {
            throw new Error("datFile cannot be null or empty");
        }

        if (!sprFile) {
            throw new Error("sprFile cannot be null or empty");
        }

        if (!version) {
            throw new Error("version cannot be null");
        }

        if (!this._things || !this._things.loaded) {
            throw new Error(Resources.getString("metadataNotLoaded"));
        }

        if (!this._sprites || !this._sprites.loaded) {
            throw new Error(Resources.getString("spritesNotLoaded"));
        }

        const structureChanged = (this._extended !== extended ||
                                 this._transparency !== transparency ||
                                 this._improvedAnimations !== improvedAnimations ||
                                 this._frameGroups !== frameGroups);

        if (!this._things.compile(datFile, version, extended, improvedAnimations, frameGroups) ||
            !this._sprites.compile(sprFile, version, extended, transparency)) {
            return;
        }

        // Save .otfi file
        const dir = path.dirname(datFile);
        const datName = path.basename(datFile, path.extname(datFile));
        const otfiFile = path.join(dir, datName + ".otfi");
        const otfi = new OTFI(extended, transparency, improvedAnimations, frameGroups,
                             path.basename(datFile), path.basename(sprFile),
                             SpriteExtent.DEFAULT_SIZE, SpriteExtent.DEFAULT_DATA_SIZE);
        otfi.save(otfiFile);

        this.clientCompileComplete();

        if (!this._datFile || !this._sprFile) {
            this._datFile = datFile;
            this._sprFile = sprFile;
        }

        if (structureChanged) {
            this.sendCommand(new NeedToReloadCommand(extended, transparency, improvedAnimations, frameGroups));
        } else {
            this.sendClientInfo();
        }
    }

    private unloadFilesCallback(): void {
        if (this._things) {
            this._things.removeAllListeners(StorageEvent.LOAD);
            this._things.removeAllListeners(StorageEvent.CHANGE);
            this._things.removeAllListeners(ProgressEvent.PROGRESS);
            this._things.removeAllListeners("error");
            this._things.unload();
            this._things = null;
        }

        if (this._sprites) {
            this._sprites.removeAllListeners(StorageEvent.LOAD);
            this._sprites.removeAllListeners(StorageEvent.CHANGE);
            this._sprites.removeAllListeners(ProgressEvent.PROGRESS);
            this._sprites.removeAllListeners("error");
            this._sprites.unload();
            this._sprites = null;
        }

        this._datFile = null;
        this._sprFile = null;
        this._version = null;
        this._extended = false;
        this._transparency = false;
        this._improvedAnimations = false;
        this._frameGroups = false;
        this._errorMessage = null;
    }

    private newThingCallback(category: string): void {
        if (!ThingCategory.getCategory(category)) {
            throw new Error(Resources.getString("invalidCategory"));
        }

        if (!this._settings || !this._things) {
            throw new Error("Settings and things storage must be initialized");
        }

        // Add thing
        const thing = ThingType.create(0, category, this._frameGroups, this._settings.getDefaultDuration(category));
        const result = this._things.addThing(thing, category);
        if (!result.done) {
            console.error(result.message);
            return;
        }

        // Send changes
        this.getThingCallback(thing.id, category);
    }

    private updateThingCallback(thingData: ThingData, replaceSprites: boolean): void {
        if (!thingData) {
            throw new Error("thingData cannot be null");
        }

        if (!this._things || !this._sprites) {
            throw new Error("Things and sprites storage must be initialized");
        }

        const thing = thingData.thing;
        if (!thing) {
            throw new Error("thingData.thing cannot be null");
        }
        if (!this._things.hasThingType(thing.category, thing.id)) {
            throw new Error(Resources.getString(
                "thingNotFound",
                Resources.getString(thing.category),
                thing.id));
        }

        // Update sprites
        const spritesIds: number[] = [];
        const currentThing = this._things.getThingType(thing.id, thing.category);
        if (!currentThing) {
            return;
        }

        const sprites = thingData.sprites;
        for (let groupType = FrameGroupType.DEFAULT; groupType <= FrameGroupType.WALKING; groupType++) {
            const frameGroup = thing.getFrameGroup(groupType);
            if (!frameGroup) {
                continue;
            }

            const currentFrameGroup = currentThing.getFrameGroup(groupType);
            if (!currentFrameGroup) {
                continue;
            }

            const groupSprites = sprites.get(groupType);
            if (!groupSprites) {
                continue;
            }

            const length = groupSprites.length;
            if (!frameGroup.spriteIndex) {
                continue;
            }
            for (let i = 0; i < length; i++) {
                const spriteData = groupSprites[i];
                let id = frameGroup.spriteIndex[i];

                if (id === 0xFFFFFFFF) { // uint.MAX_VALUE
                    if (spriteData.isEmpty()) {
                        frameGroup.spriteIndex[i] = 0;
                    } else {
                        let result;
                        if (replaceSprites && currentFrameGroup.spriteIndex && i < currentFrameGroup.spriteIndex.length && currentFrameGroup.spriteIndex[i] !== 0) {
                            if (!spriteData.pixels) {
                                continue;
                            }
                            result = this._sprites.replaceSprite(currentFrameGroup.spriteIndex[i], spriteData.pixels);
                        } else {
                            if (!spriteData.pixels) {
                                continue;
                            }
                            result = this._sprites.addSprite(spriteData.pixels);
                        }

                        if (!result.done) {
                            console.error(result.message);
                            return;
                        }

                        if (result.list && result.list.length > 0) {
                            const newSpriteData = result.list[0];
                            frameGroup.spriteIndex[i] = newSpriteData.id;
                            spritesIds.push(newSpriteData.id);
                        }
                    }
                } else {
                    if (!this._sprites.hasSpriteId(id)) {
                        console.error(Resources.getString("spriteNotFound", id));
                        return;
                    }
                }
            }
        }

        // Update thing
        const result = this._things.replaceThing(thing, thing.category, thing.id);
        if (!result.done) {
            console.error(result.message);
            return;
        }

        // Send changes
        if (spritesIds.length > 0) {
            this.setSelectedSpriteIds(spritesIds);
        }

        this.getThingCallback(thingData.id, thingData.category);
        this.sendThingList([thingData.id], thingData.category);
    }

    private importThingsCallback(list: ThingData[]): void {
        if (!list) {
            throw new Error("list cannot be null");
        }

        if (!this._things || !this._sprites || !this._version || !this._settings) {
            throw new Error("Storage, version, and settings must be initialized");
        }

        const length = list.length;
        if (length === 0) return;

        // Add sprites
        const spritesIds: number[] = [];
        for (let i = 0; i < length; i++) {
            const thingData = list[i];
            if (this._frameGroups && thingData.obdVersion < OBDVersions.OBD_VERSION_3) {
                ThingUtils.convertFrameGroups(thingData, ThingUtils.ADD_FRAME_GROUPS, this._improvedAnimations,
                    this._settings.getDefaultDuration(thingData.category), this._version.value < 870);
            } else if (!this._frameGroups && thingData.obdVersion >= OBDVersions.OBD_VERSION_3) {
                ThingUtils.convertFrameGroups(thingData, ThingUtils.REMOVE_FRAME_GROUPS, this._improvedAnimations,
                    this._settings.getDefaultDuration(thingData.category), this._version.value < 870);
            }

            const thing = thingData.thing;
            if (!thing) {
                continue;
            }
            for (let groupType = FrameGroupType.DEFAULT; groupType <= FrameGroupType.WALKING; groupType++) {
                const frameGroup = thing.getFrameGroup(groupType);
                if (!frameGroup) {
                    continue;
                }

                const groupSprites = thingData.sprites.get(groupType);
                if (!groupSprites) {
                    continue;
                }

                const len = groupSprites.length;
                for (let k = 0; k < len; k++) {
                    const spriteData = groupSprites[k];
                    let id = spriteData.id;
                    if (spriteData.isEmpty()) {
                        id = 0;
                    } else if (spriteData.pixels && (!this._sprites.hasSpriteId(id) || !this._sprites.compare(id, spriteData.pixels))) {
                        const result = this._sprites.addSprite(spriteData.pixels);
                        if (!result.done) {
                            console.error(result.message);
                            return;
                        }
                        id = this._sprites.spritesCount;
                        spritesIds.push(id);
                    }
                    if (frameGroup.spriteIndex) {
                        frameGroup.spriteIndex[k] = id;
                    }
                }
            }
        }

        // Add things
        const thingsToAdd: ThingType[] = [];
        for (let i = 0; i < length; i++) {
            const thing = list[i].thing;
            if (thing) {
                thingsToAdd.push(thing);
            }
        }

        if (thingsToAdd.length === 0) {
            return;
        }

        const result = this._things.addThings(thingsToAdd);
        if (!result.done) {
            console.error(result.message);
            return;
        }

        const addedThings = result.list;
        if (!addedThings) {
            return;
        }
        const thingsIds: number[] = [];
        for (let i = 0; i < addedThings.length; i++) {
            thingsIds.push(addedThings[i].id);
        }

        if (spritesIds.length > 0) {
            this.sendSpriteList([this._sprites.spritesCount]);
        }

        if (list.length === 0 || !list[0].thing) {
            return;
        }
        const category = list[0].thing.category;
        this.setSelectedThingIds(thingsIds, category);
    }

    private importThingsFromFilesCallback(list: PathHelper[]): void {
        if (!list) {
            throw new Error("list cannot be null");
        }

        if (!this._settings) {
            throw new Error("Settings must be initialized");
        }

        const length = list.length;
        if (length === 0) return;

        const loader = new ThingDataLoader(this._settings);
        loader.on("progress", (event: ProgressEvent) => {
            this.sendCommand(new ProgressCommand(event.id, event.loaded, event.total, Resources.getString("loading")));
        });

        loader.on("complete", () => {
            this.sendCommand(new HideProgressBarCommand(ProgressBarID.DEFAULT));
            this.importThingsCallback(loader.thingDataList);
        });

        loader.on("error", (error: Error) => {
            this.sendCommand(new HideProgressBarCommand(ProgressBarID.DEFAULT));
            const { Logger } = require("../utils/Logger");
            Logger.error("Error importing things", error, "ObjectBuilderWorker:importThingsCallback");
            console.error(error);
        });

        loader.loadFiles(list);
    }

    private async exportThingCallback(list: PathHelper[],
                               category: string,
                               obdVersion: number,
                               clientVersion: Version,
                               spriteSheetFlag: number,
                               transparentBackground: boolean,
                               jpegQuality: number): Promise<void> {
        if (!list) {
            throw new Error("list cannot be null");
        }

        if (!ThingCategory.getCategory(category)) {
            throw new Error(Resources.getString("invalidCategory"));
        }

        if (!clientVersion) {
            throw new Error("clientVersion cannot be null");
        }

        if (!this._settings) {
            throw new Error("Settings must be initialized");
        }

        const length = list.length;
        if (length === 0) return;

        // Export things
        const label = Resources.getString("exportingObjects");
        const encoder = new OBDEncoder(this._settings);
        const helper = new SaveHelper();
        const backgroundColor = (this._transparency || transparentBackground) ? 0x00FF00FF : 0xFFFF00FF;

        for (let i = 0; i < length; i++) {
            const pathHelper = list[i];
            const thingData = this.getThingData(pathHelper.id, category, obdVersion, clientVersion.value);

            const filePath = pathHelper.nativePath;
            const name = path.basename(filePath, path.extname(filePath));
            const format = path.extname(filePath).substring(1).toLowerCase();

            if (!thingData) {
                continue;
            }
            if (ImageCodec.hasImageFormat(format)) {
                const bitmap = thingData.getTotalSpriteSheet(null, backgroundColor);
                const bytes = await ImageCodec.encode(bitmap, format, jpegQuality);
                helper.addFile(bytes, name, format, filePath);

                if (spriteSheetFlag !== 0 && thingData.thing) {
                    const patternsString = ObUtils.getPatternsString(thingData.thing, spriteSheetFlag);
                    const txtPath = filePath.replace(new RegExp(`\\.${format}$`, "i"), ".txt");
                    helper.addFile(patternsString, name, "txt", txtPath);
                }
            } else if (format === OTFormat.OBD) {
                if (thingData) {
                    const bytes = await encoder.encode(thingData);
                    helper.addFile(bytes.toBuffer(), name, format, filePath);
                }
            }
        }

        helper.on("progress", (event: ProgressEvent) => {
            this.sendCommand(new ProgressCommand(ProgressBarID.DEFAULT, event.loaded, event.total, label));
        });

        helper.on("complete", () => {
            this.sendCommand(new HideProgressBarCommand(ProgressBarID.DEFAULT));
        });

        helper.on("error", (error: Error) => {
            const { Logger } = require("../utils/Logger");
            Logger.error("Error exporting thing", error, "ObjectBuilderWorker:exportThingCallback");
            console.error(error);
            this.sendCommand(new HideProgressBarCommand(ProgressBarID.DEFAULT));
        });

        await helper.save();
    }

    private replaceThingsCallback(list: ThingData[]): void {
        if (!list) {
            throw new Error("list cannot be null");
        }

        if (!this._things || !this._sprites || !this._version || !this._settings) {
            throw new Error("Storage, version, and settings must be initialized");
        }

        const length = list.length;
        if (length === 0) return;

        // Add sprites
        const spritesIds: number[] = [];
        for (let i = 0; i < length; i++) {
            const thingData = list[i];
            if (this._frameGroups && thingData.obdVersion < OBDVersions.OBD_VERSION_3) {
                ThingUtils.convertFrameGroups(thingData, ThingUtils.ADD_FRAME_GROUPS, this._improvedAnimations,
                    this._settings.getDefaultDuration(thingData.category), this._version.value < 870);
            } else if (!this._frameGroups && thingData.obdVersion >= OBDVersions.OBD_VERSION_3) {
                ThingUtils.convertFrameGroups(thingData, ThingUtils.REMOVE_FRAME_GROUPS, this._improvedAnimations,
                    this._settings.getDefaultDuration(thingData.category), this._version.value < 870);
            }

            const thing = thingData.thing;
            if (!thing) {
                continue;
            }
            for (let groupType = FrameGroupType.DEFAULT; groupType <= FrameGroupType.WALKING; groupType++) {
                const frameGroup = thing.getFrameGroup(groupType);
                if (!frameGroup) {
                    continue;
                }

                const groupSprites = thingData.sprites.get(groupType);
                if (!groupSprites) {
                    continue;
                }

                const len = groupSprites.length;
                for (let k = 0; k < len; k++) {
                    const spriteData = groupSprites[k];
                    let id = spriteData.id;
                    if (spriteData.isEmpty()) {
                        id = 0;
                    } else if (spriteData.pixels && (!this._sprites.hasSpriteId(id) || !this._sprites.compare(id, spriteData.pixels))) {
                        const result = this._sprites.addSprite(spriteData.pixels);
                        if (!result.done) {
                            console.error(result.message);
                            return;
                        }
                        id = this._sprites.spritesCount;
                        spritesIds.push(id);
                    }
                    if (frameGroup.spriteIndex) {
                        frameGroup.spriteIndex[k] = id;
                    }
                }
            }
        }

        // Replace things
        const thingsToReplace: ThingType[] = [];
        const thingsIds: number[] = [];
        for (let i = 0; i < length; i++) {
            const thing = list[i].thing;
            if (thing) {
                thingsToReplace.push(thing);
                thingsIds.push(list[i].id);
            }
        }

        if (thingsToReplace.length === 0) {
            return;
        }

        const result = this._things.replaceThings(thingsToReplace);
        if (!result.done) {
            console.error(result.message);
            return;
        }

        // Send changes
        if (spritesIds.length > 0) {
            this.sendSpriteList([this._sprites.spritesCount]);
        }

        if (list.length === 0 || !list[0].thing) {
            return;
        }
        const category = list[0].thing.category;
        this.setSelectedThingIds(thingsIds, category);
    }

    private replaceThingsFromFilesCallback(list: PathHelper[]): void {
        if (!list) {
            throw new Error("list cannot be null");
        }

        if (!this._settings) {
            throw new Error("Settings must be initialized");
        }

        const length = list.length;
        if (length === 0) return;

        const loader = new ThingDataLoader(this._settings);
        loader.on("progress", (event: ProgressEvent) => {
            this.sendCommand(new ProgressCommand(event.id, event.loaded, event.total, Resources.getString("loading")));
        });

        loader.on("complete", () => {
            this.sendCommand(new HideProgressBarCommand(ProgressBarID.DEFAULT));
            this.replaceThingsCallback(loader.thingDataList);
        });

        loader.on("error", (error: Error) => {
            this.sendCommand(new HideProgressBarCommand(ProgressBarID.DEFAULT));
            const { Logger } = require("../utils/Logger");
            Logger.error("Error importing things", error, "ObjectBuilderWorker:importThingsCallback");
            console.error(error);
        });

        loader.loadFiles(list);
    }

    private duplicateThingCallback(ids: number[], category: string): void {
        if (!ids) {
            throw new Error("ids cannot be null");
        }

        if (!ThingCategory.getCategory(category)) {
            throw new Error(Resources.getString("invalidCategory"));
        }

        if (!this._things) {
            throw new Error("Things storage must be initialized");
        }

        const length = ids.length;
        if (length === 0) return;

        // Duplicate things
        ids.sort((a, b) => a - b); // NUMERIC

        const thingsCopyList: ThingType[] = [];
        for (let i = 0; i < length; i++) {
            const thing = this._things.getThingType(ids[i], category);
            if (!thing) {
                throw new Error(Resources.getString(
                    "thingNotFound",
                    Resources.getString(category),
                    ids[i]));
            }
            thingsCopyList.push(thing.clone());
        }

        const result = this._things.addThings(thingsCopyList);
        if (!result.done) {
            console.error(result.message);
            return;
        }

        const addedThings = result.list;
        if (!addedThings) {
            return;
        }
        const thingIds: number[] = [];
        for (let i = 0; i < addedThings.length; i++) {
            thingIds.push(addedThings[i].id);
        }

        this.setSelectedThingIds(thingIds, category);
    }

    private removeThingsCallback(list: number[], category: string, removeSprites: boolean): void {
        if (!list) {
            throw new Error("list cannot be null");
        }

        if (!ThingCategory.getCategory(category)) {
            throw new Error(Resources.getString("invalidCategory"));
        }

        if (!this._things || !this._sprites) {
            throw new Error("Things and sprites storage must be initialized");
        }

        const length = list.length;
        if (length === 0) return;

        // Remove things
        const result = this._things.removeThings(list, category);
        if (!result.done) {
            console.error(result.message);
            return;
        }

        const removedThingList = result.list;
        if (!removedThingList) {
            return;
        }

        // Remove sprites
        let removedSpriteList: SpriteData[] = [];
        let spriteIds: number[] = [];

        if (removeSprites) {
            const sprites: Set<number> = new Set();

            for (let i = 0; i < removedThingList.length; i++) {
                const thing = removedThingList[i];
                for (let groupType = FrameGroupType.DEFAULT; groupType <= FrameGroupType.WALKING; groupType++) {
                    const frameGroup = thing.getFrameGroup(groupType);
                    if (!frameGroup || !frameGroup.spriteIndex) {
                        continue;
                    }

                    const spriteIndex = frameGroup.spriteIndex;
                    const len = spriteIndex.length;
                    for (let k = 0; k < len; k++) {
                        const id = spriteIndex[k];
                        if (id !== 0) {
                            sprites.add(id);
                        }
                    }
                }
            }

            spriteIds = Array.from(sprites);
            if (spriteIds.length > 0) {
                const spriteResult = this._sprites.removeSprites(spriteIds);
                if (!spriteResult.done) {
                    console.error(spriteResult.message);
                    return;
                }
                removedSpriteList = spriteResult.list || [];
            }
        }

        // Send changes
        const thingIds: number[] = [];
        for (let i = 0; i < removedThingList.length; i++) {
            thingIds.push(removedThingList[i].id);
        }

        this.setSelectedThingIds(thingIds, category);

        // Sprites changes
        if (removeSprites && spriteIds.length !== 0) {
            spriteIds.sort((a, b) => a - b);
            this.sendSpriteList([spriteIds[0]]);
        }
    }

    private getThingCallback(id: number, category: string): void {
        this.sendThingData(id, category);
    }

    private getThingListCallback(targetId: number, category: string): void {
        if (!category) {
            throw new Error("category cannot be null or empty");
        }
        this.sendThingList([targetId], category);
    }

    private findThingCallback(category: string, properties: ThingProperty[]): void {
        if (!ThingCategory.getCategory(category)) {
            throw new Error(Resources.getString("invalidCategory"));
        }

        if (!properties) {
            throw new Error("properties cannot be null");
        }

        if (!this._things) {
            throw new Error("Things storage must be initialized");
        }

        const list: ThingListItem[] = [];
        const things = this._things.findThingTypeByProperties(category, properties);
        const length = things.length;

        for (let i = 0; i < length; i++) {
            const listItem = new ThingListItem();
            listItem.thing = things[i];
            listItem.frameGroup = things[i].getFrameGroup(FrameGroupType.DEFAULT);
            listItem.pixels = this.getBitmapPixels(things[i]); // Returns ByteArray
            list.push(listItem);
        }

        this.sendCommand(new FindResultCommand(FindResultCommand.THINGS, list));
    }

    private optimizeFrameDurationsCallback(items: boolean, itemsMinimumDuration: number, itemsMaximumDuration: number,
                                           outfits: boolean, outfitsMinimumDuration: number, outfitsMaximumDuration: number,
                                           effects: boolean, effectsMinimumDuration: number, effectsMaximumDuration: number): void {
        if (!this._things) {
            throw new Error("Things storage must be initialized");
        }

        const optimizer = new FrameDurationsOptimizer(
            this._things,
            items, itemsMinimumDuration, itemsMaximumDuration,
            outfits, outfitsMinimumDuration, outfitsMaximumDuration,
            effects, effectsMinimumDuration, effectsMaximumDuration
        );

        optimizer.on("progress", (event: ProgressEvent) => {
            this.sendCommand(new ProgressCommand(ProgressBarID.OPTIMIZE, event.loaded, event.total, event.label || ""));
        });

        optimizer.on("complete", () => {
            this.sendCommand(new OptimizeFrameDurationsResultCommand());
        });

        optimizer.start();
    }

    private convertFrameGroupsCallback(frameGroups: boolean, mounts: boolean): void {
        if (!this._things || !this._sprites || !this._version || !this._settings) {
            throw new Error("Storage, version, and settings must be initialized");
        }

        const optimizer = new FrameGroupsConverter(
            this._things,
            this._sprites,
            frameGroups,
            mounts,
            this._version.value,
            this._improvedAnimations,
            this._settings.getDefaultDuration(ThingCategory.OUTFIT)
        );

        optimizer.on("progress", (event: ProgressEvent) => {
            this.sendCommand(new ProgressCommand(ProgressBarID.OPTIMIZE, event.loaded, event.total, event.label || ""));
        });

        optimizer.on("complete", () => {
            this._frameGroups = frameGroups;
            this.sendCommand(new ConvertFrameGroupsResultCommand());
        });

        optimizer.start();
    }

    private newSpriteCallback(): void {
        if (!this._sprites) {
            throw new Error("Sprites storage must be initialized");
        }

        if (this._sprites.isFull) {
            console.error(Resources.getString("spritesLimitReached"));
            return;
        }

        // Add sprite
        const rect = { x: 0, y: 0, width: SpriteExtent.DEFAULT_SIZE, height: SpriteExtent.DEFAULT_SIZE };
        const bitmap = new BitmapData(rect.width, rect.height, true, 0);
        const pixels = bitmap.getPixels(rect);
        const result = this._sprites.addSprite(pixels);

        if (!result.done) {
            console.error(result.message);
            return;
        }

        // Send changes
        this.sendSpriteList([this._sprites.spritesCount]);
    }

    private addSpritesCallback(sprites: Buffer[]): void {
        if (!sprites) {
            throw new Error("sprites cannot be null");
        }

        if (!this._sprites) {
            throw new Error("Sprites storage must be initialized");
        }

        if (sprites.length === 0) return;

        // Add sprites
        const result = this._sprites.addSprites(sprites);
        if (!result.done) {
            console.error(result.message);
            return;
        }

        const spriteAddedList = result.list;
        if (!spriteAddedList) {
            return;
        }

        // Send changes to application
        const ids: number[] = [];
        const length = spriteAddedList.length;
        for (let i = 0; i < length; i++) {
            ids.push(spriteAddedList[i].id);
        }

        this.sendSpriteList([ids[0]]);
    }

    private importSpritesFromFilesCallback(list: PathHelper[]): void {
        if (!list) {
            throw new Error("list cannot be null");
        }

        if (list.length === 0) return;

        // Ensure sprite storage is initialized
        if (!this._sprites) {
            // Create sprite storage if it doesn't exist
            // Note: SpriteStorage doesn't require settings, only ThingTypeStorage does
            this._sprites = new SpriteStorage();
            this._sprites.on(StorageEvent.LOAD, this.storageLoadHandler.bind(this));
            this._sprites.on(StorageEvent.CHANGE, this.storageChangeHandler.bind(this));
            this._sprites.on(ProgressEvent.PROGRESS, this.spritesProgressHandler.bind(this));
            this._sprites.on("error", this.spritesErrorHandler.bind(this));
            
            // Initialize storage - we need a version for createNew, but if we don't have one,
            // we'll initialize it manually in the complete handler
            if (this._version) {
                if (!this._sprites.loaded) {
                    this._sprites.createNew(this._version, this._extended, this._transparency);
                }
            } else {
                // If no version, we'll need to initialize manually
                // Use current extended and transparency settings
                (this._sprites as any)._extended = this._extended;
                (this._sprites as any)._transparency = this._transparency;
                (this._sprites as any)._sprites = new Map();
                (this._sprites as any)._spritesCount = 0;
                (this._sprites as any)._blankSprite = new Sprite(0, this._transparency);
                (this._sprites as any)._alertSprite = new Sprite(0xFFFFFFFF, this._transparency);
                (this._sprites as any)._sprites.set(0, (this._sprites as any)._blankSprite);
                (this._sprites as any)._loaded = true;
            }
        }

        const loader = new SpriteDataLoader();
        
        // Determine correct settings for SPR file loading
        // For old versions like 8.0, extended should be false and transparency should be true
        let extended = this._extended;
        let transparency = this._transparency;
        
        if (this._version) {
            loader.setVersion(this._version);
            // Override extended based on version (versions < 960 are not extended)
            extended = this._version.value >= 960;
            // For old versions, default transparency to true if not explicitly set
            if (this._version.value < 960 && !this._transparency) {
                transparency = true;
            }
        } else {
            // If no version, use safe defaults for old versions
            extended = false;
            transparency = true;
        }
        
        loader.setExtended(extended);
        loader.setTransparency(transparency);
        
        // Ensure storage transparency matches loader settings
        // This is important for replaceSprites which uses storage._transparency
        if (this._sprites) {
            (this._sprites as any)._transparency = transparency;
            (this._sprites as any)._extended = extended;
        }
        
        // Store settings for error reporting
        const loadSettings = { extended, transparency, version: this._version?.valueStr || "unknown" };
        
        loader.on("progress", (event: ProgressEvent) => {
            this.sendCommand(new ProgressCommand(event.id, event.loaded, event.total, Resources.getString("loading")));
        });

        loader.on("complete", () => {
            this.sendCommand(new HideProgressBarCommand(ProgressBarID.DEFAULT));

            const spriteDataList = loader.spriteDataList;
            const length = spriteDataList.length;
            
            if (length === 0) {
                console.warn("No sprites were loaded from the SPR file");
                return;
            }

            if (!this._sprites) {
                console.error("Sprite storage is not initialized");
                return;
            }

            console.log(`Loaded ${length} sprites from SPR file, max ID: ${Math.max(...spriteDataList.map(s => s.id))}`);

            // Sort by id descending
            spriteDataList.sort((a, b) => b.id - a.id);

            // Find the maximum sprite ID to update spritesCount
            const maxSpriteId = Math.max(...spriteDataList.map(s => s.id));
            
            // Update spritesCount to accommodate the highest sprite ID
            // This is necessary because replaceSprites doesn't update spritesCount automatically
            if (maxSpriteId > this._sprites.spritesCount) {
                (this._sprites as any)._spritesCount = maxSpriteId;
            }

            // Use replaceSprites to preserve sprite IDs from the SPR file
            // This ensures sprites are added/updated with their original IDs
            const result = this._sprites.replaceSprites(spriteDataList);
            if (!result.done) {
                console.error(result.message);
                return;
            }

            // Ensure spritesCount is updated after replace
            // replaceSprites might add new sprites that weren't in the storage
            if (maxSpriteId > this._sprites.spritesCount) {
                (this._sprites as any)._spritesCount = maxSpriteId;
            }

            // Send changes to application
            const ids: number[] = [];
            for (let i = 0; i < length; i++) {
                ids.push(spriteDataList[i].id);
            }

            if (ids.length > 0) {
                this.sendSpriteList([ids[0]]);
            }
        });

        loader.on("error", (error: Error) => {
            this.sendCommand(new HideProgressBarCommand(ProgressBarID.DEFAULT));
            const { Logger } = require("../utils/Logger");
            Logger.error("Sprite import error", error, "ObjectBuilderWorker:importSpritesCallback", {
                ...loadSettings
            });
            console.error("Sprite import error:", error);
            console.error("Error details:", {
                message: error.message,
                stack: error.stack,
                ...loadSettings
            });
        });

        loader.loadFiles(list);
    }

    private async exportSpritesCallback(list: PathHelper[],
                                  transparentBackground: boolean,
                                  jpegQuality: number): Promise<void> {
        if (!list) {
            throw new Error("list cannot be null");
        }

        if (!this._sprites) {
            throw new Error("Sprites storage must be initialized");
        }

        const length = list.length;
        if (length === 0) return;

        // Save sprites
        const label = Resources.getString("exportingSprites");
        const helper = new SaveHelper();

        for (let i = 0; i < length; i++) {
            const pathHelper = list[i];
            const filePath = pathHelper.nativePath;
            const name = path.basename(filePath, path.extname(filePath));
            const format = path.extname(filePath).substring(1).toLowerCase();

            if (ImageCodec.hasImageFormat(format) && pathHelper.id !== 0) {
                const bitmap = this._sprites.getBitmap(pathHelper.id, transparentBackground);
                if (bitmap) {
                    const bytes = await ImageCodec.encode(bitmap, format, jpegQuality);
                    helper.addFile(bytes, name, format, filePath);
                }
            }
        }

        helper.on("progress", (event: ProgressEvent) => {
            this.sendCommand(new ProgressCommand(ProgressBarID.DEFAULT, event.loaded, event.total, label));
        });

        helper.on("complete", () => {
            this.sendCommand(new HideProgressBarCommand(ProgressBarID.DEFAULT));
        });

        helper.on("error", (error: Error) => {
            console.error(error);
            this.sendCommand(new HideProgressBarCommand(ProgressBarID.DEFAULT));
        });

        await helper.save();
    }

    private replaceSpritesCallback(list: SpriteData[]): void {
        if (!list) {
            throw new Error("list cannot be null");
        }

        if (!this._sprites) {
            throw new Error("Sprites storage must be initialized");
        }

        const length = list.length;
        if (length === 0) return;

        // Replace sprites
        const result = this._sprites.replaceSprites(list);
        if (!result.done) {
            console.error(result.message);
            return;
        }

        // Send changes
        const spriteIds: number[] = [];
        for (let i = 0; i < length; i++) {
            spriteIds.push(list[i].id);
        }

        this.setSelectedSpriteIds(spriteIds);
    }

    private replaceSpritesFromFilesCallback(files: PathHelper[]): void {
        if (!files) {
            throw new Error("files cannot be null");
        }

        if (files.length === 0) return;

        const loader = new SpriteDataLoader();
        loader.on("progress", (event: ProgressEvent) => {
            this.sendCommand(new ProgressCommand(event.id, event.loaded, event.total, Resources.getString("loading")));
        });

        loader.on("complete", () => {
            this.sendCommand(new HideProgressBarCommand(ProgressBarID.DEFAULT));
            this.replaceSpritesCallback(loader.spriteDataList);
        });

        loader.on("error", (error: Error) => {
            this.sendCommand(new HideProgressBarCommand(ProgressBarID.DEFAULT));
            const { Logger } = require("../utils/Logger");
            Logger.error("Error importing things", error, "ObjectBuilderWorker:importThingsCallback");
            console.error(error);
        });

        loader.loadFiles(files);
    }

    private removeSpritesCallback(list: number[]): void {
        if (!list) {
            throw new Error("list cannot be null");
        }

        if (!this._sprites) {
            throw new Error("Sprites storage must be initialized");
        }

        // Remove sprites
        const result = this._sprites.removeSprites(list);
        if (!result.done) {
            console.error(result.message);
            return;
        }

        // Send changes
        this.setSelectedSpriteIds(list);
    }

    private getSpriteListCallback(targetId: number): void {
        this.sendSpriteList([targetId]);
    }

    private findSpritesCallback(unusedSprites: boolean, emptySprites: boolean): void {
        if (!this._things || !this._sprites) {
            throw new Error("Things and sprites storage must be initialized");
        }

        const finder = new SpritesFinder(this._things, this._sprites);
        finder.on("progress", (event: ProgressEvent) => {
            this.sendCommand(new ProgressCommand(ProgressBarID.FIND, event.loaded, event.total));
        });

        finder.on("complete", () => {
            this.sendCommand(new FindResultCommand(FindResultCommand.SPRITES, finder.foundList));
        });

        finder.start(unusedSprites, emptySprites);
    }

    private optimizeSpritesCommand(): void {
        if (!this._things || !this._sprites) {
            throw new Error("Things and sprites storage must be initialized");
        }

        const optimizer = new SpritesOptimizer(this._things, this._sprites);
        optimizer.on("progress", (event: ProgressEvent) => {
            this.sendCommand(new ProgressCommand(ProgressBarID.OPTIMIZE, event.loaded, event.total, event.label || ""));
        });

        optimizer.on("complete", () => {
            if (optimizer.removedCount > 0) {
                this.sendClientInfo();
                this.sendSpriteList([0]);
                this.sendThingList([ThingTypeStorage.MIN_ITEM_ID], ThingCategory.ITEM);
            }

            this.sendCommand(new OptimizeSpritesResultCommand(optimizer.removedCount, optimizer.oldCount, optimizer.newCount));
        });

        optimizer.start();
    }

    private needToReloadCallback(extended: boolean, transparency: boolean, improvedAnimations: boolean, frameGroups: boolean): void {
        if (this._datFile && this._sprFile && this._version) {
            this.loadFilesCallback(
                this._datFile,
                this._sprFile,
                this._version,
                extended,
                transparency,
                improvedAnimations,
                frameGroups
            );
        }
    }

    //--------------------------------------
    // Helper Methods
    //--------------------------------------

    private sendThingData(id: number, category: string): void {
        if (!this._version) {
            return;
        }
        const thingData = this.getThingData(id, category, OBDVersions.OBD_VERSION_3, this._version.value);
        if (thingData) {
            this.sendCommand(new SetThingDataCommand(thingData));
        }
    }

    private sendThingList(selectedIds: number[], category: string): void {
        if (!this._things || !this._things.loaded) {
            throw new Error(Resources.getString("metadataNotLoaded"));
        }

        const first = this._things.getMinId(category);
        const last = this._things.getMaxId(category);
        const length = selectedIds.length;

        console.log(`[ObjectBuilderWorker] sendThingList: category=${category}, first=${first}, last=${last}, selectedIds=${selectedIds.join(',')}`);

        if (length > 1) {
            selectedIds.sort((a, b) => b - a); // DESCENDING
            if (selectedIds[length - 1] > last) {
                selectedIds = [last];
            }
        }

        const target = length === 0 ? 0 : selectedIds[0];
        const min = Math.max(first, ObUtils.hundredFloor(target));
        const diff = (category !== ThingCategory.ITEM && min === first) ? 1 : 0;
        const max = Math.min((min - diff) + (this._thingListAmount - 1), last);
        const list: ThingListItem[] = [];

        console.log(`[ObjectBuilderWorker] sendThingList: min=${min}, max=${max}, range=${max - min + 1}`);

        for (let i = min; i <= max; i++) {
            const thing = this._things.getThingType(i, category);
            if (!thing) {
                throw new Error(Resources.getString(
                    "thingNotFound",
                    Resources.getString(category),
                    i));
            }

            const listItem = new ThingListItem();
            listItem.thing = thing;
            listItem.frameGroup = thing.getFrameGroup(FrameGroupType.DEFAULT);
            listItem.pixels = this.getBitmapPixels(thing); // Returns ByteArray
            list.push(listItem);
        }

        console.log(`[ObjectBuilderWorker] sendThingList: sending ${list.length} items`);
        this.sendCommand(new SetThingListCommand(selectedIds, list));
    }

    private sendSpriteList(selectedIds: number[]): void {
        if (!selectedIds) {
            throw new Error("selectedIds cannot be null");
        }

        if (!this._sprites || !this._sprites.loaded) {
            throw new Error(Resources.getString("spritesNotLoaded"));
        }

        const length = selectedIds.length;
        if (length > 1) {
            selectedIds.sort((a, b) => b - a); // DESCENDING
            if (selectedIds[length - 1] > this._sprites.spritesCount) {
                selectedIds = [this._sprites.spritesCount];
            }
        }

        const target = length === 0 ? 0 : selectedIds[0];
        const first = 0;
        const last = this._sprites.spritesCount;
        const min = Math.max(first, ObUtils.hundredFloor(target));
        const max = Math.min(min + (this._spriteListAmount - 1), last);
        const list: SpriteData[] = [];

        for (let i = min; i <= max; i++) {
            const pixels = this._sprites.getPixels(i);
            if (!pixels) {
                throw new Error(Resources.getString("spriteNotFound", i));
            }

            const spriteData = new SpriteData();
            spriteData.id = i;
            spriteData.pixels = pixels; // Already a Buffer
            list.push(spriteData);
        }

        this.sendCommand(new SetSpriteListCommand(selectedIds, list));
    }

    private getThingData(id: number, category: string, obdVersion: number, clientVersion: number): ThingData | null {
        if (!ThingCategory.getCategory(category)) {
            throw new Error(Resources.getString("invalidCategory"));
        }

        if (!this._things || !this._sprites) {
            return null;
        }

        const thing = this._things.getThingType(id, category);
        if (!thing) {
            throw new Error(Resources.getString(
                "thingNotFound",
                Resources.getString(category),
                id));
        }

        const sprites = new Map<number, SpriteData[]>();
        for (let groupType = FrameGroupType.DEFAULT; groupType <= FrameGroupType.WALKING; groupType++) {
            const frameGroup = thing.getFrameGroup(groupType);
            if (!frameGroup) {
                continue;
            }

            sprites.set(groupType, []);

            const spriteIndex = frameGroup.spriteIndex;
            if (!spriteIndex) {
                continue;
            }

            const spriteIndexLength = spriteIndex.length;
            for (let i = 0; i < spriteIndexLength; i++) {
                const spriteId = spriteIndex[i];
                let pixels: Buffer | null = this._sprites.getPixels(spriteId);
                if (!pixels) {
                    const alertSprite = this._sprites.alertSprite;
                    if (alertSprite) {
                        const alertPixels = alertSprite.getPixels();
                        pixels = alertPixels instanceof Buffer ? alertPixels : alertPixels.toBuffer();
                    } else {
                        pixels = Buffer.alloc(SpriteExtent.DEFAULT_DATA_SIZE);
                    }
                }

                const spriteData = new SpriteData();
                spriteData.id = spriteId;
                spriteData.pixels = pixels;
                sprites.get(groupType)!.push(spriteData);
            }
        }

        return ThingData.create(obdVersion, clientVersion, thing, sprites);
    }

    private getBitmapPixels(thing: ThingType): ByteArray {
        const size = SpriteExtent.DEFAULT_SIZE;
        const frameGroup = thing.getFrameGroup(FrameGroupType.DEFAULT);
        if (!frameGroup) {
            return new ByteArray();
        }

        let width = frameGroup.width;
        let height = frameGroup.height;
        let layers = frameGroup.layers;
        const bitmap = new BitmapData(width * size, height * size, true, 0xFF636363);
        let x = 0;

        if (thing.category === ThingCategory.OUTFIT) {
            layers = 1;
            x = frameGroup.patternX > 1 ? 2 : 0;
        }

        if (!this._sprites) {
            return new ByteArray();
        }

        for (let l = 0; l < layers; l++) {
            for (let w = 0; w < width; w++) {
                for (let h = 0; h < height; h++) {
                    const index = frameGroup.getSpriteIndex(w, h, l, x, 0, 0, 0);
                    const px = (width - w - 1) * size;
                    const py = (height - h - 1) * size;
                    if (!frameGroup.spriteIndex) {
                        continue;
                    }
                    const spriteId = frameGroup.spriteIndex[index];
                    this._sprites.copyPixels(spriteId, bitmap, px, py);
                }
            }
        }

        const pixels = bitmap.getPixels(bitmap.rect);
        return ByteArray.fromBuffer(pixels);
    }

    private sendClientInfo(): void {
        const info = new ClientInfo();
        info.loaded = this.clientLoaded;

        if (info.loaded && this._things && this._sprites && this._version) {
            info.clientVersion = this._version.value;
            info.clientVersionStr = this._version.valueStr;
            info.datSignature = this._things.signature;
            info.minItemId = ThingTypeStorage.MIN_ITEM_ID;
            info.maxItemId = this._things.itemsCount;
            info.minOutfitId = ThingTypeStorage.MIN_OUTFIT_ID;
            info.maxOutfitId = this._things.outfitsCount;
            info.minEffectId = ThingTypeStorage.MIN_EFFECT_ID;
            info.maxEffectId = this._things.effectsCount;
            info.minMissileId = ThingTypeStorage.MIN_MISSILE_ID;
            info.maxMissileId = this._things.missilesCount;
            info.sprSignature = this._sprites.signature;
            info.minSpriteId = 0;
            info.maxSpriteId = this._sprites.spritesCount;
            info.extended = this._extended;
            info.transparency = this._transparency;
            info.improvedAnimations = this._improvedAnimations;
            info.frameGroups = this._frameGroups;
            info.changed = this.clientChanged;
            info.isTemporary = this.clientIsTemporary;
        }

        this.sendCommand(new SetClientInfoCommand(info));
    }

    private createStorage(): void {
        if (!this._settings) {
            throw new Error("Settings must be set before creating storage");
        }

        this._things = new ThingTypeStorage(this._settings);
        this._things.on(StorageEvent.LOAD, this.storageLoadHandler.bind(this));
        this._things.on(StorageEvent.CHANGE, this.storageChangeHandler.bind(this));
        this._things.on(ProgressEvent.PROGRESS, this.thingsProgressHandler.bind(this));
        this._things.on("error", this.thingsErrorHandler.bind(this));

        this._sprites = new SpriteStorage();
        this._sprites.on(StorageEvent.LOAD, this.storageLoadHandler.bind(this));
        this._sprites.on(StorageEvent.CHANGE, this.storageChangeHandler.bind(this));
        this._sprites.on(ProgressEvent.PROGRESS, this.spritesProgressHandler.bind(this));
        this._sprites.on("error", this.spritesErrorHandler.bind(this));
    }

    private clientLoadComplete(): void {
        console.log('[ObjectBuilderWorker] clientLoadComplete called');
        this.sendClientInfo();
        console.log('[ObjectBuilderWorker] Sending thing list...');
        this.sendThingList([ThingTypeStorage.MIN_ITEM_ID], ThingCategory.ITEM);
        this.sendThingData(ThingTypeStorage.MIN_ITEM_ID, ThingCategory.ITEM);
        this.sendSpriteList([0]);
        console.log('[ObjectBuilderWorker] clientLoadComplete finished');
    }

    private clientCompileComplete(): void {
        this._compiled = true;
        this.sendClientInfo();
    }

    //--------------------------------------
    // Event Handlers
    //--------------------------------------

    private storageLoadHandler(event: StorageEvent): void {
        console.log(`[ObjectBuilderWorker] storageLoadHandler: target=${event.target?.constructor?.name}, things.loaded=${this._things?.loaded}, sprites.loaded=${this._sprites?.loaded}, clientLoaded=${this.clientLoaded}`);
        if ((event.target === this._things || event.target === this._sprites) && this.clientLoaded) {
            console.log('[ObjectBuilderWorker] Both storages loaded, calling clientLoadComplete');
            this.clientLoadComplete();
        }
    }

    private storageChangeHandler(event: StorageEvent): void {
        this.sendClientInfo();
    }

    private thingsProgressHandler(event: ProgressEvent): void {
        this.sendCommand(new ProgressCommand(event.id, event.loaded, event.total, "Metadata"));
    }

    private thingsErrorHandler(error: Error): void {
        // TODO: Handle errors, potentially retry with extended mode
        const { Logger } = require("../utils/Logger");
        Logger.error("Things loading error", error, "ObjectBuilderWorker:thingsErrorHandler");
        console.error("Things error:", error);
    }

    private spritesProgressHandler(event: ProgressEvent): void {
        this.sendCommand(new ProgressCommand(event.id, event.loaded, event.total, "Sprites"));
    }

    private spritesErrorHandler(error: Error): void {
        // TODO: Handle sprite errors
        const { Logger } = require("../utils/Logger");
        Logger.error("Sprites loading error", error, "ObjectBuilderWorker:spritesErrorHandler");
        console.error("Sprites error:", error);
    }
}

