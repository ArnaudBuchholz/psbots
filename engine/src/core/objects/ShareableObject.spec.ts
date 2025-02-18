import { it, expect } from 'vitest';
import { toValue } from '@test/index.js';
import { ShareableObject } from './ShareableObject.js';

it('calls _dispose on last reference count', () => {
  const { object } = toValue.createSharedObject();
  expect(object.refCount).toStrictEqual(1);
  expect(object.disposeCalled).toStrictEqual(0);
  object.addRef();
  expect(object.refCount).toStrictEqual(2);
  expect(object.disposeCalled).toStrictEqual(0);
  expect(object.release()).toStrictEqual(true);
  expect(object.refCount).toStrictEqual(1);
  expect(object.disposeCalled).toStrictEqual(0);
  expect(object.release()).toStrictEqual(false);
  expect(object.refCount).toStrictEqual(0);
  expect(object.disposeCalled).toStrictEqual(1);
});

it('detects invalid use of release', () => {
  const { object } = toValue.createSharedObject();
  expect(object.refCount).toStrictEqual(1);
  object.release();
  expect(() => object.release()).toThrowError();
});

it('cannot be used to track any value', () => {
  expect(() => ShareableObject.tracker.releaseValue(toValue(123))).toThrowError();
});
