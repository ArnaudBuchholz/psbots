import { hrtime } from 'node:process';
import { writeFile } from 'node:fs/promises';
import { createState, getOperatorDefinitionRegistry, ValueType } from '../dist/index.js';
import { toStringValue, assert } from '../dist/sdk/index.js';

const yellow = '\u001B[33m';
const magenta = '\u001B[35m';
const white = '\u001B[37m';
const red = '\u001B[31m';
const green = '\u001B[32m';
const TICKS = ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f']

const LOOPS = 500;
const MAX_CYCLES = 10 ** 9;

let sampleCount = 0;
let cycles = 0;
let timeSpent = 0; // nanoseconds
const measurements = {};
let lastFeedbackTimestamp = Date.now();
let lastFeedbackTick = 0

function execute(source, loops = LOOPS) {
  let result;
  ++sampleCount;
  for (let loop = 0; loop < loops; ++loop) {
    const { value: state } = createState();
    assert(!!state);
    const { value: iterator } = state.exec(toStringValue(source, { isExecutable: true }));
    assert(!!iterator);
    while (++cycles < MAX_CYCLES) {
      if (Date.now() - lastFeedbackTimestamp > 250) {
        process.stdout.write(`${TICKS[lastFeedbackTick]} Running samples (${sampleCount})...\r`);
        lastFeedbackTick = (lastFeedbackTick + 1) % TICKS.length;
        lastFeedbackTimestamp = Date.now();
      }
      const { calls } = state;
      let instruction;
      if (calls.at(0).type === ValueType.operator) {
        instruction = calls.at(0).operator.name;
        if (calls.topOperatorState > 0 && calls.topOperatorState < Number.POSITIVE_INFINITY) {
          instruction += '+';
        } else if (calls.topOperatorState < 0) {
          instruction += '-';
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
    result = state.operands.at(0);
    state.destroy();
  }
  return result;
}

const { string: version } = execute('version', 1);

const registry = getOperatorDefinitionRegistry();
for (const definition of Object.values(registry)) {
  for (const sample of definition.samples) {
    execute(sample.in);
    execute(sample.out);
  }
}

// Scalability use cases
function* iterate(from, to) {
  for (let index = from; index <= to; ++index) {
    yield index;
  }
}

/*
execute(['[', ...iterate(0, 10_000), ']'].join(' '));
execute(['{', ...iterate(0, 10_000), '}'].join(' '));
execute(
  '<<',
  [ ...iterate(0, 10_000) ]
    .map((value) => [`/value_${value}`, value])
    .flat()
    .join(' '),
  '>>'
);
*/

console.log(`\nVersion   :${magenta}`, version, white);
console.log('Samples   :', sampleCount);
console.log('Cycles    :', cycles);
console.log(`Duration  :${yellow}`, timeSpent.toLocaleString(), `${white}ns`);
console.log('Cycles/ms :', Math.floor((10 ** 9 * cycles) / timeSpent) / 1000);
const globalMean = Math.ceil(timeSpent / cycles);
console.log('Mean      :', globalMean, 'ns');

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
    't (ns)': mean, // > 2 * globalMean ? `${red}${mean}${white}` : `${yellow}${mean}${white}`,
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

const maxOperatorWidth = Object.keys(statistics).reduce((max, length) => Math.max(max, length), 0)
const maxCountWidth = Object.values(statistics).reduce((max, { count }) => Math.max(max, count.toString().length), 0)

console.table(statistics);

await writeFile('./performances.json', JSON.stringify(measurements, undefined, 2));
