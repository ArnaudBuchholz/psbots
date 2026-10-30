# Memory and State

One of the biggest challenge is to organize the engine around a statically allocated block of memory _that will also be called `state`_.

## WebAssembly constraint

The language itself can only manipulate integers (lets assume `i32` and `i64`).

We need to fit different type of values in it :

| Type | Summary | Representation | Executable | ReadOnly |
|---|---|---|--|--|
| Null | null | `00_00` | ❌ | ✔️ |
| Mark | mark | `FF_FF` | ❌ | ✔️ |
| Boolean | True / False | `1F_FF` / `10_00` | ❌ | ✔️ |
| Integer | Integer value (fits MAX_SAFE_INTEGER / MIN_SAFE_INTEGER) | `20_00_00_00_00_00_00_00` | ❌ | ✔️ |
| String | ASCII for now | `3<O_FF_SE_TT>` | ❌ | ✔️ |
| Name | Not the same semantic as string | `4<O_FF_SE_TT>` | ❌ | ✔️ |
|| (executable) | `5<O_FF_SE_TT>` | ✔️ | ✔️ |
| Operator | Internal operator (add, pop...) | `6<X_YZ>` | ✔️ | ✔️ |
| Array | An array of values | `70_..._00_00` | ❌ / ✔️ (code) | ❌ / ✔️ |
| Array | An array of values | `80_..._00_00` | ❌ / ✔️ (code) | ❌ / ✔️ |
| Array | An array of values | `90_..._00_00` | ❌ / ✔️ (code) | ❌ / ✔️ |
| Array | An array of values | `A0_..._00_00` | ❌ / ✔️ (code) | ❌ / ✔️ |
| Dictionary | A collection of values indexed by names | `B0_...` |  ❌ | ❌ / ✔️ |
| Dictionary | A collection of values indexed by names | `C0_...` |  ❌ | ❌ / ✔️ |

Plus the state of the engine requires several "objects" :

* An operand stack (an Array)
* A call stack (An array)
* A dictionary stack (nn Array)
* A serie of flags (TO BE DEFINED)

Questions to answer :

* How to link to source for debugging ?
* How to handle resizable objects (arrays) to make allocation / deallocation fast and efficient
