import { describe, it, expect, beforeEach } from 'vitest';
import { STRING_MEMORY_TYPE, MemoryTracker } from './MemoryTracker.js';
import { toValue } from '@test/index.js';
import { SYSTEM_MEMORY_TYPE, USER_MEMORY_TYPE } from '@api/index.js';
import type { IMemoryByType } from '@api/index.js';

describe('initial state', () => {
  it('starts with used being 0', () => {
    const tracker = new MemoryTracker();
    expect(tracker.used).toStrictEqual(0);
  });
});

describe('tracking', () => {
  const MAX_MEMORY = 100;
  let tracker: MemoryTracker;

  beforeEach(() => {
    tracker = new MemoryTracker({
      total: MAX_MEMORY
    });
  });

  it('provides information about total memory', () => {
    expect(tracker.total).toStrictEqual(MAX_MEMORY);
  });

  it('keeps track of memory used', () => {
    tracker.register({ container: {}, type: SYSTEM_MEMORY_TYPE, bytes: 50 });
    tracker.register({ container: {}, type: STRING_MEMORY_TYPE, bytes: 20 });
    tracker.register({ container: {}, type: USER_MEMORY_TYPE, bytes: 10 });
    expect(tracker.used).toStrictEqual(80);
    expect(tracker.byType).toStrictEqual<IMemoryByType>({
      system: 50,
      string: 20,
      user: 10
    });
  });

  it('fails when allocating too much memory', () => {
    expect(() => tracker.register({ container: {}, type: 'system', bytes: MAX_MEMORY + 1 })).toThrowError();
  });
});

describe('string management', () => {
  const STRING_CACHE_THRESHOLD = 10;
  let tracker: MemoryTracker;

  beforeEach(() => {
    tracker = new MemoryTracker({
      stringCacheThreshold: STRING_CACHE_THRESHOLD
    });
  });

  describe('small strings', () => {
    it('counts string size', () => {
      tracker.addValueRef(toValue('hello'));
      expect(tracker.used).toStrictEqual(6);
    });

    it('sums up bytes', () => {
      const string = toValue('hello');
      tracker.addValueRef(string);
      tracker.addValueRef(string);
      expect(tracker.used).toStrictEqual(12);
    });

    it('frees bytes', () => {
      const string = toValue('hello');
      tracker.addValueRef(string);
      expect(tracker.releaseValue(string)).toStrictEqual(false);
      expect(tracker.used).toStrictEqual(0);
      expect(tracker.peak).toStrictEqual(6);
    });
  });

  describe('larger strings (over the threshold)', () => {
    it('counts string size', () => {
      tracker.addValueRef(toValue('hello world!'));
      expect(tracker.used).toStrictEqual(17);
    });

    it('does *not* sums up bytes', () => {
      const string = toValue('hello world!');
      tracker.addValueRef(string);
      tracker.addValueRef(string);
      expect(tracker.used).toStrictEqual(17);
    });

    it('keeps the string valid until fully released', () => {
      const string = toValue('hello world!');
      tracker.addValueRef(string);
      tracker.addValueRef(string);
      expect(tracker.releaseValue(string)).toStrictEqual(true);
    });

    it('frees bytes', () => {
      const string = toValue('hello world!');
      tracker.addValueRef(string);
      expect(tracker.releaseValue(string)).toStrictEqual(false);
      expect(tracker.used).toStrictEqual(0);
      expect(tracker.peak).toStrictEqual(17);
    });
  });
});
