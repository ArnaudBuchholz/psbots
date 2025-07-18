import type { ValueType, Result, Value, IState, IReadOnlyDictionary, ValueOf } from '@psbots/engine';
import { getOperatorDefinitionRegistry, createState } from '@psbots/engine';

import { assert, OperatorType, toStringValue, valuesOf } from '@psbots/engine/sdk';
import type { IFunctionOperator, IInternalState } from '@psbots/engine/sdk';
import { cyan, yellow, white, green, red } from '../colors.js';
import type { IReplIO } from '../IReplIo.js';
import type { ReplHostDictionary } from './index.js';
import { buildOptions } from '../options.js';

const MAX_CYCLES = 10 ** 9;
const TICKS = ['\u280B', '\u2819', '\u2839', '\u2838', '\u283C', '\u2834', '\u2826', '\u2827', '\u2807', '\u280F'];

function getResolution() {
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

  private _cleanedCount = 0;
  get cleanedCount() {
    return this._cleanedCount;
  }

  private _ranges: number[] = [];
  get ranges() {
    return this._ranges;
  }

  private _maxHits = 0;
  get maxHits() {
    return this._maxHits;
  }

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
    const removeIndexes: number[] = [];
    for (const [index, value] of this._ranges.entries()) {
      if (!value || value < threshold) {
        removeIndexes.push(index);
      } else {
        this._min = Math.min(this._min, index);
        this._max = Math.max(this._max, index);
        sum += value * index;
        count += value;
      }
    }
    for (const index of removeIndexes.toReversed()) {
      this._ranges.splice(index, 1);
    }
    this._mean = Math.floor(sum / count);
    this._cleanedCount = count;
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
  if (value.type === 'string') {
    return 'parser';
  }
  if (value.type === 'array') {
    return 'block';
  }
  if (value.type === 'operator') {
    const { topOperatorState } = calls;
    if (topOperatorState !== 0 && topOperatorState !== Number.POSITIVE_INFINITY) {
      return `-${value.operator.name}-@${topOperatorState > 0 ? '+' : '-'}`;
    }
    return `-${value.operator.name}-`;
  }
  if (value.type === 'name') {
    return `name_${value.name}`;
  }
  throw new Error(`Missing measure name for ${JSON.stringify(value)}`);
}

type ExecuteContext = {
  loops: number;
  resolution: number;
  logWithPerformanceApi: boolean;
  source?: string;
  options?: string[];
  detail?: string;
  measures: Measures;
  replIO: IReplIO;
  lastUpdate?: number;
  lastTick?: number;
};

// eslint-disable-next-line sonarjs/cognitive-complexity -- waiting for a fix
async function evaluate(value: Value, context: ExecuteContext) {
  const { loops, measures, replIO } = context;
  let cycles = 0;
  for (let loop = 0; loop < loops && !replIO.abortSignal?.aborted; ++loop) {
    const stateCreated = createState(buildOptions(context.options ?? []));
    assert<IState>(stateCreated);
    const { value: state } = stateCreated;
    const executed = state.exec(value);
    assert(executed);
    const { value: iterator } = executed;
    while (++cycles < MAX_CYCLES && !replIO.abortSignal?.aborted) {
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

function report(context: ExecuteContext) {
  const { replIO, measures, resolution } = context;
  context.replIO.output(`${cyan}Resolution: ${yellow}${resolution.toString()}${cyan}ns${white}\r\n`);
  const keys = Object.keys(measures).sort((a, b) => a.localeCompare(b));
  let maxKeyLength = 0;
  let maxMeanLength = 0;
  for (const key of keys) {
    maxKeyLength = Math.max(maxKeyLength, key.length);
    const bucket = measures[key];
    if (!bucket) {
      replIO.output(`❌ missing bucket for ${key}`);
      continue;
    }
    bucket.clean();
    maxMeanLength = Math.max(maxMeanLength, bucket.mean.toString().length);
  }
  /**
   * -true- and -false- are supposed to be the fastest
   * -and- and -or- are fast but with validated parameters
   */
  const reference = Math.max(measures['-and-']?.mean ?? 1, measures['-or-']?.mean ?? 1);
  for (const key of keys) {
    const bucket = measures[key];
    if (!bucket) {
      continue;
    }
    replIO.output(key.padEnd(maxKeyLength, ' ') + ' ');
    const mean = bucket.mean;
    let color: string;
    if (mean <= reference) {
      color = green;
    } else if (mean < 2 * reference) {
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
  reportDetail(context);
}

function reportDetail({ replIO, measures, detail, resolution }: ExecuteContext) {
  if (detail && measures[detail]) {
    const bucket = measures[detail];
    replIO.output(
      `${cyan}Detail for ${white}${detail}: ${green}${bucket.mean.toString()} x ${yellow}${resolution.toString()}${cyan}ns${white}\r\n`
    );
    replIO.output(
      `Count: ${yellow}${bucket.count.toString()}${white}, cleaned count: ${yellow}${bucket.cleanedCount.toString()}${white}\r\n`
    );
    const maxWidth = bucket.max.toString().length;
    const maxHitsWidth = bucket.maxHits.toString().length;
    const barWidth = Math.min(replIO.width - maxWidth - maxHitsWidth - 4, 50);
    for (let index = 0; index <= bucket.max; ++index) {
      const ratio = bucket.ratio(index);
      replIO.output(`${green}${index.toString().padStart(maxWidth + 1, ' ')}${white} `);
      if (ratio > 0) {
        replIO.output(`${'█'.repeat(Math.floor(ratio * barWidth))} ${yellow}${bucket.ranges[index]}`);
      }
      replIO.output(`${white}\r\n`);
    }
  }
}

async function execute(context: ExecuteContext) {
  if (context.resolution === 0) {
    context.resolution = getResolution();
  }
  if (context.source) {
    // Ensure reference values are created
    for (const first of ['true', 'false']) {
      for (const second of ['true', 'false']) {
        await evaluate(toStringValue(`${first} ${second} and`, { isExecutable: true }), context);
        await evaluate(toStringValue(`${first} ${second} or`, { isExecutable: true }), context);
      }
    }
    await evaluate(toStringValue(context.source, { isExecutable: true }), context);
  } else {
    await measureAllOperators(context);
  }
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

export function createPerfOperator(host: ReplHostDictionary): Value<'operator'> {
  return {
    type: 'operator',
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
        let loops: number = -1;
        let definition: IReadOnlyDictionary | undefined;
        if (value.type === 'integer') {
          loops = value.integer;
        } else if (value.type === 'dictionary') {
          definition = value.dictionary;
          loops = getValue(definition, 'loops', 'integer') ?? -1;
        } else {
          return { success: false, exception: 'typeCheck' };
        }
        if (loops < 0) {
          return { success: false, exception: 'typeCheck' };
        }
        const context: ExecuteContext = {
          loops,
          resolution: (definition && getValue(definition, 'resolution', 'integer')) ?? 0,
          measures: {},
          logWithPerformanceApi: (definition && getValue(definition, 'performance', 'boolean')) ?? false,
          source: definition && getValue(definition, 'source', 'string'),
          detail: definition && getValue(definition, 'detail', 'string'),
          options: definition && getValue(definition, 'options', 'string')?.split(' '),
          replIO: host.replIO
        };
        operands.pop();
        host.block();
        void execute(context).then(() => host.unblock());
        return { success: true, value: undefined };
      }
    }
  };
}
