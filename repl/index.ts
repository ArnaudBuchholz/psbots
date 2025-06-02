import type { IDebugSource } from '@psbots/engine';
import { createState, run } from '@psbots/engine';
import { assert, toStringValue } from '@psbots/engine/sdk';
import type { IReplIO } from './IReplIo.js';
import { cyan, green, magenta, red, white, yellow } from './colors.js';
import { ReplHostDictionary } from './host/index.js';
import { status } from './status.js';
import { buildInputHandler, InputError } from './inputHandler.js';
import { showError, failed, showException } from './showError.js';
import { runWithDebugger } from './debug.js';
import { buildOptions } from './options.js';

class AbortError extends InputError {}

export * from './IReplIo.js';

function showVersion(replIO: IReplIO): boolean {
  const stateResult = createState();
  if (failed(replIO, stateResult, { message: 'Unable to allocate state' })) {
    return false;
  }
  const { value: state } = stateResult;
  run(state, 'version');
  const version = state.operands.at(0);
  assert(version.type === 'string');
  replIO.output(`${cyan}Welcome to 🤖${magenta}${version.string}${white}\r\n`);
  return true;
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- very little value / interest in refactoring this function
export async function repl(replIO: IReplIO, options: string[] = []): Promise<void> {
  if (!showVersion(replIO)) {
    return;
  }

  const hostDictionary = new ReplHostDictionary(replIO);
  const stateResult = createState({
    ...buildOptions(options, replIO),
    hostDictionary
  });
  if (failed(replIO, stateResult, { message: 'Unable to allocate state' })) {
    return;
  }
  const { value: state } = stateResult;

  replIO.output(`${cyan}Use '${yellow}exit${cyan}'  to quit${white}\r\n`);
  replIO.output(`${cyan}Use '${yellow}state${cyan}' to print a state summary${white}\r\n`);
  replIO.output(`${cyan}Use '${yellow}help${cyan}'  to display help${white}\r\n`);
  replIO.output(`${cyan}Use '${yellow}debug${cyan}' to use inbuilt debugger${white}\r\n`);

  let replIndex = 0;
  const { waitForLines, waitForChar } = buildInputHandler(replIO);

  while (!replIO.abort?.aborted) {
    replIO.output('? ');
    try {
      const source = await waitForLines();
      const lastOperandsCount = state.operands.length;
      const lastUsedMemory = state.memoryTracker.used;
      let cycle = 0;
      let lastCycleCheck = 0;

      const execResult = state.exec(
        Object.assign(
          {
            debugSource: <IDebugSource>{
              filename: `repl${replIndex++}`,
              pos: 0,
              length: source.length,
              source: source
            }
          },
          toStringValue(source, { isExecutable: true })
        )
      );
      assert(execResult);
      const { value: iterator } = execResult;

      let { done } = iterator.next();
      while (done === false && !replIO.abort?.aborted) {
        if (hostDictionary.debugIsOn) {
          cycle += await runWithDebugger({ replIO, state, hostDictionary, iterator, waitForChar });
        } else {
          ++cycle;
        }
        if (cycle - lastCycleCheck >= 100_000) {
          replIO.output(
            `⮔ The engine has completed ${yellow}${cycle}${white} cycles, ${green}a${white}bort or ${green}any${white} key to continue`
          );
          const key = await waitForChar();
          if (key !== '\n') {
            replIO.output('\n');
          }
          if (key === 'a') {
            throw new AbortError();
          }
          lastCycleCheck = cycle;
        }
        const next = iterator.next();
        done = next.done;
      }
      if (hostDictionary.exitCalled) {
        break;
      }
      if (state.exception !== undefined) {
        showException(replIO, state.exception, state.exceptionStack);
      }
      await hostDictionary.ready;
      replIO.output(
        status(state, {
          cycle,
          absolute: false,
          lastOperandsCount,
          lastUsedMemory
        })
      );
    } catch (error) {
      showError(replIO, error);
      if (error instanceof InputError) {
        break;
      }
    }
  }

  replIO.output(`${red}terminating...${white}\r\n`);
  try {
    state.destroy();
  } catch (error) {
    showError(replIO, error);
  }
  replIO.output(`${red}terminated.${white}\r\n`);
}
