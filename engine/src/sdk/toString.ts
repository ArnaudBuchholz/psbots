import type { Value } from '@api/index.js';
import { ValueType } from '@api/index.js';

const implementations: { [type in ValueType]: (container: Value<type>) => string } = {
  [ValueType.boolean]: ({ isSet }) => (isSet ? 'true' : 'false'),
  [ValueType.integer]: ({ integer }) => integer.toString(),
  [ValueType.string]: ({ isExecutable, string }) => {
    if (isExecutable) {
      return string.replace(/ /g, '␣');
    }
    return JSON.stringify(string);
  },
  [ValueType.mark]: () => '--mark--',
  [ValueType.operator]: ({ operator }) => `-${operator.name}-`,
  [ValueType.array]: ({ isExecutable, array }) => {
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
        output.push(implementations[item.type](item as never));
      }
    }
    if (isExecutable) {
      output.push('}');
    } else {
      output.push(']');
    }
    return output.join(' ');
  },
  [ValueType.dictionary]: ({ dictionary }) => {
    const namesCount = dictionary.names.length.toString();
    return `--dictionary(${namesCount})--`;
  }
};

export function toString(value: Value): string {
  return implementations[value.type](value as never);
}
