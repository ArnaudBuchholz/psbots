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

## Open questions

* How to link values back to source for debugging?
* Exact flags layout (handle-growth chunk size, shard options, compaction thresholds, …).
