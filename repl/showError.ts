import type { Exception, IReadOnlyCallStack, Result } from '@psbots/engine';
import { callStackToString } from '@psbots/engine/sdk';
import type { IReplIO } from './IReplIO.js';
import { red, white } from './colors.js';

export function failed(replIO: IReplIO, result: Result<unknown>, context: { stack?: IReadOnlyCallStack; message?: string } = {}): result is { success: false; exception: Exception } {
  if (!result.success) {
    if (context.message) {
      replIO.output(`${red}${context.message}${white}\r\n`);
    }
    showException(replIO, result.exception, context.stack);
    return true
  }
  return false
}

export function showException(replIO: IReplIO, exception: string, stack?: IReadOnlyCallStack) {
  replIO.output(`${red}❌ ${exception}${white}\r\n`);
  if (stack) {
    callStackToString(stack).forEach((line) => replIO.output(`${red}${line}${white}\r\n`));
  }
}

export function showError(replIO: IReplIO, e: unknown) {
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
}
