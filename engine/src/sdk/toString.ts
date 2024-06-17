import type { Value, IReadOnlyArray } from '@api/index.js';
import { ValueType } from '@api/index.js';

function arrayImplementation(array: IReadOnlyArray, begin: string, end: string): string {
  const output = [begin];
  const { length } = array;
  for (let index = 0; index < length; ++index) {
    const item = array.at(index);
    if (item === null) {
      output.push('␀');
    } else {
      output.push(implementations[item.type](item as never));
    }
  }
  output.push(end);
  return output.join(' ');
}

const implementations: { [type in ValueType]: (container: Value<type>) => string } = {
  [ValueType.boolean]: ({ isSet }) => (isSet ? 'true' : 'false'),
  [ValueType.integer]: ({ integer }) => integer.toString(),
  [ValueType.string]: ({ isExecutable, string }) => {
    if (isExecutable) {
      return string.replace(/ /g, '␣')
    }
    return JSON.stringify(string)
  },
  [ValueType.mark]: () => '--mark--',
  [ValueType.operator]: ({ operator }) => `-${operator.name}-`,
  [ValueType.array]: ({ array }) => arrayImplementation(array, '[', ']'),
  [ValueType.dictionary]: ({ dictionary }) => {
    const namesCount = dictionary.names.length.toString();
    return `--dictionary(${namesCount})--`;
  }
};

export function toString(value: Value): string {
  return implementations[value.type](value as never);
}
