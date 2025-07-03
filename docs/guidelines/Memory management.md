Even if JavaScript does not require memory handling, the engine keeps track of *allocated* memory through a `MemoryTracker` instance.
Also, it tries to mimic the allocations (and memory access) that would be needed if developped on a different technology (such as WebAssembly).

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

/** Release memory (must pass the result of a previous allocation) */
release(pointer: MemoryPointer, container: object): void
```

> [!NOTE]  
> In these APIs, the `container` is used to track allocations and 'attach' them to a logical object.

For strings, specific methods are available :

```TypeScript
addStringRef(string: string): Result<number>

releaseString(string: string): boolean
```

## `name` type

All names' values must be allocated and released through `addStringRef` amd `releaseString`, *but* the following ones :

* `null`
* `boolean`
* `integer`
* `string`
* `name`
* `mark`
* `operator`
* `array`
* `dictionary`

> [!NOTE]
> They correspond to value types and are considered pre-allocated.

## Garbage collection

As they are allocated by chunks, dictionaries and arrays require significant time to completely release their memory.
Furthermore, stored values may themselves require deallocation after being released, which implies iteration and recursion over values.

As a consequence, when an object is released - for instance when being popped from the operand stack - the deallocation may not be triggered immediately to ensure
consistent timings in the engine cycles.
Instead, the object is added to a garbage collection queue with information about memory type and total.

When a `vmOverflow` error is raised or when some thresholds are met (like memory waiting to garbage collected), the engine enters a special phase by adding the `gc` operator on the call stack.

> [!IMPORTANT]
> An operator should fail with `vmOverflow` as soon as possible (first cycle) to enable retry once memory has been garbage collected.

Garbage collection can also be explicitely requested using `gc` operator.

> [!NOTE]
> This memory is considered deallocated even if not effectively removed from the garbage collector queue.
> As a consequence, when saving the engine state, no information is tracked about the garbage collector.
