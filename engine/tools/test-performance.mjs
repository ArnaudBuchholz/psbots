import { hrtime } from 'node:process';
import { createState, getOperatorDefinitionRegistry, ValueType } from '../dist/index.js';
import { toStringValue } from '../dist/sdk/index.js';

const red = '\x1b[31m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';
const magenta = '\x1b[35m';
const cyan = '\x1b[36m';
const white = '\x1b[37m';

const LOOPS = 500;

let sampleCount = 0;
let cycles = 0;
let timeSpent = 0; // nanoseconds
const operators = {};

function execute(source) {
  const { value: state, error } = createState();
  if (error) {
    throw error;
  }
  const iterator = state.exec(toStringValue(source, { isExecutable: true }));
  while (true) {
    ++cycles;
    const { callStack } = state;
    let operator;
    if (callStack[0]?.value.type === ValueType.operator) {
      operator = callStack[0].value.operator.name;
    }
    const start = hrtime();
    const { done } = iterator.next();
    const duration = hrtime(start)[1];
    timeSpent += duration;
    if (operator) {
      operators[operator] ??= [];
      operators[operator].push(duration);
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
console.log('Cycles/ms :', Math.floor((10 ** 9) * cycles / timeSpent) / 1000);

const operatorNames = Object.keys(operators).sort();
const operatorStatistics = {};
for(const operator of operatorNames) {
  const durations = operators[operator];
  const totalDuration = durations.reduce((total, duration) => duration + total);
  const mean = Math.floor(totalDuration / durations.length);
  operatorStatistics[operator] = {
    count: durations.length,
    'mean (ns)': mean.toLocaleString().padStart(6, ' ')
  }
}
console.table(operatorStatistics);
