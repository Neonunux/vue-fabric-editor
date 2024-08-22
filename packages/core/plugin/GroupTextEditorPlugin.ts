/*
 * @Author: 秦少卫
 * @Date: 2023-06-22 16:11:40
 * @LastEditors: 秦少卫
 * @LastEditTime: 2024-07-25 16:49:18
 * @Description: 组内文字编辑
 */

import { fabric } from 'fabric';
import { isGroup } from '../utils/utils';
import { v4 as uuid } from 'uuid';
import { pick } from 'lodash-es';
import type { IEditor, IPluginTempl } from '@kuaitu/core';

class GroupTextEditorPlugin implements IPluginTempl {
  static pluginName = 'GroupTextEditorPlugin';
  isDown = false;
  constructor(public canvas: fabric.Canvas, public editor: IEditor) {
    this._init();
  }

  // Text input in the group
  _init() {
    this.canvas.on('mouse:down', (opt) => {
      this.isDown = true;
      // Reset selected Controls
      if (
        opt.target &&
        !opt.target.lockMovementX &&
        !opt.target.lockMovementY &&
        !opt.target.lockRotation &&
        !opt.target.lockScalingX &&
        !opt.target.lockScalingY
      ) {
        opt.target.hasControls = true;
      }
    });

    this.canvas.on('mouse:up', () => {
      this.isDown = false;
    });

    this.canvas.on('mouse:dblclick', (opt) => {
      if (isGroup(opt.target)) {
        const selectedObject = this._getGroupObj(opt) as fabric.IText;
        if (!selectedObject) return;
        selectedObject.selectable = true;
        // Due to the elements in the group, after double -clicking, it will cause Controls to offset, so it hides him
        if (selectedObject.hasControls) {
          selectedObject.hasControls = false;
        }
        if (this.isText(selectedObject)) {
          this._bedingTextEditingEvent(selectedObject, opt.target);
          return;
        }
        this.canvas.setActiveObject(selectedObject);
        this.canvas.renderAll();
      }
    });
  }

  // Get the text element in the group in the area
  _getGroupTextObj(opt: fabric.IEvent<MouseEvent>) {
    const pointer = this.canvas.getPointer(opt.e, true);
    if (!isGroup(opt.target)) return false;
    const clickObj = this.canvas._searchPossibleTargets(opt.target._objects, pointer);
    if (clickObj && this.isText(clickObj)) {
      return clickObj;
    }
    return false;
  }

  _getGroupObj(opt: fabric.IEvent<MouseEvent>) {
    const pointer = this.canvas.getPointer(opt.e, true);
    if (!isGroup(opt.target)) return false;
    const clickObj = this.canvas._searchPossibleTargets(opt.target._objects, pointer);
    return clickObj;
  }

  // 通过组合重新组装来编辑文字，可能会耗性能。
  _bedingTextEditingEvent(textObject: fabric.IText, groupObj: fabric.Group) {
    const textObjectJSON = textObject.toObject();

    const groupMatrix: number[] = groupObj.calcTransformMatrix();

    const a: number = groupMatrix[0];
    const b: number = groupMatrix[1];
    const c: number = groupMatrix[2];
    const d: number = groupMatrix[3];
    const e: number = groupMatrix[4];
    const f: number = groupMatrix[5];

    const newX = a * (textObject.left ?? 0) + c * (textObject.top ?? 0) + e;
    const newY = b * (textObject.left ?? 0) + d * (textObject.top ?? 0) + f;

    const tempText = new (textObject.constructor as typeof fabric.IText)(textObject.text ?? '', {
      ...textObjectJSON,
      scaleX: textObjectJSON.scaleX * a,
      scaleY: textObjectJSON.scaleY * a,
      textAlign: textObject.textAlign,
      left: newX,
      top: newY,
      styles: textObject.styles,
      groupCopyed: textObject.group,
    });
    tempText.id = uuid();
    textObject.visible = false;
    groupObj.addWithUpdate();
    tempText.visible = true;
    tempText.selectable = true;
    tempText.hasControls = false;
    tempText.editable = true;
    this.canvas.add(tempText);
    this.canvas.setActiveObject(tempText);
    tempText.enterEditing();
    tempText.selectAll();

    tempText.on('editing:exited', () => {
      const attrs = tempText.toObject();

      // Triggered when entering the editor mode
      textObject.set({
        ...pick(attrs, [
          'fill',
          'fontSize',
          'fontStyle',
          'fontFamily',
          'lineHeight',
          'backgroundColor',
        ]),
        text: tempText.text,
        visible: true,
      });
      groupObj.addWithUpdate();
      tempText.visible = false;
      this.canvas.remove(tempText);
      this.canvas.setActiveObject(groupObj);
    });
  }

  // Binding editor cancel incident
  _bedingEditingEvent(textObject: fabric.IText, opt: fabric.IEvent<MouseEvent>) {
    if (!opt.target) return;
    const left = opt.target.left;
    const top = opt.target.top;
    const ids = this._unGroup() || [];

    const resetGroup = () => {
      const groupArr = this.canvas.getObjects().filter((item) => item.id && ids.includes(item.id));
      // Delete element
      groupArr.forEach((item) => this.canvas.remove(item));

      // New group
      const group = new fabric.Group([...groupArr]);
      group.set('left', left);
      group.set('top', top);
      group.set('id', uuid());
      textObject.off('editing:exited', resetGroup);
      this.canvas.add(group);
      this.canvas.discardActiveObject().renderAll();
    };
    // Binding cancellation incident
    textObject.on('editing:exited', resetGroup);
  }

  // Split combination and return ID
  _unGroup() {
    const ids: string[] = [];
    const activeObj = this.canvas.getActiveObject() as fabric.Group;
    if (!activeObj) return;
    activeObj.getObjects().forEach((item) => {
      const id = uuid();
      ids.push(id);
      item.set('id', id);
    });
    activeObj.toActiveSelection();
    return ids;
  }

  isText(obj: fabric.Object) {
    return obj.type && ['i-text', 'text', 'textbox'].includes(obj.type);
  }

  destroy() {
    console.log('pluginDestroy');
  }
}

export default GroupTextEditorPlugin;
