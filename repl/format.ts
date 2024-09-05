import { enumIArrayValues } from '@psbots/engine';
import type { IReadOnlyArray, IState } from '@psbots/engine';
import { toString } from '@psbots/engine/sdk';
import type { IReplIO } from './IReplIO.js';
import { blue, cyan, /* green, red, white, */ yellow } from './colors.js';
import { memory } from './status.js';

function enumAndDisplay(replIO: IReplIO, values: IReadOnlyArray): void {
  let index = 0;
  for (const value of enumIArrayValues(values)) {
    const formattedIndex = index.toString();
    const [instruction, debug] = toString(value, {
      includeDebugSource: true,
      maxWidth: replIO.width - formattedIndex.length - 1
    }).split('@');
    let debugInfo = '';
    if (debug) {
      debugInfo = `${blue}@${debug})`;
    }
    replIO.output(`${formattedIndex} ${instruction}${debugInfo}`);
    ++index;
  }
}

export function operands(replIO: IReplIO, state: IState): void {
  replIO.output(`${cyan}operands: ${yellow}${state.operands.length}`);
  enumAndDisplay(replIO, state.operands);
}

export function state(replIO: IReplIO, state: IState): void {
  const dictLength = state.dictionaries.length;
  replIO.output(`${cyan}memory: ${yellow}${memory(state)}`);
  replIO.output(`${cyan}dictionaries: ${yellow}${dictLength}`);
  enumAndDisplay(replIO, state.dictionaries);
  operands(replIO, state);
}
