import { describe, beforeAll, it, expect } from 'vitest';
import { ExceptionDictionaryName, ExceptionType, SYSTEM_MEMORY_TYPE } from '@api/index.js';
import { BaseException } from '@sdk/exceptions/BaseException.js';
import { checkStringValue } from '@sdk/checks/checkValue.js';

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

  it('exposes type', () => {
    const typeValue = exception.lookup('type');
    checkStringValue(typeValue, { isExecutable: false });
    expect(typeValue.string).toStrictEqual(SYSTEM_MEMORY_TYPE);
  });

  it('exposes name', () => {
    const nameValue = exception.lookup('name');
    checkStringValue(nameValue, { isExecutable: false });
    expect(nameValue.string).toStrictEqual('BaseException');
  });

  it('exposes message', () => {
    const messageValue = exception.lookup('message');
    checkStringValue(messageValue, { isExecutable: false });
    expect(messageValue.string).toStrictEqual('test');
  });

  it('exposes stack', () => {
    const stackValue = exception.lookup('stack');
    checkStringValue(stackValue, { isExecutable: false });
    expect(stackValue.string).toContain('BaseException.spec.ts');
  });

  it('returns null on any other property', () => {
    expect(exception.lookup('unknown')).toBeNull();
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
