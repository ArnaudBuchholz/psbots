import { getOperatorDefinitionRegistry, createState, ValueType } from '@psbots/engine';
import type { Result, Value, IState } from '@psbots/engine';
import { assert, OperatorType, toStringValue } from '@psbots/engine/sdk';
import type { IFunctionOperator, IInternalState } from '@psbots/engine/sdk';
import { cyan, red, yellow, white } from '../colors.js';
import type { IReplIO } from '../IReplIo.js';

const MAX_CYCLES = 10 ** 9;
const TICKS = ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f'];
let RESOLUTION = 0;

function getResolution() {
  const COUNT = 10_000;
  const powersOf10: number[] = [];
  let last = performance.now() * 1_000_000;
  for (let index = 0; index < COUNT; ++index) {
    const now = performance.now() * 1_000_000;
    const index = Math.round(Math.log10(now - last));
    powersOf10[index] = (powersOf10[index] ?? 0) + 1;
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
  RESOLUTION = 10 ** powerOf10;
}

class TimeBucket {
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
  private _ranges: number[] = [];
  private _maxHits = 0;

  add(duration: number) {
    ++this._count;
    const index = Math.floor(duration / RESOLUTION);
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
      return `-${value.operator.name}-@${ topOperatorState > 0 ? '+' : '-' }`;
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
  measures: Measures;
  replIO: IReplIO;
  lastUpdate?: number;
  lastTick?: number;
};

function execute(value: Value, context: ExecuteContext): void {
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
      if (context.lastUpdate === undefined || (Date.now() - context.lastUpdate) > 250) {
        const tick = context.lastTick ?? 0;
        context.replIO.output(`\r${cyan}${TICKS[tick]}${white}`);
        context.lastUpdate = Date.now();
        context.lastTick = (tick + 1) % TICKS.length;
      }
      const { calls } = state;
      if (calls.length > 0) {
        const measureName = getMeasureName(state);
        const start = performance.now();
        iterator.next();
        const end = performance.now();
        if (measures[measureName] === undefined) {
          measures[measureName] = new TimeBucket();
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

function measureAllOperators(context: ExecuteContext) {
  execute(toStringValue('version', { isExecutable: true }), context);
  const registry = getOperatorDefinitionRegistry();
  for (const definition of Object.values(registry)) {
    for (const sample of definition.samples) {
      execute(toStringValue(sample.in, { isExecutable: true }), context);
      execute(toStringValue(sample.out, { isExecutable: true }), context);
    }
  }
}

export function createPerfOperator(replIO: IReplIO): Value<ValueType.operator> {
  return {
    type: ValueType.operator,
    isExecutable: true,
    isReadOnly: true,
    operator: <IFunctionOperator>{
      name: 'perf',
      type: OperatorType.implementation,
      implementation: (internalState: IInternalState): Result<undefined> => {
        const { operands } = internalState;
        if (operands.length < 2) {
          return { success: false, exception: 'rangeCheck' };
        }
        const value = operands.top;
        if (
          (value.type !== ValueType.array || !value.isExecutable) &&
          (value.type !== ValueType.string || value.string !== 'default')
        ) {
          return { success: false, exception: 'typeCheck' };
        }
        const loops = operands.at(1);
        if (loops.type !== ValueType.integer) {
          return { success: false, exception: 'typeCheck' };
        }
        if (RESOLUTION === 0) {
          getResolution();
        }
        replIO.output(`${cyan}Resolution: ${yellow}${RESOLUTION.toString()}${cyan}ns${white}\r\n`);
        const context: ExecuteContext = {
          loops: loops.integer,
          measures: {},
          replIO
        };
        if (value.type === ValueType.string) {
          measureAllOperators(context);
          replIO.output(`\r`);
        } else {
          replIO.output(`${red}Not implemented${white}\r\n`);
        }
        return { success: true, value: undefined };
      }
    }
  };
}
