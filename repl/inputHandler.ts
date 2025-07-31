import type { IReplIO } from './IReplIo.js';

export interface IInputHandler {
  waitForLines: () => Promise<string>;
  waitForChar: () => Promise<string>;
}

export class InputError extends Error {
  constructor() {
    super();
    this.name = this.constructor.name;
  }
}

class EndOfTextError extends InputError {}
class EscapeError extends InputError {}

const noop = () => {};

const paste = (replIO: IReplIO, appendToLinesBuffer: (data: string, newLine?: boolean) => void, data: string) => {
  if (data.charAt(0) === '\u001B') {
    return; // ignore
  }
  let unterminatedLine: string;
  if (data.includes('\r')) {
    const lines = data.split('\r');
    unterminatedLine = lines.pop()!; // because it includes \r
    for (const line of lines) {
      replIO.output(line);
      replIO.output('\r\n');
      appendToLinesBuffer(line, true);
    }
  } else {
    unterminatedLine = data;
  }
  if (unterminatedLine.length > 0) {
    replIO.output(unterminatedLine);
    appendToLinesBuffer(unterminatedLine);
  }
};

export function buildInputHandler(replIO: IReplIO): IInputHandler {
  const linesBuffer: string[] = [];

  let linesBufferChange = Promise.resolve();

  let notifyLinesBufferChange: () => void = noop;
  let rejectInput: (reason: Error) => void = noop;
  const appendToLinesBuffer = (data: string, newLine = false) => {
    if (data.length > 0) {
      linesBuffer[0] = linesBuffer[0] + data;
    }
    if (newLine) {
      linesBuffer.unshift('');
    }
    notifyLinesBufferChange();
    linesBufferChange = new Promise<void>((resolve, reject) => {
      notifyLinesBufferChange = resolve;
      rejectInput = reject;
    });
  };

  appendToLinesBuffer('', true); // Initialize

  replIO.input((data) => {
    if (data.length > 1) {
      paste(replIO, appendToLinesBuffer, data);
    } else if (data === '\r') {
      // Enter
      replIO.output('\r\n');
      appendToLinesBuffer('', true);
    } else if (data === '\u0008' || data === '\u007F') {
      // Backspace (DEL)
      const line = linesBuffer[0];
      if (line && line.length > 0) {
        replIO.output('\b \b');
        linesBuffer[0] = line.slice(0, Math.max(0, line.length - 1));
      }
    } else if (data === '\u0003') {
      rejectInput(new EndOfTextError());
    } else if (data === '\u001B') {
      rejectInput(new EscapeError());
    } else if ((data >= ' ' && data <= '~') || data >= '\u00A0') {
      replIO.output(data);
      appendToLinesBuffer(data, false);
    }
  });

  return {
    async waitForLines() {
      const waitForLine = async () => {
        await linesBufferChange;
        if (linesBuffer.length === 1) {
          return waitForLine();
        }
        let newInput = false;
        await Promise.race([
          linesBufferChange.then(() => {
            newInput = true;
          }),
          // Wait before returning lines
          new Promise((resolve) => setTimeout(resolve, 50))
        ]);
        if (newInput) {
          return waitForLine();
        }
        return linesBuffer.splice(1).toReversed().join('\n');
      };
      return waitForLine();
    },

    async waitForChar() {
      if (linesBuffer.length === 1 && linesBuffer[0]!.length === 0) {
        await linesBufferChange;
      }
      const line = linesBuffer.at(-1)!;
      const char = line.charAt(0);
      const remainder = line.slice(1);
      if (remainder.length > 0 || linesBuffer.length === 1) {
        linesBuffer[linesBuffer.length - 1] = remainder;
      } else {
        linesBuffer.pop();
      }
      return char;
    }
  };
}
