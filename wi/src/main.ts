import './style.css';
import '@xterm/xterm/css/xterm.css';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import type { IReplInputBuffer } from '@psbots/repl';
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

  let replInputBuffer: IReplInputBuffer;
  const input: string[] = [];

  term.onData((e) => {
    if (terminated) {
      return;
    }
    if (e.length > 1) {
      let unterminatedLine: string;
      if (e.includes('\r')) {
        const lines = e.split('\r');
        unterminatedLine = lines.pop()!; // because it includes \r
        lines.forEach((line) => {
          term.write(line);
          term.write('\r\n');
          replInputBuffer.addLine(line);
        });
      } else {
        unterminatedLine = e;
      }
      if (unterminatedLine.length > 0) {
        input.push(...unterminatedLine.split(''));
        term.write(unterminatedLine);
      }
    } else if (e === '\r') {
      // Enter
      term.write('\r\n');
      replInputBuffer.addLine(input.join(''));
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
    setInputBuffer(inputBuffer) {
      replInputBuffer = inputBuffer;
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
