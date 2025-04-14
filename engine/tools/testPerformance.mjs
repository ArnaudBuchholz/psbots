import { hrtime } from 'node:process';
import { createState, getOperatorDefinitionRegistry, ValueType } from '../dist/index.js';
import { toStringValue, assert, valuesOf } from '../dist/sdk/index.js';
import { log, serve } from 'reserve';

const cached = {
  loops: undefined,
  data: []
};

log(serve({
  port: 8080,
  mappings: [{
    match: '/compute/:loops',
    custom: async (request, response, loops) => {
      response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      });
      if (cached.loops !== loops) {
        cached.loops = loops;
        cached.data.length = 0;
        const iterator = compute(Number.parseInt(loops));
        while (true) {
          const next = iterator.next();
          if (next.done) {
            break;
          }
          cached.data.push(next.value);
          response.write(`event: progress\ndata: ${JSON.stringify(next.value)}\n\n`);
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      } else {
        for (const data of cached.data) {
          response.write(`event: progress\ndata: ${JSON.stringify(data)}\n\n`);
        }
      }
      response.write(`event: done\ndata: \n\n`);
      response.end();
    }
  }, {
    match: '(.*)',
    file: 'tools/performances/$1',
    static: false
  }]
}));

const MAX_CYCLES = 10 ** 9;

function * compute (loops) {
  let sampleCount = 0;
  let cycles = 0;
  let timeSpent = 0; // nanoseconds
  
  function * execute(source) {
    const result = [];
    ++sampleCount;
    for (let loop = 0; loop < loops; ++loop) {
      const iteration = [];
      const { value: state } = createState();
      assert(!!state);
      const { value: iterator } = state.exec(toStringValue(source, { isExecutable: true }));
      assert(!!iterator);
      while (++cycles < MAX_CYCLES) {
        const { calls } = state;
        if (calls.length) {
          const value = calls.at(0);
          const info = [];
          if (!value.isExecutable) {
            info.push('l:', value.type);
          } else if (value.type === ValueType.string) {
            info.push('p');
          } else if (value.type === ValueType.array) {
            info.push('a');
          } else if (value.type === ValueType.operator) {
            info.push('o:', value.operator.name);
          } else if (value.type === ValueType.name) {
            info.push('n:', value.name);
          } else {
            console.log('How to handle', value.type);
            process.exit(0);
          }
          const operatorState = calls.topOperatorState;
          if (operatorState !== 0 && operatorState !== Number.POSITIVE_INFINITY) {
            info.push('@', operatorState);
          }
          const start = hrtime.bigint();
          iterator.next();
          const end = hrtime.bigint();
          const duration = Number(end - start);
          info.push('=', duration / 100);
          iteration.push(info.join(''));
          timeSpent += duration;
        } else {
          const { done } = iterator.next();
          assert(done);
          break;
        }
      }
      state.destroy();
      result.push(iteration.join(','));
    }
    yield {
      sampleCount,
      cycles,
      timeSpent,
      measures: result.join('|')
    };
  }
  
  yield * execute('version', 1);

  const registry = getOperatorDefinitionRegistry();
  for (const definition of Object.values(registry)) {
    for (const sample of definition.samples) {
      yield * execute(sample.in);
      yield * execute(sample.out);
    }
  }
  
/*
  // Scalability use cases
  function* iterate(from, to) {
    for (let index = from; index <= to; ++index) {
      yield index;
    }
  }
  
  yield * execute(['[', ...iterate(0, 10_000), ']'].join(' '));
  yield * execute(['{', ...iterate(0, 10_000), '}'].join(' '));
  yield * execute(
    '<<',
    [ ...iterate(0, 10_000) ]
      .map((value) => [`/value_${value}`, value])
      .flat()
      .join(' '),
    '>>'
  );
*/
}

/*

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
*/
