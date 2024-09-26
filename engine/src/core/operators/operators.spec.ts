import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parse } from '@api/index.js';
import type { OperatorDefinition } from './operators.js';
import { registry } from './operators.js';
import { State } from '@core/state/State.js';
import { waitForGenerator } from '@test/wait-for-generator.js';

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
              const start = performance.now();
              debugCycles += waitForGenerator(state.process(sample.in)).length;
              debugCycles += waitForGenerator(expectedState.process(sample.out)).length;
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

describe('executing in only (performance)', () => {
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
              const start = performance.now();
              cycles += waitForGenerator(state.process(sample.in)).length;
              milliseconds += Math.ceil(performance.now() - start);
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

  it('(debug) cycles/ms > 0', () => {
    const debugRatio = Math.floor((100 * debugCycles) / debugMilliseconds) / 100;
    console.log('(debug) cycles/ms', debugRatio);
    expect(debugRatio).toBeGreaterThan(0);
  });

  it('cycles/ms > (debug) cycles/ms', () => {
    const debugRatio = Math.floor((100 * debugCycles) / debugMilliseconds) / 100;
    const ratio = Math.floor((100 * cycles) / milliseconds) / 100;
    console.log('cycles/ms', ratio);
    expect(ratio).toBeGreaterThan(debugRatio);
  });
});
