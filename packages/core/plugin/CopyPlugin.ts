/*
 * @Author: 秦少卫
 * @Date: 2023-06-20 12:38:37
 * @LastEditors: 秦少卫
 * @LastEditTime: 2024-06-07 11:25:05
 * @Description: 复制插件
 */

import { fabric } from 'fabric';
import { v4 as uuid } from 'uuid';
import { getImgStr } from '../utils/utils';
import { t } from '../utils/languages';
import type { IEditor, IPluginTempl } from '@kuaitu/core';

type IPlugin = Pick<CopyPlugin, 'clone'>;

declare module '@kuaitu/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

class CopyPlugin implements IPluginTempl {
  static pluginName = 'CopyPlugin';
  static apis = ['clone'];
  hotkeys: string[] = ['ctrl+v', 'ctrl+c'];
  private cache: null | fabric.ActiveSelection | fabric.Object = null;
  constructor(public canvas: fabric.Canvas, public editor: IEditor) {
    this.initPaste();
  }

  // Copy multiple selected objects
  _copyActiveSelection(activeObject: fabric.Object) {
    // Spacing settings
    const grid = 10;
    const canvas = this.canvas;
    const keys = this.editor.getExtensionKey();
    activeObject?.clone((cloned: fabric.Object) => {
      // Clone again to handle the selection of multiple objects
      cloned.clone((clonedObj: fabric.ActiveSelection) => {
        canvas.discardActiveObject();
        if (clonedObj.left === undefined || clonedObj.top === undefined) return;
        // Reassign the cloned canvas
        clonedObj.canvas = canvas;
        // Set location
        clonedObj.set({
          left: clonedObj.left + grid,
          top: clonedObj.top + grid,
          evented: true,
          id: uuid(),
        });
        clonedObj.forEachObject((obj: fabric.Object) => {
          obj.id = uuid();
          canvas.add(obj);
        });
        // Solve non-choice problems
        clonedObj.setCoords();
        canvas.setActiveObject(clonedObj);
        canvas.requestRenderAll();
      });
    }, keys);
  }

  // Single object copy
  _copyObject(activeObject: fabric.Object) {
    // Spacing settings
    const grid = 10;
    const canvas = this.canvas;
    const keys = this.editor.getExtensionKey();
    activeObject?.clone((cloned: fabric.Object) => {
      if (cloned.left === undefined || cloned.top === undefined) return;
      canvas.discardActiveObject();
      // Set location
      cloned.set({
        left: cloned.left + grid,
        top: cloned.top + grid,
        evented: true,
        id: uuid(),
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
    }, keys);
  }

  // Copy element
  clone(paramsActiveObeject?: fabric.ActiveSelection | fabric.Object) {
    const activeObject = paramsActiveObeject || this.canvas.getActiveObject();
    if (!activeObject) return;
    if (activeObject?.type === 'activeSelection') {
      this._copyActiveSelection(activeObject);
    } else {
      this._copyObject(activeObject);
    }
  }

  // Shortcut key extension recovery
  hotkeyEvent(eventName: string, e: KeyboardEvent) {
    if (eventName === 'ctrl+c' && e.type === 'keydown') {
      const activeObject = this.canvas.getActiveObject();
      this.cache = activeObject;
      // Clear shear plate
      navigator.clipboard.writeText('');
    }
    if (eventName === 'ctrl+v' && e.type === 'keydown') {
      // Ensure that the operation of the Clone element is later than Pastelistener
      setTimeout(() => {
        if (this.cache) {
          this.clone(this.cache);
        }
      }, 0);
    }
  }

  contextMenu() {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      return [{ text: t('copy'), hotkey: 'Ctrl+V', disabled: false, onclick: () => this.clone() }];
    }
  }

  destroy() {
    console.log('pluginDestroy');
    window.removeEventListener('paste', (e) => this.pasteListener(e));
  }

  initPaste() {
    window.addEventListener('paste', (e) => this.pasteListener(e));
  }

  async pasteListener(event: any) {
    const canvas = this.canvas;
    if (document.activeElement === document.body) {
      event.preventDefault(); // Prevent default paste behavior
    } else {
      return;
    }

    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    const fileAccept = '.pdf,.psd,.cdr,.ai,.svg,.jpg,.jpeg,.png,.webp,.json';
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        const curFileSuffix: string | undefined = file.name.split('.').pop();
        if (!fileAccept.split(',').includes(`.${curFileSuffix}`)) return;
        if (curFileSuffix === 'svg') {
          const svgFile = await getImgStr(file);
          if (!svgFile) throw new Error('file is undefined');
          fabric.loadSVGFromURL(svgFile as string, (objects, options) => {
            const item = fabric.util.groupSVGElements(objects, {
              ...options,
              name: 'defaultSVG',
              id: uuid(),
            });
            canvas.add(item).centerObject(item).renderAll();
          });
        }
        // if (curFileSuffix === 'json') {
        //   const dataText = await getImageText(file);
        //   const template = JSON.parse(dataText);
        //   addTemplate(template);
        // }
        if (item.type.indexOf('image/') === 0) {
          // This is a picture file
          const imageUrl = URL.createObjectURL(file);
          const imgEl = document.createElement('img');
          imgEl.src = imageUrl;
          // Insert page
          document.body.appendChild(imgEl);
          imgEl.onload = () => {
            // Create a picture object
            const imgInstance = new fabric.Image(imgEl, {
              id: uuid(),
              name: t('picture-1'),
              left: 100,
              top: 100,
            });
            // Set the zoom
            canvas.add(imgInstance);
            canvas.setActiveObject(imgInstance);
            canvas.renderAll();
            // Delete the picture elements in the page
            imgEl.remove();
          };
        }
      } else if (item.kind === 'string' && item.type.indexOf('text/plain') === 0) {
        // text data
        item.getAsString((text: any) => {
          // Insert to the text box
          const activeObject = canvas.getActiveObject() as fabric.Textbox;
          // If it is the activated text, insert the copy of the copy to the corresponding cursor location
          if (
            activeObject &&
            (activeObject.type === 'textbox' || activeObject.type === 'i-text') &&
            activeObject.text
          ) {
            const cursorPosition = activeObject.selectionStart;
            const textBeforeCursorPosition = activeObject.text.substring(0, cursorPosition);
            const textAfterCursorPosition = activeObject.text.substring(cursorPosition as number);

            // Update the text of the text object
            activeObject.set('text', textBeforeCursorPosition + text + textAfterCursorPosition);

            // Set the position of the cursor
            activeObject.selectionStart = cursorPosition + text.length;
            activeObject.selectionEnd = cursorPosition + text.length;

            // Re-rendering the updated text after the canvas
            activeObject.dirty = true;
            canvas.renderAll();
          } else {
            const fabricText = new fabric.IText(text, {
              left: 100,
              top: 100,
              fontSize: 80,
              id: uuid(),
            });
            canvas.add(fabricText);
            canvas.setActiveObject(fabricText);
          }
        });
      }
    }
    // When copying the elements outside the browser, the empty temporary canvas paste the element
    if (items.length) this.cache = null;
  }
}

export default CopyPlugin;
