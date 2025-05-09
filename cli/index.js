#!/usr/bin/env node

import { repl } from '@psbots/repl';
import { stdin, stdout } from 'node:process';

stdin.setRawMode(true);

const options = process.argv.filter((argument) => argument.startsWith('--')).map((argument) => argument.slice(2));

await repl(
  {
    get width() {
      return process.stdout.columns;
    },
    get height() {
      return process.stdout.rows;
    },
    input: (callback) => {
      stdin.on('data', (chunk) => callback(chunk.toString()));
    },
    output(text) {
      stdout.write(text);
    }
  },
  options
).catch((error) => {
  console.error(error);
  process.exitCode = -1;
});

process.exit();
