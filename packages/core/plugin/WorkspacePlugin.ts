/*
 * @Author: 秦少卫
 * @Date: 2023-06-27 12:26:41
 * @LastEditors: 秦少卫
 * @LastEditTime: 2024-07-22 10:30:53
 * @Description: 画布区域插件
 */

import { fabric } from 'fabric';
import { throttle } from 'lodash-es';
import type { IEditor, IPluginTempl } from '@kuaitu/core';

type IPlugin = Pick<
  WorkspacePlugin,
  | 'big'
  | 'small'
  | 'auto'
  | 'one'
  | 'setSize'
  | 'getWorkspace'
  | 'setWorkspaceBg'
  | 'setCenterFromObject'
>;

declare module '@kuaitu/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

class WorkspacePlugin implements IPluginTempl {
  static pluginName = 'WorkspacePlugin';
  static events = ['sizeChange'];
  static apis = [
    'big',
    'small',
    'auto',
    'one',
    'setSize',
    'getWorkspace',
    'setWorkspaceBg',
    'setCenterFromObject',
  ];
  workspaceEl!: HTMLElement;
  workspace: null | fabric.Rect;
  resizeObserver!: ResizeObserver;
  option: any;
  zoomRatio: number;
  constructor(public canvas: fabric.Canvas, public editor: IEditor) {
    this.workspace = null;
    this.init({
      width: 900,
      height: 2000,
    });
    this.zoomRatio = 0.85;
  }

  init(option: { width: number; height: number }) {
    const workspaceEl = document.querySelector('#workspace') as HTMLElement;
    if (!workspaceEl) {
      throw new Error('element #workspace is missing, plz check!');
    }
    this.workspaceEl = workspaceEl;
    this.workspace = null;
    this.option = option;
    this._initBackground();
    this._initWorkspace();
    this._initResizeObserve();
    this._bindWheel();
  }

  hookImportAfter() {
    return new Promise((resolve) => {
      const workspace = this.canvas.getObjects().find((item) => item.id === 'workspace');
      if (workspace) {
        workspace.set('selectable', false);
        workspace.set('hasControls', false);
        workspace.set('evented', false);
        if (workspace.width && workspace.height) {
          this.setSize(workspace.width, workspace.height);
          this.editor.emit('sizeChange', workspace.width, workspace.height);
        }
      }
      resolve('');
    });
  }

  hookSaveAfter() {
    return new Promise((resolve) => {
      this.auto();
      resolve(true);
    });
  }

  // Initialize background
  _initBackground() {
    this.canvas.backgroundImage = '';
    this.canvas.setWidth(this.workspaceEl.offsetWidth);
    this.canvas.setHeight(this.workspaceEl.offsetHeight);
  }

  // Initialize canvas
  _initWorkspace() {
    const { width, height } = this.option;
    const workspace = new fabric.Rect({
      fill: 'rgba(255,255,255,1)',
      width,
      height,
      id: 'workspace',
      strokeWidth: 0,
    });
    workspace.set('selectable', false);
    workspace.set('hasControls', false);
    workspace.hoverCursor = 'default';
    this.canvas.add(workspace);
    this.canvas.renderAll();

    this.workspace = workspace;
    if (this.canvas.clearHistory) {
      this.canvas.clearHistory();
    }
    this.auto();
  }

  // Return workspace object
  getWorkspace() {
    return this.canvas.getObjects().find((item) => item.id === 'workspace') as fabric.Rect;
  }

  /**
   * Set the center of the canvas to the center point of the specified object
   * @param {Object} obj specified object
   */
  setCenterFromObject(obj: fabric.Rect) {
    const { canvas } = this;
    const objCenter = obj.getCenterPoint();
    const viewportTransform = canvas.viewportTransform;
    if (canvas.width === undefined || canvas.height === undefined || !viewportTransform) return;
    viewportTransform[4] = canvas.width / 2 - objCenter.x * viewportTransform[0];
    viewportTransform[5] = canvas.height / 2 - objCenter.y * viewportTransform[3];
    canvas.setViewportTransform(viewportTransform);
    canvas.renderAll();
  }

  // Initialize listener
  _initResizeObserve() {
    const resizeObserver = new ResizeObserver(
      throttle(() => {
        this.auto();
      }, 50)
    );
    this.resizeObserver = resizeObserver;
    this.resizeObserver.observe(this.workspaceEl);
  }

  setSize(width: number, height: number) {
    this._initBackground();
    this.option.width = width;
    this.option.height = height;
    // Reset workspace
    this.workspace = this.canvas
      .getObjects()
      .find((item) => item.id === 'workspace') as fabric.Rect;
    this.workspace.set('width', width);
    this.workspace.set('height', height);
    this.editor.emit('sizeChange', this.workspace.width, this.workspace.height);
    this.auto();
  }

  setZoomAuto(scale: number, cb?: (left?: number, top?: number) => void) {
    const { workspaceEl } = this;
    const width = workspaceEl.offsetWidth;
    const height = workspaceEl.offsetHeight;
    this.canvas.setWidth(width);
    this.canvas.setHeight(height);
    const center = this.canvas.getCenter();
    this.canvas.setViewportTransform(fabric.iMatrix.concat());
    this.canvas.zoomToPoint(new fabric.Point(center.left, center.top), scale);
    if (!this.workspace) return;
    this.setCenterFromObject(this.workspace);

    // Do not display beyond the canvas
    this.workspace.clone((cloned: fabric.Rect) => {
      this.canvas.clipPath = cloned;
      this.canvas.requestRenderAll();
    });
    if (cb) cb(this.workspace.left, this.workspace.top);
  }

  // function findScaleToFit(object: fabric.Rect, containerWidth: number, containerHeight: number): number {
  //   const objectAspect = object.width / object.height;
  //   const containerAspect = containerWidth / containerHeight;

  //   if (objectAspect > containerAspect) {
  //     return containerWidth / object.width;
  //   } else {
  //     return containerHeight / object.height;
  //   }
  // }

  _getScale() {
    return fabric.util.findScaleToFit(this.getWorkspace(), {
      width: this.workspaceEl.offsetWidth,
      height: this.workspaceEl.offsetHeight,
    });
  }

  // enlarge
  big() {
    let zoomRatio = this.canvas.getZoom();
    zoomRatio += 0.05;
    const center = this.canvas.getCenter();
    this.canvas.zoomToPoint(new fabric.Point(center.left, center.top), zoomRatio);
  }

  // zoom out
  small() {
    let zoomRatio = this.canvas.getZoom();
    zoomRatio -= 0.05;
    const center = this.canvas.getCenter();
    this.canvas.zoomToPoint(
      new fabric.Point(center.left, center.top),
      zoomRatio < 0 ? 0.01 : zoomRatio
    );
  }

  // Auto scaling
  auto() {
    const scale = this._getScale();
    this.setZoomAuto(scale * this.zoomRatio);
  }

  // 1:1 enlarge
  one() {
    this.setZoomAuto(1 * this.zoomRatio);
    this.canvas.requestRenderAll();
  }

  setWorkspaceBg(color: string) {
    const workspace = this.getWorkspace();
    workspace?.set('fill', color);
  }

  _bindWheel() {
    this.canvas.on('mouse:wheel', function (this: fabric.Canvas, opt) {
      const delta = opt.e.deltaY;
      let zoom = this.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      const center = this.getCenter();
      this.zoomToPoint(new fabric.Point(center.left, center.top), zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
  }

  destroy() {
    this.resizeObserver.disconnect();
    this.canvas.off();
    console.log('pluginDestroy');
  }
}

export default WorkspacePlugin;
