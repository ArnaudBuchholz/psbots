import { repl } from '@psbots/repl';
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const lines = [];
let newLineInBuffer = () => {};

const rl = readline.createInterface({ input: stdin, output: stdout });
rl.on('line', (line) => {
  lines.push(line);
  newLineInBuffer();
});

await repl(
  {
    width: process.stdout.columns,
    height: process.stdout.rows,
    output(text) {
      stdout.write(text);
    },
    async input() {
      if (lines.length === 0) {
        await new Promise((resolve) => {
          newLineInBuffer = resolve;
        });
      }
      return lines.shift();
    }
  },
  process.argv.includes('--debug')
).catch((reason) => {
  console.error(reason);
  process.exitCode = -1;
});

rl.close();
