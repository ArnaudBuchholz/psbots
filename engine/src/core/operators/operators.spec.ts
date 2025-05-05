import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { enumIArrayValues, parse } from '@api/index.js';
import type { OperatorDefinition } from './operators.js';
import { registry } from './operators.js';
import type { StateFactorySettings } from '@core/state/State.js';
import { State } from '@core/state/State.js';
import { toValue, waitForExec } from '@test/index.js';
import { assert } from '@sdk/index.js';

const nullDefinition: OperatorDefinition = {
  name: 'null',
  description: '',
  labels: [],
  samples: []
};

function executeOperatorsTests(settings: Partial<StateFactorySettings> = {}) {
  const settingsString = JSON.stringify(settings);
  const label =
    settingsString === '{}' ? 'executing in & out using debug' : `executing in & out using debug ${settingsString}`;
  describe(label, () => {
    for (const operatorName of Object.keys(registry).sort()) {
      describe(`operators/${operatorName}`, () => {
        const definition: OperatorDefinition = registry[operatorName]?.definition ?? nullDefinition;
        let state: State;
        let expectedState: State;

        beforeEach(() => {
          const stateResult = State.create({ debugMemory: true });
          assert(stateResult);
          state = stateResult.value;
          const expectedStateResult = State.create({ debugMemory: true });
          assert(expectedStateResult);
          expectedState = expectedStateResult.value;
        });

        afterEach(() => {
          expectedState.destroy();
          state.destroy();
        });

        it('exposes a definition', () => {
          expect(definition).not.toStrictEqual(nullDefinition);
        });

        for (const [index, sample] of definition.samples.entries()) {
          const missingOperators = [...parse(sample.in), ...parse(sample.out)]
            .filter((value) => value.type === 'string' && value.isExecutable)
            .map((value) => (value.type === 'string' ? value.string : ''))
            .filter((name) => !Object.prototype.hasOwnProperty.call(registry, name) && !name.startsWith('test'))
            .filter((name, index, names) => names.indexOf(name) === index);
          const sampleId = `${operatorName}#${index}`;
          const description = sample.description ?? definition.description;
          if (missingOperators.length > 0) {
            it.skip(`[${sampleId}] ${description} (⚠️ ${missingOperators})`);
          } else {
            it(`[${sampleId}] ${description}`, () => {
              waitForExec(state.exec(toValue(sample.in, { isExecutable: true })));
              waitForExec(expectedState.exec(toValue(sample.out, { isExecutable: true })));
              if (expectedState.exception) {
                expect(state.exception).not.toBeUndefined();
                expect(state.exception).toStrictEqual(expectedState.exception);
              } else {
                expect(state.exception).toBeUndefined();
                expect(state.operands.length).toStrictEqual(expectedState.operands.length);
                // flatten differences between the two memory trackers
                Object.assign(state.memoryTracker, { _peak: 0 });
                Object.assign(expectedState.memoryTracker, { _peak: 0 });
                expect(state.memoryTracker.byType).toStrictEqual(expectedState.memoryTracker.byType);
                expect([...enumIArrayValues(state.operands)]).toStrictEqual([
                  ...enumIArrayValues(expectedState.operands)
                ]);
              }
            });
          }
        }
      });
    }
  });
}

executeOperatorsTests();
executeOperatorsTests({ experimentalGarbageCollector: true });
