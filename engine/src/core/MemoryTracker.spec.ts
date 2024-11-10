import { describe, it, expect, beforeEach } from 'vitest';
import { STRING_MEMORY_TYPE, MemoryTracker } from './MemoryTracker.js';
import { toValue } from '@test/index.js';
import { SYSTEM_MEMORY_TYPE, USER_MEMORY_TYPE } from '@api/index.js';
import type { IMemoryByType, IMemorySnapshot } from '@api/index.js';
import { AssertException } from '@sdk/index.js';

const helloWorldString = 'hello world!';
const helloWorldValue = toValue(helloWorldString);

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

  it('provides a minimal snapshot', () => {
    tracker.register({ container: {}, type: SYSTEM_MEMORY_TYPE, bytes: 50 });
    tracker.register({ container: {}, type: USER_MEMORY_TYPE, bytes: 20 });
    tracker.addValueRef(helloWorldValue);
    expect(tracker.used).toStrictEqual(87);
    expect(tracker.snapshot()).toMatchObject<IMemorySnapshot>({
      used: 87,
      peak: 87,
      total: MAX_MEMORY,
      byType: {
        system: 50,
        user: 20,
        string: 17
      },
      string: [
        {
          references: 1,
          string: helloWorldString,
          size: 13,
          total: 17
        }
      ],
      system: [],
      user: []
    });
  });

  it('fails when allocating too much memory', () => {
    expect(() => tracker.register({ container: {}, type: 'system', bytes: MAX_MEMORY + 1 })).toThrowError();
  });

  describe('debugging memory', () => {
    beforeEach(() => {
      tracker = new MemoryTracker({
        total: MAX_MEMORY,
        debug: true
      });
    });

    it('provides a minimal snapshot', () => {
      tracker.register({ container: {}, type: SYSTEM_MEMORY_TYPE, bytes: 50 });
      tracker.register({ container: {}, type: USER_MEMORY_TYPE, bytes: 20 });
      tracker.addValueRef(helloWorldValue);
      expect(tracker.used).toStrictEqual(87);
      expect(tracker.snapshot()).toMatchObject<IMemorySnapshot>({
        used: 87,
        peak: 87,
        total: MAX_MEMORY,
        byType: {
          system: 50,
          user: 20,
          string: 17
        },
        string: [
          {
            references: 1,
            string: helloWorldString,
            size: 13,
            total: 17
          }
        ],
        system: [
          {
            container: {
              class: 'Object'
            },
            total: 50
          }
        ],
        user: [
          {
            container: {
              class: 'Object'
            },
            total: 20
          }
        ]
      });
    });
  });
});

describe('debug', () => {
  const container = {};
  let tracker: MemoryTracker;

  beforeEach(() => {
    tracker = new MemoryTracker({ debug: true });
  });

  it('keeps track of allocation containers', () => {
    tracker.register({ container, type: SYSTEM_MEMORY_TYPE, bytes: 1 });
    const containerRegisters = [...tracker.enumContainersAllocations()];
    expect(
      containerRegisters.findIndex((containerRegister) => containerRegister.container.deref() === container)
    ).not.toStrictEqual(-1);
  });

  it('removes fully freed references', () => {
    tracker.register({ container, type: SYSTEM_MEMORY_TYPE, bytes: 1 });
    tracker.register({ container, type: SYSTEM_MEMORY_TYPE, bytes: -1 });
    const containerRegisters = [...tracker.enumContainersAllocations()];
    expect(
      containerRegisters.findIndex((containerRegister) => containerRegister.container.deref() === container)
    ).toStrictEqual(-1);
  });

  it('detects and prevents memory type change for a given container', () => {
    tracker.register({ container, type: SYSTEM_MEMORY_TYPE, bytes: 1 });
    expect(() => tracker.register({ container, type: USER_MEMORY_TYPE, bytes: 1 })).toThrowError(AssertException);
  });

  it('detects invalid memory registration leading to negative totals', () => {
    tracker.register({ container, type: SYSTEM_MEMORY_TYPE, bytes: 1 });
    expect(() => tracker.register({ container, type: SYSTEM_MEMORY_TYPE, bytes: -2 })).toThrowError(AssertException);
  });
});

describe('string management', () => {
  let tracker: MemoryTracker;

  beforeEach(() => {
    tracker = new MemoryTracker();
  });

  it('counts string size', () => {
    tracker.addValueRef(toValue('hello world!'));
    expect(tracker.used).toStrictEqual(17);
  });

  it('does *not* sums up bytes', () => {
    tracker.addValueRef(helloWorldValue);
    tracker.addValueRef(helloWorldValue);
    expect(tracker.used).toStrictEqual(17);
  });

  it('keeps the string valid until fully released', () => {
    tracker.addValueRef(helloWorldValue);
    tracker.addValueRef(helloWorldValue);
    expect(tracker.releaseValue(helloWorldValue)).toStrictEqual(true);
    expect(tracker.used).toStrictEqual(17);
  });

  it('frees bytes (one reference)', () => {
    tracker.addValueRef(helloWorldValue);
    expect(tracker.releaseValue(helloWorldValue)).toStrictEqual(false);
    expect(tracker.used).toStrictEqual(0);
    expect(tracker.peak).toStrictEqual(17);
  });

  it('frees bytes (two references)', () => {
    tracker.addValueRef(helloWorldValue);
    tracker.addValueRef(helloWorldValue);
    expect(tracker.releaseValue(helloWorldValue)).toStrictEqual(true);
    expect(tracker.releaseValue(helloWorldValue)).toStrictEqual(false);
    expect(tracker.used).toStrictEqual(0);
    expect(tracker.peak).toStrictEqual(17);
  });

  it('resets string reference after release', () => {
    tracker.addValueRef(helloWorldValue);
    tracker.releaseValue(helloWorldValue);
    tracker.addValueRef(helloWorldValue);
    tracker.releaseValue(helloWorldValue);
    expect(tracker.used).toStrictEqual(0);
  });

  it('fails if the reference count becomes incorrect', () => {
    tracker.addValueRef(helloWorldValue);
    tracker.releaseValue(helloWorldValue);
    expect(() => tracker.releaseValue(helloWorldValue)).toThrowError(AssertException);
  });
});
