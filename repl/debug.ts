import type { IMemorySnapshot, IState } from '@psbots/engine';
import type { IReplIO } from './IReplIo.js';
import { assert, valueToString, TOSTRING_BEGIN_MARKER, TOSTRING_END_MARKER } from '@psbots/engine/sdk';
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
    exceptionInfo = ` ${red}❌ ${state.exception}`;
    exceptionInfoSize = state.exception.length + 3;
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
    const operandInfo = valueToString(operand, { maxWidth: operandsWidth, includeDebugSource: true });
    replIO.output(`${colorize(operandInfo)}${''.padStart(operandsWidth - operandInfo.length, ' ')}`);

    replIO.output(`${border}│${white}`);

    if (index < callStack.length) {
      const value = state.calls.at(index);
      const operatorState = state.calls.operatorStateAt(index);
      const callStackInfo = valueToString(value, { maxWidth: callStackWidth, operatorState, includeDebugSource: true });
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
  enumAndDisplay(replIO, state.calls, { callstack: true, format: colorize });
  replIO.output(`${shortcut}any${white} key to continue`);
  return waitForChar();
}

function dumpMemoryContainers(replIO: IReplIO, snapshot: IMemorySnapshot, type: 'user' | 'system') {
  const containerSnapshots = snapshot[type];
  if (containerSnapshots.length === 0 && snapshot.byType[type] !== 0) {
    replIO.output(`${red}No memory containers registered, use --debug-memory${white}\r\n`);
    return;
  }
  for (const containerSnapshot of containerSnapshots) {
    replIO.output(
      `${white}${containerSnapshot.container.class}: ${yellow}${formatBytes(containerSnapshot.total)}${white}\r\n`
    );
  }
}

async function dumpMemory(replIO: IReplIO, state: IState, waitForChar: DebugParameters['waitForChar']) {
  const snapshot = state.memoryTracker.snapshot();
  let key = ' ';
  while ('ust '.includes(key)) {
    replIO.output(clearDisplay);
    replIO.output(`${cyan}memory : ${yellow}${formatBytes(state.memoryTracker.used)}${white} / ${yellow}`);
    replIO.output(
      state.memoryTracker.total === Number.POSITIVE_INFINITY ? '∞' : formatBytes(state.memoryTracker.total)
    );
    replIO.output(`${white}\r\n`);
    replIO.output(`${shortcut}u${blue}ser   : ${yellow}${formatBytes(state.memoryTracker.byType.user)}${white}\r\n`);
    if (key === 'u') {
      dumpMemoryContainers(replIO, snapshot, 'user');
    }
    replIO.output(`${shortcut}s${blue}trings: ${yellow}${formatBytes(state.memoryTracker.byType.string)}${white}\r\n`);
    if (key === 's') {
      for (const stringInfo of snapshot.string) {
        replIO.output(
          `${stringInfo.references}x ${yellow}${stringInfo.string}${white} (${yellow}${formatBytes(stringInfo.size)}${white})\r\n`
        );
      }
    }
    replIO.output(
      `${blue}sys${shortcut}t${blue}em : ${yellow}${formatBytes(state.memoryTracker.byType.system)}${white}\r\n`
    );
    if (key === 't') {
      dumpMemoryContainers(replIO, snapshot, 'system');
    }
    replIO.output(`${shortcut}any${white} key to continue`);
    key = await waitForChar();
    key = key.toLowerCase();
  }
}

async function dumpDictionaries(replIO: IReplIO, state: IState, waitForChar: DebugParameters['waitForChar']) {
  let key = ' ';
  while ('0123456789 '.includes(key)) {
    replIO.output(clearDisplay);
    if (key === ' ') {
      replIO.output(`${cyan}dictionaries: ${yellow}${state.dictionaries.length}${white}\r\n`);
      enumAndDisplay(replIO, state.dictionaries);
    } else {
      const index = Number.parseInt(key, 10);
      if (index < state.dictionaries.length) {
        const dictionaryValue = state.dictionaries.at(index);
        replIO.output(`${cyan}${index}${white} ${valueToString(dictionaryValue)}\r\n`);
        assert(dictionaryValue.type === 'dictionary');
        const { dictionary } = dictionaryValue;
        const names = dictionary.names;
        for (const name of names) {
          const value = dictionary.lookup(name);
          replIO.output(
            `${yellow}${name}${white}: ${valueToString(value, { maxWidth: replIO.width - name.length - 3 })}\r\n`
          );
        }
      } else {
        replIO.output(`${red}No dictionary${white}\r\n`);
      }
    }
    replIO.output(
      `[${shortcut}0${white}...${shortcut}9${white}] to inspect dictionary, ${shortcut}any${white} key to continue`
    );
    key = await waitForChar();
    key = key.toLowerCase();
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

    replIO.output(
      `${shortcut}D${white}ictionaries (${state.dictionaries.length}), ${shortcut}q${white}uit, ${shortcut}any${white} key to continue`
    );

    lastOperandsCount = state.operands.length;
    lastUsedMemory = state.memoryTracker.used;
    lastCallStackSize = state.calls.length;

    const key = await waitForChar();
    const step = key.toLowerCase();
    replIO.output('\b \b');
    if (step === 'o') {
      await dumpOperands(replIO, state, waitForChar);
      continue;
    } else if (step === 'd') {
      await dumpDictionaries(replIO, state, waitForChar);
      continue;
    } else if (step === 'a') {
      await dumpCallStack(replIO, state, waitForChar);
      continue;
    } else if (step === 'm') {
      await dumpMemory(replIO, state, waitForChar);
      continue;
    } else if (step === 'q') {
      hostDictionary.debug(false);
      break;
    }

    ++cycle;
    const { done } = iterator.next();
    await replIO.on?.('cycle', { state });
    if (done) {
      break;
    }
  }
  replIO.output(clearDisplay);
  return cycle;
}
