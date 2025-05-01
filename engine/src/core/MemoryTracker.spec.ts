import { describe, it, expect, beforeEach } from 'vitest';
import type { MemoryPointer, MemorySize } from './MemoryTracker.js';
import {
  addMemorySize,
  INTEGER_BYTES,
  memorySizeToBytes,
  MemoryTracker,
  POINTER_BYTES,
  VALUE_BYTES
} from './MemoryTracker.js';
import { toValue } from '@test/index.js';
import { SYSTEM_MEMORY_TYPE, USER_MEMORY_TYPE } from '@api/index.js';
import type { IMemoryByType, IMemorySnapshot, Result } from '@api/index.js';
import { assert } from '@sdk/index.js';

const helloWorldString = 'hello world!';
const helloWorldValue = toValue(helloWorldString);

describe('initial state', () => {
  it('starts with used being 0', () => {
    const tracker = new MemoryTracker();
    expect(tracker.used).toStrictEqual(0);
  });
});

describe('MemorySize', () => {
  const tests: { a: MemorySize; b: MemorySize; total: number }[] = [
    { a: {}, b: {}, total: 0 },
    { a: { bytes: 1 }, b: {}, total: 1 },
    { a: { integers: 1 }, b: {}, total: INTEGER_BYTES },
    { a: { pointers: 1 }, b: {}, total: POINTER_BYTES },
    { a: { values: 1 }, b: {}, total: VALUE_BYTES },
    { b: { bytes: 1 }, a: {}, total: 1 },
    { b: { integers: 1 }, a: {}, total: INTEGER_BYTES },
    { b: { pointers: 1 }, a: {}, total: POINTER_BYTES },
    { b: { values: 1 }, a: {}, total: VALUE_BYTES },
    { a: { bytes: 1 }, b: { bytes: 2 }, total: 3 },
    { a: { integers: 1 }, b: { integers: 2 }, total: 3 * INTEGER_BYTES },
    { a: { pointers: 1 }, b: { pointers: 2 }, total: 3 * POINTER_BYTES },
    { a: { values: 1 }, b: { values: 2 }, total: 3 * VALUE_BYTES }
  ];
  for (const { a, b, total } of tests) {
    it(`${JSON.stringify(a)} + ${JSON.stringify(b)} = ${total}`, () => {
      expect(memorySizeToBytes(addMemorySize(a, b))).toStrictEqual(total);
    });
  }
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
    expect(tracker.allocate({ bytes: 50 }, SYSTEM_MEMORY_TYPE, {}).success).toStrictEqual(true);
    expect(tracker.allocate({ bytes: 20 }, USER_MEMORY_TYPE, {}).success).toStrictEqual(true);
    expect(tracker.addStringRef(helloWorldString).success).toStrictEqual(true);
    expect(tracker.used).toStrictEqual(87);
    expect(tracker.byType).toStrictEqual<IMemoryByType>({
      system: 50,
      string: 17,
      user: 20
    });
  });

  it('provides a minimal snapshot', () => {
    tracker.allocate({ bytes: 50 }, SYSTEM_MEMORY_TYPE, {});
    tracker.allocate({ bytes: 20 }, USER_MEMORY_TYPE, {});
    tracker.addStringRef(helloWorldString);
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
    expect(tracker.allocate({ bytes: MAX_MEMORY + 1 }, SYSTEM_MEMORY_TYPE, {})).toStrictEqual<Result>({
      success: false,
      exception: 'vmOverflow'
    });
  });

  describe('debugging memory', () => {
    beforeEach(() => {
      tracker = new MemoryTracker({
        total: MAX_MEMORY,
        debug: true
      });
    });

    it('provides a minimal snapshot', () => {
      tracker.allocate({ bytes: 50 }, SYSTEM_MEMORY_TYPE, {});
      tracker.allocate({ bytes: 20 }, USER_MEMORY_TYPE, {});
      tracker.addStringRef(helloWorldString);
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
    tracker.allocate({ bytes: 1 }, SYSTEM_MEMORY_TYPE, container);
    const containerRegisters = [...tracker.enumContainersAllocations()];
    expect(
      containerRegisters.findIndex((containerRegister) => containerRegister.container.deref() === container)
    ).not.toStrictEqual(-1);
  });

  it('removes fully freed references', () => {
    const result = tracker.allocate({ bytes: 1 }, SYSTEM_MEMORY_TYPE, container);
    assert(result);
    tracker.release(result.value, container);
    const containerRegisters = [...tracker.enumContainersAllocations()];
    expect(
      containerRegisters.findIndex((containerRegister) => containerRegister.container.deref() === container)
    ).toStrictEqual(-1);
  });

  it('detects and prevents memory type change for a given container', () => {
    tracker.allocate({ bytes: 1 }, SYSTEM_MEMORY_TYPE, container);
    expect(() => tracker.allocate({ bytes: 1 }, USER_MEMORY_TYPE, container)).toThrowError();
  });

  it('detects invalid memory registration leading to negative totals', () => {
    tracker.allocate({ bytes: 1 }, SYSTEM_MEMORY_TYPE, container);
    expect(() =>
      tracker.release({ bytes: 2, type: SYSTEM_MEMORY_TYPE } as unknown as MemoryPointer, container)
    ).toThrowError();
  });
});

describe('string management', () => {
  let tracker: MemoryTracker;

  beforeEach(() => {
    tracker = new MemoryTracker();
  });

  it('counts string size', () => {
    tracker.addStringRef(helloWorldString);
    expect(tracker.used).toStrictEqual(17);
  });

  it('does *not* sums up bytes', () => {
    tracker.addStringRef(helloWorldString);
    tracker.addValueRef(helloWorldValue);
    expect(tracker.used).toStrictEqual(17);
  });

  it('keeps the string valid until fully released', () => {
    tracker.addStringRef(helloWorldString);
    tracker.addValueRef(helloWorldValue);
    expect(tracker.releaseValue(helloWorldValue)).toStrictEqual(true);
    expect(tracker.used).toStrictEqual(17);
  });

  it('frees bytes (one reference)', () => {
    tracker.addStringRef(helloWorldString);
    expect(tracker.releaseValue(helloWorldValue)).toStrictEqual(false);
    expect(tracker.used).toStrictEqual(0);
    expect(tracker.peak).toStrictEqual(17);
  });

  it('frees bytes (two references)', () => {
    tracker.addStringRef(helloWorldString);
    tracker.addValueRef(helloWorldValue);
    expect(tracker.releaseValue(helloWorldValue)).toStrictEqual(true);
    expect(tracker.releaseValue(helloWorldValue)).toStrictEqual(false);
    expect(tracker.used).toStrictEqual(0);
    expect(tracker.peak).toStrictEqual(17);
  });

  it('resets string reference after release', () => {
    tracker.addStringRef(helloWorldString);
    tracker.releaseValue(helloWorldValue);
    tracker.addStringRef(helloWorldString);
    tracker.releaseValue(helloWorldValue);
    expect(tracker.used).toStrictEqual(0);
  });

  it('fails if the reference count becomes incorrect', () => {
    tracker.addStringRef(helloWorldString);
    tracker.releaseValue(helloWorldValue);
    expect(() => tracker.releaseValue(helloWorldValue)).toThrowError();
  });
});

describe('Garbage Collector', () => {
  let tracker: MemoryTracker;

  beforeEach(() => {
    tracker = new MemoryTracker();
  });

  it('exposes a boolean flag (initialized to false)', () => {
    expect(tracker.hasGarbageToCollect).toStrictEqual(false);
  });

  it('does nothing when empty', () => {
    expect(tracker.hasGarbageToCollect).toStrictEqual(false);
    expect(tracker.garbageCollect()).toStrictEqual(true);
    expect(tracker.hasGarbageToCollect).toStrictEqual(false);
  });

  it('exposes a boolean flag set when the queue is filled', () => {
    tracker.addToGarbageCollectorQueue({
      collect() {
        return true;
      }
    });
    expect(tracker.hasGarbageToCollect).toStrictEqual(true);
  });

  it('loops until collect is true (false)', () => {
    tracker.addToGarbageCollectorQueue({
      collect() {
        return false;
      }
    });
    expect(tracker.hasGarbageToCollect).toStrictEqual(true);
    expect(tracker.garbageCollect()).toStrictEqual(false); // still has garbage
    expect(tracker.hasGarbageToCollect).toStrictEqual(true);
  });

  it('loops until collect is true (true)', () => {
    tracker.addToGarbageCollectorQueue({
      collect() {
        return true;
      }
    });
    expect(tracker.hasGarbageToCollect).toStrictEqual(true);
    expect(tracker.garbageCollect()).toStrictEqual(true);
    expect(tracker.hasGarbageToCollect).toStrictEqual(false);
  });
});
