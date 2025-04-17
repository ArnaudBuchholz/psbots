import { hrtime } from 'node:process';
import { readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { log, serve } from 'reserve';

async function getLastModifiedTimestamp(path = 'dist') {
  const files = await readdir(path);
  let lastModifiedTimestamp = 0;
  for (const filename of files) {
    const fileStat = await stat(join(path, filename));
    lastModifiedTimestamp = fileStat.isDirectory()
      ? Math.max(lastModifiedTimestamp, await getLastModifiedTimestamp(join(path, filename)))
      : Math.max(lastModifiedTimestamp, fileStat.mtimeMs);
  }
  return lastModifiedTimestamp;
}

log(
  serve({
    port: 8080,
    mappings: [
      {
        match: '/compute/:loops',
        custom: async (request, response, loops) => {
          const cachedFilename = `perf-${loops}.jsonl`;
          let generate = false;
          try {
            const cachedStat = await stat(cachedFilename);
            const testPerformanceStat = await stat(import.meta.filename);
            const distributionTimestamp = await getLastModifiedTimestamp();
            generate = distributionTimestamp > cachedStat.mtimeMs || testPerformanceStat.mtimeMs > cachedStat.mtimeMs;
          } catch {
            generate = true;
          }
          if (generate) {
            await unlink(cachedFilename);
          }
          response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache'
          });
          if (generate) {
            const iterator = compute(Number.parseInt(loops));
            while (true) {
              const next = await iterator.next();
              if (next.done) {
                break;
              }
              const data = JSON.stringify(next.value) + '\n';
              response.write(`event: progress\ndata: ${data}\n`);
              await writeFile(cachedFilename, data, { flag: 'a+' });
            }
          } else {
            const cached = await readFile(cachedFilename, 'utf8');
            for (const data of cached.split('\n')) {
              if (data.trim()) {
                response.write(`event: progress\ndata: ${data}\n\n`);
              }
            }
          }
          response.write(`event: done\ndata: \n\n`);
          response.end();
        }
      },
      {
        match: '(.*)',
        file: 'tools/performances/$1',
        static: false
      }
    ]
  })
);

const MAX_CYCLES = 10 ** 9;

function* iterate(from, to) {
  for (let index = from; index <= to; ++index) {
    yield index;
  }
}

async function* compute(loops) {
  const { createState, getOperatorDefinitionRegistry, ValueType } = await import('../dist/index.js');
  const { toStringValue, assert } = await import('../dist/sdk/index.js');

  let sampleCount = 0;
  let cycles = 0;
  let timeSpent = 0; // nanoseconds

  // eslint-disable-next-line sonarjs/cognitive-complexity -- not production code
  function* execute(source) {
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
        if (calls.length > 0) {
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
            throw new Error(`How to handle ${value.type}`);
          }
          const operatorState = calls.topOperatorState;
          if (operatorState !== 0 && operatorState !== Number.POSITIVE_INFINITY) {
            info.push('@', operatorState);
          }
          const start = hrtime.bigint();
          iterator.next();
          const end = hrtime.bigint();
          const duration = Number(end - start);
          info.push('=', duration);
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

  yield* execute('version');

  const registry = getOperatorDefinitionRegistry();
  for (const definition of Object.values(registry)) {
    for (const sample of definition.samples) {
      yield* execute(sample.in);
      yield* execute(sample.out);
    }
  }

  // Scalability use cases
  yield* execute(['[', ...iterate(0, 1000), ']', 'aload'].join(' '));
  yield* execute(['{', ...iterate(0, 1000), '}'].join(' '));
  yield* execute('<<' + [...iterate(0, 1000)].flatMap((value) => [`/value_${value}`, value]).join(' ') + '>>');
}
