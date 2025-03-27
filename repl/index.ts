import type { IDebugSource } from '@psbots/engine';
import { createState, ValueType } from '@psbots/engine';
import { assert, toStringValue } from '@psbots/engine/sdk';
import type { IReplIO } from './IReplIO.js';
import { cyan, green, magenta, red, white, yellow } from './colors.js';
import { ReplHostDictionary } from './host/index.js';
import { status } from './status.js';
import { buildInputHandler, InputError } from './inputHandler.js';
import { showError, failed, showException } from './showError.js';
import { runWithDebugger } from './debug.js';

export * from './IReplIO.js';

function showVersion(replIO: IReplIO): boolean {
  const stateResult = createState();
  if (failed(replIO, stateResult, { message: 'Unable to allocate state' })) {
    return false;
  }
  const { value: state } = stateResult;

  const execVersionResult = state.exec(toStringValue('version', { isExecutable: true }));
  if (failed(replIO, execVersionResult, { message: 'Unable to execute version' })) {
    return false;
  }
  [...execVersionResult.value];
  const version = state.operands.at(0);
  assert(version.type === ValueType.string);
  replIO.output(`${cyan}Welcome to 🤖${magenta}${version.string}${white}\r\n`);
  return true;
}

export async function repl(replIO: IReplIO, debug?: boolean): Promise<void> {
  if (!showVersion(replIO)) {
    return;
  }

  const hostDictionary = new ReplHostDictionary(replIO);
  const stateResult = createState({
    hostDictionary,
    debugMemory: debug
  });
  if (failed(replIO, stateResult, { message: 'Unable to allocate state' })) {
    return;
  }
  const { value: state } = stateResult;

  if (debug === true) {
    replIO.output(`${green}DEBUG mode enabled${white}\r\n`);
  }
  replIO.output(`${cyan}Use '${yellow}exit${cyan}'  to quit${white}\r\n`);
  replIO.output(`${cyan}Use '${yellow}state${cyan}' to print a state summary${white}\r\n`);
  replIO.output(`${cyan}Use '${yellow}help${cyan}'  to display help${white}\r\n`);

  let replIndex = 0;
  const { waitForLines, waitForChar } = buildInputHandler(replIO);

  while (true) {
    replIO.output('? ');
    try {
      const source = await waitForLines();
      const lastOperandsCount = state.operands.length;
      const lastUsedMemory = state.memoryTracker.used;
      let cycle = 0;

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
      while (done === false) {
        if (hostDictionary.debugCalled) {
          cycle += await runWithDebugger({ replIO, state, iterator, waitForChar });
        } else {
          ++cycle;
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
