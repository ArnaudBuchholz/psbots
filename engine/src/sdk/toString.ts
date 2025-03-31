import type { IDebugSource, IReadOnlyCallStack, Value } from '@api/index.js';
import { ValueType, parse } from '@api/index.js';
import {
  OPERATOR_STATE_CALL_BEFORE_POP,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_POP,
  OPERATOR_STATE_UNKNOWN
} from '@sdk/interfaces/ICallStack.js';

export const TOSTRING_NULL = '␀';
export const TOSTRING_BEGIN_MARKER = '▻';
export const TOSTRING_END_MARKER = '◅';

export type ToStringOptions = {
  operatorState?: number;
  includeDebugSource?: boolean;
  maxWidth?: number;
};

function convertPosToLineAndCol(source: string, pos: number) {
  let line = 1;
  let lastCrIndex = 0;
  let crIndex = source.indexOf('\n');
  while (crIndex !== -1 && lastCrIndex + pos > crIndex) {
    ++crIndex;
    pos -= crIndex - lastCrIndex;
    lastCrIndex = crIndex;
    ++line;
    crIndex = source.indexOf('\n', lastCrIndex);
  }
  return { line, col: pos + 1 };
}

function minimizeAt(at: string) {
  const atParts = at.split(/([\\/])/).filter((part) => part.trim());
  if (atParts.length < 3) {
    return at;
  }
  return '…' + atParts.splice(-2).join('');
}

function centerValue(stringifiedValue: string, maxWidth: number) {
  const beginMarkerPos = stringifiedValue.indexOf(TOSTRING_BEGIN_MARKER);
  const endMarkerPos = stringifiedValue.indexOf(TOSTRING_END_MARKER, beginMarkerPos + 1);
  const markedAreaLength = endMarkerPos - beginMarkerPos + 1;
  if (beginMarkerPos > -1 && endMarkerPos > -1 && markedAreaLength > 0) {
    if (maxWidth > markedAreaLength) {
      let from = beginMarkerPos - Math.ceil((maxWidth - markedAreaLength) / 2);
      if (from + maxWidth > stringifiedValue.length) {
        from = stringifiedValue.length - maxWidth + 1;
      }
      if (from > 0) {
        return '…' + stringifiedValue.slice(Math.max(0, from));
      }
    } else {
      return '…' + stringifiedValue.slice(Math.max(0, beginMarkerPos - 1));
    }
  }
  return stringifiedValue;
}

function fitToMaxWidth(stringifiedValue: string, at: string | undefined, maxWidth: number) {
  let result = at === undefined ? stringifiedValue : `${stringifiedValue}@${at}`;
  if (maxWidth < 1 || result.length <= maxWidth) {
    return result;
  }

  let minimizedAt = '';
  if (at !== undefined) {
    minimizedAt = `@${minimizeAt(at)}`;
    result = `${stringifiedValue}${minimizedAt}`;
    if (result.length <= maxWidth) {
      return result;
    }
    if (maxWidth < minimizedAt.length) {
      minimizedAt = ''; // ignore
    } else {
      maxWidth -= minimizedAt.length;
    }
  }

  stringifiedValue = centerValue(stringifiedValue, maxWidth);

  if (stringifiedValue.length > maxWidth) {
    stringifiedValue = stringifiedValue.slice(0, Math.max(0, maxWidth - 1)) + '…';
  }
  if (minimizedAt) {
    return `${stringifiedValue}${minimizedAt}`;
  }
  return stringifiedValue;
}

function decorate(
  stringifiedValue: string,
  debugSource: IDebugSource | undefined,
  { includeDebugSource = false, maxWidth = 0 }: ToStringOptions
): string {
  let at: string | undefined;
  if (debugSource !== undefined && includeDebugSource) {
    const { filename, source } = debugSource;
    const { line, col } = convertPosToLineAndCol(source, debugSource.pos);
    at = `${filename}:${line}:${col}`;
  }
  return fitToMaxWidth(stringifiedValue, at, maxWidth);
}

const implementations: { [type in ValueType]: (container: Value<type>, options: ToStringOptions) => string } = {
  [ValueType.null]: ({ debugSource }, options) => decorate(TOSTRING_NULL, debugSource, options),
  [ValueType.boolean]: ({ isSet, debugSource }, options) => decorate(isSet ? 'true' : 'false', debugSource, options),
  [ValueType.integer]: ({ integer, debugSource }, options) => decorate(integer.toString(), debugSource, options),
  [ValueType.string]: ({ isExecutable, string, debugSource }, options) => {
    let stringified: string | undefined;
    if (isExecutable) {
      const { operatorState } = options;
      if (operatorState !== undefined && operatorState >= OPERATOR_STATE_FIRST_CALL) {
        const [token] = parse(string, operatorState, 'toString');
        const length = token?.debugSource?.length;
        if (length !== undefined) {
          stringified =
            string.slice(0, Math.max(0, operatorState)) +
            TOSTRING_BEGIN_MARKER +
            string.slice(operatorState, operatorState + length) +
            TOSTRING_END_MARKER +
            string.slice(Math.max(0, operatorState + length));
        }
      }
      if (!stringified) {
        stringified = string;
      }
    } else {
      stringified = JSON.stringify(string);
    }
    return decorate(stringified, debugSource, options);
  },
  [ValueType.name]: ({ isExecutable, name, debugSource }, options) => {
    let stringified: string = name.replaceAll(' ', '␣');
    if (!isExecutable) {
      stringified = `/${stringified}`;
    }
    return decorate(stringified, debugSource, options);
  },
  [ValueType.mark]: ({ debugSource }, options) => decorate('--mark--', debugSource, options),
  [ValueType.operator]: ({ operator, debugSource }, options) => {
    let stringified = `-${operator.name}-`;
    const { operatorState } = options;
    if (operatorState !== undefined && operatorState !== OPERATOR_STATE_UNKNOWN) {
      if (operatorState > OPERATOR_STATE_FIRST_CALL) {
        stringified += `${TOSTRING_BEGIN_MARKER}${operatorState?.toString()}`;
      } else if (operatorState === OPERATOR_STATE_CALL_BEFORE_POP) {
        stringified += TOSTRING_END_MARKER;
      } else if (operatorState === OPERATOR_STATE_POP) {
        stringified += `${TOSTRING_END_MARKER}${TOSTRING_END_MARKER}`;
      } else if (operatorState < OPERATOR_STATE_CALL_BEFORE_POP) {
        stringified += `${TOSTRING_END_MARKER}${operatorState?.toString()}`;
      }
    }
    return decorate(stringified, debugSource, options);
  },
  [ValueType.array]: ({ isExecutable, array, debugSource }, options) => {
    const output: string[] = [];
    if (isExecutable) {
      output.push('{');
    } else {
      output.push('[');
    }
    const { length } = array;
    const { operatorState } = options;
    for (let index = 0; index < length; ++index) {
      const item = array.at(index);
      const stringifiedItem = implementations[item.type](
        item as never,
        Object.assign({}, options, {
          includeDebugSource: false,
          maxWidth: 0,
          operatorState: OPERATOR_STATE_UNKNOWN
        })
      );
      if (isExecutable && operatorState === index) {
        output.push(TOSTRING_BEGIN_MARKER + stringifiedItem + TOSTRING_END_MARKER);
      } else {
        output.push(stringifiedItem);
      }
    }
    if (isExecutable) {
      output.push('}');
    } else {
      output.push(']');
    }
    return decorate(output.join(' '), debugSource, options);
  },
  [ValueType.dictionary]: ({ dictionary, isReadOnly, debugSource }, options) => {
    const namesCount = dictionary.names.length.toString();
    let namesDescription = namesCount.toString();
    if (!isReadOnly) {
      namesDescription += '/∞'; // May be limited some day
    }
    return decorate(`--dictionary(${namesDescription})--`, debugSource, options);
  }
};

export function toString(value: Value, options?: ToStringOptions): string {
  return implementations[value.type](
    value as never,
    options ?? {
      includeDebugSource: false,
      maxWidth: 0
    }
  );
}

export function callStackToString(
  callStack: IReadOnlyCallStack,
  options?: Omit<ToStringOptions, 'operatorState'>
): string[] {
  const { length } = callStack;
  const result: string[] = [];
  for (let index = 0; index < length; ++index) {
    const value = callStack.at(index);
    const operatorState = callStack.operatorStateAt(index);
    result.push(toString(value, Object.assign({}, options, { operatorState })));
  }
  return result;
}
