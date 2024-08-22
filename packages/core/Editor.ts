import EventEmitter from 'events';
import hotkeys from 'hotkeys-js';
import ContextMenu from './ContextMenu.js';
import ServersPlugin from './ServersPlugin';
import { AsyncSeriesHook } from 'tapable';
import type {
  IPluginMenu,
  IPluginClass,
  IPluginOption,
  IEditorHooksType,
  IPluginTempl,
} from '@kuaitu/core';

import Utils from './utils/utils';

class Editor extends EventEmitter {
  private canvas: fabric.Canvas | null = null;
  contextMenu: ContextMenu | null = null;
  [key: string]: any;
  private pluginMap: {
    [propName: string]: IPluginTempl;
  } = {};
  // Custom event
  private customEvents: string[] = [];
  // Custom API
  private customApis: string[] = [];
  // Life cycle function name
  private hooks: IEditorHooksType[] = [
    'hookImportBefore',
    'hookImportAfter',
    'hookSaveBefore',
    'hookSaveAfter',
    'hookTransform',
  ];
  public hooksEntity: {
    [propName: string]: AsyncSeriesHook<any, any>;
  } = {};

  init(canvas: fabric.Canvas) {
    this.canvas = canvas;
    this._initContextMenu();
    this._bindContextMenu();
    this._initActionHooks();
    this._initServersPlugin();

    this.Utils = Utils;
  }

  get fabricCanvas() {
    return this.canvas;
  }

  // Introduce component
  use(plugin: IPluginTempl, options?: IPluginOption) {
    if (this._checkPlugin(plugin) && this.canvas) {
      this._saveCustomAttr(plugin);
      const pluginRunTime = new (plugin as IPluginClass)(this.canvas, this, options || {});
      // Add plug-in name
      pluginRunTime.pluginName = plugin.pluginName;
      this.pluginMap[plugin.pluginName] = pluginRunTime;
      this._bindingHooks(pluginRunTime);
      this._bindingHotkeys(pluginRunTime);
      this._bindingApis(pluginRunTime);
    }
  }

  destroy() {
    this.canvas = null;
    this.contextMenu = null;
    this.pluginMap = {};
    this.customEvents = [];
    this.customApis = [];
    this.hooksEntity = {};
  }
  // Obtain a plug-in
  getPlugin(name: string) {
    if (this.pluginMap[name]) {
      return this.pluginMap[name];
    }
  }

  // Inspection component
  private _checkPlugin(plugin: IPluginTempl) {
    const { pluginName, events = [], apis = [] } = plugin;
    // Name inspection
    if (this.pluginMap[pluginName]) {
      throw new Error(pluginName + 'Plug-in repeated initialization');
    }
    events.forEach((eventName: string) => {
      if (this.customEvents.find((info) => info === eventName)) {
        throw new Error(pluginName + 'Plug-in' + eventName + 'repeat');
      }
    });

    apis.forEach((apiName: string) => {
      if (this.customApis.find((info) => info === apiName)) {
        throw new Error(pluginName + 'Plug-in' + apiName + 'repeat');
      }
    });
    return true;
  }

  // Method for binding hooks
  private _bindingHooks(plugin: IPluginTempl) {
    this.hooks.forEach((hookName) => {
      const hook = plugin[hookName];
      if (hook) {
        this.hooksEntity[hookName].tapPromise(plugin.pluginName + hookName, function () {
          // console.log(hookName, ...arguments);
          // eslint-disable-next-line prefer-rest-params
          const result = hook.apply(plugin, [...arguments]);
          // HOOK is compatible with non -Promise return value
          return (result as any) instanceof Promise ? result : Promise.resolve(result);
        });
      }
    });
  }

  // Binding shortcut keys
  private _bindingHotkeys(plugin: IPluginTempl) {
    plugin?.hotkeys?.forEach((keyName: string) => {
      // support keyup
      hotkeys(keyName, { keyup: true }, (e) => {
        plugin.hotkeyEvent && plugin.hotkeyEvent(keyName, e);
      });
    });
  }

  // Save the component custom event and API
  private _saveCustomAttr(plugin: IPluginTempl) {
    const { events = [], apis = [] } = plugin;
    this.customApis = this.customApis.concat(apis);
    this.customEvents = this.customEvents.concat(events);
  }
  // Agent API event
  private _bindingApis(pluginRunTime: IPluginTempl) {
    const { apis = [] } = (pluginRunTime.constructor as any) || {};
    apis.forEach((apiName: string) => {
      this[apiName] = function () {
        // eslint-disable-next-line prefer-rest-params
        return pluginRunTime[apiName].apply(pluginRunTime, [...arguments]);
      };
    });
  }

  // Right-click menu
  private _bindContextMenu() {
    this.canvas &&
      this.canvas.on('mouse:down', (opt) => {
        if (opt.button === 3) {
          let menu: IPluginMenu[] = [];
          Object.keys(this.pluginMap).forEach((pluginName) => {
            const pluginRunTime = this.pluginMap[pluginName];
            const pluginMenu = pluginRunTime.contextMenu && pluginRunTime.contextMenu();
            if (pluginMenu) {
              menu = menu.concat(pluginMenu);
            }
          });
          this._renderMenu(opt, menu);
        }
      });
  }

  // Right-click menu
  private _renderMenu(opt: { e: MouseEvent }, menu: IPluginMenu[]) {
    if (menu.length !== 0 && this.contextMenu) {
      this.contextMenu.hideAll();
      this.contextMenu.setData(menu);
      this.contextMenu.show(opt.e.clientX, opt.e.clientY);
    }
  }

  // Life cycle event
  _initActionHooks() {
    this.hooks.forEach((hookName) => {
      this.hooksEntity[hookName] = new AsyncSeriesHook(['data']);
    });
  }

  _initContextMenu() {
    this.contextMenu = new ContextMenu(this.canvas!.wrapperEl, []);
    this.contextMenu.install();
  }

  _initServersPlugin() {
    this.use(ServersPlugin);
  }

  // Uninstall the error when solving the Listener to UNDEFINED
  off(eventName: string, listener: any): this {
    // noinspection TypeScriptValidateTypes
    return listener ? super.off(eventName, listener) : this;
  }
}

export default Editor;
/*
const HooksManager = require('./hooksManager');

describe('HooksManager', () => {
  let hooksManager;
  let mockPlugin;

  beforeEach(() => {
    hooksManager = new HooksManager();

    mockPlugin = {
      pluginName: 'testPlugin',
      hook1: jest.fn((arg) => arg),
      hook2: jest.fn((arg) => Promise.resolve(arg)),
    };
  });

  test('should bind sync hook correctly', async () => {
    hooksManager._bindingHooks(mockPlugin);

    // Trigger the hook to test if it was bound correctly
    const result = await hooksManager.hooksEntity.hook1.promise('testArg');

    expect(mockPlugin.hook1).toHaveBeenCalledWith('testArg');
    expect(result).toBe('testArg');
  });

  test('should bind async hook correctly', async () => {
    hooksManager._bindingHooks(mockPlugin);

    // Trigger the hook to test if it was bound correctly
    const result = await hooksManager.hooksEntity.hook2.promise('testArg');

    expect(mockPlugin.hook2).toHaveBeenCalledWith('testArg');
    expect(result).toBe('testArg');
  });

  test('should handle non-existent hooks gracefully', () => {
    delete mockPlugin.hook1;

    hooksManager._bindingHooks(mockPlugin);

    // Trigger the hook to test if it was bound correctly
    expect(hooksManager.hooksEntity.hook1.taps.length).toBe(0);
  });
});
*/
