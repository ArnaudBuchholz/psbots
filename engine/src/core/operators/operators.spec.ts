import { describe, it, expect, beforeEach, afterEach, onTestFailed } from 'vitest';
import { parse } from '@api/index.js';
import type { OperatorDefinition } from './operators.js';
import { registry } from './operators.js';
import { State } from '@core/state/State.js';
import { toValue, waitForGenerator } from '@test/index.js';

const nullDefinition: OperatorDefinition = {
  name: 'null',
  description: '',
  labels: [],
  signature: {
    input: [],
    output: []
  },
  samples: []
};

let skipped = 0;
let debugCycles = 0;
let debugMilliseconds = 0;
let failed = false;

describe('executing in & out using debug', () => {
  Object.keys(registry)
    .sort()
    .forEach((operatorName) => {
      describe(`operators/${operatorName}`, () => {
        const definition: OperatorDefinition = registry[operatorName]?.definition ?? nullDefinition;
        let state: State;
        let expectedState: State;

        beforeEach(() => {
          state = new State({ debugMemory: true });
          expectedState = new State({ debugMemory: true });
        });

        afterEach(() => {
          expectedState.destroy();
          state.destroy();
        });

        it('exposes a definition', () => {
          expect(definition).not.toStrictEqual(nullDefinition);
        });

        definition.samples.forEach((sample, index) => {
          const missingOperators = [...parse(sample.in), ...parse(sample.out)]
            .filter((value) => value.type === 'string' && value.isExecutable)
            .map((value) => (value.type === 'string' ? value.string : ''))
            .filter((name) => !Object.prototype.hasOwnProperty.call(registry, name) && !name.startsWith('test'))
            .reduce((names, name) => (names.includes(name) ? names : [name, ...names]), <string[]>[]);
          const sampleId = `${operatorName}#${index}`;
          const description = sample.description ?? definition.description;
          if (missingOperators.length > 0) {
            it.skip(`[${sampleId}] ${description} (⚠️ ${missingOperators})`);
            ++skipped;
          } else {
            it(`[${sampleId}] ${description}`, () => {
              onTestFailed(() => {
                failed = true;
              });
              const start = performance.now();
              debugCycles += waitForGenerator(state.exec(toValue(sample.in, { isExecutable: true }))).length;
              debugCycles += waitForGenerator(expectedState.exec(toValue(sample.out, { isExecutable: true }))).length;
              debugMilliseconds += Math.ceil(performance.now() - start);
              if (expectedState.exception) {
                expect(state.exception).not.toBeUndefined();
                expect(state.exception).toBeInstanceOf(expectedState.exception.constructor);
              } else {
                expect(state.exception).toBeUndefined();
                expect(state.operands.ref.length).toStrictEqual(expectedState.operands.ref.length);
                // flatten differences between the two memory trackers
                Object.assign(state.memoryTracker, { _peak: 0 });
                Object.assign(expectedState.memoryTracker, { _peak: 0 });
                expect(state.memoryTracker.byType).toStrictEqual(expectedState.memoryTracker.byType);
                expect(state.operands.ref).toStrictEqual(expectedState.operands.ref);
              }
            });
          }
        });
      });
    });
});

let cycles = 0;
let milliseconds = 0;
let minMs = Number.POSITIVE_INFINITY;
let maxMs = 0;

describe.runIf(!failed)('executing in only (performance)', () => {
  Object.keys(registry)
    .sort()
    .forEach((operatorName) => {
      const definition: OperatorDefinition = registry[operatorName]?.definition ?? nullDefinition;
      if (!definition.samples.length) {
        return;
      }
      describe(`operators/${operatorName}`, () => {
        let state: State;

        beforeEach(() => {
          state = new State();
        });

        afterEach(() => {
          state.destroy();
        });

        definition.samples.forEach((sample, index) => {
          const missingOperators = [...parse(sample.in), ...parse(sample.out)]
            .filter((value) => value.type === 'string' && value.isExecutable)
            .map((value) => (value.type === 'string' ? value.string : ''))
            .filter((name) => !Object.prototype.hasOwnProperty.call(registry, name) && !name.startsWith('test'))
            .reduce((names, name) => (names.includes(name) ? names : [name, ...names]), <string[]>[]);
          const sampleId = `${operatorName}#${index}`;
          const description = sample.description ?? definition.description;
          if (missingOperators.length === 0) {
            it(`[${sampleId}] ${description}`, () => {
              const iterator = state.exec(toValue(sample.in, { isExecutable: true }));
              // eslint-disable-next-line no-constant-condition
              while (true) {
                const start = performance.now();
                const { done } = iterator.next();
                const timeSpent = performance.now() - start;
                ++cycles;
                milliseconds += timeSpent;
                minMs = Math.min(minMs, timeSpent);
                maxMs = Math.max(maxMs, timeSpent);
                if (done === true) {
                  break;
                }
              }
            });
          }
        });
      });
    });
});

describe('Execution report for operators', () => {
  if (skipped === 1) {
    it.skip('1 test is skipped');
  } else if (skipped > 0) {
    it.skip(`${skipped} tests are skipped`);
  }

  const round = (value: number) => Math.floor(value * 10000) / 10000;

  it('(debug) cycles/ms > 0', () => {
    const debugRatio = round(debugCycles / debugMilliseconds);
    console.log('(debug) cycles/ms', debugRatio);
    expect(debugRatio).toBeGreaterThan(0);
  });

  it.runIf(!failed)('cycles/ms > (debug) cycles/ms', () => {
    const ratio = round(cycles / milliseconds);
    console.log('cycles/ms', ratio);
    console.log('cycle (ms)', round(minMs), '<', round(milliseconds / cycles), '<', round(maxMs));
    const debugRatio = round(debugCycles / debugMilliseconds);
    expect(ratio).toBeGreaterThan(debugRatio);
  });
});
