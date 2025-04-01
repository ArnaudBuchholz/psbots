import { ValueType } from '@api/values/ValueType.js';
import type { Value } from '@api/values/Value.js';
import type { IDebugSource } from '@api/interfaces/IDebugSource.js';

type ParseOptions = {
  pos?: number;
  filename?: string;
  // TODO: syntax switch to enable real PostScript parsing
};

export function* parse(source: string, options?: ParseOptions): Generator<Value> {
  options = options ?? {};
  const { filename } = options;
  let { pos = 0 } = options;
  // const { length } = source;

  // do {
  //   const char = source[pos];
  //   if (char === ' ' || char === '\t' || char === '\n') {
  //     continue;
  //   }
  //   if (char === '%') {
  //     pos = source.indexOf('\n', pos);
  //     if (pos === -1) {
  //       pos = length - 1;
  //     }
  //     continue;
  //   }
  //   if (char === '"') {
  //     pos = source.indexOf('"', pos + 1);
  //     if (pos === -1) {
  //       // TODO: throw an error
  //     }
  //     ++pos;
  //     yield 

  //   }


  // } while (++pos < length) {
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
        integer: Number.parseInt(integer, 10)
      };
    } else if (call !== undefined) {
      yield call.length > 1 && call.startsWith('/')
        ? {
            ...common,
            type: ValueType.name,
            isExecutable: false,
            name: call.slice(1)
          }
        : {
            ...common,
            type: ValueType.name,
            isExecutable: true,
            name: call
          };
    }
    match = matcher.exec(source);
  }
}
