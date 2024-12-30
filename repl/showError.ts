import type { IReplIO } from './IReplIO.js';
import { red, white } from './colors.js';
import { BaseException } from '@psbots/engine/sdk';

export function showError(replIO: IReplIO, e: unknown) {
  if (!(e instanceof BaseException)) {
    let name: string;
    let message: string;
    if (e instanceof Error) {
      name = e.name;
      message = e.message;
    } else {
      name = 'Unknown error';
      message = JSON.stringify(e);
    }
    if (message.length) {
      message = ': ' + message;
    }
    replIO.output(`${red}💣 ${name}${message}${white}\r\n`);
  } else {
    replIO.output(`${red}❌ ${e.message}${white}\r\n`);
    e.engineStack.forEach((line) => replIO.output(`${red}${line}${white}\r\n`));
  }
}
