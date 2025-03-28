import './style.css';
import '@xterm/xterm/css/xterm.css';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { repl } from '@psbots/repl';

const term = new Terminal({
  cursorBlink: true
});
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(document.querySelector('#terminal')!);
fitAddon.fit();

window.addEventListener('resize', () => fitAddon.fit());

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
}).catch((error) => {
  console.error(error);
});
