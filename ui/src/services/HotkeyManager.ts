import { Hotkey } from './Hotkey';
import { HotkeyDefinition } from './HotkeyDefinition';

export interface HotkeyManagerEvent {
  type: 'hotkey_changed';
  actionId: string;
  hotkey: Hotkey | null;
}

type EventListener = (event: HotkeyManagerEvent) => void;

/**
 * Simple EventEmitter for browser compatibility
 */
class SimpleEventEmitter {
  private listeners: Map<string, Set<EventListener>> = new Map();

  on(event: string, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: EventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  emit(event: string, data: HotkeyManagerEvent): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

/**
 * HotkeyManager manages keyboard shortcuts
 */
export class HotkeyManager extends SimpleEventEmitter {
  private _definitions: HotkeyDefinition[] = [];
  private _definitionsById: Map<string, HotkeyDefinition> = new Map();
  private _definitionsBySignature: Map<string, HotkeyDefinition> = new Map();
  private _handlers: Map<string, Set<() => void>> = new Map();

  /**
   * Register a hotkey action
   */
  registerAction(id: string, label: string, category: string, defaultHotkey: Hotkey | null = null): void {
    if (!id || this._definitionsById.has(id)) return;

    const definition = new HotkeyDefinition(id, label, category, defaultHotkey);
    this._definitions.push(definition);
    this._definitionsById.set(id, definition);

    if (definition.hotkey) {
      this._definitionsBySignature.set(definition.hotkey.signature, definition);
    }
  }

  /**
   * Add a handler for a hotkey action
   */
  addHandler(actionId: string, handler: () => void): void {
    if (!actionId || !handler) return;

    let handlers = this._handlers.get(actionId);
    if (!handlers) {
      handlers = new Set();
      this._handlers.set(actionId, handlers);
    }
    handlers.add(handler);
  }

  /**
   * Remove a handler for a hotkey action
   */
  removeHandler(actionId: string, handler: () => void): void {
    const handlers = this._handlers.get(actionId);
    if (!handlers) return;
    handlers.delete(handler);
  }

  /**
   * Get all definitions
   */
  get definitions(): HotkeyDefinition[] {
    return [...this._definitions];
  }

  /**
   * Get hotkey for an action
   */
  getHotkey(actionId: string): Hotkey | null {
    const definition = this._definitionsById.get(actionId);
    return definition && definition.hotkey ? definition.hotkey.clone() : null;
  }

  /**
   * Load hotkeys from settings
   */
  load(settings: { hotkeysConfig?: string | null }): void {
    this.resetToDefaults(false);

    if (!settings || !settings.hotkeysConfig) {
      this.dispatchAllChanged();
      return;
    }

    let data: any;
    try {
      data = JSON.parse(settings.hotkeysConfig);
    } catch (error) {
      data = null;
    }

    if (data) {
      for (const key in data) {
        const value = data[key];
        const definition = this._definitionsById.get(key);
        if (!definition) continue;

        if (value === '') {
          this.assignHotkey(definition, null, false);
        } else if (typeof value === 'string') {
          const hotkey = Hotkey.fromConfigString(value);
          if (hotkey) {
            this.assignHotkey(definition, hotkey, false);
          }
        }
      }
    }

    this.dispatchAllChanged();
  }

  /**
   * Persist hotkeys to settings
   */
  persist(settings: { hotkeysConfig?: string | null }): void {
    if (!settings) return;

    const data: { [key: string]: string } = {};
    for (const definition of this._definitions) {
      if (definition.hotkey) {
        data[definition.id] = definition.hotkey.toConfigString();
      } else if (definition.defaultHotkey) {
        data[definition.id] = '';
      }
    }

    try {
      settings.hotkeysConfig = JSON.stringify(data);
    } catch (error) {
      settings.hotkeysConfig = null;
    }
  }

  /**
   * Update hotkey for an action
   */
  updateHotkey(actionId: string, hotkey: Hotkey | null): void {
    const definition = this._definitionsById.get(actionId);
    if (!definition) return;
    this.assignHotkey(definition, hotkey, true);
  }

  /**
   * Reset hotkey to default
   */
  resetHotkey(actionId: string): void {
    const definition = this._definitionsById.get(actionId);
    if (!definition) return;
    this.assignHotkey(definition, definition.defaultHotkey ? definition.defaultHotkey.clone() : null, true);
  }

  /**
   * Handle keyboard event
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    // Ignore if typing in input fields
    const target = event.target as HTMLElement;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.getAttribute('contenteditable') === 'true')
    ) {
      return false;
    }

    const hotkey = Hotkey.fromKeyboardEvent(event);
    if (!hotkey) return false;

    const definition = this._definitionsBySignature.get(hotkey.signature);
    if (!definition) return false;

    event.preventDefault();
    event.stopPropagation();

    this.trigger(definition.id);
    return true;
  }

  /**
   * Reset all to defaults
   */
  private resetToDefaults(dispatch: boolean): void {
    this._definitionsBySignature.clear();

    for (const definition of this._definitions) {
      const defaultHotkey = definition.defaultHotkey ? definition.defaultHotkey.clone() : null;
      definition.hotkey = defaultHotkey;

      if (defaultHotkey) {
        this._definitionsBySignature.set(defaultHotkey.signature, definition);
      }

      if (dispatch) {
        this.dispatchHotkeyChanged(definition);
      }
    }
  }

  /**
   * Dispatch all changed events
   */
  private dispatchAllChanged(): void {
    for (const definition of this._definitions) {
      this.dispatchHotkeyChanged(definition);
    }
  }

  /**
   * Dispatch hotkey changed event
   */
  private dispatchHotkeyChanged(definition: HotkeyDefinition): void {
    const event: HotkeyManagerEvent = {
      type: 'hotkey_changed',
      actionId: definition.id,
      hotkey: definition.hotkey ? definition.hotkey.clone() : null,
    };
    this.emit('hotkey_changed', event);
  }

  /**
   * Assign hotkey to definition
   */
  private assignHotkey(definition: HotkeyDefinition, hotkey: Hotkey | null, dispatch: boolean): void {
    if (hotkey && hotkey.isEmpty) {
      hotkey = null;
    }

    if (definition.hotkey && hotkey && definition.hotkey.equals(hotkey)) {
      return;
    }

    if (definition.hotkey) {
      this._definitionsBySignature.delete(definition.hotkey.signature);
    }

    if (hotkey) {
      const signature = hotkey.signature;
      const existing = this._definitionsBySignature.get(signature);
      if (existing && existing !== definition) {
        existing.hotkey = null;
        this._definitionsBySignature.delete(signature);
        if (dispatch) {
          this.dispatchHotkeyChanged(existing);
        }
      }

      definition.hotkey = hotkey.clone();
      this._definitionsBySignature.set(signature, definition);
    } else {
      definition.hotkey = null;
    }

    if (dispatch) {
      this.dispatchHotkeyChanged(definition);
    }
  }

  /**
   * Trigger action handlers
   */
  private trigger(actionId: string): void {
    const handlers = this._handlers.get(actionId);
    if (!handlers) return;

    for (const handler of handlers) {
      if (handler) {
        try {
          handler();
        } catch (error) {
          console.error(`Error executing hotkey handler for ${actionId}:`, error);
        }
      }
    }
  }
}

// Singleton instance
let hotkeyManagerInstance: HotkeyManager | null = null;

export function getHotkeyManager(): HotkeyManager {
  if (!hotkeyManagerInstance) {
    hotkeyManagerInstance = new HotkeyManager();
  }
  return hotkeyManagerInstance;
}

