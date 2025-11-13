/**
 * CommandFactory - Creates command objects for sending to backend
 * This bridges the gap between UI and backend command classes
 */

export interface CommandData {
  type: string;
  [key: string]: any;
}

export class CommandFactory {
  static createLoadFilesCommand(datFile: string, sprFile: string, version: any, extended: boolean, transparency: boolean, improvedAnimations: boolean, frameGroups: boolean): CommandData {
    return {
      type: 'LoadFilesCommand',
      datFile,
      sprFile,
      version,
      extended,
      transparency,
      improvedAnimations,
      frameGroups,
    };
  }

  static createCreateNewFilesCommand(datSignature: number, sprSignature: number, extended: boolean, transparency: boolean, improvedAnimations: boolean, frameGroups: boolean): CommandData {
    return {
      type: 'CreateNewFilesCommand',
      datSignature,
      sprSignature,
      extended,
      transparency,
      improvedAnimations,
      frameGroups,
    };
  }

  static createCompileCommand(): CommandData {
    return {
      type: 'CompileCommand',
    };
  }

  static createGetThingListCommand(targetId: number, category: string): CommandData {
    return {
      type: 'GetThingListCommand',
      targetId,
      category,
    };
  }

  static createGetThingCommand(id: number, category: string): CommandData {
    return {
      type: 'GetThingCommand',
      id,
      category,
    };
  }

  static createGetSpriteListCommand(targetId: number): CommandData {
    return {
      type: 'GetSpriteListCommand',
      targetId,
    };
  }

  static createUpdateThingCommand(id: number, category: string, thingData: any): CommandData {
    return {
      type: 'UpdateThingCommand',
      id,
      category,
      thingData,
    };
  }

  static createFindThingCommand(category: string, properties: any[]): CommandData {
    return {
      type: 'FindThingCommand',
      category,
      properties,
    };
  }

  static createImportThingsFromFilesCommand(filePaths: string[]): CommandData {
    return {
      type: 'ImportThingsFromFilesCommand',
      list: filePaths.map(path => ({ path })), // PathHelper-like structure
    };
  }

  static createImportSpritesFromFilesCommand(filePaths: string[]): CommandData {
    return {
      type: 'ImportSpritesFromFileCommand',
      list: filePaths.map(path => ({ path })), // PathHelper-like structure
    };
  }

  static createExportThingCommand(
    selectedIds: number[],
    outputPath: string,
    obdVersion?: number,
    spriteSheetFlag?: number
  ): CommandData {
    return {
      type: 'ExportThingCommand',
      list: selectedIds.map(id => ({ id, path: outputPath })), // PathHelper-like structure
      category: 'item', // Default, should be configurable
      obdVersion: obdVersion || 2,
      clientVersion: null, // Will be determined by backend
      spriteSheetFlag: spriteSheetFlag || 0,
      transparentBackground: true,
      jpegQuality: 80,
    };
  }

  static createExportSpritesCommand(
    selectedIds: number[],
    outputPath: string,
    format: string,
    transparentBackground: boolean,
    jpegQuality: number
  ): CommandData {
    return {
      type: 'ExportSpritesCommand',
      list: selectedIds.map(id => ({ id, path: outputPath })), // PathHelper-like structure
      format,
      transparentBackground,
      jpegQuality,
    };
  }

  static createMergeFilesCommand(
    datFile: string,
    sprFile: string,
    version: any,
    extended: boolean,
    transparency: boolean,
    improvedAnimations: boolean,
    frameGroups: boolean
  ): CommandData {
    return {
      type: 'MergeFilesCommand',
      datFile,
      sprFile,
      version,
      extended,
      transparency,
      improvedAnimations,
      frameGroups,
    };
  }

  static createSettingsCommand(settings: any): CommandData {
    return {
      type: 'SettingsCommand',
      settings,
    };
  }
}

