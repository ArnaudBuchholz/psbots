import assert from 'node:assert/strict';
import * as distributionVersion from '../dist/index.js';
import * as performanceVersion from '../dist/perf/index.js';

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

function warmup(impl, stateOptions = {}) {
  let errors = 0;
  let count = 0;
  for (const [name, definition] of Object.entries(impl.getOperatorDefinitionRegistry())) {
    let index = 0;
    for (const { in: inSource, out: outSource } of definition.samples) {
      try {
        const { value: inState } = impl.createState(stateOptions);
        const { value: outState } = impl.createState(stateOptions);
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
  return { count, errors };
}

function measure(impl, metrics) {
  const start = performance.now();
  for (const definition of Object.values(impl.getOperatorDefinitionRegistry())) {
    for (const { in: inSource, out: outSource } of definition.samples) {
      const { value: inState } = impl.createState();
      const { value: outState } = impl.createState();
      impl.run(inState, inSource);
      impl.run(outState, outSource);
      inState.destroy();
      outState.destroy();
    }
  }
  const end = performance.now();
  const duration = Math.floor(1000 * (end - start)) / 1000;
  metrics.min = Math.min(metrics.min ?? Number.POSITIVE_INFINITY, duration);
  metrics.max = Math.max(metrics.max ?? 0, duration);
  metrics.sum = (metrics.sum ?? 0) + duration;
}

// Warming up and validating the builds
console.log('Warming up...');
const { count: distributionCount, errors: distributionErrors } = warmup(distributionVersion, { debugMemory: true });
const { count: perfCount, errors: perfErrors } = warmup(performanceVersion, { debugMemory: true });
assert.strictEqual(distributionErrors + perfErrors, 0);
assert.strictEqual(distributionCount, perfCount);
console.log('🧪 tests count     :', distributionCount);

for (let iteration = 0; iteration < 10; ++iteration) {
  warmup(distributionVersion);
  warmup(performanceVersion);
}

// Performance

const distributionMetrics = {};
const perfMetrics = {};
let count = 0;
process.stdout.write('\u001B[s');
while (count < 10_000) {
  process.stdout.write('\u001B[u');
  ++count;
  measure(distributionVersion, distributionMetrics);
  measure(performanceVersion, perfMetrics);
  process.stdout.write(
    [
      '⏳ time spent (ms) : ',
      distributionMetrics.min.toFixed(3),
      ' ≤ ',
      (distributionMetrics.sum / count).toFixed(3),
      ' ≤ ',
      distributionMetrics.max.toFixed(3),
      '\n',
      '⚡ time spent (ms) : ',
      perfMetrics.min.toFixed(3),
      ' ≤ ',
      (perfMetrics.sum / count).toFixed(3),
      ' ≤ ',
      perfMetrics.max.toFixed(3),
      '\n'
    ].join('')
  );
}
