import assert from 'node:assert/strict';
import * as transpiled from '../dist/index.js';
import * as optimized from '../dist/perf/index.js';
import { TimeBucket } from './TimeBucket.mjs';

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

function measure(impl) {
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
  return Math.floor(1000 * (end - start)) / 1000;
}

// Warming up and validating the builds
console.log('Warming up...');
const { count: transpiledCount, errors: transpiledErrors } = warmup(transpiled, { debugMemory: true });
const { count: optimizedCount, errors: optimizedErrors } = warmup(optimized, { debugMemory: true });
assert.strictEqual(transpiledErrors + optimizedErrors, 0);
assert.strictEqual(transpiledCount, optimizedCount);
console.log('🧪 tests count     :', transpiledCount);

for (let iteration = 0; iteration < 100; ++iteration) {
  warmup(transpiled);
  warmup(optimized);
}

// Performance
const resolution = TimeBucket.getResolution();
console.log('⏲️  Resolution (µs) :', resolution);

const transpiledDurations = [];
const optimizedDurations = [];
console.log('\n\n\n');
const REFRESH_MS = 250;
let lastUpdate = Date.now() - REFRESH_MS;

const min = (durations) => durations.reduce((min, current) => Math.min(min, current));
const mean = (durations) => durations.reduce((sum, current) => sum + current) / durations.length;
const max = (durations) => durations.slice(-250).reduce((max, current) => Math.max(max, current));

while (transpiledDurations.length < 10_000) {
  transpiledDurations.push(measure(transpiled));
  optimizedDurations.push(measure(optimized));
  if (Date.now() - lastUpdate > REFRESH_MS) {
    lastUpdate = Date.now();
    const transpiledMin = min(transpiledDurations);
    const transpiledMean = mean(transpiledDurations);
    const optimizedMin = min(optimizedDurations);
    const optimizedMean = mean(optimizedDurations);
    console.log(
      '\u001B[4A🔄 iterations      :',
      transpiledDurations.length,
      '\n⏳ time spent (ms) :',
      transpiledMin.toFixed(3),
      '≤',
      transpiledMean.toFixed(3),
      '≤',
      max(transpiledDurations).toFixed(3),
      '\n⚡ time spent (ms) :',
      optimizedMin.toFixed(3),
      '≤',
      optimizedMean.toFixed(3),
      '≤',
      max(optimizedDurations).toFixed(3),
      '\n⏳𝝙⚡ (ms)         :',
      (transpiledMin - optimizedMin).toFixed(3),
      '≤',
      (transpiledMean - optimizedMean).toFixed(3)
    );
  }
}
