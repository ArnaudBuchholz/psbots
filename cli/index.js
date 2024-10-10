import { repl } from '@psbots/repl';
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { readSync } from 'node:fs';

const rl = readline.createInterface({ input: stdin, output: stdout });

await repl(
  {
    width: process.stdout.columns,
    height: process.stdout.rows,
    setInputBuffer(buffer) {
      rl.on('line', (line) => {
        buffer.addLine(line);
      });
    },
    async waitForKey() {
      stdin.setRawMode(true);
      const buffer = Buffer.alloc(1);
      readSync(0, buffer, 0, 1);
      stdin.setRawMode(false);
      return buffer.toString('utf8');
    },
    output(text) {
      stdout.write(text);
    }
  },
  process.argv.includes('--debug')
).catch((reason) => {
  console.error(reason);
  process.exitCode = -1;
});

rl.close();
