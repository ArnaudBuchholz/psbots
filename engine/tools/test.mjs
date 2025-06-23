import assert from 'node:assert/strict';
import { createState, getOperatorDefinitionRegistry, run } from '../dist/index.js';

function compareIArrays(actual, expected) {
  assert.strictEqual(actual.length, expected.length);
  const { length } = actual;
  for (let index = 0; index < length; ++index) {
    compareValues(actual.at(index), expected.at(index));
  }
}

function compareIDictionaries(actual, expected) {
  assert.deepStrictEqual(
    actual.names.sort((a, b) => a.localCompare(b)),
    expected.names.sort((a, b) => a.localCompare(b))
  );
  for (const name of actual.names) {
    compareValues(actual.lookup(name), expected.lookup(name));
  }
}

function compareValues(actual, expected) {
  assert.strictEqual(actual.type, expected.type);
  assert.strictEqual(actual.isReadOnly, expected.isReadOnly);
  assert.strictEqual(actual.isExecutable, expected.isExecutable);
  const { type } = actual;
  if (type === 'array') {
    compareIArrays(actual.array, expected.array);
  } else if (type === 'dictionary') {
    compareIDictionaries(actual.dictionary, expected.dictionary);
  } else if (type === 'operator') {
    assert.strictEqual(actual.operator.name, expected.operator.name);
  } else {
    assert.deepStrictEqual(
      { ...actual, tracker: undefined, debugSource: undefined },
      { ...expected, tracker: undefined, debugSource: undefined }
    );
  }
}

let count = 0;
const start = performance.now();
for (const [name, definition] of Object.entries(getOperatorDefinitionRegistry())) {
  let index = 0;
  for (const { in: inSource, out: outSource } of definition.samples) {
    try {
      const inResult = createState({ debugMemory: true });
      if (inResult.exception) {
        throw inResult.exception;
      }
      const inState = inResult.value;
      const outResult = createState({ debugMemory: true });
      if (outResult.exception) {
        throw outResult.exception;
      }
      const outState = outResult.value;

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
        compareIArrays(inState.operands, outState.operands);
      }

      inState.destroy();
      outState.destroy();
    } catch (e) {
      console.log(`❌${name}#${index}:`, e);
    }
    ++index;
    ++count;
  }
}

const end = performance.now()

console.log('🧪 tests count:', count)
console.log('⏳ time spent :', Math.floor(end - start), 'ms')
