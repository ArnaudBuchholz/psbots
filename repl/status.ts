import type { IState } from '@psbots/engine';
import { formatBytes } from './formatBytes.js';
import { blue, cyan, green, red, white, yellow } from './colors.js';

export function memory(state: IState): string {
  const { used, peak, total } = state.memoryTracker;
  const usage = formatBytes(used) + ' (top:' + formatBytes(peak) + ')' + blue + '/';
  if (total === Infinity) {
    return usage + '∞' + white;
  }
  return usage + formatBytes(total) + white;
}

interface StatusOptions {
  cycle: number;
  absolute: boolean;
  lastOperandsCount: number;
  lastUsedMemory: number;
  concat?: string;
}

export function status(state: IState, options: StatusOptions): string {
  let cycleLabel: string;
  if (options.absolute) {
    cycleLabel = 'cycle: #';
  } else {
    cycleLabel = 'cycles: ';
  }
  let operandsVariation = '';
  const { lastOperandsCount } = options;
  if (lastOperandsCount !== undefined) {
    const currentOperandsCount = state.operands.length;
    if (currentOperandsCount > lastOperandsCount) {
      operandsVariation = ` ${red}+${currentOperandsCount - lastOperandsCount}`;
    } else if (currentOperandsCount < lastOperandsCount) {
      operandsVariation = ` ${red}-${lastOperandsCount - currentOperandsCount}`;
    }
  }
  let memoryVariation = '';
  const { lastUsedMemory } = options;
  if (lastUsedMemory !== undefined) {
    const currentUsedMemory = state.memoryTracker.used;
    if (currentUsedMemory > lastUsedMemory) {
      memoryVariation = ` ${red}+${formatBytes(currentUsedMemory - lastUsedMemory)}`;
    } else if (currentUsedMemory < lastUsedMemory) {
      memoryVariation = ` ${green}-${formatBytes(lastUsedMemory - currentUsedMemory)}`;
    }
  }
  let flags = '';
  if (!state.callEnabled) {
    flags = ` ${red}!call`;
  }
  return [
    `${cyan}${cycleLabel}${yellow}${options.cycle}`,
    flags,
    `${cyan} operands: ${yellow}${state.operands.length}${operandsVariation}`,
    `${cyan} memory: ${yellow}${memory(state)}${memoryVariation}`,
    white,
    options.concat,
    white,
    '\r\n'
  ].join('');
}
