import { ValueType } from '@api/values/ValueType.js';
import type { Value } from '@api/values/Value.js';
import type { IDebugSource } from '@api/interfaces/IDebugSource.js';

export function* parse(source: string, pos: number = 0, filename?: string): Generator<Value> {
  const matcher = /%[^\n]*|(?:"([^"]*)")|\s|((?:-|\+)?\d+)|(\[|\]|{|}|<<|>>|«|»|[^[\]{}<>«»\s]+)/g;
  matcher.lastIndex = pos;
  let match = matcher.exec(source);
  while (match !== null) {
    const [text, string, integer, call] = match;
    const common: {
      isReadOnly: true;
      debugSource?: IDebugSource;
    } = {
      isReadOnly: true
    };
    if (filename !== undefined) {
      common.debugSource = {
        source,
        filename,
        pos: match.index,
        length: text.length
      };
    }
    if (string !== undefined) {
      yield {
        ...common,
        type: ValueType.string,
        isExecutable: false,
        string
      };
    } else if (integer !== undefined) {
      yield {
        ...common,
        type: ValueType.integer,
        isExecutable: false,
        integer: parseInt(integer, 10)
      };
    } else if (call !== undefined) {
      if (call.length > 1 && call.startsWith('/')) {
        yield {
          ...common,
          type: ValueType.name,
          isExecutable: false,
          name: call.substring(1)
        };
      } else {
        yield {
          ...common,
          type: ValueType.name,
          isExecutable: true,
          name: call
        };
      }
    }
    match = matcher.exec(source);
  }
}
