import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parse } from '@api/index.js';
import type { OperatorDefinition } from './operators.js';
import { registry } from './operators.js';
import { State } from '@core/state/State.js';
import { waitForGenerator } from '@test/wait-for-generator.js';

const nullDefinition: OperatorDefinition = {
  name: 'null',
  description: '',
  signature: {
    input: []
  },
  samples: []
};

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
        const missingOperators = [...parse(sample.in)]
          .filter((value) => value.type === 'string' && value.isExecutable)
          .map((value) => (value.type === 'string' ? value.string : ''))
          .filter((name) => !Object.prototype.hasOwnProperty.call(registry, name));
        const sampleId = `${operatorName}#${index}`;
        const description = sample.description ?? definition.description;
        if (missingOperators.length > 0) {
          it.skip(`[${sampleId}] ${description} (⚠️ ${missingOperators})`);
        } else {
          it(`[${sampleId}] ${description}`, () => {
            waitForGenerator(state.process(sample.in));
            waitForGenerator(expectedState.process(sample.out));
            expect(state.operands.ref).toStrictEqual(expectedState.operands.ref);
            if (expectedState.exception) {
              expect(state.exception).not.toBeUndefined();
              expect(state.exception).toBeInstanceOf(expectedState.exception.constructor);
            } else {
              expect(state.exception).toBeUndefined();
            }
          });
        }
      });
    });
  });
