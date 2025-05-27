import { Terminal } from '@xterm/xterm';
import { repl } from '@psbots/repl';

interface OnConnected {
  connectedCallback(): void;
}

class Repl extends HTMLElement implements OnConnected {
  constructor() {
    super();
  }

  async connectedCallback(): Promise<void> {
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = `<style>@import "https://cdn.jsdelivr.net/npm/@xterm/xterm/css/xterm.min.css";:host {display: grid;justify-content: center;align-content: center;}* {box-sizing: border-box;}::-webkit-scrollbar {width: 0.5rem;}::-webkit-scrollbar:horizontal {height: 0;}::-webkit-scrollbar-thumb {border-radius: 30px;background-color: oklch(0.552 0.016 285.938);}::-webkit-scrollbar-button {background-color: transparent;width: 30px;}::-webkit-scrollbar-track {border-radius: 30px;background-color: oklch(0.37 0.013 285.805);}.terminal {overscroll-behavior: contain;min-width: 300px !important;height: 410px !important;& > * {width: 100% !important;height: 100% !important;}& > .xterm-viewport {overflow-y: auto !important;height: 440px !important;border-radius: 10px !important;background-color: oklch(0.21 0.006 285.885) !important;}& > .xterm-screen {padding: 15px !important;& > .xterm-rows {overflow-x: auto !important;}}}</style>`;

    const term = new Terminal({ cursorBlink: true });
    term.open(shadowRoot as unknown as HTMLElement);

    await repl({
      get width() {
        return term.cols;
      },
      get height() {
        return term.rows;
      },
      input(callback) {
        term.onData(callback);
      },
      output(text) {
        term.write(text);
      }
    }).catch(error => {
      console.error(error);
    });
  }
}

/**
 * Setups the `ps-bots` web component.
 *
 * This function enables you to use psbots's REPL into any web page as follow.
 * @example
 * ```html
 * <p>Simply awesome!</p>
 * <ps-bots></ps-bots> <!-- component's tag name -->
 * ```
 */
export function setupRepl(): void {
  customElements.define('ps-bots', Repl);
}
