import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import type { IDictionary, IReadOnlyDictionary, Value } from '@api/index.js';
import { USER_MEMORY_TYPE } from '@api/index.js';
import type { DictionaryStackWhereResult } from '@sdk/index.js';
import { DictStackUnderflowException, UndefinedException } from '@sdk/index.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { Dictionary } from '@core/objects/dictionaries/Dictionary.js';
import { SystemDictionary } from '@core/objects/dictionaries/System.js';
import { DictionaryStack } from './DictionaryStack.js';
import { toValue } from '@test/index.js';

let tracker: MemoryTracker;
let stack: DictionaryStack;
let markOp: Value;

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

beforeAll(() => {
  const lookUpResult = SystemDictionary.instance.lookup('mark');
  if (lookUpResult === null) {
    throw new Error('mark is not part of System dictionary');
  }
  markOp = lookUpResult;
});

beforeEach(() => {
  tracker = new MemoryTracker();
  stack = new DictionaryStack(tracker, host);
});

afterEach(() => {
  expect(stack.release()).toStrictEqual(false);
  expect(tracker.used).toStrictEqual(0);
});

it('starts with three dictionaries', () => {
  expect(stack.ref.length).toStrictEqual(3);
});

it('exposes the host dictionary', () => {
  expect(stack.host.dictionary).toStrictEqual(host);
});

it('exposes the system dictionary', () => {
  expect(stack.system.dictionary).toStrictEqual(SystemDictionary.instance);
});

it('exposes an empty global dictionary', () => {
  const { global } = stack;
  expect(global.dictionary.names.length).toStrictEqual(0);
});

it('exposes first dictionary as top', () => {
  expect(stack.top).toStrictEqual(stack.global);
});

it('creates an empty dictionary if host is not specified', () => {
  const hostFreeStack = new DictionaryStack(tracker);
  expect(hostFreeStack.ref.length).toStrictEqual(3);
  expect(hostFreeStack.host.dictionary.names).toStrictEqual<string[]>([]);
  expect(hostFreeStack.release()).toStrictEqual(false);
});

describe('where', () => {
  it('searches for a known name (from host dictionary)', () => {
    expect(stack.where('hostname')).toStrictEqual<DictionaryStackWhereResult>({
      dictionary: stack.host.dictionary,
      value: toValue('localhost')
    });
  });

  it('searches for a known name (from system dictionary)', () => {
    expect(stack.where('mark')).toStrictEqual<DictionaryStackWhereResult>({
      dictionary: stack.system.dictionary,
      value: markOp
    });
  });

  it('searches for a known name (from global dictionary)', () => {
    const global = stack.global.dictionary as IDictionary;
    global.def('clear', toValue('clear'));
    expect(stack.where('clear')).toStrictEqual<DictionaryStackWhereResult>({
      dictionary: global,
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
    expect(stack.lookup('mark')).toStrictEqual<Value>(markOp);
  });

  it('searches for a known name (from global dictionary)', () => {
    const global = stack.global.dictionary as IDictionary;
    global.def('clear', toValue('clear'));
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
    dict.def('mark', toValue('overridden'));
    stack.begin(dict.toValue());
  });

  afterEach(() => {
    dict.release();
  });

  it('adds a new dictionary to the stack', () => {
    expect(stack.lookup('mark')).toStrictEqual<Value>(toValue('overridden'));
  });

  describe('end', () => {
    beforeEach(() => stack.end());

    it('removes the top dictionary from the stack', () => {
      expect(stack.lookup('mark')).toStrictEqual<Value>(markOp);
    });

    it('fails when attempting to remove pre-installed dictionaries', () => {
      expect(() => stack.end()).toThrowError(DictStackUnderflowException);
    });
  });
});
