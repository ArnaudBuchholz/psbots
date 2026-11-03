# Memory and State

One of the biggest challenges is to organize the engine around a statically allocated block of memory _that will also be called `state`_.

## WebAssembly constraint

The language itself can only manipulate integers (lets assume `i32` and `i64`).

We need to fit different type of values in it :

| Type | Summary | Representation | Executable | ReadOnly |
|---|---|---|--|--|
| Null | null | `00_00` | ❌ | ✔️ |
| Mark | mark | `FF_FF` | ❌ | ✔️ |
| Boolean | True / False | `1F_FF` / `10_00` | ❌ | ✔️ |
| Integer | Integer value (fits MAX_SAFE_INTEGER / MIN_SAFE_INTEGER) | `20_00_00_00_00_00_00_00` | ❌ | ✔️ |
| String | ASCII for now | `3<O_FF_SE_TT>` | ❌ | ✔️ |
| Name | Not the same semantic as string | `4<O_FF_SE_TT>` | ❌ | ✔️ |
|| (executable) | `5<O_FF_SE_TT>` | ✔️ | ✔️ |
| Operator | Internal operator (add, pop...) | `6<X_YZ>` | ✔️ | ✔️ |
| Array | An array of values | `70_..._00_00` | ❌ / ✔️ (code) | ❌ / ✔️ |
| Array | An array of values | `80_..._00_00` | ❌ / ✔️ (code) | ❌ / ✔️ |
| Array | An array of values | `90_..._00_00` | ❌ / ✔️ (code) | ❌ / ✔️ |
| Array | An array of values | `A0_..._00_00` | ❌ / ✔️ (code) | ❌ / ✔️ |
| Dictionary | A collection of values indexed by names | `B0_...` |  ❌ | ❌ / ✔️ |
| Dictionary | A collection of values indexed by names | `C0_...` |  ❌ | ❌ / ✔️ |

Plus the state of the engine requires several "objects" :

* An operand stack (an Array)
* A call stack (An array)
* A dictionary stack (an Array)
* A serie of flags (TO BE DEFINED)

## Design principles

The memory is a single, **fixed-size, pre-allocated** block (assumed under 1 GB → **30 bits** are enough to address any location). The engine must operate entirely within this block; growing the underlying memory is deferred and out of scope for now.

The design is driven by a churny workload: arrays and dictionaries are allocated and freed constantly (most operations need them), so allocation and handle management must be fast, while compaction can be rare and comparatively expensive.

### Handles and indirection

Arrays, dictionaries and strings are never referenced directly by address. A value that refers to one of these objects stores a **handle index**; the handle table entry then holds the object's real location. This double indirection (`value → handle index → object location`) is what makes garbage collection and memory compaction tractable: moving an object only requires updating its handle entry, not every value that points at it. The complexity is expected to be absorbed cleanly at the code level so the rest of the implementation stays simple.

A handle entry (header) carries everything needed to access and manage the object quickly:

* **Reference count** — `0` means the slot is free. Reaching `0` means the object's memory can be released.
* **Type**
* **Logical length** and **capacity**
* **Root location** of the object (shard offset for arrays/dicts, string offset for strings)
* **Top-of-stack cursor** (root shard + index within it) so push/pop on stacks is O(1) without traversing shards

## Memory layout

```
[ flags ][ handles (grows →) ][ shards ][ ...free gap... ][ strings (grows ←) ]
 abs 0    anchor A             anchor B                     anchor C = end of memory
```

| Region | Anchor | Addressing | Growth |
|---|---|---|---|
| Flags | absolute `0` | fixed | fixed size |
| Handles | **A** (after flags) | — | grows rightward, in configurable chunks |
| Shards (arrays / dicts) | **B** = end of handles | offsets **relative to B** | grows rightward into the gap |
| Free gap | — | — | shock absorber between shards and strings |
| Strings | **C** = end of memory | offsets **relative to C** (always negative) | grows leftward into the gap |

### Why the two relative anchors matter

* **Shard offsets are relative to B (end of handles).** When the handle table grows, B moves right and the whole shard region is memmoved right with it — but **no shard offset value changes**, because they are all measured from B. The shards shift physically; their logical offsets are stable.
* **String offsets are relative to C (fixed end of memory).** Strings only move when the shard region grows enough to consume the gap and push them. As long as the gap absorbs growth, **string offsets never change**.

The free gap in the middle is the shock absorber: it lets the handle table and the shard region grow without touching string offsets, and lets handles grow without touching shard offsets. Fixups only occur when the gap is exhausted.

## Handles

* Allocated very often; recycled via the free slot list — a slot with refcount `0` is reusable.
* The table physically grows (chunked memmove of the shard region) only when no free slot is available. Chunk size is **configurable** (stored in the flags).

## Arrays and dictionaries (shards)

Arrays and dictionaries are stored as **shards**: linked blocks of fixed size. Their content is therefore not necessarily contiguous in memory, which is what lets them grow and shrink efficiently.

* **Shard size is tunable.** Per object, the `array` / `dictionary` operators already specify an initial size and a growing size. Whether a user array is sharded or kept contiguous-with-growth is a **configurable option**.
* **Stacks** (operand, call, dictionary stacks) only ever push/pop at the end, so inter-shard pointer-chasing never costs them anything — the top-of-stack cursor in the handle makes push/pop O(1). This is why fixed-size shards are a good fit despite random indexed access (`get`/`put`) having to walk `index / shard_size` links.
* **Dictionary cells are `(name-handle, value)` pairs** — two 64-bit slots. The name is always a handle; the value is a full tagged 64-bit slot, which may itself be a handle or an inline value (boolean, integer, …). Dict shard sizes are therefore counted in **cell-pairs**, not raw slots.

### Freeing shards

When a shard is released it is **not** immediately returned to the free gap (doing so would force re-offsetting). Instead:

* Freed shards are pushed onto a **free-shard linked list** — holes left in place inside the shard region.
* Allocating a new shard reuses a hole from the free-shard list first, and only carves from the big gap when the list is empty.

This gives two distinct kinds of free memory: scattered holes (the free-shard list) and the single contiguous gap.

## Strings

Strings **must be contiguous** chunks — sharding them would complicate reading. They are **immutable**: operators that would modify a string allocate a new one instead (this intentionally diverges from the PostScript specification). They participate in the handle + reference-counting mechanism but not in the shard mechanism.

Because strings are contiguous and variable-length, they live in their own region growing leftward from C, kept as far from the shards as the gap allows to minimize relocations.

Allocation is a simple bump downward from C. There is **no free-string list**: a released string's space simply becomes dead until the next compaction reclaims it. No separate bookkeeping is needed because the live string handles are the source of truth — the dead holes are implicitly the gaps between the surviving strings, derivable by scanning handles.

## Memory compaction (deferred)

The algorithm is deferred, but the model is fixed. A single compaction sweep reclaims dead space at **both** ends, widening the central gap:

**Phase 1 — pack shards toward B.**

* Walks the free-shard list and slides live shards down to close the holes, restoring the ideal `[handles][packed shards][gap]` picture.
* Must update the handle entries of any shard it moves (a moved shard's B-relative offset changes). Compaction is the one operation allowed to rewrite offsets.
* Finds the owning handle of a moved shard by **scanning the handle table** — shards deliberately carry **no** back-reference to their handle (nor to a preceding shard), to keep them lean. Compaction is rare, so the scan cost is acceptable.

**Phase 2 — pack strings toward C.**

* Slides the surviving strings up so they abut C with no dead gaps, reclaiming the space left by released strings.
* A moved string's C-relative offset changes, so its handle entry is rewritten — owner found by the same handle scan.
* This is the mirror of phase 1 at the opposite anchor; together the two phases return the freed shard-holes and freed-string space to the central gap.

The target for the eventual algorithm is speed and efficiency.

## JavaScript ↔ Wasm interop model

### The hard asymmetry

JS and the Wasm engine share memory, but only in one direction:

* **JS can read and write** the engine's linear memory — `memory.buffer` is a plain `ArrayBuffer` fully accessible to JS.
* **The engine cannot read** JS-allocated memory — Wasm load/store instructions only address bytes inside its own linear memory. There is no Wasm instruction that can reach a JS `ArrayBuffer` or any JS heap object.

The practical consequence: **the engine must own all allocations**. JS writes input data into engine-owned regions (by calling an exported `alloc` first and writing into `memory.buffer` at the returned offset), and reads results back out. JS produces and consumes data; it never allocates.

### Multiple states in one memory

One engine instance = one linear memory = one `ArrayBuffer`. Every state the engine allocates is a region within that single buffer, identified by a pointer (an offset from byte `0`). With N states:

```
WebAssembly.Memory (one ArrayBuffer)
┌────────────────────────────────────────────────────────┐
│ static data │ engine bookkeeping │ State A │ State B │ … │
└────────────────────────────────────────────────────────┘
                                    ptr_A     ptr_B
```

States are not isolated from each other — there is no hardware boundary between them inside the module. Isolation is the allocator's responsibility.

### Memory growth does not move existing data

`memory.grow` **appends** pages; existing bytes keep their offsets. `ptr_A` and `ptr_B` are numerically stable across any number of grows. This is a hard Wasm spec guarantee: grow either appends and preserves everything, or returns -1 and changes nothing.

What does change: `memory.buffer` returns a **new** `ArrayBuffer` object after growth. Any `Uint8Array` or `DataView` created over the old buffer is detached (zero-length / throws). JS pointers (offsets) are stable; JS buffer handles are not.

### The JS bridge pattern

Centralising all memory access behind a bridge module is the right approach. It is the single place that:

1. Always re-derives the view from `memory.buffer` — absorbs the buffer-replacement churn on growth.
2. Records the layout (offsets, sizes, endianness) — changes to the engine's memory layout stay in one file.
3. Can add bounds checks and liveness assertions.

```js
function makeBridge(instance) {
  const memory = instance.exports.memory;
  const dv = () => new DataView(memory.buffer); // re-derived every call

  return {
    readI32(ptr)     { return dv().getInt32(ptr, true); },
    writeI32(ptr, v) { dv().setInt32(ptr, v, true); },
    readBytes(ptr, n){ return new Uint8Array(memory.buffer).slice(ptr, ptr + n); },
  };
}
```

### ABI — the binary contract

The bridge also defines the **ABI** (Application Binary Interface) between JS and the engine: the rules both sides must agree on so that bytes written by one are interpreted correctly by the other — data type sizes, endianness (Wasm is always little-endian), struct field offsets, and encoding conventions (e.g. how a string is length-prefixed). API tells you what to call; ABI tells you what the bytes mean.

### Initialization ordering

The engine's AS runtime initialises its heap in a `start` function executed during `WebAssembly.instantiate`. The allocator's bookkeeping is not valid until after this completes. Calling `alloc` or any allocation-dependent export before `start` finishes is unsafe. Concretely:

1. `WebAssembly.instantiate(...)` — module and memory exist, `start` runs.
2. Engine is now safe to call. JS may call exported allocators, setters, or a deserialise entry point.
3. JS writes state data into engine-owned regions.

For a fresh session: call engine exports to build up state. For a restored session: write the saved bytes into an engine-allocated region and call a deserialise entry point.

## Open questions

* How to load the engine with instructions

> Proposal would be to surface two areas in the memory/state : input and output
> Output would be used to transmit some state flags (idle / error / memory / a custom set of flags owned by the program)
> Input would be used for "loading" instructions + custom set of flags (one byte each)
> To load the engine, a parser would tokenize the program and generate a sequence of value
> These values are loaded one by one to the engine, only when the engine is idle

> Particular case for string : in order to load strings in the engine memory, provided the input area is small (minimum to be defined) a special sequence must be defined to :
> 1) allocate the string length
> 2) transmit characters
> 3) Finalize the transmission

> This could be controlled using JavaScript

* "Standard" strings should be hardcoded in the engine (at least all known instructions) to avoid filling the memory with useless strings

* How to link values back to source for debugging?

> Proposal would be that the parser associates two numbers to each token : 1 identify the source, the other the offset in the source

* Exact flags layout (handle-growth chunk size, shard options, compaction thresholds, …).

### Input area

* Minimum 8 bytes (fits number and names)
* halt (force stop)
* Configurable area ()
  * input <offset> get

### Output area

* tick
* idle
* error
* Configurable area ()
  * output <offset> <value> put
