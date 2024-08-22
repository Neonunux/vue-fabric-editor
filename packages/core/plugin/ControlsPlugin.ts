/*
 * @Author: 秦少卫
 * @Date: 2023-06-13 23:00:43
 * @LastEditors: 秦少卫
 * @LastEditTime: 2024-07-16 14:59:25
 * @Description: 控制条插件
 */
import { fabric } from 'fabric';
import verticalImg from '../assets/middlecontrol.svg?url';
// import verticalImg from './middlecontrol.svg';
import horizontalImg from '../assets/middlecontrolhoz.svg?url';
import edgeImg from '../assets/edgecontrol.svg?url';
import rotateImg from '../assets/rotateicon.svg?url';
import type { IEditor, IPluginTempl } from '@kuaitu/core';

/**
 * Actual scenario: When scaling an object, the default precision of fabricjs is toFixed(2).
 * In order to make the scaling more accurate, the default value of NUM_FRACTION_DIGITS is changed to 4, that is, toFixed(4).
 */
fabric.Object.NUM_FRACTION_DIGITS = 4;

function drawImg(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  img: HTMLImageElement,
  wSize: number,
  hSize: number,
  angle: number | undefined
) {
  if (angle === undefined) return;
  ctx.save();
  ctx.translate(left, top);
  ctx.rotate(fabric.util.degreesToRadians(angle));
  ctx.drawImage(img, -wSize / 2, -hSize / 2, wSize, hSize);
  ctx.restore();
}

// middle bar
function intervalControl() {
  const verticalImgIcon = document.createElement('img');
  verticalImgIcon.src = verticalImg;

  const horizontalImgIcon = document.createElement('img');
  horizontalImgIcon.src = horizontalImg;

  function renderIcon(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    styleOverride: any,
    fabricObject: fabric.Object
  ) {
    drawImg(ctx, left, top, verticalImgIcon, 20, 25, fabricObject.angle);
  }

  function renderIconHoz(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    styleOverride: any,
    fabricObject: fabric.Object
  ) {
    drawImg(ctx, left, top, horizontalImgIcon, 25, 20, fabricObject.angle);
  }
  // middle bar
  fabric.Object.prototype.controls.ml = new fabric.Control({
    x: -0.5,
    y: 0,
    offsetX: -1,
    cursorStyleHandler: fabric.controlsUtils.scaleSkewCursorStyleHandler,
    actionHandler: fabric.controlsUtils.scalingXOrSkewingY,
    getActionName: fabric.controlsUtils.scaleOrSkewActionName,
    render: renderIcon,
  });

  fabric.Object.prototype.controls.mr = new fabric.Control({
    x: 0.5,
    y: 0,
    offsetX: 1,
    cursorStyleHandler: fabric.controlsUtils.scaleSkewCursorStyleHandler,
    actionHandler: fabric.controlsUtils.scalingXOrSkewingY,
    getActionName: fabric.controlsUtils.scaleOrSkewActionName,
    render: renderIcon,
  });

  fabric.Object.prototype.controls.mb = new fabric.Control({
    x: 0,
    y: 0.5,
    offsetY: 1,
    cursorStyleHandler: fabric.controlsUtils.scaleSkewCursorStyleHandler,
    actionHandler: fabric.controlsUtils.scalingYOrSkewingX,
    getActionName: fabric.controlsUtils.scaleOrSkewActionName,
    render: renderIconHoz,
  });

  fabric.Object.prototype.controls.mt = new fabric.Control({
    x: 0,
    y: -0.5,
    offsetY: -1,
    cursorStyleHandler: fabric.controlsUtils.scaleSkewCursorStyleHandler,
    actionHandler: fabric.controlsUtils.scalingYOrSkewingX,
    getActionName: fabric.controlsUtils.scaleOrSkewActionName,
    render: renderIconHoz,
  });
}

// vertex
function peakControl() {
  const img = document.createElement('img');
  img.src = edgeImg;

  function renderIconEdge(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    styleOverride: any,
    fabricObject: fabric.Object
  ) {
    drawImg(ctx, left, top, img, 25, 25, fabricObject.angle);
  }
  // four corners icon
  fabric.Object.prototype.controls.tl = new fabric.Control({
    x: -0.5,
    y: -0.5,
    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
    actionHandler: fabric.controlsUtils.scalingEqually,
    render: renderIconEdge,
  });
  fabric.Object.prototype.controls.bl = new fabric.Control({
    x: -0.5,
    y: 0.5,
    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
    actionHandler: fabric.controlsUtils.scalingEqually,
    render: renderIconEdge,
  });
  fabric.Object.prototype.controls.tr = new fabric.Control({
    x: 0.5,
    y: -0.5,
    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
    actionHandler: fabric.controlsUtils.scalingEqually,
    render: renderIconEdge,
  });
  fabric.Object.prototype.controls.br = new fabric.Control({
    x: 0.5,
    y: 0.5,
    cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
    actionHandler: fabric.controlsUtils.scalingEqually,
    render: renderIconEdge,
  });
}

// delete
/*function deleteControl(canvas: fabric.Canvas) {
  const deleteIcon =
    "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E";
  const delImg = document.createElement('img');
  delImg.src = deleteIcon;

  function renderDelIcon(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    styleOverride: any,
    fabricObject: fabric.Object
  ) {
    drawImg(ctx, left, top, delImg, 24, 24, fabricObject.angle);
  }

  // Delete selected elements
  function deleteObject(mouseEvent: MouseEvent, target: fabric.Transform) {
    if (target.action === 'rotate') return true;
    const activeObject = canvas.getActiveObjects();
    if (activeObject) {
      activeObject.map((item) => canvas.remove(item));
      canvas.requestRenderAll();
      canvas.discardActiveObject();
    }
    return true;
  }

  // delete icon
  fabric.Object.prototype.controls.deleteControl = new fabric.Control({
    x: 0.5,
    y: -0.5,
    offsetY: -16,
    offsetX: 16,
    cursorStyle: 'pointer',
    mouseUpHandler: deleteObject,
    render: renderDelIcon,
    // cornerSize: 24,
  });
}*/

// rotate
function rotationControl() {
  const img = document.createElement('img');
  img.src = rotateImg;
  function renderIconRotate(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    styleOverride: any,
    fabricObject: fabric.Object
  ) {
    drawImg(ctx, left, top, img, 40, 40, fabricObject.angle);
  }
  // Rotate icon
  fabric.Object.prototype.controls.mtr = new fabric.Control({
    x: 0,
    y: 0.5,
    cursorStyleHandler: fabric.controlsUtils.rotationStyleHandler,
    actionHandler: fabric.controlsUtils.rotationWithSnapping,
    offsetY: 30,
    // withConnecton: false,
    actionName: 'rotate',
    render: renderIconRotate,
  });
}

class ControlsPlugin implements IPluginTempl {
  static pluginName = 'ControlsPlugin';
  constructor(public canvas: fabric.Canvas, public editor: IEditor) {
    this.init();
  }
  init() {
    // delete icon
    // deleteControl(this.canvas);
    // vertex icon
    peakControl();
    // middle bar icon
    intervalControl();
    // Rotate icon
    rotationControl();

    // selected style
    fabric.Object.prototype.set({
      transparentCorners: false,
      borderColor: '#51B9F9',
      cornerColor: '#FFF',
      borderScaleFactor: 2.5,
      cornerStyle: 'circle',
      cornerStrokeColor: '#0E98FC',
      borderOpacityWhenMoving: 1,
    });
    // textbox remains consistent
    // fabric.Textbox.prototype.controls = fabric.Object.prototype.controls;
  }

  destroy() {
    console.log('pluginDestroy');
  }
}

export default ControlsPlugin;
