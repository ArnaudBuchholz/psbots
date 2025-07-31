# Optimizations

> This document summarizes optimizations that are applied on the engine codebase *after* it has been transpiled from TypeScript.

## Abstract Syntax Tree

All these optimizations are realized by manipulating the Abstract Syntax Tree representation (often shortened to [AST]) of the source codes.

The following packages are used :

* [`@babel/parser`](https://www.npmjs.com/package/@babel/parser): to transform the source code into [AST],
* [`@babel/traverse`](https://www.npmjs.com/package/@babel/traverse): to crawl the generated [AST],
* [`@babel/generator`](https://www.npmjs.com/package/@babel/traverse): to transform the manipulated [AST] back into source code.

> [!NOTE]
> These packages, in particular the `traverse` one, lack documentation. An LLM was queried to understand how to leverage them.

## Removing `assert` calls

### The `assert` function

The [`assert`] function has two signatures, as detailed below.

```TypeScript
function assert<T>(result: Result<T>): asserts result is { success: true; value: T };
function assert(condition: boolean, message?: string, cause?: unknown): asserts condition;
```

> The two signatures of the [`assert`] function.

In the engine codebase, this function has two usages :

* Validating that a function call succeeded by testing the `success` member of the returned [`Result`] structure,
* Assessing a condition.

In both situations, the [`assert`] function throws an exception if the expected condition is not met.

> [!IMPORTANT]
> To keep the possibily to generate WebAssembly using [AssemblyScript](https://www.assemblyscript.org/), the productive engine code *does not* use JavaScript exceptions. As a consequence, failed assertions *should* never happen in the codebase.

From a pure TypeScript point of view, the [`assert`] function simplifies the code by removing the need for conditions. In the following example, it is expected that the call to the function [`toIntegerValue`] always succeed as the operand stack length is a valid integer.
By assessing the `integerResult` variable, the code can access `integerResult.value` without failing the type check.

```TypeScript
    const integerResult = toIntegerValue(operands.length);
    assert(integerResult); // cannot exceed limit
    return operands.push(integerResult.value);
```

> An example where [`assert`] is used to simplify the code

The function [`toIntegerValue`] returns a [`Result`] as this conversion may fail, like in the  example below.

```TypeScript
    const integerResult = toIntegerValue(value1 + value2);
    if (!integerResult.success) {
      return integerResult;
    }
```

> An example where [`toIntegerValue`] could fail when adding two big numbers.

### Removing

The calls to the [`assert`] function are removed after transpiling.

> [!NOTE]
> As of the time these lines were written, there are 83 [`assert`] calls in the codebase.

This is done in two steps :

* Removing the corresponding `import`,
* Removing the `ExpressionStatements` calling the function.

## Inlining toValue functions

### Inlining some `toIntegerValue` functions

> 🚧 the ones that are followed by an `assert`

## Inlining patterns

## Overview

This is probably the most challenging part of the optimization. Due to the usage of strict linting rules, the codebase contains small functions. In some situation, an algorithm is split into multiple functions and one way to improve performance is to inline them all.

For instance, the core cycle implementation uses 5 different functions, as listed below :

```typescript
cycle() {
    const calls = this._calls;
    const { top } = calls;
    if (this._exception) {
      if (top.type === 'operator') {
        operatorPop.call(this, top);
      } else {
        calls.pop();
      }
    } else if (top.isExecutable) {
      if (top.type === 'operator') {
        operatorCycle.call(this, top);
      } else if (top.type === 'name') {
        callCycle.call(this, top);
      } else if (top.type === 'array') {
        blockCycle.call(this, top);
      } else if (top.type === 'string') {
        parseCycle.call(this, top);
      } else {
        assert(false, 'Unsupported executable value');
      }
    } else {
      this._operands.push(top);
      calls.pop();
    }
  }
```

> core cycle implementation

These functions are implemented in different modules, focusing on only one aspect of the cycle :

* `operatorCycle` inside [`operator.ts`](https://github.com/ArnaudBuchholz/psbots/blob/main/engine/src/core/state/operator.ts)
* `callCycle` inside [`call.ts`](https://github.com/ArnaudBuchholz/psbots/blob/main/engine/src/core/state/call.ts)
* `blockCycle` inside [`block.ts`](https://github.com/ArnaudBuchholz/psbots/blob/main/engine/src/core/state/block.ts)
* `parseCycle` inside [`parse.ts`](https://github.com/ArnaudBuchholz/psbots/blob/main/engine/src/core/state/parse.ts)

> [!IMPORTANT]
> To prepare for the inlining process, these functions were refactored to use the `.call` syntax. As a result, each function has a common signature and can access `this` as in the main method.

These dependencies are illustrated in the following graph :

```mermaid
graph
  subgraph "sdk/assert.ts"
    assert("📦&nbsp;assert");
  end
  subgraph "core/state/operator.ts"
    operatorPop("📦&nbsp;operatorPop");
  end
  subgraph "core/state/operator.ts"
    operatorCycle("📦&nbsp;operatorCycle");
  end
  subgraph "core/state/call.ts"
    callCycle("📦&nbsp;callCycle");
  end
  subgraph "core/state/block.ts"
    blockCycle("📦&nbsp;blockCycle");
  end
  subgraph "core/state/parse.ts"
    parseCycle("📦&nbsp;parseCycle");
  end
  subgraph "core/state/State.ts"
    State("📦&nbsp;_class_&nbsp;State")
    State --- _checkIfDestroyed("State::_checkIfDestroyed");
    _checkIfDestroyed --> assert;
    State --- destroy("State::destroy");
    destroy --> assert;
    State --- raiseException("State::raiseException");
    raiseException --> assert;
    State --- cycle("State::cycle");
    cycle --> operatorPop;
    cycle --> operatorCycle;
    cycle --> callCycle;
    cycle --> blockCycle;
    cycle --> parseCycle;
    cycle --> assert;
  end
```

> Dependency graph of the core `cycle` method

## Function definition

In order to analyze *if* and *how* a function can be inlined, there are several aspects of the function implementation that must be considered :

* **Parameters** : when the function is inlined, it must receive values from the initial calling function,
* **Returned value** : the function *may* return a value, the calling function might use this value either to assign a variable or directly in a statement,
* **Early exits** : the function *may* use the `return` keyword to exit prematurely,
* **Loops** : as early exits might generate complexity in the

### Examples

> These examples are expressed JavaScript both to simplify the writing but also because optimization is applied on JavaScript sources.
>
#### Simple case 1

```JavaScript
function main() {
  const result = inline();
  return result + 1;
}

function inline() {
  return 1;
}

/* Should result in */
function main_inline() {
  const result = 1; // let is acceptable
  return result + 1;
}
```

### Parameters

```JavaScript
function main() {
  const result = inline(5);
  return result + 1;
}

function inline(value) {
  return value + 1;
}

/* Should result in */
function main_inline() {
  const __inline_arg1 = 5; // Simplest way to handle use of parameter
  const result = __inline_arg1 + 1;
  return result + 1;
}
```

#### Early exit

```JavaScript
function main() {
  const result = inline();
  return result + 1;
}

// Could use ternary operator but that's not the point
function inline() {
  if (Math.random() > .5) {
    return 1;
  }
  return 2;
}

/* Should result in */
function main_inline() {
  let result;
  do {
    if (Math.random() > .5) {
   result = 1;
   break;
    }
 result = 2;
  } while (false);
  const result = 1;
  return result + 1;
}
```

#### Early exit with loops in loops

```JavaScript
function main() {
  let value = 0;
  do {
    const result = inline();
  } while ()
  return result + 1;
}

function inline() {
  let value = 0;
  while (value < 100) {
    if (Math.random() > .5) {
      return value;
    }
    ++value;
  }
  return 100;
}

/* Should result in */
function main_inline() {
  let result;
  do {
    if (Math.random() > .5) {
   result = 1;
   break;
    }
 result = 2;
  } while (false);
  const result = 1;
  return result + 1;
}
```

[`assert`]: https://github.com/ArnaudBuchholz/psbots/blob/main/engine/src/sdk/assert.ts "Open source code"
[`Result`]: https://github.com/ArnaudBuchholz/psbots/blob/main/engine/src/api/Result.ts "Open source code"
[`toIntegerValue`]: https://github.com/ArnaudBuchholz/psbots/blob/main/engine/src/sdk/toValue.ts "Open source code"
[AST]: https://en.wikipedia.org/wiki/Abstract_syntax_tree "Open documentation"
