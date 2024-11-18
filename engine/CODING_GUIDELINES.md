# Coding Guidelines

This document consolidates the different coding guidelines used for the development of the engine.

## Memory allocation

Even if JavaScript does not require memory handling, the engine keeps track of *allocated* memory through a `MemoryTracker` instance.

Memory size description is based on primitive types :

```TypeScript
type MemorySize = {
  bytes?: number;
  integers?: number;
  pointers?: number;
  values?: number;
};
```

> [!IMPORTANT]  
> Try to limit the use of `bytes` as much as possible and prefer using one of the known types.

Memory allocation *may* fail but memory release is **not** supposed to. This is why the `release` method does not return a `Result` (see [Error Management](#error-management)).

```TypeScript
/** Check if the requested memory size can be allocated */
isAvailable(size: MemorySize, type: MemoryType): Result<undefined, VmOverflowException>

/** Allocate memory */
allocate(size: MemorySize, type: MemoryType, container: object): Result<MemoryPointer, VmOverflowException>

/** Release memory */
release(pointer: MemoryPointer, container: object): void
```

For strings, specific methods are available :

```TypeScript
addStringRef(string: string): Result<number>

releaseString(string: string): boolean
```

## Error management

* When a method *may* fail either because of its direct content or its subsequent calls, it *must* returns a `Result`.

* When an object instantiation *may* fail (because of the constructor), encapsulate the object creation in a factory returning a `Result`.

* Even if a method is not supposed to fail, it is possible to use exceptions to detect unexpected situation. This will crash the engine.
