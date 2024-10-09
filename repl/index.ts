import { createState, parse } from '@psbots/engine';
import { BaseException, checkStringValue, InternalException } from '@psbots/engine/sdk';
import type { IReplIO } from './IReplIO.js';
import { /* blue, */ cyan, green, magenta, red, white, /* white, */ yellow } from './colors.js';
import { createHostDictionary } from './host/index.js';
import { ExitError } from './host/exit.js';
import { status } from './status.js';

export * from './IReplIO.js';

function showError(replIO: IReplIO, e: unknown) {
  if (!(e instanceof BaseException)) {
    replIO.output(`${red}💣 Unknown error${white}\r\n`);
  } else {
    replIO.output(`${red}❌ ${e.message}${white}\r\n`);
    e.engineStack.forEach((line) => replIO.output(`${red}${line}${white}\r\n`));
    if (e instanceof InternalException && typeof e.reason === 'object') {
      replIO.output(`${red}${JSON.stringify(e.reason, undefined, 2)}${white}\r\n`);
    }
  }
}

function buildInputHandler(replIO: IReplIO): () => Promise<string> {
  const inputs: string[] = [];

  let newInput: () => void;
  let waitForInput = Promise.resolve();
  let newInputTimerId: ReturnType<typeof setTimeout> | undefined;

  const noInputs = () => {
    waitForInput = new Promise((resolve) => { newInput = resolve; });
  };
  noInputs();

  replIO.setInputBuffer({
    addLine(input: string) {
      if (newInputTimerId !== undefined) {
        clearTimeout(newInputTimerId);
      }
      inputs.push(input);
      newInputTimerId = setTimeout(newInput, 100);
    }
  });

  return async () => {
    if (inputs.length === 0) {
      await waitForInput;
    }
    const input = inputs.join('\n');
    inputs.length = 0;
    noInputs();
    return input;
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

  // eslint-disable-next-line no-constant-condition
  while (true) {
    replIO.output('? ');
    const src = await getInput();
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
        //   replHost.output(`${cyan}memory: ${yellow}${memory(state)}${white}\r\n`);
        //   replHost.output(`${cyan}dictionaries: ${yellow}${dictLength}${white}\r\n`);
        //   forEach(state.dictionaries, (value, formattedIndex) => {
        //     replHost.output(`${formattedIndex} ${formatters[value.type](value)}${white}\r\n`);
        //   });
        //   operands();
        // }

        // while (debugging) {
        //   if (typeof value === 'string') {
        //     replHost.output(`${blue}${value}${white}\r\n`);
        //   }
        //   replHost.output(
        //     renderCallStack(state.calls)
        //       .replace(/».*«/g, (match: string): string => `${yellow}${match}${white}`)
        //       .replace(/@.*\n/g, (match: string): string => `${blue}${match}${white}`)
        //       .replace(/\/!\\.*\n/g, (match: string): string => `${red}${match}${white}`)
        //       .replace(/…|↵|⭲/g, (match: string): string => `${blue}${match}${white}`)
        //     + `${white}\r\n`
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
