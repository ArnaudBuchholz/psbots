import type { Exception, IReadOnlyCallStack, Result } from '@psbots/engine';
import { callStackToString } from '@psbots/engine/sdk';
import type { IReplIO } from './IReplIo.js';
import { red, white } from './colors.js';

export function failed(
  replIO: IReplIO,
  result: Result<unknown>,
  context: { stack?: IReadOnlyCallStack; message?: string } = {}
): result is { success: false; exception: Exception } {
  if (!result.success) {
    if (context.message) {
      replIO.output(`${red}${context.message}${white}\r\n`);
    }
    showException(replIO, result.exception, context.stack);
    return true;
  }
  return false;
}

export function showException(replIO: IReplIO, exception: string, stack?: IReadOnlyCallStack) {
  replIO.output(`${red}❌ ${exception}${white}\r\n`);
  if (stack) {
    for (const line of callStackToString(stack)) {
      replIO.output(`${red}${line}${white}\r\n`);
    }
  }
}

export function showError(replIO: IReplIO, error: unknown) {
  let name: string;
  let message: string;
  if (error instanceof Error) {
    name = error.name;
    message = error.message;
  } else {
    name = 'Unknown error';
    message = JSON.stringify(error);
  }
  if (message.length > 0) {
    message = ': ' + message;
  }
  replIO.output(`${red}💣 ${name}${message}${white}\r\n`);
}
