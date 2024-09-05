import { repl } from '@psbots/repl';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

await repl({
  width: process.stdout.columns,
  height: process.stdout.rows,
  output(text) {
    console.log(text + '\x1b[37m');
  },
  async input() {
    return await rl.question('? ');
  }
}).catch((reason) => {
  console.error(reason);
  process.exitCode = -1;
});

rl.close();
