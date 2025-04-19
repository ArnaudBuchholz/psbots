# Coding Guidelines

This document consolidates the different coding guidelines used for the development of the engine.

## Memory allocation

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

## Error management

* When a method *may* fail either because of its direct content or its subsequent calls, it *must* returns a `Result`.

* When an object instantiation *may* fail (because of the constructor), encapsulate the object creation in a factory returning a `Result`.

* Even if a method is not supposed to fail, it is possible to use exceptions to detect unexpected situation. This will crash the engine.

## Operators and cycles

* Operators *must* have a **predictable** cycle length : **no iteration** should occur within a cycle, use `operatorState` to iterate.

* To enable debugging, operators *must* leave the engine in a *comprehensive* state when they **fail** :
  * the operand stack *must* reflect the operator parameters,
  * the dictionary stack *must* reflect the state *before* the operator was executed,
  * the call stack *might* not be changed.

> [!IMPORTANT]  
> Some operators may modify the operand stack along the cycles, it is *acceptable* only if they do not fail during those cycles.

> [!IMPORTANT]  
> When the operator requires several cycles, we must distinguish the two **phases** :
> 
> * `calling` : any failure *must* leave the engine as it was *before* executing the operator. Yet, the `operatorState` and call stack specific dictionary *might* be altered.
>
> * `popping` : as soon as the calling phase is completed, the operator already **impacted** the state of the engine.
> As a consequence, it is nearly impossible to revert the changes.
>
> When failing, the operator state *must* reflect *which* phase failed.


