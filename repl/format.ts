import { enumIArrayValues } from '@psbots/engine';
import type { IReadOnlyArray, IReadOnlyCallStack, IState } from '@psbots/engine';
import type { ToStringOptions } from '@psbots/engine/sdk';
import { valueToString } from '@psbots/engine/sdk';
import type { IReplIO } from './IReplIo.js';
import { blue, cyan, white, /* green, red, white, */ yellow } from './colors.js';
import { memory } from './status.js';

type EnumAndDisplayOptions = {
  includeDebugSource?: boolean;
  includeIndex?: boolean;
  callstack?: boolean;
  format?: (output: string) => string;
};

export function enumAndDisplay(
  replIO: IReplIO,
  values: IReadOnlyArray | IReadOnlyCallStack,
  options?: EnumAndDisplayOptions
): void {
  const { includeDebugSource, includeIndex, callstack, format } = {
    includeDebugSource: true,
    includeIndex: true,
    callstack: false,
    format: (text: string) => text,
    ...options
  };
  let index = 0;
  for (const value of enumIArrayValues(values as IReadOnlyArray)) {
    const formattedIndex = index.toString();
    let maxWidth = replIO.width;
    if (includeIndex) {
      maxWidth -= formattedIndex.length + 1;
    }
    let operatorState: ToStringOptions['operatorState'] | undefined;
    if (callstack) {
      operatorState = (values as IReadOnlyCallStack).operatorStateAt(index);
    }
    const formatted = valueToString(value, { includeDebugSource, maxWidth, operatorState });
    const withDebugInfo = /^(.*)@([^:@]+:\d+:\d+)$/.exec(formatted);
    let instruction = formatted;
    let debugInfo = '';
    if (withDebugInfo) {
      instruction = withDebugInfo[1]!;
      debugInfo = `${blue}@${withDebugInfo[2]}`;
    }
    replIO.output(format(`${includeIndex ? formattedIndex + ' ' : ''}${instruction}${debugInfo}${white}\r\n`));
    ++index;
  }
}

export function operands(replIO: IReplIO, state: IState): void {
  replIO.output(`${cyan}operands: ${yellow}${state.operands.length}${white}\r\n`);
  enumAndDisplay(replIO, state.operands);
}

export function state(replIO: IReplIO, state: IState): void {
  const dictLength = state.dictionaries.length;
  replIO.output(`${cyan}memory: ${yellow}${memory(state)}${white}\r\n`);
  replIO.output(`${cyan}dictionaries: ${yellow}${dictLength}${white}\r\n`);
  enumAndDisplay(replIO, state.dictionaries);
  operands(replIO, state);
}
