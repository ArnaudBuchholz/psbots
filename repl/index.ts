import type { IDebugSource } from '@psbots/engine';
import { createState } from '@psbots/engine';
import type { IInternalState } from '@psbots/engine/sdk';
import { checkStringValue, InternalException, toStringValue } from '@psbots/engine/sdk';
import type { IReplIO } from './IReplIO.js';
import { cyan, green, magenta, red, white, yellow } from './colors.js';
import { createHostDictionary } from './host/index.js';
import { ExitError } from './host/exit.js';
import { status } from './status.js';
import { buildInputHandler, InputError } from './inputHandler.js';
import { DebugError } from './host/debug.js';
import { showError } from './showError.js';
import { runWithDebugger } from './debug.js';

export * from './IReplIO.js';

export async function repl(replIO: IReplIO, debug?: boolean): Promise<void> {
  const state = createState({
    hostDictionary: createHostDictionary(replIO),
    debugMemory: debug
  });

  [...state.exec(toStringValue('version', { isExecutable: true }))];
  const version = state.operands.at(0);
  checkStringValue(version);
  replIO.output(`${cyan}Welcome to 🤖${magenta}${version.string}${white}\r\n`);
  [...state.exec(toStringValue('pop', { isExecutable: true }))];

  if (debug === true) {
    replIO.output(`${green}DEBUG mode enabled${white}\r\n`);
  }
  replIO.output(`${cyan}Use '${yellow}exit${cyan}'  to quit${white}\r\n`);
  replIO.output(`${cyan}Use '${yellow}state${cyan}' to print a state summary${white}\r\n`);
  replIO.output(`${cyan}Use '${yellow}help${cyan}'  to display help${white}\r\n`);

  let replIndex = 0;
  const { waitForLines, waitForChar } = buildInputHandler(replIO);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    replIO.output('? ');
    try {
      const src = await waitForLines();
      const lastOperandsCount = state.operands.length;
      const lastUsedMemory = state.memoryTracker.used;
      let cycle = 0;

      const iterator = state.exec(
        Object.assign(
          {
            debugSource: <IDebugSource>{
              filename: `repl${replIndex++}`,
              pos: 0,
              length: src.length,
              source: src
            }
          },
          toStringValue(src, { isExecutable: true })
        )
      );

      let { done } = iterator.next();
      while (done === false) {
        const { exception } = state;
        if (exception instanceof InternalException && exception.reason instanceof DebugError) {
          (state as IInternalState).exception = undefined;
          cycle += await runWithDebugger({ replIO, state, iterator, waitForChar });
        } else {
          ++cycle;
        }
        const next = iterator.next();
        done = next.done;
      }
      const { exception } = state;
      if (exception instanceof InternalException && exception.reason instanceof ExitError) {
        break;
      }
      if (exception !== undefined) {
        showError(replIO, exception);
      }
      replIO.output(
        status(state, {
          cycle,
          absolute: false,
          lastOperandsCount,
          lastUsedMemory
        })
      );
    } catch (e) {
      showError(replIO, e);
      if (e instanceof InputError) {
        break;
      }
    }
  }

  replIO.output(`${red}terminating...${white}\r\n`);
  try {
    state.destroy();
  } catch (e) {
    showError(replIO, e);
  }
  replIO.output(`${red}terminated.${white}\r\n`);
}
