import { it, expect, beforeEach, afterEach } from 'vitest';
import type { Value } from '@api/index.js';
import { USER_MEMORY_TYPE, ValueType } from '@api/index.js';
import { InternalException } from '@sdk/index.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { Dictionary } from './Dictionary.js';
import { toValue } from '@test/index.js';
import { ShareableObject } from '../ShareableObject.js';

let tracker: MemoryTracker;
let dictionary: Dictionary;
let initiallyUsed: number;
let shared: ReturnType<typeof toValue.createSharedObject>;

beforeEach(() => {
  tracker = new MemoryTracker();
  dictionary = new Dictionary(tracker, USER_MEMORY_TYPE);
  dictionary.def('value1', toValue(1));
  dictionary.def('value2', toValue(2));
  shared = toValue.createSharedObject();
  dictionary.def('shared', shared.value);
  expect(shared.object.refCount).toStrictEqual(2);
  shared.object.release();
  initiallyUsed = tracker.used;
});

afterEach(() => {
  expect(dictionary.release()).toStrictEqual(false);
  expect(shared.object.disposeCalled).toStrictEqual(1);
  expect(tracker.used).toStrictEqual(0);
});

it('converts to a Value (read-only)', () => {
  const value = dictionary.toValue();
  expect(value).toStrictEqual<Value>({
    type: ValueType.dictionary,
    isExecutable: false,
    isReadOnly: true,
    dictionary,
    tracker: ShareableObject.tracker
  });
  expect(dictionary.refCount).toStrictEqual(1);
});

it('converts to a Value (read/write)', () => {
  const value = dictionary.toValue({ isReadOnly: false });
  expect(value).toStrictEqual<Value>({
    type: ValueType.dictionary,
    isExecutable: false,
    isReadOnly: false,
    dictionary,
    tracker: ShareableObject.tracker
  });
  expect(dictionary.refCount).toStrictEqual(1);
});

it('fails to convert to a Value when isExecutable is set', () => {
  expect(() => dictionary.toValue({ isExecutable: true })).toThrowError(InternalException);
});

it('tracks memory used', () => {
  expect(initiallyUsed).not.toStrictEqual(0);
});

it('offers list of names', () => {
  expect(dictionary.names).toStrictEqual<string[]>(['value1', 'value2', 'shared']);
});

it('retrieves a value by its name', () => {
  expect(dictionary.lookup('value1')).toStrictEqual<Value>(toValue(1));
});

it('returns null on an unknown name', () => {
  expect(dictionary.lookup('name0')).toStrictEqual(null);
});

it('allows the override of a named value', () => {
  expect(dictionary.def('value2', toValue(3))).toStrictEqual<Value>(toValue(2));
  expect(dictionary.lookup('value2')).toStrictEqual<Value>(toValue(3));
  // Same name (and simple value) does not increase memory
  expect(tracker.used).toStrictEqual(initiallyUsed);
});

it('allows the override of a named value (shareable, not released)', () => {
  shared.object.addRef();
  expect(dictionary.def('shared', toValue(0))).toStrictEqual<Value>(shared.value);
  expect(shared.object.refCount).toStrictEqual(1);
  shared.object.release(); // to fit afterEach checks
});

it('allows the override of a named value (shareable, released)', () => {
  expect(dictionary.def('shared', toValue(0))).toStrictEqual<Value | null>(null);
  expect(shared.object.disposeCalled).toStrictEqual(1);
});

it('allows new values', () => {
  expect(dictionary.def('new_value', toValue(3))).toStrictEqual<Value | null>(null);
  expect(dictionary.lookup('new_value')).toStrictEqual<Value>(toValue(3));
  expect(tracker.used).toBeGreaterThan(initiallyUsed);
});
