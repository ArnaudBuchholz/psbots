import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import type { IReplIO } from '@psbots/repl';
import { repl } from '@psbots/repl';
import type { IWebComponent } from './IWebComponent';
import styles from './styles.css?raw';

class PsbotsTerminal extends HTMLElement implements IWebComponent {
  private _root: ShadowRoot;
  private _terminalContainer: HTMLElement;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
    this._root.innerHTML = `<style>${styles}</style><div class="terminal"></div>`;
    this._terminalContainer = this._root.querySelector('.terminal') as HTMLElement;
  }

  static readonly observedAttributes = ['width', 'height', 'options'];

  attributeChangedCallback(name: string) {
    if (name === 'options') {
      this._reset();
    } else {
      this._resize();
    }
  }

  private _resize() {
    const width = this.getAttribute('width');
    const height = this.getAttribute('height');
    this._terminalContainer.style = [
      width ? `width: ${width};` : '',
      height ? `height: ${height};` : ''
    ].join('; ');
  }

  connectedCallback() {
    this._reset();
  }

  private _terminal: Terminal | null = null;
  private _lastReplIO: IReplIO | null = null;

  private _reset() {
    if (!this._terminal) {
      this._terminal = new Terminal({ cursorBlink: true });
      const fitAddon = new FitAddon();
      this._terminal.loadAddon(fitAddon);
      this._terminal.open(this._terminalContainer);
      fitAddon.fit();
    }

    if (this._lastReplIO) {
      this._lastReplIO.abort?.abort();
    }


    repl({
      get width() {
        return this._terminal.cols;
      },
      get height() {
        return this._terminal.rows;
      },
      input(callback) {
        term.onData(callback);
      },
      output(text) {
        term.write(text);
      }
    }).catch((error) => {
      console.error(error);
    });
  }
}

customElements.define('psbots-terminal', PsbotsTerminal);
