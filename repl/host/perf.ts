import { getOperatorDefinitionRegistry, createState, ValueType } from '@psbots/engine';
import type { Result, Value, IState, IReadOnlyDictionary, ValueOf } from '@psbots/engine';
import { assert, OperatorType, toStringValue, valuesOf } from '@psbots/engine/sdk';
import type { IFunctionOperator, IInternalState } from '@psbots/engine/sdk';
import { cyan, yellow, white, green, red } from '../colors.js';
import type { IReplIO } from '../IReplIo.js';
import type { ReplHostDictionary } from './index.js';

const MAX_CYCLES = 10 ** 9;
const TICKS = ['\u280B', '\u2819', '\u2839', '\u2838', '\u283C', '\u2834', '\u2826', '\u2827', '\u2807', '\u280F'];

async function getResolution() {
  const COUNT = 10_000;
  const powersOf10: number[] = [];
  let last = performance.now() * 1_000_000;
  for (let index = 0; index < COUNT; ++index) {
    let now: number;
    do {
      now = performance.now() * 1_000_000;
    } while (now === last);
    let powerOf10 = Math.round(Math.log10(now - last));
    if (powerOf10 === Number.NEGATIVE_INFINITY) {
      powerOf10 = 0;
    }
    powersOf10[powerOf10] = (powersOf10[powerOf10] ?? 0) + 1;
    last = now;
  }
  let powerOf10: number = 1;
  let countForPowerOf10 = 0;
  for (const [index, count] of powersOf10.entries()) {
    if (count && count > countForPowerOf10) {
      countForPowerOf10 = count;
      powerOf10 = index;
    }
  }
  return 10 ** powerOf10;
}

class TimeBucket {
  constructor(private _resolution: number) {}

  private _min = Number.POSITIVE_INFINITY;
  get min() {
    return this._min;
  }

  private _mean = 0;
  get mean() {
    return this._mean;
  }

  private _max = 0;
  get max() {
    return this._max;
  }

  private _count = 0;
  get count() {
    return this._count;
  }

  private _ranges: number[] = [];
  private _maxHits = 0;

  add(duration: number) {
    ++this._count;
    const index = Math.floor(duration / this._resolution);
    const rangeHits = (this._ranges[index] ?? 0) + 1;
    this._ranges[index] = rangeHits;
    this._maxHits = Math.max(rangeHits, this._maxHits);
  }

  clean() {
    const threshold = Math.ceil(this._count / 100);
    let sum = 0;
    let count = 0;
    for (let index = 0; index < this._ranges.length; ++index) {
      const value = this._ranges[index] ?? 0;
      if (value < threshold) {
        delete this._ranges[index];
      } else {
        this._min = Math.min(this._min, index);
        this._max = Math.max(this._max, index);
        sum += value * index;
        count += value;
      }
    }
    this._mean = Math.floor(sum / count);
    return count;
  }

  ratio(index: number) {
    return (this._ranges[index] ?? 0) / this._maxHits;
  }
}

type Measures = { [name in string]: TimeBucket };

function getMeasureName({ calls }: IState) {
  const value = calls.at(0);
  if (!value.isExecutable) {
    return `literal_${value.type}`;
  }
  if (value.type === ValueType.string) {
    return 'parser';
  }
  if (value.type === ValueType.array) {
    return 'block';
  }
  if (value.type === ValueType.operator) {
    const { topOperatorState } = calls;
    if (topOperatorState !== 0 && topOperatorState !== Number.POSITIVE_INFINITY) {
      return `-${value.operator.name}-@${topOperatorState > 0 ? '+' : '-'}`;
    }
    return `-${value.operator.name}-`;
  }
  if (value.type === ValueType.name) {
    return `name_${value.name}`;
  }
  throw new Error(`Missing measure name for ${JSON.stringify(value)}`);
}

type ExecuteContext = {
  loops: number;
  resolution: number;
  logWithPerformanceApi: boolean;
  source?: string;
  measures: Measures;
  replIO: IReplIO;
  lastUpdate?: number;
  lastTick?: number;
};

// eslint-disable-next-line sonarjs/cognitive-complexity -- waiting for a fix
async function evaluate(value: Value, context: ExecuteContext) {
  const { loops, measures } = context;
  let cycles = 0;
  for (let loop = 0; loop < loops; ++loop) {
    const stateCreated = createState();
    assert(stateCreated);
    const { value: state } = stateCreated;
    const executed = state.exec(value);
    assert(executed);
    const { value: iterator } = executed;
    while (++cycles < MAX_CYCLES) {
      if (context.lastUpdate === undefined || Date.now() - context.lastUpdate > 250) {
        const tick = context.lastTick ?? 0;
        context.replIO.output(`\r${cyan}${TICKS[tick]}${white}`);
        context.lastUpdate = Date.now();
        context.lastTick = (tick + 1) % TICKS.length;
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      const { calls } = state;
      if (calls.length > 0) {
        const measureName = getMeasureName(state);
        const start = performance.now();
        iterator.next();
        const end = performance.now();
        if (context.logWithPerformanceApi) {
          performance.measure(measureName, { start, end });
        }
        if (measures[measureName] === undefined) {
          measures[measureName] = new TimeBucket(context.resolution);
        }
        measures[measureName].add(Math.ceil(1_000_000 * (end - start)));
      } else {
        const { done } = iterator.next();
        assert(done === true);
        break;
      }
    }
    state.destroy();
  }
}

async function measureAllOperators(context: ExecuteContext) {
  await evaluate(toStringValue('version', { isExecutable: true }), context);
  const registry = getOperatorDefinitionRegistry();
  for (const definition of Object.values(registry)) {
    for (const sample of definition.samples) {
      await evaluate(toStringValue(sample.in, { isExecutable: true }), context);
      await evaluate(toStringValue(sample.out, { isExecutable: true }), context);
    }
  }
}

/*
    [ ...iterate(0, 1000) ] aload
    { ...iterate(0, 1000) }
    << /value_0 0 ... /value_1000 1000 >>
*/

function report({ replIO, measures }: ExecuteContext) {
  const keys = Object.keys(measures).sort();
  let maxKeyLength = 0;
  let maxMeanLength = 0;
  for (const key of keys) {
    maxKeyLength = Math.max(maxKeyLength, key.length);
    const bucket = measures[key];
    if (!bucket) {
      replIO.output(`❌ missing bucket for ${key}`);
      continue;
    }
    console.log(key, bucket);
    bucket.clean();
    maxMeanLength = Math.max(maxMeanLength, bucket.mean.toString().length);
  }
  const reference = Math.max(measures['-true-']?.mean ?? 1, measures['-false-']?.mean ?? 1);
  for (const key of keys) {
    const bucket = measures[key];
    if (!bucket) {
      continue;
    }
    replIO.output(key.padEnd(maxKeyLength, ' ') + ' ');
    const mean = bucket.mean;
    let color: string;
    if (mean < 4 * reference) {
      color = green;
    } else if (mean < 10 * reference) {
      color = yellow;
    } else {
      color = red;
    }
    replIO.output(color);
    replIO.output(bucket.mean.toString().padStart(maxMeanLength, ' '));
    replIO.output(white);
    replIO.output(' x');
    replIO.output(bucket.count.toString());
    replIO.output('\r\n');
  }
}

async function execute(context: ExecuteContext) {
  if (context.resolution === 0) {
    context.resolution = await getResolution();
  }
  context.replIO.output(`${cyan}Resolution: ${yellow}${context.resolution.toString()}${cyan}ns${white}\r\n`);
  await (context.source
    ? evaluate(toStringValue(context.source, { isExecutable: true }), context)
    : measureAllOperators(context));
  context.replIO.output(`\r`);
  report(context);
}

const getValue = <T extends ValueType>(
  dictionary: IReadOnlyDictionary,
  name: string,
  expectedType: T
): undefined | ValueOf<T> => {
  const value = dictionary.lookup(name);
  if (value.type !== expectedType) {
    return undefined;
  }
  return valuesOf(value)[0];
};

export function createPerfOperator(host: ReplHostDictionary): Value<ValueType.operator> {
  return {
    type: ValueType.operator,
    isExecutable: true,
    isReadOnly: true,
    operator: <IFunctionOperator>{
      name: 'perf',
      type: OperatorType.implementation,
      implementation: (internalState: IInternalState): Result<undefined> => {
        const { operands } = internalState;
        if (operands.length === 0) {
          return { success: false, exception: 'rangeCheck' };
        }
        const value = operands.top;
        if (value.type !== ValueType.dictionary) {
          return { success: false, exception: 'typeCheck' };
        }
        const definition = value.dictionary;
        const loops = getValue(definition, 'loops', ValueType.integer);
        if (loops === undefined) {
          return { success: false, exception: 'typeCheck' };
        }
        const context: ExecuteContext = {
          loops,
          resolution: getValue(definition, 'resolution', ValueType.integer) ?? 0,
          measures: {},
          logWithPerformanceApi: getValue(definition, 'performance', ValueType.boolean) ?? false,
          source: getValue(definition, 'source', ValueType.string),
          replIO: host.replIO
        };
        operands.pop();
        host.block();
        execute(context).then(() => host.unblock());
        return { success: true, value: undefined };
      }
    }
  };
}
