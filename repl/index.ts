import type { IDebugSource } from '@psbots/engine';
import { createState } from '@psbots/engine';
import type { IInternalState } from '@psbots/engine/sdk';
import {
  BaseException,
  checkStringValue,
  InternalException,
  toString,
  TOSTRING_BEGIN_MARKER,
  TOSTRING_END_MARKER,
  toStringValue
} from '@psbots/engine/sdk';
import type { IReplIO } from './IReplIO.js';
import { blue, cyan, green, magenta, red, white, yellow } from './colors.js';
import { createHostDictionary } from './host/index.js';
import { ExitError } from './host/exit.js';
import { status } from './status.js';
import { buildInputHandler, InputError } from './inputHandler.js';
import { DebugError } from './host/debug.js';
import { operands } from './format.js';

export * from './IReplIO.js';

function showError(replIO: IReplIO, e: unknown) {
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
    if (e instanceof InternalException && typeof e.reason === 'object') {
      replIO.output(`${red}${JSON.stringify(e.reason, undefined, 2)}${white}\r\n`);
    }
  }
}

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
  let debugging: boolean;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    debugging = false;
    replIO.output('? ');
    try {
      const src = await waitForLines();
      let lastOperandsCount = state.operands.length;
      let lastUsedMemory = state.memoryTracker.used;
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

      let lastCallStackSize = 1;
      let { done } = iterator.next();
      while (done === false) {
        const { exception } = state;
        if (exception instanceof InternalException && exception.reason instanceof DebugError) {
          (state as IInternalState).exception = undefined;
          debugging = true;
        }
        while (debugging) {
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
          } else if (step === 'q') {
            debugging = false;
          } else {
            break;
          }
        }
        ++cycle;
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
