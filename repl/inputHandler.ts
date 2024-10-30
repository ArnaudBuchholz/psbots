import type { IReplIO } from './IReplIO.js';

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

export function buildInputHandler(replIO: IReplIO): IInputHandler {
  const linesBuffer: string[] = [];

  let linesBufferChange = Promise.resolve();

  let notifyLinesBufferChange = () => {};
  let rejectInput = (error: Error) => {
    error;
  };
  const appendToLinesBuffer = (data: string, newLine = false) => {
    if (data.length) {
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
      if (data.charAt(0) === '\u001b') {
        return; // ignore
      }
      let unterminatedLine: string;
      if (data.includes('\r')) {
        const lines = data.split('\r');
        unterminatedLine = lines.pop()!; // because it includes \r
        lines.forEach((line) => {
          replIO.output(line);
          replIO.output('\r\n');
          appendToLinesBuffer(line, true);
        });
      } else {
        unterminatedLine = data;
      }
      if (unterminatedLine.length > 0) {
        replIO.output(unterminatedLine);
        appendToLinesBuffer(unterminatedLine);
      }
    } else if (data === '\r') {
      // Enter
      replIO.output('\r\n');
      appendToLinesBuffer('', true);
    } else if (data === '\u0008' || data === '\u007F') {
      // Backspace (DEL)
      const line = linesBuffer[0];
      if (line && line.length > 0) {
        replIO.output('\b \b');
        linesBuffer[0] = line.substring(0, line.length - 1);
      }
    } else if (data === '\u0003') {
      rejectInput(new EndOfTextError());
    } else if (data === '\u001b') {
      rejectInput(new EscapeError());
    } else if ((data >= String.fromCharCode(0x20) && data <= String.fromCharCode(0x7e)) || data >= '\u00a0') {
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
        return linesBuffer.splice(1).reverse().join('\n');
      };
      return waitForLine();
    },

    async waitForChar() {
      if (linesBuffer.length === 1 && linesBuffer[0]!.length === 0) {
        await linesBufferChange;
      }
      const line = linesBuffer.at(-1)!;
      const char = line.charAt(0);
      const remainder = line.substring(1);
      if (remainder.length || linesBuffer.length === 1) {
        linesBuffer[linesBuffer.length - 1] = remainder;
      } else {
        linesBuffer.pop();
      }
      return char;
    }
  };
}
