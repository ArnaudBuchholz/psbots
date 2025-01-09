import { hrtime } from 'node:process';
import { writeFile } from 'node:fs/promises';
import { createState, getOperatorDefinitionRegistry, ValueType } from '../dist/index.js';
import { toStringValue } from '../dist/sdk/index.js';

// const red = '\x1b[31m';
// const green = '\x1b[32m';
const yellow = '\x1b[33m';
// const blue = '\x1b[34m';
const magenta = '\x1b[35m';
// const cyan = '\x1b[36m';
const white = '\x1b[37m';

const LOOPS = 500;
const MAX_CYCLES = 10 ** 9;

let sampleCount = 0;
let cycles = 0;
let timeSpent = 0; // nanoseconds
const measurements = {};

function execute(source) {
  const { value: state, exception: stateFailed } = createState();
  if (stateFailed) {
    throw new Error(stateFailed);
  }
  const { value: iterator, exception: execFailed } = state.exec(toStringValue(source, { isExecutable: true }));
  if (execFailed) {
    throw new Error(execFailed);
  }
  while (++cycles < MAX_CYCLES) {
    const { callStack } = state;
    let instruction;
    if (callStack.at(0).type === ValueType.operator) {
      instruction = callStack.at(0).operator.name;
      if (state.exception !== undefined) {
        instruction += '!';
      }
    }
    const start = hrtime();
    const { done } = iterator.next();
    const duration = hrtime(start)[1];
    timeSpent += duration;
    if (instruction) {
      measurements[instruction] ??= [];
      measurements[instruction].push(duration);
    }
    if (done === true) {
      break;
    }
  }
  const result = state.operands.at(0);
  state.destroy();
  return result;
}

const { string: version } = execute('version');

const registry = getOperatorDefinitionRegistry();
for (const definition of Object.values(registry)) {
  for (const sample of definition.samples) {
    sampleCount += 2;
    for (let loop = 0; loop < LOOPS; ++loop) {
      execute(sample.in);
      execute(sample.out);
    }
  }
}

console.log(`Version   :${magenta}`, version, white);
console.log('Samples   :', sampleCount);
console.log('Cycles    :', cycles);
console.log(`Duration  :${yellow}`, timeSpent.toLocaleString(), `${white}ns`);
console.log('Cycles/ms :', Math.floor((10 ** 9 * cycles) / timeSpent) / 1000);

const intructions = Object.keys(measurements).sort();
const statistics = {};
for (const instruction of intructions) {
  const durations = measurements[instruction];
  const totalDuration = durations.reduce((total, duration) => duration + total);
  const mean = Math.floor(totalDuration / durations.length);
  const variance = Math.floor(
    Math.sqrt(durations.reduce((total, duration) => total + (mean - duration) ** 2, 0) / (durations.length - 1))
  );
  const halfPercentile = Math.floor(
    (100 * durations.reduce((total, duration) => total + (2 * duration <= mean ? 1 : 0), 0)) / durations.length
  );
  const meanPercentile = Math.floor(
    (100 * durations.reduce((total, duration) => total + (duration <= mean ? 1 : 0), 0)) / durations.length
  );
  const twicePercentile = Math.floor(
    (100 * durations.reduce((total, duration) => total + (duration >= 2 * mean ? 1 : 0), 0)) / durations.length
  );
  statistics[instruction] = {
    count: durations.length,
    't (ns)': mean,
    Δ: variance,
    '≤t%': meanPercentile,
    '≤½t%': halfPercentile,
    '≥2t%': twicePercentile
  };
  measurements[instruction] = {
    durations,
    mean,
    variance,
    meanPercentile,
    twicePercentile
  };
}
console.table(statistics);

await writeFile('./performances.txt', JSON.stringify(measurements, undefined, 2));
