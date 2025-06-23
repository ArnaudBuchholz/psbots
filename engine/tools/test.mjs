import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createState, getOperatorDefinitionRegistry, run, enumIArrayValues } from '../dist/index.js';

let inState, outState;
beforeEach(() => {
  const inResult = createState({ debugMemory: true });
  if (inResult.exception) {
    throw inResult.exception;
  }
  inState = inResult.value;
  const outResult = createState({ debugMemory: true });
  if (outResult.exception) {
    throw outResult.exception;
  }
  outState = outResult.value;
});

afterEach(() => {
  inState.destroy();
  outState.destroy();
});

for (const [name, definition] of Object.entries(getOperatorDefinitionRegistry())) {
  describe(name, () => {
    let index = 0;
    for (const { in: inSource, out: outSource } of definition.samples) {
      it(`${name}#${index}`, () => {
        run(inState, inSource);
        run(outState, outSource);
        if (outState.exception) {
          assert.strictEqual(inState.exception, outState.exception);
        } else {
          assert.strictEqual(inState.exception, undefined);
          // flatten differences between the two memory trackers
          Object.assign(inState.memoryTracker, { _peak: 0 });
          Object.assign(outState.memoryTracker, { _peak: 0 });
          assert.deepStrictEqual(inState.memoryTracker.byType, outState.memoryTracker.byType);
          assert.deepStrictEqual([...enumIArrayValues(inState.operands)], [...enumIArrayValues(outState.operands)]);
        }
      });
      ++index;
    }
  });
}
