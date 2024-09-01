import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parse } from '@api/index.js';
import type { Value } from '@api/index.js';
import { State } from './State.js';
import { waitForGenerator, toValue } from '@test/index.js';
import { BusyException } from '@sdk/index.js';

let state: State;

beforeEach(() => {
  state = new State({
    debugMemory: true
  });
});

afterEach(() => {
  if (!state.destroyed) {
    state.destroy();
  }
});

describe('IState', () => {
  describe('when active', () => {
    it('exposes idle', () => {
      expect(state.idle).toStrictEqual(true);
    });

    it('exposes memoryTracker', () => {
      expect(state.memoryTracker).toBeDefined();
    });

    it('exposes operands', () => {
      expect(state.operands).toBeDefined();
    });

    it('exposes dictionaries', () => {
      expect(state.dictionaries).toBeDefined();
    });

    it('exposes exception', () => {
      expect(() => state.exception).not.toThrowError();
    });
  });

  describe('when destroyed', () => {
    beforeEach(() => {
      state.destroy();
    });

    it('fails on idle', () => {
      expect(() => state.idle).toThrowError();
    });

    it('fails on memoryTracker', () => {
      expect(() => state.memoryTracker).toThrowError();
    });

    it('fails on operands', () => {
      expect(() => state.operands).toThrowError();
    });

    it('fails on dictionaries', () => {
      expect(() => state.dictionaries).toThrowError();
    });

    it('fails on exception', () => {
      expect(() => state.exception).toThrowError();
    });
  });
});

describe('processing', () => {
  it('processes a string', () => {
    expect(state.idle).toStrictEqual(true);
    const generator = state.process('123');
    expect(state.idle).toStrictEqual(false);
    waitForGenerator(generator);
    expect(state.idle).toStrictEqual(true);
    expect(state.operands.ref).toStrictEqual<Value[]>([toValue(123)]);
  });

  it('processes an array', () => {
    expect(state.idle).toStrictEqual(true);
    const generator = state.process([toValue(123)]);
    expect(state.idle).toStrictEqual(false);
    waitForGenerator(generator);
    expect(state.idle).toStrictEqual(true);
    expect(state.operands.ref).toStrictEqual<Value[]>([toValue(123)]);
  });

  it('processes a generator', () => {
    expect(state.idle).toStrictEqual(true);
    const generator = state.process(parse('123'));
    expect(state.idle).toStrictEqual(false);
    waitForGenerator(generator);
    expect(state.idle).toStrictEqual(true);
    expect(state.operands.ref).toStrictEqual<Value[]>([toValue(123)]);
  });

  it('fails if already busy', () => {
    state.process(parse('123'));
    expect(() => state.process(parse('456'))).toThrowError(BusyException);
  });
});

describe('IInternalState', () => {
  it('enables calls by default', () => {
    expect(state.callEnabled).toStrictEqual(true);
  });

  it('uses a counter for callEnabled', () => {
    state.preventCall();
    expect(state.callEnabled).toStrictEqual(false);
    state.preventCall();
    expect(state.callEnabled).toStrictEqual(false);
    state.allowCall();
    expect(state.callEnabled).toStrictEqual(false);
    state.allowCall();
    expect(state.callEnabled).toStrictEqual(true);
  });
});
