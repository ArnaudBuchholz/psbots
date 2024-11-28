import { describe, beforeAll, it, expect } from 'vitest';
import type { Value } from '@api/index.js';
import { ExceptionDictionaryName, ExceptionType, nullValue, SYSTEM_MEMORY_TYPE } from '@api/index.js';
import { BaseException } from '@sdk/exceptions/BaseException.js';
import { isStringValue } from '@sdk/checks/isValue.js';

it('exposes a type', () => {
  const exception = new BaseException('test');
  expect(exception.type).toStrictEqual(ExceptionType.system);
});

describe('error behavior', () => {
  let exception: BaseException;

  beforeAll(() => {
    exception = new BaseException('test');
  });

  it('exposes name', () => {
    expect(exception.name).toStrictEqual('BaseException');
  });

  it('exposes message', () => {
    expect(exception.message).toStrictEqual('test');
  });

  it('exposes stack', () => {
    expect(exception.stack).toBeTypeOf('string');
    expect(exception.stack).not.toBe('');
  });
});

describe('IReadOnlyDictionary behavior', () => {
  let exception: BaseException;

  beforeAll(() => {
    exception = new BaseException('test');
  });

  it('exposes names', () => {
    expect(exception.names).toStrictEqual([
      ExceptionDictionaryName.type,
      ExceptionDictionaryName.name,
      ExceptionDictionaryName.message,
      ExceptionDictionaryName.stack
    ]);
  });

  function check(value: Value, expectedString: string, exact = true) {
    if (isStringValue(value, { isExecutable: false })) {
      if (exact) {
        expect(value.string).toStrictEqual(expectedString);
      } else {
        expect(value.string).toContain(expectedString);
      }
    } else {
      expect.unreachable();
    }
  }

  it('exposes type', () => {
    check(exception.lookup('type'), SYSTEM_MEMORY_TYPE);
  });

  it('exposes name', () => {
    check(exception.lookup('name'), 'BaseException');
  });

  it('exposes message', () => {
    check(exception.lookup('message'), 'test');
  });

  it('exposes stack', () => {
    check(exception.lookup('stack'), 'BaseException.spec.ts', false);
  });

  it('returns null on any other property', () => {
    expect(exception.lookup('unknown')).toStrictEqual(nullValue);
  });
});

describe('engine stack handling', () => {
  it('is empty by default', () => {
    const exception = new BaseException('test');
    expect(exception.engineStack).toStrictEqual([]);
  });

  it('offers a setter', () => {
    const exception = new BaseException('test');
    exception.engineStack = ['abc'];
    expect(exception.engineStack).toStrictEqual(['abc']);
  });
});
