import type { IState } from '@psbots/engine';
import type { IReplIO } from './IReplIo.js';
import { toString, TOSTRING_BEGIN_MARKER, TOSTRING_END_MARKER } from '@psbots/engine/sdk';
import { blue, /* cyan, */ green, magenta, red, white, yellow } from './colors.js';
import { formatCountVariation, formatMemoryVariation } from './status.js';
import { operands } from './format.js';
import { formatBytes } from './formatBytes.js';

type DebugParameters = {
  replIO: IReplIO;
  state: IState;
  iterator: Generator;
  waitForChar: () => Promise<string>;
};

const border = magenta;
const shortcut = green;

function colorize(string: string): string {
  // const chars = [...string];
  // const beginMarkerPos = chars.indexOf(TOSTRING_BEGIN_MARKER);
  // const endMarkerPos = chars.indexOf(TOSTRING_END_MARKER, beginMarkerPos);
  // if (beginMarkerPos > -1 && endMarkerPos > -1) {
  //   chars.splice(endMarkerPos + 1, 0, white);
  //   chars.splice(beginMarkerPos + 1, 0, yellow);
  // }
  // const sourcePos = chars.lastIndexOf('@');
  // if (sourcePos > -1) {
  //   chars.splice(sourcePos + 1, 0, blue);
  //   chars.push(white);
  // }
  // TODO: 
  return string
    .replaceAll(
      // eslint-disable-next-line security/detect-non-literal-regexp -- both are constants
      new RegExp(TOSTRING_BEGIN_MARKER + '.*' + TOSTRING_END_MARKER, 'g'),
      (match: string): string => `${yellow}${match}${white}`
    )
    .replaceAll(/@.+$/g, (match: string): string => `${blue}${match}${white}`)
    .replaceAll(/[…↵⭲]/g, (match: string): string => `${blue}${match}${white}`);
}

export async function runWithDebugger({ replIO, state, iterator, waitForChar }: DebugParameters): Promise<number> {
  let lastOperandsCount = state.operands.length;
  let lastUsedMemory = state.memoryTracker.used;
  let lastCallStackSize = state.calls.length;
  let cycle = 0;

  // TODO: show dictionaries

  while (true) {
    const { width, height } = replIO;
    if (width < 40 || height < 10) {
      replIO.output(`${red}⚠️ Output too small for debugger${white}\n`);
      return 0;
    }

    replIO.output('\u001B[1;1H\u001B[J'); // clear display

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

    replIO.output(`${shortcut}c${white}ontinue ${shortcut}q${white}uit`);

    lastOperandsCount = state.operands.length;
    lastUsedMemory = state.memoryTracker.used;
    lastCallStackSize = state.calls.length;

    const step = await waitForChar();
    replIO.output('\b \b');
    if (step === 'o') {
      operands(replIO, state);
    } else if (step === 'q') {
      break;
    }

    ++cycle;
    const { done } = iterator.next();
    if (done) {
      break;
    }
  }
  replIO.output('\u001B[1;1H\u001B[J'); // clear display
  return cycle;
}
