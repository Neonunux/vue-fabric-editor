/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * @Author: 秦少卫
 * @Date: 2023-06-20 13:06:31
 * @LastEditors: 秦少卫
 * @LastEditTime: 2024-07-12 21:35:16
 * @Description: 历史记录插件
 */
import { fabric } from 'fabric';
import '../utils/fabric-history.js';
import type { IEditor, IPluginTempl } from '@kuaitu/core';
import { t } from '../utils/languages';

type IPlugin = Pick<HistoryPlugin, 'undo' | 'redo' | 'historyUpdate'>;

declare module '@kuaitu/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

type extendCanvas = {
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  historyUndo: any[];
  historyRedo: any[];
};

class HistoryPlugin implements IPluginTempl {
  static pluginName = 'HistoryPlugin';
  static apis = ['undo', 'redo', 'historyUpdate'];
  static events = [];
  hotkeys: string[] = ['ctrl+z', 'ctrl+shift+z', '⌘+z', '⌘+shift+z'];
  constructor(public canvas: fabric.Canvas & extendCanvas, public editor: IEditor) {
    fabric.Canvas.prototype._historyNext = () => {
      return this.editor.getJson();
    };
    this._init();
  }

  _init() {
    this.canvas.on('history:append', () => {
      this.historyUpdate();
    });
    window.addEventListener('beforeunload', (e) => {
      if (this.canvas.historyUndo.length > 0) {
        (e || window.event).returnValue = t('confirm-to-leave');
      }
    });
  }

  historyUpdate() {
    const { historyUndo, historyRedo } = this.canvas;
    this.editor.emit('historyUpdate', historyUndo.length, historyRedo.length);
  }

  // After importing the template, clean up the history cache
  hookImportAfter() {
    this.canvas.clearHistory(true);
    this.historyUpdate();
    return Promise.resolve();
  }

  undo() {
    // if (this.canvas.historyUndo.length === 1) {
    //   // this.canvas.clearUndo();
    //   // this.editor.clear();
    // }
    this.canvas.undo();
    this.historyUpdate();
  }

  redo() {
    this.canvas.redo();
    this.historyUpdate();
  }

  // Shortcut key extension recovery
  hotkeyEvent(eventName: string, e: KeyboardEvent) {
    if (e.type === 'keydown') {
      switch (eventName) {
        case 'ctrl+z':
        case '⌘+z':
          this.undo();
          break;
        case 'ctrl+shift+z':
        case '⌘+shift+z':
          this.redo();
          break;
      }
    }
  }
}

export default HistoryPlugin;
