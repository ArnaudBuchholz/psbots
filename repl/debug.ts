import type { IState } from '@psbots/engine';
import type { IReplIO } from './IReplIo.js';
import { toString, TOSTRING_BEGIN_MARKER, TOSTRING_END_MARKER } from '@psbots/engine/sdk';
import { blue, cyan, /* cyan, */ green, magenta, red, white, yellow } from './colors.js';
import { formatCountVariation, formatMemoryVariation } from './status.js';
import { enumAndDisplay, operands } from './format.js';
import { formatBytes } from './formatBytes.js';
import type { ReplHostDictionary } from 'host/index.js';

type DebugParameters = {
  replIO: IReplIO;
  state: IState;
  hostDictionary: ReplHostDictionary;
  iterator: Generator;
  waitForChar: () => Promise<string>;
};

const border = magenta;
const shortcut = green;
const clearDisplay = '\u001B[1;1H\u001B[J';

function colorize(string: string): string {
  const chars = [...string];
  const beginMarkerPos = chars.indexOf(TOSTRING_BEGIN_MARKER);
  const endMarkerPos = chars.indexOf(TOSTRING_END_MARKER, beginMarkerPos);
  if (beginMarkerPos !== -1 && endMarkerPos !== -1) {
    chars.splice(endMarkerPos + 1, 0, white);
    chars.splice(beginMarkerPos, 0, yellow);
  }
  const sourcePos = chars.lastIndexOf('@');
  if (sourcePos !== -1) {
    chars.splice(sourcePos, 0, blue);
    chars.push(white);
  }
  return chars.map((char) => ('…↵⭲'.includes(char) ? `${blue}${char}${white}` : char)).join('');
}

function renderCycleAndMemoryInfo({
  replIO,
  state,
  cycle,
  width,
  lastUsedMemory
}: {
  replIO: IReplIO;
  state: IState;
  cycle: number;
  width: number;
  lastUsedMemory: number;
}): number {
  const cycleLength = cycle.toString().length;
  const cycleInfoLength = 8 + cycleLength;
  const cycleInfo = `${white}Cycle: #${yellow}${cycle.toString()}`;

  const spaceLeftForMemory = width - 3 /* ┌┬┐ */ - cycleInfoLength;

  replIO.output(`${border}┌${''.padStart(cycleInfoLength, '─')}┬${''.padStart(spaceLeftForMemory, '─')}┐`);

  const memoryVariation = formatMemoryVariation(lastUsedMemory, state.memoryTracker.used);
  const currentMemory = formatBytes(state.memoryTracker.used);
  let memoryInfoLength = 8 + currentMemory.length;
  let memoryInfo = `${shortcut}M${white}emory: ${yellow}${currentMemory}`;
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
    `│${cycleInfo}${border}│${memoryInfo}${''.padStart(spaceLeftForMemory - memoryInfoLength, ' ')}${border}│`
  );

  return cycleInfoLength;
}

function renderOperandAndCallStacksTitle({
  replIO,
  state,
  width,
  cycleInfoLength,
  lastOperandsCount,
  lastCallStackSize
}: {
  replIO: IReplIO;
  state: IState;
  width: number;
  cycleInfoLength: number;
  lastOperandsCount: number;
  lastCallStackSize: number;
}): {
  operandsWidth: number;
  callStackWidth: number;
} {
  const operandsWidth = Math.floor((width - 3) / 2);
  const callStackWidth = width - 3 - operandsWidth;
  replIO.output(
    `${border}├${''.padStart(cycleInfoLength, '─')}┴${''.padStart(operandsWidth - cycleInfoLength - 1, '─')}┬${''.padStart(callStackWidth, '─')}┤`
  );

  const operandsVariation = formatCountVariation(lastOperandsCount, state.operands.length);
  let operandsInfo = `${shortcut}O${white}perands: ${yellow}${state.operands.length}`;
  let operandsInfoSize = 10 + state.operands.length.toString().length;
  if (operandsInfoSize + operandsVariation.length < operandsWidth) {
    operandsInfo += operandsVariation.formatted;
    operandsInfoSize += operandsVariation.length;
  }
  replIO.output(`${border}│${operandsInfo}${''.padStart(operandsWidth - operandsInfoSize, ' ')}`);

  const callStackVariation = formatCountVariation(lastCallStackSize, state.calls.length);
  let callStackInfo = `${white}C${shortcut}a${white}ll stack: ${yellow}${state.calls.length}`;
  let callStackInfoSize = 12 + state.calls.length.toString().length;
  let exceptionInfo = '';
  let exceptionInfoSize = 0;
  if (state.exception) {
    exceptionInfo = ` ${red}❌${state.exception}`;
    exceptionInfoSize = state.exception.length + 2;
  }
  if (callStackInfoSize + callStackVariation.length + exceptionInfoSize < callStackWidth) {
    callStackInfo += callStackVariation.formatted + exceptionInfo;
    callStackInfoSize += callStackVariation.length + exceptionInfoSize;
  } else if (callStackInfoSize + exceptionInfoSize < callStackWidth) {
    callStackInfo += exceptionInfo;
    callStackInfoSize += exceptionInfoSize;
  } else if (state.exception && callStackInfoSize + 2 < callStackWidth) {
    callStackInfo += ' ❌';
    callStackInfoSize += 2;
  }

  replIO.output(`${border}│${callStackInfo}${''.padStart(callStackWidth - callStackInfoSize, ' ')}${border}│`);

  return { operandsWidth, callStackWidth };
}

function renderOperandAndCallStacks({
  replIO,
  state,
  operandsWidth,
  callStackWidth
}: {
  replIO: IReplIO;
  state: IState;
  operandsWidth: number;
  callStackWidth: number;
}): void {
  const callStack = state.calls;
  for (let index = 0; index < 5; ++index) {
    replIO.output(`${border}│${white}`);

    const operand = state.operands.at(index);
    if (null === operand) {
      replIO.output(''.padStart(operandsWidth, ' '));
    } else {
      const operandInfo = toString(operand, { maxWidth: operandsWidth, includeDebugSource: true });
      replIO.output(`${colorize(operandInfo)}${''.padStart(operandsWidth - operandInfo.length, ' ')}`);
    }

    replIO.output(`${border}│${white}`);

    if (index < callStack.length) {
      const value = state.calls.at(index);
      const operatorState = state.calls.operatorStateAt(index);
      const callStackInfo = toString(value, { maxWidth: callStackWidth, operatorState, includeDebugSource: true });
      const callStackInfoSize = callStackInfo.length;
      replIO.output(`${colorize(callStackInfo)}${''.padStart(callStackWidth - callStackInfoSize, ' ')}`);
    } else {
      replIO.output(''.padStart(callStackWidth, ' '));
    }
    replIO.output(`${border}│`);
  }

  replIO.output(`${border}└${''.padStart(operandsWidth, '─')}┴${''.padStart(callStackWidth, '─')}┘`);
}

function dumpOperands(replIO: IReplIO, state: IState, waitForChar: DebugParameters['waitForChar']) {
  replIO.output(clearDisplay);
  operands(replIO, state);
  replIO.output(`${shortcut}any${white} key to continue`);
  return waitForChar();
}

function dumpCallStack(replIO: IReplIO, state: IState, waitForChar: DebugParameters['waitForChar']) {
  replIO.output(clearDisplay);
  replIO.output(`${cyan}call stack: ${yellow}${state.calls.length}${white}\r\n`);
  enumAndDisplay(replIO, state.calls);
  replIO.output(`${shortcut}any${white} key to continue`);
  return waitForChar();
}

async function dumpMemory(replIO: IReplIO, state: IState, waitForChar: DebugParameters['waitForChar']) {
  const snapshot = state.memoryTracker.snapshot();
  let c = ' ';
  while ('ust '.includes(c)) {
    replIO.output(clearDisplay);
    replIO.output(`${cyan}memory : ${yellow}${formatBytes(state.memoryTracker.used)}${white} / ${yellow}`);
    replIO.output(state.memoryTracker.total === Number.POSITIVE_INFINITY ? '∞' : formatBytes(state.memoryTracker.total));
    replIO.output(`${white}\r\n`);
    replIO.output(`${shortcut}u${blue}ser   : ${yellow}${formatBytes(state.memoryTracker.byType.user)}${white}\r\n`);
    replIO.output(`${shortcut}s${blue}trings: ${yellow}${formatBytes(state.memoryTracker.byType.string)}${white}\r\n`);
    if (c === 's') {
      for (const stringInfo of snapshot.string) {
        replIO.output(
          `${stringInfo.references}x ${yellow}${stringInfo.string}${white} (${yellow}${formatBytes(stringInfo.size)}${white})\r\n`
        );
      }
    }
    replIO.output(
      `${blue}sys${shortcut}t${blue}em : ${yellow}${formatBytes(state.memoryTracker.byType.system)}${white}\r\n`
    );
    replIO.output(`${shortcut}c${white}ontinue`);
    c = await waitForChar();
  }
}

export async function runWithDebugger({
  replIO,
  state,
  hostDictionary,
  iterator,
  waitForChar
}: DebugParameters): Promise<number> {
  let lastOperandsCount = state.operands.length;
  let lastUsedMemory = state.memoryTracker.used;
  let lastCallStackSize = state.calls.length;
  let cycle = 0;

  while (hostDictionary.debugIsOn) {
    const { width, height } = replIO;
    if (width < 40 || height < 10) {
      replIO.output(`${red}⚠️ Output too small for debugger${white}\n`);
      return 0;
    }

    replIO.output(clearDisplay);
    const cycleInfoLength = renderCycleAndMemoryInfo({ replIO, state, cycle, width, lastUsedMemory });
    const { operandsWidth, callStackWidth } = renderOperandAndCallStacksTitle({
      replIO,
      state,
      width,
      cycleInfoLength,
      lastOperandsCount,
      lastCallStackSize
    });
    renderOperandAndCallStacks({ replIO, state, operandsWidth, callStackWidth });

    replIO.output(`${shortcut}c${white}ontinue ${shortcut}q${white}uit`);

    lastOperandsCount = state.operands.length;
    lastUsedMemory = state.memoryTracker.used;
    lastCallStackSize = state.calls.length;

    const step = await waitForChar();
    replIO.output('\b \b');
    if (step === 'o') {
      await dumpOperands(replIO, state, waitForChar);
      break;
    } else if (step === 'a') {
      await dumpCallStack(replIO, state, waitForChar);
      break;
    } else if (step === 'm') {
      await dumpMemory(replIO, state, waitForChar);
      break;
    } else if (step === 'q') {
      hostDictionary.debug(false);
      break;
    }

    ++cycle;
    const { done } = iterator.next();
    if (done) {
      break;
    }
  }
  replIO.output(clearDisplay);
  return cycle;
}
