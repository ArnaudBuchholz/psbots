import type { IDebugSource, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';

type ToStringOptions = {
  operatorState?: number;
  includeDebugSource?: boolean;
  maxWidth?: number;
};

function convertPosToLineAndCol(source: string, pos: number): { line: number; col: number } {
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

function minimizeAt(at: string): string {
  const atParts = at.split(/(\\|\/)/).filter((part) => part.trim());
  if (atParts.length < 3) {
    return at;
  }
  return '…' + atParts.splice(-2).join('');
}

function fitToMaxWidth(stringifiedValue: string, at: string | undefined, maxWidth: number): string {
  let result: string;
  if (at !== undefined) {
    result = `${stringifiedValue}@${at}`;
  } else {
    result = stringifiedValue;
  }
  if (maxWidth < 1 || result.length < maxWidth) {
    return result;
  }
  if (at !== undefined) {
    const miminizedAt = minimizeAt(at);
    const width = maxWidth - (miminizedAt.length + 1);
    if (width < stringifiedValue.length) {
      return stringifiedValue.substring(0, width - 1) + '…@' + miminizedAt;
    }
    return stringifiedValue + '@' + miminizedAt;
  }
  return stringifiedValue.substring(0, maxWidth - 1) + '…';
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
  [ValueType.boolean]: ({ isSet, debugSource }, options) => decorate(isSet ? 'true' : 'false', debugSource, options),
  [ValueType.integer]: ({ integer, debugSource }, options) => decorate(integer.toString(), debugSource, options),
  [ValueType.string]: ({ isExecutable, string, debugSource }, options) => {
    let stringified: string;
    if (isExecutable) {
      stringified = string.replace(/ /g, '␣');
    } else {
      stringified = JSON.stringify(string);
    }
    return decorate(stringified, debugSource, options);
  },
  [ValueType.mark]: ({ debugSource }, options) => decorate('--mark--', debugSource, options),
  [ValueType.operator]: ({ operator, debugSource }, options) => decorate(`-${operator.name}-`, debugSource, options),
  [ValueType.array]: ({ isExecutable, array, debugSource }, options) => {
    const output: string[] = [];
    if (isExecutable) {
      output.push('{');
    } else {
      output.push('[');
    }
    const { length } = array;
    for (let index = 0; index < length; ++index) {
      const item = array.at(index);
      if (item === null) {
        output.push('␀');
      } else {
        output.push(
          implementations[item.type](
            item as never,
            Object.assign({}, options, {
              includeDebugSource: false,
              maxWidth: 0
            })
          )
        );
      }
    }
    if (isExecutable) {
      output.push('}');
    } else {
      output.push(']');
    }
    return decorate(output.join(' '), debugSource, options);
  },
  [ValueType.dictionary]: ({ dictionary, debugSource }, options) => {
    const namesCount = dictionary.names.length.toString();
    return decorate(`--dictionary(${namesCount})--`, debugSource, options);
  }
};

export function toString(
  value: Value,
  options: ToStringOptions = {
    includeDebugSource: false,
    maxWidth: 0
  }
): string {
  return implementations[value.type](value as never, options);
}
