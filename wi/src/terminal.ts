import type { IDisposable, ITerminalInitOnlyOptions, ITerminalOptions } from '@xterm/xterm';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import type { IReplIO } from '@psbots/repl';
import { repl } from '@psbots/repl';
import type { IWebComponent } from './IWebComponent';
import styles from './styles.css?raw';
import type { IState } from '../../engine/dist/api';

class AbortableReplIO implements IReplIO {
  private _controller: AbortController = new AbortController();
  private _aborted = false;

  abort() {
    this._aborted = true;
    this._disposableInput?.dispose();
    this._disposableInput = null;
    this._controller.abort();
  }

  constructor(private _terminal: PsbotsTerminal) {}

  get abortSignal() {
    return this._controller.signal;
  }

  get width() {
    return this._terminal.xterm.cols;
  }

  get height() {
    return this._terminal.xterm.rows;
  }

  on(event: string, detail: { state: IState, wait?: Promise<void> }) {
    const htmlEvent = new CustomEvent(event, { bubbles: true, detail });
    this._terminal.dispatchEvent(htmlEvent);
    // The event may receive a promise to wait on
    return htmlEvent.detail.wait;
  }

  private _disposableInput: IDisposable | null = null;

  input(callback: (data: string) => void) {
    this._disposableInput = this._terminal.xterm.onData(callback);
  }

  output(text: string) {
    if (this._aborted) {
      console.warn('ReplIO has been aborted, ignoring output:', text);
    } else {
      this._terminal.xterm.write(text);
    }
  }
}

class PsbotsTerminal extends HTMLElement implements IWebComponent {
  private _root: ShadowRoot;
  private _terminalContainer: HTMLElement;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
    this._root.innerHTML = `<style>${styles}</style><div class="terminal-container"></div>`;
    this._terminalContainer = this._root.querySelector('.terminal-container') as HTMLElement;
  }

  static readonly observedAttributes = ['rows', 'options'];

  attributeChangedCallback(name: string) {
    if (name === 'options') {
      this._reset();
    } else {
      this._recreate();
    }
  }

  connectedCallback() {
    this._reset();
  }

  private _terminal: Terminal | null = null;
  private _replIO: AbortableReplIO | null = null;

  get xterm() {
    if (!this._terminal) {
      this._reset();
    }
    return this._terminal!;
  }

  private _recreate() {
    if (this._terminal) {
      this._terminal.dispose();
      this._terminal = null;
    }
    this._reset();
  }

  private _reset() {
    if (!this._terminal) {
      const terminalOptions: ITerminalOptions & ITerminalInitOnlyOptions = {
        cursorBlink: true
      };
      const rows = this.getAttribute('rows');
      if (rows) {
        terminalOptions.rows = Number.parseInt(rows);
      }
      this._terminal = new Terminal(terminalOptions);
      const fitAddon = new FitAddon();
      this._terminal.loadAddon(fitAddon);
      this._terminal.open(this._terminalContainer);
      fitAddon.fit();
      const resizeObserver = new ResizeObserver(() => {
        if (!this._terminal) {
          return;
        }
        fitAddon.fit();
        const event = new CustomEvent('resize', {
          bubbles: true,
          detail: {
            width: this._terminal.cols,
            height: this._terminal.rows
          }
        });
        this.dispatchEvent(event);
      });
      resizeObserver.observe(this._terminalContainer);
    }
    if (this._replIO) {
      this._replIO.abort();
      this._terminal.write('\u001Bc'); // clear
    }
    this._replIO = new AbortableReplIO(this);
    const options = this.getAttribute('options')?.split(',') || [];
    repl(this._replIO, options).catch((error) => {
      console.error(error);
    });
  }
}

customElements.define('psbots-terminal', PsbotsTerminal);
