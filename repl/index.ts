import { createState, parse } from '@psbots/engine';
import type { IInternalState } from '@psbots/engine/sdk';
import { BaseException, checkStringValue, InternalException, toString } from '@psbots/engine/sdk';
import type { IReplIO } from './IReplIO.js';
import { /* blue, */ blue, cyan, green, magenta, red, white, /* white, */ yellow } from './colors.js';
import { createHostDictionary } from './host/index.js';
import { ExitError } from './host/exit.js';
import { status } from './status.js';
import { buildInputHandler } from './inputHandler.js';
import { DebugError } from './host/debug.js';
import { operands } from './format.js';

export * from './IReplIO.js';

function showError(replIO: IReplIO, e: unknown) {
  if (!(e instanceof BaseException)) {
    let message: string;
    if (e instanceof Error) {
      message = e.toString();
    } else {
      message = JSON.stringify(e);
    }
    replIO.output(`${red}💣 Unknown error: ${message}${white}\r\n`);
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

  [...state.process(parse('version'))];
  const version = state.operands.at(0);
  checkStringValue(version);
  replIO.output(`${cyan}Welcome to 🤖${magenta}${version.string}${white}\r\n`);
  [...state.process(parse('pop'))];

  if (debug === true) {
    replIO.output(`${green}DEBUG mode enabled${white}\r\n`);
  }
  replIO.output(`${cyan}Use '${yellow}exit${cyan}'  to quit${white}\r\n`);
  replIO.output(`${cyan}Use '${yellow}state${cyan}' to print a state summary${white}\r\n`);
  replIO.output(`${cyan}Use '${yellow}help${cyan}'  to display help${white}\r\n`);

  let replIndex = 0;
  const getInput = buildInputHandler(replIO);
  let debugging = false;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    replIO.output('? ');
    const src = await getInput();
    try {
      let lastOperandsCount = state.operands.length;
      let lastUsedMemory = state.memoryTracker.used;
      let cycle = 0;

      const iterator = state.process(parse(src, 0, `repl${replIndex++}`));
      let { done } = iterator.next();
      while (done === false) {
        const { exception } = state;
        if (exception instanceof InternalException && exception.reason instanceof DebugError) {
          (state as IInternalState).exception = undefined;
          debugging = true;
        }
        while (debugging) {
          replIO.output(
            (state as IInternalState).calls.ref
              .map((value) =>
                toString(value, { includeDebugSource: true, maxWidth: replIO.width })
                  .replace(/».*«/g, (match: string): string => `${yellow}${match}${white}`)
                  .replace(/@.*\n/g, (match: string): string => `${blue}${match}${white}`)
                  .replace(/\/!\\.*\n/g, (match: string): string => `${red}${match}${white}`)
                  .replace(/…|↵|⭲/g, (match: string): string => `${blue}${match}${white}`)
              )
              .join('\r\n') + `${white}\r\n`
          );
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
          const step = await replIO.waitForKey();
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
