import './style.css';
import '@xterm/xterm/css/xterm.css';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { repl } from '@psbots/repl';

let terminated = false;

async function main() {
  const term = new Terminal({
    cursorBlink: true
  });
  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.open(document.getElementById('terminal')!);
  fitAddon.fit();

  window.addEventListener('resize', () => fitAddon.fit());

  const input: string[] = [];
  let resolveInput = (input: string) => console.log(input);

  term.onData((e) => {
    if (terminated) {
      return;
    }
    if (e === '\r') {
      // Enter
      term.write('\r\n');
      resolveInput(input.join(''));
      input.length = 0;
    } else if (e === '\u007F') {
      // Backspace (DEL)
      if (input.length > 0) {
        term.write('\b \b');
        input.pop();
      }
    } else if ((e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7e)) || e >= '\u00a0') {
      input.push(e);
      term.write(e);
    }
  });

  await repl({
    get width() {
      return term.cols;
    },
    get height() {
      return term.rows;
    },
    setInputBuffer(/*buffer*/) {
    },
    async waitForKey() {
      return '';
    },
    output(text) {
      term.write(text);
    }
  }).catch((reason) => {
    console.error(reason);
  });
}

main().finally(() => {
  terminated = true;
});
