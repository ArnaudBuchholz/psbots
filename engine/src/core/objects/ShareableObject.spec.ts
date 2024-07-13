import { it, expect } from 'vitest';
import { InternalException } from '@sdk/exceptions/index.js';
import { ShareableObject } from './ShareableObject.js';

class TestObject extends ShareableObject {
  public disposeCalled: number = 0;

  protected _dispose(): void {
    ++this.disposeCalled;
  }
}

it('calls _dispose on last reference count', () => {
  const object = new TestObject();
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
  const object = new TestObject();
  expect(object.refCount).toStrictEqual(1);
  object.release();
  expect(() => object.release()).toThrow(InternalException);
});
