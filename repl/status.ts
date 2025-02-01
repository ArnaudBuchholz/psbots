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

export function formatCountVariation(last: number, current: number): { length: number; formatted: string } {
  if (current > last) {
    const formatted = `+${current - last}`;
    return {
      length: formatted.length + 1,
      formatted: ` ${red}${formatted}`
    };
  } else if (current < last) {
    const formatted = `-${last - current}`;
    return {
      length: formatted.length + 1,
      formatted: ` ${red}${formatted}`
    };
  }
  return { length: 0, formatted: '' };
}

export function formatMemoryVariation(last: number, current: number): { length: number; formatted: string } {
  if (current > last) {
    const formatted = `+${formatBytes(current - last)}`;
    return {
      length: formatted.length + 1,
      formatted: ` ${red}${formatted}`
    };
  } else if (current < last) {
    const formatted = `-${formatBytes(last - current)}`;
    return {
      length: formatted.length + 1,
      formatted: ` ${green}${formatted}`
    };
  }
  return { length: 0, formatted: '' };
}

export function status(state: IState, options: StatusOptions): string {
  let cycleLabel: string;
  if (options.absolute) {
    cycleLabel = 'cycle: #';
  } else {
    cycleLabel = 'cycles: ';
  }

  const currentOperandsCount = state.operands.length;
  const operandsVariation = formatCountVariation(
    options.lastOperandsCount ?? currentOperandsCount,
    currentOperandsCount
  ).formatted;

  const currentUsedMemory = state.memoryTracker.used;
  const memoryVariation = formatMemoryVariation(
    options.lastUsedMemory ?? currentUsedMemory,
    currentUsedMemory
  ).formatted;

  let flags = '';
  if (!state.callEnabled) {
    flags += ` ${red}!call`;
  }
  if (state.exception) {
    flags += ` ${red}❌${state.exception}`;
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
