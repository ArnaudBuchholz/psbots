import { ValueType } from '@api/values/ValueType.js'
import { Value } from '@api/values/Value'
import { IDebugSource } from '@api/interfaces/IDebugSource'

export function * parse (source: string, filename: string, pos: number): Generator<Value> {
  const matcher = /%[^\n]*|(?:"([^"]*)")|\s|((?:-|\+)?\d+)|(\[|\]|{|}|[^[\]{}}\s]+)/g
  matcher.lastIndex = pos
  let match = matcher.exec(source)
  while (match !== null) {
    const [text, string, integer, call] = match
    const debugSource: IDebugSource = {
      source,
      filename,
      pos: match.index,
      length: text.length
    }
    if (string !== undefined) {
      yield {
        type: ValueType.string,
        isExecutable: false,
        isReadOnly: true,
        isShared: false,
        debugSource,
        string
      }
    } else if (integer !== undefined) {
      yield {
        type: ValueType.integer,
        isExecutable: false,
        isReadOnly: true,
        isShared: false,
        debugSource,
        integer: parseInt(integer, 10)
      }
    } else if (call !== undefined) {
      yield {
        type: ValueType.string,
        isExecutable: true,
        isReadOnly: true,
        isShared: false,
        debugSource,
        string: call
      }
    }
    match = matcher.exec(source)
  }
}
