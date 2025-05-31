import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { repl } from '@psbots/repl';
import type { IWebComponent } from './IWebComponent';

class PsbotsTerminal extends HTMLElement implements IWebComponent {

  connectedCallback() {
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = `<style>
@import "https://cdn.jsdelivr.net/npm/@xterm/xterm/css/xterm.min.css";

* {
  box-sizing: border-box;
}

::-webkit-scrollbar {
  width: 0.5rem;
}

::-webkit-scrollbar:horizontal {
  height: 0;
}

::-webkit-scrollbar-thumb {
  border-radius: 30px;
  background-color: oklch(0.552 0.016 285.938);
}

::-webkit-scrollbar-button {
  background-color: transparent;
  width: 30px;
}

::-webkit-scrollbar-track {
  border-radius: 30px;
  background-color: oklch(0.37 0.013 285.805);
}

.terminal {
  &>.xterm-viewport {
    border-radius: 10px
  }

  &>.xterm-screen {
    margin: 10px;

    &>.xterm-rows {
      overflow-x: auto;
    }
  }
}
</style>
<div class="terminal">
</div>`;

    const terminalContainer = shadowRoot.querySelector('.terminal') as HTMLElement;

    const term = new Terminal({ cursorBlink: true });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainer);
    fitAddon.fit();    

    repl({
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

    // Handle resize events
    const resizeObserver = new ResizeObserver(() => {
      console.log('Resizing terminal', {
        width: terminalContainer.offsetWidth,
        height: terminalContainer.offsetHeight
      });
    });
    resizeObserver.observe(terminalContainer);
  }
}

customElements.define('psbots-terminal', PsbotsTerminal);
