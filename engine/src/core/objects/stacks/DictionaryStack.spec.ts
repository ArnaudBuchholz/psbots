import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { IReadOnlyDictionary, Value } from '@api/index.js';
import { USER_MEMORY_TYPE } from '@api/index.js';
import type { DictionaryStackWhereResult } from '@sdk/index.js';
import { DictStackUnderflowException, UndefinedException } from '@sdk/index.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { Dictionary } from '@core/objects/dictionaries/Dictionary.js';
import { DictionaryStack } from './DictionaryStack.js';
import { toValue } from '@test/index.js';

let tracker: MemoryTracker;
let stack: DictionaryStack;

const system: IReadOnlyDictionary = {
  get names() {
    return ['test'];
  },
  lookup(name: string): Value | null {
    if (name === 'test') {
      return toValue('test');
    }
    return null;
  }
};

const host: IReadOnlyDictionary = {
  get names() {
    return ['hostname'];
  },
  lookup(name: string): Value | null {
    if (name === 'hostname') {
      return toValue('localhost');
    }
    return null;
  }
};

beforeEach(() => {
  tracker = new MemoryTracker();
  stack = new DictionaryStack(tracker, { system, host });
});

afterEach(() => {
  expect(stack.release()).toStrictEqual(false);
  expect(tracker.used).toStrictEqual(0);
});

it('starts with three dictionaries', () => {
  expect(stack.ref.length).toStrictEqual(3);
});

it('exposes the host dictionary', () => {
  const { host: iHostRODictionary } = stack;
  expect(iHostRODictionary).toStrictEqual(host);
});

it('exposes the system dictionary', () => {
  const { system: iSystemRODictionary } = stack;
  expect(iSystemRODictionary).toStrictEqual(system);
});

it('exposes an empty global dictionary', () => {
  const { global } = stack;
  expect(global.names.length).toStrictEqual(0);
});

it('exposes first dictionary as top', () => {
  const global = stack.top;
  expect(global.dictionary).toStrictEqual(stack.global);
});

it('creates an empty dictionary if host is not specified', () => {
  const stackWithoutHost = new DictionaryStack(tracker, { system });
  expect(stackWithoutHost.ref.length).toStrictEqual(3);
  const { host: iHostRODictionary } = stackWithoutHost;
  expect(iHostRODictionary.names).toStrictEqual<string[]>([]);
  expect(stackWithoutHost.release()).toStrictEqual(false);
});

describe('where', () => {
  it('searches for a known name (from host dictionary)', () => {
    expect(stack.where('hostname')).toStrictEqual<DictionaryStackWhereResult>({
      dictionary: stack.host,
      value: toValue('localhost')
    });
  });

  it('searches for a known name (from system dictionary)', () => {
    expect(stack.where('test')).toStrictEqual<DictionaryStackWhereResult>({
      dictionary: stack.system,
      value: toValue('test')
    });
  });

  it('searches for a known name (from global dictionary)', () => {
    stack.global.def('clear', toValue('clear'));
    expect(stack.where('clear')).toStrictEqual<DictionaryStackWhereResult>({
      dictionary: stack.global,
      value: toValue('clear')
    });
  });

  it('returns null if the name is not found in the stack', () => {
    expect(stack.where('unknown')).toStrictEqual(null);
  });
});

describe('lookup', () => {
  it('searches for a known name (from host dictionary)', () => {
    expect(stack.lookup('hostname')).toStrictEqual<Value>(toValue('localhost'));
  });

  it('searches for a known name (from system dictionary)', () => {
    expect(stack.lookup('test')).toStrictEqual<Value>(toValue('test'));
  });

  it('searches for a known name (from global dictionary)', () => {
    stack.global.def('clear', toValue('clear'));
    expect(stack.lookup('clear')).toStrictEqual<Value>(toValue('clear'));
  });

  it('fails with Undefined if the name is not found in the stack', () => {
    expect(() => stack.lookup('unknown')).toThrowError(UndefinedException);
  });
});

describe('begin', () => {
  let dict: Dictionary;

  beforeEach(() => {
    dict = new Dictionary(tracker, USER_MEMORY_TYPE);
    dict.def('test', toValue('overridden'));
    stack.begin(dict.toValue());
  });

  afterEach(() => {
    dict.release();
  });

  it('adds a new dictionary to the stack', () => {
    expect(stack.lookup('test')).toStrictEqual<Value>(toValue('overridden'));
  });

  describe('end', () => {
    beforeEach(() => stack.end());

    it('removes the top dictionary from the stack', () => {
      expect(stack.lookup('test')).toStrictEqual<Value>(toValue('test'));
    });

    it('fails when attempting to remove pre-installed dictionaries', () => {
      expect(() => stack.end()).toThrowError(DictStackUnderflowException);
    });
  });
});
