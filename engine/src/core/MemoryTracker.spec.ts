import { describe, it, expect, beforeEach } from 'vitest';
import { ShareableObject } from '@core/objects/ShareableObject.js';
import { MemoryTracker } from './MemoryTracker.js';
import { toValue } from '@test/index.js';

class MyObject extends ShareableObject {
  public disposeCalled: number = 0;

  protected _dispose(): void {
    ++this.disposeCalled;
  }
}

describe('initial state', () => {
  it('starts with used being 0', () => {
    const tracker = new MemoryTracker();
    expect(tracker.used).toStrictEqual(0);
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
      tracker.releaseValue(string);
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

    it('frees bytes', () => {
      const string = toValue('hello world!');
      tracker.addValueRef(string);
      tracker.releaseValue(string);
      expect(tracker.used).toStrictEqual(0);
      expect(tracker.peak).toStrictEqual(17);
    });
  });
});
