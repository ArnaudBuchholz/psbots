import { createState, getOperatorDefinitionRegistry } from '../dist/index.js';
import { toStringValue } from '../dist/sdk/index.js';

let sampleCount = 0;
let cycles = 0;

function execute(source) {
  const { value: state, error } = createState();
  if (error) {
    throw error;
  }
  const iterator = state.exec(toStringValue(source, { isExecutable: true }));
  while (true) {
    ++cycles;
    const { done } = iterator.next();
    if (done === true) {
      break;
    }
  }
  state.destroy();
}

const registry = getOperatorDefinitionRegistry();
for (const definition of Object.values(registry)) {
  for (const sample of definition.samples) {
    ++sampleCount;
    execute(sample.in);
  }
}

console.log('Samples :', sampleCount);
console.log('Cycles  :', cycles);
