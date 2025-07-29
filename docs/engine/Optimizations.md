# Optimizations

> This document summarizes optimizations that are applied on the engine codebase after it has been transpiled from TypeScript.

## Abstract Syntax Tree

> 🚧 explain how @babel tools are used to parse, traverse and regenerate the JavaScript

## Removing `assert` calls

### The `assert` function

The [`assert`] function has two signatures, as detailled below.

```TypeScript
function assert<T>(result: Result<T>): asserts result is { success: true; value: T };
function assert(condition: boolean, message?: string, cause?: unknown): asserts condition;
```

> The two signatures of the [`assert`] function.

In the engine codebase, the [`assert`] function has two usages :

* Validating that a function call succeeded by testing the `success` member of the returned [`Result`] structure,
* Assessing a condition.

In both situations, the [`assert`] function fails by throwing an exception if the expected condition is not met.

> [! IMPORTANT]
> To keep the possibily to generate WebAssembly using [AssemblyScript](https://www.assemblyscript.org/), the productive engine code *does not* use JavaScript exceptions.

From a pure TypeScript point of view, the function simplifies the code by removing the need for conditions. In the following example, it is expected that the call to the function [`toIntegerValue`] always succeed as the operand stack length is a valid integer.
By assessing the `integerResult` variable, the code can access `integerResult.value` without failing the type check.

```TypeScript
    const integerResult = toIntegerValue(operands.length);
    assert(integerResult); // cannot exceed limit
    return operands.push(integerResult.value);
```

> An example where [`assert`] is used to simplify the code

The function [`toIntegerValue`] returns a [`Result`] as this conversion may sometimes fail, like in the following example.

```TypeScript
    const integerResult = toIntegerValue(value1 + value2);
    if (!integerResult.success) {
      return integerResult;
    }
```

> An example where [`toIntegerValue`] could fail by adding two big numbers.

The calls to the [`assert`] function are removed after transpiling.

> [! NOTE]
> As of the time these lines were written, there are 83 [`assert`] calls in the codebase.

### Removing

Removing the calls to the [`assert`] function is done in two steps :

* Removing the corresponding `import`,
* Removing the `ExpressionStatements` calling the function.

## Inlining toValue functions

### Inlining some `toIntegerValue` functions

> 🚧 the ones that are followed by an `assert`

## Inlining patterns




[`assert`]: https://github.com/ArnaudBuchholz/psbots/blob/main/engine/src/sdk/assert.ts "Open source code"
[`Result`]: https://github.com/ArnaudBuchholz/psbots/blob/main/engine/src/api/Result.ts "Open source code"
[`toIntegerValue`]: https://github.com/ArnaudBuchholz/psbots/blob/main/engine/src/sdk/toValue.ts "Open source code"