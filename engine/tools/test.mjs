import assert from 'node:assert/strict';
import * as distribution from '../dist/index.js';
import * as optimized from '../dist/perf/index.js';

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

const ITERATIONS = 50;
const WARMUP = 10;

// eslint-disable-next-line sonarjs/cognitive-complexity -- testing purpose
function runTests(impl) {
  let min = Number.POSITIVE_INFINITY;
  let max = 0;
  let sum = 0;
  let count;
  let errors = 0;

  for (let iteration = 0; iteration < ITERATIONS && errors === 0; ++iteration) {
    count = 0;
    const start = performance.now();
    for (const [name, definition] of Object.entries(impl.getOperatorDefinitionRegistry())) {
      let index = 0;
      for (const { in: inSource, out: outSource } of definition.samples) {
        try {
          const inResult = impl.createState({ debugMemory: true });
          if (inResult.exception) {
            throw inResult.exception;
          }
          const inState = inResult.value;
          const outResult = impl.createState({ debugMemory: true });
          if (outResult.exception) {
            throw outResult.exception;
          }
          const outState = outResult.value;

          impl.run(inState, inSource);
          impl.run(outState, outSource);
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
        } catch (error) {
          console.log(`❌${name}#${index}:`, error);
          ++errors;
        }
        ++index;
        ++count;
      }
    }
    if (iteration >= WARMUP) {
      const end = performance.now();

      const duration = Math.floor(1000 * (end - start)) / 1000;
      min = Math.min(min, duration);
      max = Math.max(max, duration);
      sum += duration;
    }
  }

  return {
    count,
    min,
    max,
    mean: Math.floor((1000 * sum) / (ITERATIONS - WARMUP)) / 1000,
    errors
  };
}

const perfOfDistribution = runTests(distribution);
if (!perfOfDistribution.errors) {
  console.log('🧪 tests count     :', perfOfDistribution.count);
  console.log(
    '⏳ time spent (ms) :',
    perfOfDistribution.min.toFixed(3),
    '≤',
    perfOfDistribution.mean.toFixed(3),
    '≤',
    perfOfDistribution.max.toFixed(3)
  );
  const perfOfOptimized = runTests(optimized);
  console.log(
    '⚡ time spent (ms) :',
    perfOfOptimized.min.toFixed(3),
    '≤',
    perfOfOptimized.mean.toFixed(3),
    '≤',
    perfOfOptimized.max.toFixed(3)
  );
}
