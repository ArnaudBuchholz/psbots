import { describe, beforeAll, it, expect } from 'vitest';
import { ExceptionDictionaryName } from '@api/index.js';
import { BaseException } from '@sdk/exceptions/BaseException.js';
import { checkStringValue } from '@sdk/checks/checkValue.js';

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
    checkStringValue(typeValue, false);
    expect(typeValue.string).toStrictEqual('system');
  });

  it('exposes name', () => {
    const nameValue = exception.lookup('name');
    checkStringValue(nameValue, false);
    expect(nameValue.string).toStrictEqual('BaseException');
  });

  it('exposes message', () => {
    const messageValue = exception.lookup('message');
    checkStringValue(messageValue, false);
    expect(messageValue.string).toStrictEqual('test');
  });

  it('exposes stack', () => {
    const stackValue = exception.lookup('stack');
    checkStringValue(stackValue, false);
    expect(stackValue.string).toContain('BaseException.spec.ts');
  });

  it('returns null on any other property', () => {
    expect(exception.lookup('unknown')).toBeNull();
  });
});

describe('stack handling', () => {
  it('maps default stack', () => {
    const exception = new BaseException('test');
    const { stack } = exception;
    expect(stack).toContain('BaseException: test');
    expect(stack).toContain('BaseException.spec.ts');
  });

  it('offers a setter', () => {
    const exception = new BaseException('test');
    exception.stack = 'abc';
    expect(exception.stack).toStrictEqual('abc');
  });
});
