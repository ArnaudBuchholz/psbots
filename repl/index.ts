import { createState, parse } from '@psbots/engine';
import { BaseException, InternalException } from '@psbots/engine/sdk';
import type { IReplIO } from './IReplIO.js';
import { /* blue, */ cyan, green, red, /* white, */ yellow } from './colors.js';
import { createHostDictionary } from './host/index.js';
import { ExitError } from './host/exit.js';
import { status } from './status.js';

export * from './IReplIO.js';

function showError(replIO: IReplIO, e: unknown) {
  if (!(e instanceof BaseException)) {
    replIO.output(`${red}(X) Unknown error`);
  } else {
    replIO.output(`${red}/!\\ ${e.message}`);
    e.engineStack.forEach((line) => replIO.output(`${red}${line}`));
  }
}

export async function repl(replIO: IReplIO, debug?: boolean): Promise<void> {
  if (debug === true) {
    replIO.output(`${green}DEBUG mode enabled`);
  }
  replIO.output(`${cyan}Use '${yellow}exit${cyan}' to quit`);
  replIO.output(`${cyan}Use '${yellow}state${cyan}' to print a state summary`);

  const state = createState({
    hostDictionary: createHostDictionary(replIO),
    debugMemory: debug
  });
  let replIndex = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const src = await replIO.input();
    try {
      const lastOperandsCount = state.operands.length;
      const lastUsedMemory = state.memoryTracker.used;
      let cycle = 0;
      // const debugging = false;

      const iterator = state.process(parse(src, 0, `repl${replIndex++}`));
      let { done /*, value */ } = iterator.next();
      while (done === false) {
        // let nextValue: unknown;
        // if (value === $state) {
        //   const dictLength = state.dictionaries.length;
        //   replHost.output(`${cyan}memory: ${yellow}${memory(state)}`);
        //   replHost.output(`${cyan}dictionaries: ${yellow}${dictLength}`);
        //   forEach(state.dictionaries, (value, formattedIndex) => {
        //     replHost.output(`${formattedIndex} ${formatters[value.type](value)}`);
        //   });
        //   operands();
        // }

        // while (debugging) {
        //   if (typeof value === 'string') {
        //     replHost.output(`${blue}${value}`);
        //   }
        //   replHost.output(
        //     renderCallStack(state.calls)
        //       .replace(/».*«/g, (match: string): string => `${yellow}${match}${white}`)
        //       .replace(/@.*\n/g, (match: string): string => `${blue}${match}${white}`)
        //       .replace(/\/!\\.*\n/g, (match: string): string => `${red}${match}${white}`)
        //       .replace(/…|↵|⭲/g, (match: string): string => `${blue}${match}${white}`)
        //   );
        //   replHost.output(
        //     status(state, {
        //       cycle,
        //       absolute: true,
        //       lastOperandsCount,
        //       lastUsedMemory,
        //       concat: ` ${yellow}o${cyan}perands ${yellow}c${cyan}ontinue ${yellow}q${cyan}uit`
        //     })
        //   );
        //   lastOperandsCount = state.operands.length;
        //   lastUsedMemory = state.memory.used;
        //   const step = await replHost.getChar();
        //   if (step === 'o') {
        //     operands();
        //   } else if (step === 'q') {
        //     debugging = false;
        //   } else {
        //     break;
        //   }
        // }

        ++cycle;
        const next = iterator.next();
        done = next.done;
        // value = next.value;
      }
      const { exception } = state;
      if (exception instanceof InternalException && exception.reason instanceof ExitError) {
        break;
      }
      if (exception !== undefined) {
        replIO.output(`${red}/!\\ ${exception.message}`);
        exception.engineStack.forEach((line) => replIO.output(`${red}${line}`));
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

  replIO.output(`${red}terminating...`);
  try {
    state.destroy();
  } catch (e) {
    showError(replIO, e);
  }
  replIO.output(`${red}terminated.`);
}
