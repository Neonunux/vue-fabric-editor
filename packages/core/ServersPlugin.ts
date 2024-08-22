/*
 * @Author: 秦少卫
 * @Date: 2023-06-20 12:52:09
 * @LastEditors: 秦少卫
 * @LastEditTime: 2024-07-25 17:40:14
 * @Description: 内部插件
 */
import { v4 as uuid } from 'uuid';
import { selectFiles, clipboardText, downFile } from './utils/utils';
import { fabric } from 'fabric';
import type { IEditor, IPluginTempl } from '@kuaitu/core';
import { SelectEvent, SelectMode } from './eventType';

type IPlugin = Pick<
  ServersPlugin,
  | 'insert'
  | 'loadJSON'
  | 'getJson'
  | 'dragAddItem'
  | 'clipboard'
  | 'clipboardBase64'
  | 'saveJson'
  | 'saveSvg'
  | 'saveImg'
  | 'clear'
  | 'preview'
  | 'getSelectMode'
  | 'getExtensionKey'
>;

declare module '@kuaitu/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

function transformText(objects: any) {
  if (!objects) return;
  objects.forEach((item: any) => {
    if (item.objects) {
      transformText(item.objects);
    } else {
      item.type === 'text' && (item.type = 'textbox');
    }
  });
}

class ServersPlugin implements IPluginTempl {
  public selectedMode: SelectMode;
  static pluginName = 'ServersPlugin';
  static apis = [
    'insert',
    'loadJSON',
    'getJson',
    'dragAddItem',
    'clipboard',
    'clipboardBase64',
    'saveJson',
    'saveSvg',
    'saveImg',
    'clear',
    'preview',
    'getSelectMode',
    'getExtensionKey',
  ];
  static events = [SelectMode.ONE, SelectMode.MULTI, SelectEvent.CANCEL];
  // public hotkeys: string[] = ['left', 'right', 'down', 'up'];
  constructor(public canvas: fabric.Canvas, public editor: IEditor) {
    this.selectedMode = SelectMode.EMPTY;
    this._initSelectEvent();
  }

  private _initSelectEvent() {
    this.canvas.on('selection:created', () => this._emitSelectEvent());
    this.canvas.on('selection:updated', () => this._emitSelectEvent());
    this.canvas.on('selection:cleared', () => this._emitSelectEvent());
  }

  private _emitSelectEvent() {
    if (!this.canvas) {
      throw TypeError('Not initialized yet');
    }

    const actives = this.canvas
      .getActiveObjects()
      .filter((item) => !(item instanceof fabric.GuideLine)); // Filter the auxiliary line
    if (actives && actives.length === 1) {
      this.selectedMode = SelectMode.ONE;
      this.editor.emit(SelectEvent.ONE, actives);
    } else if (actives && actives.length > 1) {
      this.selectedMode = SelectMode.MULTI;
      this.editor.emit(SelectEvent.MULTI, actives);
    } else {
      this.editor.emit(SelectEvent.CANCEL);
    }
  }

  getSelectMode() {
    return String(this.selectedMode);
  }

  insert(callback?: () => void) {
    selectFiles({ accept: '.json' }).then((files) => {
      if (files && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = () => {
          this.loadJSON(reader.result as string, callback);
        };
      }
    });
  }

  // Set the PATH property
  renderITextPath(textPaths: Record<'id' | 'path', any>[]) {
    textPaths.forEach((item) => {
      const object = this.canvas.getObjects().find((o) => o.id === item.id);
      if (object) {
        fabric.Path.fromObject(item.path, (e) => {
          object.set('path', e);
        });
      }
    });
  }

  async loadJSON(jsonFile: string | object, callback?: () => void) {
    // Make sure the element exists ID
    const temp = typeof jsonFile === 'string' ? JSON.parse(jsonFile) : jsonFile;
    const textPaths: Record<'id' | 'path', any>[] = [];
    temp.objects.forEach((item: any) => {
      !item.id && (item.id = uuid());
      // Collect all path text elements I-Text, and set PATH to NULL
      if (item.type === 'i-text' && item.path) {
        textPaths.push({ id: item.id, path: item.path });
        item.path = null;
      }
    });

    // Hooktransform traversing
    const tempTransform = await this._transform(temp);

    jsonFile = JSON.stringify(tempTransform);
    // Before loading
    this.editor.hooksEntity.hookImportBefore.callAsync(jsonFile, () => {
      this.canvas.loadFromJSON(jsonFile, () => {
        // Add the PATH corresponding to I-Text
        this.renderITextPath(textPaths);
        this.canvas.renderAll();
        // Hook after loading
        this.editor.hooksEntity.hookImportAfter.callAsync(jsonFile, () => {
          // Fixed the problem that the JSON with watermarks cannot be cleared #359
          this.editor?.updateDrawStatus &&
            typeof this.editor.updateDrawStatus === 'function' &&
            this.editor.updateDrawStatus(!!temp['overlayImage']);
          this.canvas.renderAll();
          callback && callback();
          this.editor.emit('loadJson');
        });
      });
    });
  }

  async _transform(json: any) {
    await this.promiseCallAsync(json);
    if (json.objects) {
      const all = json.objects.map((item: any) => {
        return this._transform(item);
      });
      await Promise.all(all);
    }
    return json;
  }

  promiseCallAsync(item: any) {
    return new Promise((resolve) => {
      this.editor.hooksEntity.hookTransform.callAsync(item, () => {
        resolve(item);
      });
    });
  }

  getJson() {
    const keys = this.getExtensionKey();
    return this.canvas.toJSON(keys);
  }

  getExtensionKey() {
    return [
      'id',
      'gradientAngle',
      'selectable',
      'hasControls',
      'linkData',
      'editable',
      'extensionType',
      'extension',
      'verticalAlign',
      'roundValue',
    ];
  }

  /**
   * @description: Drag and drag to the canvas
   * @param {Event} event
   * @param {Object} item
   */
  dragAddItem(item: fabric.Object, event?: DragEvent) {
    if (event) {
      const { left, top } = this.canvas.getSelectionElement().getBoundingClientRect();
      if (event.x < left || event.y < top || item.width === undefined) return;

      const point = {
        x: event.x - left,
        y: event.y - top,
      };
      const pointerVpt = this.canvas.restorePointerVpt(point);
      item.left = pointerVpt.x - item.width / 2;
      item.top = pointerVpt.y;
    }
    const { width } = this._getSaveOption();
    width && item.scaleToWidth(width / 2);
    this.canvas.add(item);
    this.canvas.setActiveObject(item);

    !event && this.editor.position('center');
    this.canvas.requestRenderAll();
  }

  clipboard() {
    const jsonStr = this.getJson();
    return clipboardText(JSON.stringify(jsonStr, null, '\t'));
  }

  async clipboardBase64() {
    const dataUrl = await this.preview();
    return clipboardText(dataUrl);
  }

  async saveJson() {
    const dataUrl = this.getJson();
    // Turn text text to textgroup, so that the import can be edited
    await transformText(dataUrl.objects);
    const fileStr = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataUrl, null, '\t')
    )}`;
    downFile(fileStr, 'json');
  }

  saveSvg() {
    this.editor.hooksEntity.hookSaveBefore.callAsync('', () => {
      const { fontOption, svgOption } = this._getSaveSvgOption();
      fabric.fontPaths = {
        ...fontOption,
      };
      const dataUrl = this.canvas.toSVG(svgOption);
      const fileStr = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(dataUrl)}`;
      this.editor.hooksEntity.hookSaveAfter.callAsync(fileStr, () => {
        downFile(fileStr, 'svg');
      });
    });
  }

  saveImg() {
    this.editor.hooksEntity.hookSaveBefore.callAsync('', () => {
      const option = this._getSaveOption();
      this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const dataUrl = this.canvas.toDataURL(option);
      this.editor.hooksEntity.hookSaveAfter.callAsync(dataUrl, () => {
        downFile(dataUrl, 'png');
      });
    });
  }

  preview() {
    return new Promise<string>((resolve) => {
      this.editor.hooksEntity.hookSaveBefore.callAsync('', () => {
        const option = this._getSaveOption();
        this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        this.canvas.renderAll();
        const dataUrl = this.canvas.toDataURL(option);
        this.editor.hooksEntity.hookSaveAfter.callAsync(dataUrl, () => {
          resolve(dataUrl);
        });
      });
    });
  }

  _getSaveSvgOption() {
    const workspace = this.canvas.getObjects().find((item) => item.id === 'workspace');
    let fontFamilyArry = this.canvas
      .getObjects()
      .filter((item) => item.type == 'textbox')
      .map((item) => item.fontFamily);
    fontFamilyArry = Array.from(new Set(fontFamilyArry));

    const fontList = this.editor.getPlugin('FontPlugin').cacheList;

    const fontEntry = {};
    for (const font of fontFamilyArry) {
      const item = fontList.find((item) => item.name === font);
      fontEntry[font] = item.file;
    }

    console.log('_getSaveSvgOption', fontEntry);
    const { left, top, width, height } = workspace as fabric.Object;
    return {
      fontOption: fontEntry,
      svgOption: {
        width,
        height,
        viewBox: {
          x: left,
          y: top,
          width,
          height,
        },
      },
    };
  }

  _getSaveOption() {
    const workspace = this.canvas
      .getObjects()
      .find((item: fabric.Object) => item.id === 'workspace');
    console.log('getObjects', this.canvas.getObjects());
    const { left, top, width, height } = workspace as fabric.Object;
    const option = {
      name: 'New Image',
      format: 'png',
      quality: 1,
      width,
      height,
      left,
      top,
    };
    return option;
  }

  clear() {
    this.canvas.getObjects().forEach((obj) => {
      if (obj.id !== 'workspace') {
        this.canvas.remove(obj);
      }
    });
    this.editor?.setWorkspaceBg('#fff');
    this.canvas.discardActiveObject();
    this.canvas.renderAll();
  }

  destroy() {
    console.log('plugin destroyed');
  }
}

export default ServersPlugin;
