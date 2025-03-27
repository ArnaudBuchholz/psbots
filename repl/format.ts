import { enumIArrayValues } from '@psbots/engine';
import type { IReadOnlyArray, IState } from '@psbots/engine';
import { toString } from '@psbots/engine/sdk';
import type { IReplIO } from './IReplIo.js';
import { blue, cyan, white, /* green, red, white, */ yellow } from './colors.js';
import { memory } from './status.js';

type EnumAndDisplayOptions = {
  includeDebugSource: boolean;
  includeIndex: boolean;
};

export function enumAndDisplay(replIO: IReplIO, values: IReadOnlyArray, options?: EnumAndDisplayOptions): void {
  const { includeDebugSource, includeIndex } = {
    includeDebugSource: true,
    includeIndex: true,
    ...options
  };
  let index = 0;
  for (const value of enumIArrayValues(values)) {
    const formattedIndex = index.toString();
    // TODO handle array
    let maxWidth = replIO.width;
    if (includeIndex) {
      maxWidth -= formattedIndex.length + 1;
    }
    const formatted = toString(value, { includeDebugSource, maxWidth });
    const withDebugInfo = formatted.match(/^(.*)@([^:@]+:\d+:\d+)$/);
    let instruction = formatted;
    let debugInfo = '';
    if (withDebugInfo) {
      instruction = withDebugInfo[1]!;
      debugInfo = `${blue}@${withDebugInfo[2]}`;
    }
    if (includeIndex) {
      replIO.output(`${formattedIndex} ${instruction}${debugInfo}${white}\r\n`);
    } else {
      replIO.output(`${instruction}${debugInfo}${white}\r\n`);
    }
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
