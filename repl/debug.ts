import type { IState } from '@psbots/engine';
import type { IReplIO } from './IReplIO.js';
import { toString, TOSTRING_BEGIN_MARKER, TOSTRING_END_MARKER } from '@psbots/engine/sdk';
import { blue, cyan, green /*, magenta*/, red, white, yellow } from './colors.js';
import { status } from './status.js';
import { operands } from './format.js';

type DebugParameters = {
  replIO: IReplIO;
  state: IState;
  iterator: Generator;
  waitForChar: () => Promise<string>;
};

export async function runWithDebugger({ replIO, state, iterator, waitForChar }: DebugParameters): Promise<number> {
  let lastOperandsCount = state.operands.length;
  let lastUsedMemory = state.memoryTracker.used;
  let lastCallStackSize = state.callStack.length;
  let cycle = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { width, height } = replIO;
    if (width < 40 || height < 10) {
      replIO.output(`${red}⚠️ Output too small for debugger${white}\n`);
      return 0;
    }

    replIO.output('\x1b[1;1H\x1b[J'); // clear display
    replIO.output(`┌─────────────────┬${''.padStart(width - 20, '─')}┐`);
    replIO.output(`│Cycle: #${cycle.toString().padEnd(5, ' ')} │Memory: ${''.padStart(width - 31, ' ')}│`);
    replIO.output(`├─────────────────┴${''.padStart(width - 20, '─')}┤`);

    replIO.output('\n');
    if (state.callStack.length) {
      const currentCallStackSize = state.callStack.length;
      let callStackVariation: string;
      if (currentCallStackSize > lastCallStackSize) {
        callStackVariation = ` ${red}+${currentCallStackSize - lastCallStackSize}`;
      } else if (currentCallStackSize < lastCallStackSize) {
        callStackVariation = ` ${green}-${lastCallStackSize - currentCallStackSize}`;
      } else {
        callStackVariation = '';
      }
      replIO.output(`${cyan}call stack: ${yellow}${state.callStack.length}${callStackVariation}${white}\r\n`);

      replIO.output(
        state.callStack
          .map(({ value, operatorState }) =>
            toString(value, { operatorState, includeDebugSource: true, maxWidth: replIO.width })
              .replace(
                new RegExp(TOSTRING_BEGIN_MARKER + '.*' + TOSTRING_END_MARKER, 'g'),
                (match: string): string => `${yellow}${match}${white}`
              )
              .replace(/@.*$/g, (match: string): string => `${blue}${match}${white}`)
              .replace(/…|↵|⭲/g, (match: string): string => `${blue}${match}${white}`)
          )
          .join('\r\n') + `${white}\r\n`
      );
    } else {
      replIO.output('∅ call stack is empty\r\n');
    }
    replIO.output(
      status(state, {
        cycle,
        absolute: true,
        lastOperandsCount,
        lastUsedMemory,
        concat: ` ${yellow}o${cyan}perands ${yellow}c${cyan}ontinue ${yellow}q${cyan}uit`
      })
    );
    lastOperandsCount = state.operands.length;
    lastUsedMemory = state.memoryTracker.used;
    lastCallStackSize = state.callStack.length;
    const step = await waitForChar();
    replIO.output('\b \b');
    if (step === 'o') {
      operands(replIO, state);
    } else if (step !== 'c') {
      break;
    }
    ++cycle;
    const { done } = iterator.next();
    if (done) {
      break;
    }
  }
  replIO.output('\x1b[1;1H\x1b[J'); // clear display
  return cycle;
}
