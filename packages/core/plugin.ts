import Editor from './Editor';
type IEditor = Editor;

class FontPlugin {
  public canvas: fabric.Canvas;
  public editor: IEditor;
  // Plug-in name
  static pluginName = 'FontPlugin';
  // Mount API name
  static apis = ['downFontByJSON'];
  // Release event
  static events = ['textEvent1', 'textEvent2'];
  // shortcut key keyCode hotkeys-js
  public hotkeys: string[] = ['backspace', 'space'];
  // Private attributes
  repoSrc: string;

  constructor(canvas: fabric.Canvas, editor: IEditor, config: { repoSrc: string }) {
    // Initialize
    this.canvas = canvas;
    this.editor = editor;
    // Plug in external configuration
    this.repoSrc = config.repoSrc;
  }

  // Hook function hookImportAfter/hookSaveBefore/hookSaveAfter Promise
  hookImportBefore(json: string) {
    return this.downFontByJSON(json);
  }
  // Before saving the file
  hookSaveBefore() {
    console.log('pluginHookSaveBefore');
  }
  // Before saving the file
  hookSaveAfter() {
    console.log('pluginHookSaveAfter');
  }
  // Shortcut key extension recovery
  hotkeyEvent(eventName: string, e?: Event) {
    console.log('pluginHotkeyEvent', eventName, e);
  }
  // Right-click menu extension
  contextMenu() {
    const selectedMode = this.editor.getSelectMode();
    if (selectedMode === SelectMode.ONE) {
      return [
        null, // Section line
        {
          text: '翻转',
          hotkey: '❯',
          subitems: [
            {
              text: t('flip.x'),
              hotkey: '|',
              onclick: () => this.flip('X'),
            },
            {
              text: t('flip.y'),
              hotkey: '-',
              onclick: () => this.flip('Y'),
            },
          ],
        },
      ];
    }
  }

  // shortcut key
  hotkeyEvent(eventName: string, { type }: KeyboardEvent) {
    // eventName: Attributes in hotkeys backspace、space
    // type: keyUp keyDown
    // code: hotkeys-js Code
    if (eventName === 'backspace' && type === 'keydown') {
      this.del();
    }
  }

  // Log out
  destroy() {
    console.log('pluginDestroy');
  }
}

export default FontPlugin;
