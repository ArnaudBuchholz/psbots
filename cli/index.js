import { repl } from '@psbots/repl';
import { stdin, stdout } from 'node:process';

stdin.setRawMode(true);

await repl(
  {
    get width() { return  process.stdout.columns },
    get height() { return process.stdout.rows },
    input: (callback) => {
      stdin.on('data', (chunk) => callback(chunk.toString()));
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

process.exit();
