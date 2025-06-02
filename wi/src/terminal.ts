import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import type { IReplIO } from '@psbots/repl';
import { repl } from '@psbots/repl';
import type { IWebComponent } from './IWebComponent';
import styles from './styles.css?raw';

class AbortableReplIO implements IReplIO {
  private _controller: AbortController = new AbortController();
  private _aborted = false;

  abort() {
    this._aborted = true;
    this._controller.abort();
  }

  constructor(private _terminal: Terminal) {}

  get abortSignal() {
    return this._controller.signal;
  }

  get width() {
    return this._terminal.cols;
  }

  get height() {
    return this._terminal.rows;
  }
  
  input(callback: (data: string) => void) {
    if (this._aborted) {
      throw new Error('ReplIO has been aborted');
    }
    this._terminal.onData(callback);
  }

  output(text: string) {
    if (this._aborted) {
      console.warn('ReplIO has been aborted, ignoring output:', text);
    } else {
      this._terminal.write(text);
    }
  }
}

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
  private _replIO: AbortableReplIO | null = null;

  private _reset() {
    if (!this._terminal) {
      this._terminal = new Terminal({ cursorBlink: true });
      const fitAddon = new FitAddon();
      this._terminal.loadAddon(fitAddon);
      this._terminal.open(this._terminalContainer);
      fitAddon.fit();
    }
    if (this._replIO) {
      this._replIO.abort();
      this._terminal.write('\u001Bc');
    }
    this._replIO = new AbortableReplIO(this._terminal);
    const options = this.getAttribute('options')?.split(',') || [];
    repl(this._replIO, options)
      .catch((error) => {
        console.error(error);
      });
  }
}

customElements.define('psbots-terminal', PsbotsTerminal);
