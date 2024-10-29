import type { IState } from '@psbots/engine';
import type { IReplIO } from './IReplIO.js';
import { toString, TOSTRING_BEGIN_MARKER, TOSTRING_END_MARKER } from '@psbots/engine/sdk';
import { blue, cyan, green, magenta, red, white, yellow } from './colors.js';
import { formatCountVariation, formatMemoryVariation, status } from './status.js';
import { operands } from './format.js';
import { formatBytes } from './formatBytes.js';

type DebugParameters = {
  replIO: IReplIO;
  state: IState;
  iterator: Generator;
  waitForChar: () => Promise<string>;
};

function colorize (string: string): string {
  return string
    .replace(
      new RegExp(TOSTRING_BEGIN_MARKER + '.*' + TOSTRING_END_MARKER, 'g'),
      (match: string): string => `${yellow}${match}${white}`
    )
    .replace(/@.*$/g, (match: string): string => `${blue}${match}${white}`)
    .replace(/…|↵|⭲/g, (match: string): string => `${blue}${match}${white}`)
}

export async function runWithDebugger({ replIO, state, iterator, waitForChar }: DebugParameters): Promise<number> {
  let lastOperandsCount = state.operands.length;
  let lastUsedMemory = state.memoryTracker.used;
  let lastCallStackSize = state.callStack.length;
  let cycle = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { width, height } = replIO;
    if (width < 40 || height < 10) {
      replIO.output(`${red}⚠️ Output too small for debugger${white}\n`);
      return 0;
    }

    replIO.output('\x1b[1;1H\x1b[J'); // clear display

    const cycleLength = cycle.toString().length;
    const cycleInfoLength = 8 + cycleLength;
    const cycleInfo = `${white}Cycle: #${yellow}${cycle.toString()}`;

    const spaceLeftForMemory = width - 3 /* ┌┬┐ */ - cycleInfoLength;

    replIO.output(`${magenta}┌${''.padStart(cycleInfoLength, '─')}┬${''.padStart(spaceLeftForMemory, '─')}┐`);

    const memoryVariation = formatMemoryVariation(lastUsedMemory, state.memoryTracker.used);
    const currentMemory = formatBytes(state.memoryTracker.used);
    let memoryInfoLength = 8 + currentMemory.length;
    let memoryInfo = `${yellow}M${white}emory: ${yellow}${currentMemory}`;
    if (memoryInfoLength + memoryVariation.length < spaceLeftForMemory) {
      memoryInfo += memoryVariation.formatted;
      memoryInfoLength += memoryVariation.length;
    }
    const memoryDetails = ` (user: ${formatBytes(state.memoryTracker.byType.user)}, strings: ${formatBytes(state.memoryTracker.byType.string)}, system: ${formatBytes(state.memoryTracker.byType.system)})`;
    if (memoryInfoLength + memoryDetails.length <= spaceLeftForMemory) {
      memoryInfo += `${white}${memoryDetails}`;
      memoryInfoLength += memoryDetails.length;
    }
    replIO.output(
      `│${cycleInfo}${magenta}│${memoryInfo}${''.padStart(spaceLeftForMemory - memoryInfoLength, ' ')}${magenta}│`
    );

    const operandsWidth = Math.floor((width - 3) / 2);
    const callStackWidth = width - 3 - operandsWidth;
    replIO.output(
      `${magenta}├${''.padStart(cycleInfoLength, '─')}┴${''.padStart(operandsWidth - cycleInfoLength - 1, '─')}┬${''.padStart(callStackWidth, '─')}┤`
    );

    const operandsVariation = formatCountVariation(lastOperandsCount, state.operands.length);
    let operandsInfo = `${yellow}O${white}perands: ${yellow}${state.operands.length}`;
    let operandsInfoSize = 10 + state.operands.length.toString().length;
    if (operandsInfoSize + operandsVariation.length < operandsWidth) {
      operandsInfo += operandsVariation.formatted;
      operandsInfoSize += operandsVariation.length;
    }
    replIO.output(`${magenta}│${operandsInfo}${''.padStart(operandsWidth - operandsInfoSize, ' ')}`);

    const callStackVariation = formatCountVariation(lastCallStackSize, state.callStack.length);
    let callStackInfo = `${white}C${yellow}a${white}ll stack: ${yellow}${state.callStack.length}`;
    let callStackInfoSize = 12 + state.callStack.length.toString().length;
    if (callStackInfoSize + callStackVariation.length < callStackWidth) {
      callStackInfo += callStackVariation.formatted;
      callStackInfoSize += callStackVariation.length;
    }
    replIO.output(`${magenta}│${callStackInfo}${''.padStart(callStackWidth - callStackInfoSize, ' ')}${magenta}│`);

    replIO.output(`${magenta}│${''.padStart(operandsWidth, ' ')}│${''.padStart(callStackWidth, ' ')}│`);

    const callStack = state.callStack;
    for (let index = 0; index < 5; ++index) {
      replIO.output(`${magenta}│${white}`);

      const operand = state.operands.at(index);
      if (null === operand) {
        replIO.output(''.padStart(operandsWidth, ' '));
      } else {
        const operandInfo = toString(operand, { maxWidth: operandsWidth, includeDebugSource: true });
        replIO.output(`${colorize(operandInfo)}${''.padStart(operandsWidth - operandInfo.length, ' ')}`);
      }

      replIO.output(`${magenta}│${white}`);

      if (index < callStack.length) {
        const { value, operatorState } = state.callStack[index]!;
        const callStackInfo = toString(value, { maxWidth: callStackWidth, operatorState, includeDebugSource: true });
        const callStackInfoSize = callStackInfo.length;
        replIO.output(`${colorize(callStackInfo)}${''.padStart(callStackWidth - callStackInfoSize, ' ')}`);
      } else {
        replIO.output(''.padStart(callStackWidth, ' '));
      }
      replIO.output(`${magenta}│`);
    }

    replIO.output(`${magenta}└${''.padStart(operandsWidth, '─')}┴${''.padStart(callStackWidth, '─')}┘`);

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
    } else if (step !== 'c') {
      break;
    }
    ++cycle;
    const { done } = iterator.next();
    if (done) {
      break;
    }
  }
  replIO.output('\x1b[1;1H\x1b[J'); // clear display
  return cycle;
}
