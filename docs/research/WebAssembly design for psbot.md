# Copilot Chat Conversation Export: WebAssembly design for PostScript engine

**User:** @ArnaudBuchholz
**Thread URL:** https://github.com/copilot/c/d632f99a-d537-41a0-942d-281f37392650

## @ArnaudBuchholz

Can you help me with some design in psbots ? In particular WebAssembly related questions

## Copilot

I’m checking the actual engine shape and whether WebAssembly is already used, then I’ll give concrete architecture guidance rather than generic WASM advice.Yes — and the current repository structure points to a clean way to approach it.

What the repo looks like today:
- The core runtime is in the engine workspace.
- The public-facing API is separated from the internal implementation under engine/src/api and engine/src/core.
- The REPL and browser UI depend on the engine, rather than embedding logic directly in the UI.
- There is no actual WebAssembly implementation or wasm-related code in the current codebase.

So the main design conclusion is:
- The project is currently a TypeScript/PostScript VM, not a wasm-first runtime.
- That is actually a good starting point for a wasm design, because the engine already has a natural separation between:
  - public API
  - state execution
  - operator registry
  - host integration

Recommended design for WebAssembly in psbots:
- Keep the PostScript execution model as the core abstraction.
- Do not mix browser/runtime details into the interpreter core.
- Make the engine the “logic” layer, and add a thin wasm bridge or host adapter at the boundary.
- For the browser, the wasm layer should expose the same high-level state/run/parser operations that the JS engine already exposes.

A solid architectural split would be:
- engine/core:
  - parser
  - execution/state model
  - operators
  - value semantics
- engine/api:
  - createState
  - run
  - result/error contracts
- wasm bridge:
  - load compiled module
  - map host calls to the VM
  - expose robot I/O or browser APIs
- UI/REPL/CLI:
  - consume the runtime through the public API, not by reaching into internals

This matches the current repo organization well: engine/src/index.ts already exposes a factory-based public entry point, while the internals are organized under core/state and core/operators. That is exactly the kind of shape you want before adding a wasm backend.

If you want a practical wasm option, I would suggest two flavors:

1. Full VM in wasm
- Compile the engine core into a wasm module.
- Keep the JS layer as the host shell.
- Best if you want portability and future native/embedded targets.

2. Hybrid: wasm for heavy or low-level tasks only
- Keep the PostScript engine in JavaScript/TypeScript.
- Use wasm only for robot primitives, numeric kernels, or performance-sensitive logic.
- Best if you want lower risk and faster iteration.

My recommendation for psbots specifically:
- Do not start by “wasmifying” the whole PostScript engine in one step.
- First separate the runtime core cleanly from the transport/host layer.
- Then add a wasm-backed implementation behind the same API contract.
- That lets the REPL, CLI, and web UI all keep working with no change in user-facing behavior.

In short: the repo is currently designed for a clean JS/TS engine, and that makes WebAssembly a good extension point rather than a redesign requirement. The most natural design is “engine as the semantic core, wasm as an implementation detail behind the same public API.”

## @ArnaudBuchholz

... I didn't ask yet any question... but OK.

As you may see in the repo the engine is designed to be extensible and enable custom operators to be hooked in. Since WebAssembly is a bit more "closed", I am thinking how I could achieve the same goal in a reasonable way. I have several ideas :

- Since the engine is designed to run by ticks (each tick makes the engine consume one instruction), we could have a special instruction that instructs the host to do its job until the "function" is done. However, this cause issues in terms of how long this function can run and I want things to be fair

- Another idea I got is to have the engine expose a memory section like input / outputs the host could read and alter. that means the engine would be able to read this section and modify it as well, creating an "interface" for the host to communicate with the engine and "influencing" its state

- Other ideas ?

## Copilot

Yes — and the important shift is this:

The right wasm equivalent of “custom operator” is not “the host can freely manipulate the engine state”, but “the engine exposes a bounded capability interface that host code can call”.

Your two ideas are both useful, but they are a bit too low-level if you want a clean design.

What I would recommend

1. Keep the engine as the scheduler
- The engine still owns execution flow and the tick model.
- A host extension is not allowed to run unboundedly in the middle of a tick.
- Instead, the host extension is invoked as a bounded operation, and it can return one of:
  - completed
  - partial progress
  - needs resume later

This is the same idea as your “special instruction that tells host to do work until function is done,” but with one important change:
- do not “run until done”
- run “up to a budget”, then yield

This preserves fairness.

2. Model host operations as capabilities, not as raw shared memory
- The engine should expose a small ABI:
  - importable host functions
  - callable from the wasm module
  - or exported wasm functions that the host can trigger
- The ABI is typed and explicit:
  - read sensor
  - write actuator
  - enqueue task
  - query state snapshot
  - set interrupt flag
- Not “arbitrary memory reads/writes of the whole VM”

This is much more robust than a giant input/output memory region, because memory becomes an implementation detail rather than a protocol.

3. Use a queue + resume model for long-running work
This is probably the cleanest answer to your fairness concern.

Conceptually:
- an operator invokes a host capability
- the host capability may need more than one tick
- it records its continuation and returns status = “paused”
- the engine resumes it later when the next tick comes
- the VM keeps total execution bounded per tick

That gives:
- fairness
- deterministic execution
- no host call can starve the engine

This is basically cooperative multitasking, but at the operator boundary instead of the instruction boundary.

A design that fits psbots especially well

Since your engine already has a “host level” in the dictionary stack, I think the wasm version should be structurally similar:

- VM core: parse, stack, objects, operator dispatch
- host registry: dictionary of capabilities / imported functions
- ABI boundary: typed calls between engine and host
- scheduler: tick budget and continuation handling

In other words:
- the host does not “become part of the VM”
- the host exposes “capabilities”
- the VM calls those capabilities through symbols/operators
- the host may suspend/resume work if needed

This keeps extensibility without turning wasm into “magic shared RAM”.

About the memory section idea

Your “input/output memory section” idea is useful, but I would only use it as a transport layer, not as the main extension mechanism.

For example:
- a linear memory block is used for:
  - arguments / return values
  - command queue
  - event buffers
  - sensor snapshots
- but the protocol is explicit and compact
- not “read arbitrary engine internals”

This is a common pattern:
- shared memory for bulk data
- explicit indices/handles for object references
- host API validates ownership and semantic meaning

This is safer than generic state mutation.

A good mental model

Think in terms of:
- JS/TS engine “owns state”
- wasm module “owns computation”
- host “owns external world”
- the boundary is a capability protocol

Not:
- wasm “reads and mutates the engine memory directly”

That second approach is brittle and breaks encapsulation.

Possible extension patterns

Option A: import-based operator extension
- Engine defines a host call operator such as:
  - `robot.read`
  - `robot.write`
  - `device.call`
- Wasm imports these functions
- The operation is bounded and type-safe
- Good for device drivers, sensors, actuators

Option B: exported wasm callback with host bridge
- Engine loads a wasm module
- Module exports a set of functions with a well-defined ABI
- Host uses a function table to dispatch custom operators
- Great if your “extensions” are mostly algorithmic and not world-facing

Option C: host command queue
- Engine issues commands to host via a queue
- Host handles them asynchronously and returns completion tokens
- Good for long-running work like network, robot I/O, or hardware access

This is probably the best adaptation for fairness.

What I would avoid

- unrestricted host call that can run without a deadline
- direct shared mutable engine state
- “host modifies VM memory by convention”
- a single giant memory segment that acts like a global state dump

Those are the patterns that eventually become hard to reason about.

My practical recommendation for psbots

I would design it like this:

- Keep the PostScript VM as the execution core
- Provide a host capability registry
- Each capability has:
  - name
  - signature
  - memory layout (if needed)
  - budget/timeout semantics
  - suspend/resume behavior
- A custom operator is just a name bound to a capability handler
- The handler may be implemented in JS, in wasm, or as a host bridge

This preserves the current “extensible operator registry” philosophy while making wasm fit naturally into it.

In one sentence:
- Instead of “wasm takes over the engine,” make it “wasm is one implementation of a host capability behind the same operator interface”.

If you want, I can sketch:
- a concrete ABI for a psbots host/wasm operator
- a tick-budget scheduler for host calls
- or a minimal design for “custom wasm operators” in this repo’s current architecture.

## @ArnaudBuchholz

can you sketch each one so that I can get the feeling of what it would look like, do not alter the repo we are just discussing

## Copilot

Absolutely. Here are three concrete sketches of how the same idea could look in psbots without changing the repo.

I’ll keep them close to your current mental model:
- engine owns execution
- host owns external world
- custom extension is still a first-class operator
- wasm is just one implementation strategy behind that boundary

1) Sketch: bounded host capability via imported function

This is the “most natural” design if you want to preserve the current extensible-operator model.

Core idea:
- A custom operator becomes a call to a capability registry.
- The host capability may run for a limited time or return “yield”.
- The engine scheduler decides whether to continue next tick.

Conceptual API:

```ts
type CapabilityStatus = 'ok' | 'yield' | 'error';

type CapabilityResult =
  | { status: 'ok'; value: number | bigint | string | Uint8Array }
  | { status: 'yield'; continuationId: string; partial?: unknown }
  | { status: 'error'; code: string; message: string };

interface HostCapability {
  name: string;
  invoke(args: unknown[], ctx: HostContext): CapabilityResult;
}

interface HostContext {
  tickIndex: number;
  budget: number;     // max work this tick
  resume(id: string): CapabilityResult;
}
```

Then in the VM:

```postscript
/read_sensor
{
  host "robot.read" 0
} bind def
```

Which is conceptually compiled to something like:

```ts
const result = host.invoke('robot.read', [0], ctx);

if (result.status === 'yield') {
  // pause execution, remember continuation
  state.pendingHost = result.continuationId;
  return state; // next tick resumes later
}
```

This preserves fairness because:
- each host invocation gets a strict tick budget
- if it needs more time, it yields
- no unbounded host execution can block the VM

This is the closest match to your first idea, but with a crucial difference:
- not “run until done”
- “run until budget, then yield”

This is probably the cleanest pattern for psbots.

2) Sketch: wasm module exposes a typed capability set

This is the more “closed-world” wasm version.

The engine does not expose raw memory to the host; instead it exposes an explicit module ABI.

Example:

```ts
// wasm host contract
export interface RobotAbi {
  readSensor(sensorId: number): number;
  writeActuator(actuatorId: number, value: number): void;
  scheduleTask(taskId: number, payloadPtr: number, payloadLen: number): void;
}
```

Then in the engine:

```ts
const robot = wasmModule.bind<RobotAbi>({
  readSensor: (id) => host.readSensor(id),
  writeActuator: (id, value) => host.writeActuator(id, value),
  scheduleTask: (id, ptr, len) => host.enqueueTask(id, ptr, len),
});
```

A custom operator then becomes:

```postscript
/sensor
{
  0 robot.readSensor
} bind def
```

or even:

```postscript
/actuate
{
  1 42 robot.writeActuator
} bind def
```

Important point:
- the wasm code can still be “closed” and internal
- but the engine sees only a narrow capability surface
- no arbitrary access to VM state
- no “shared memory as the protocol”

This is a much better fit for wasm than exposing an open memory layout.

The host memory region may still exist for bulk payloads, but it is just a transport buffer, not the public interface.

3) Sketch: host command queue + continuation tokens

This is the best design if you want long-running work to be “fair” and still extensible.

Conceptually:
- the engine emits commands to a host queue
- the host processes them asynchronously
- the host returns a completion token
- the engine resumes when the token is completed

Idea:

```ts
type HostCommand =
  | { kind: 'sensor-read'; sensorId: number; token: string }
  | { kind: 'actuator-write'; actuatorId: number; value: number; token: string };

type HostResult =
  | { status: 'pending'; token: string }
  | { status: 'done'; token: string; value: number }
  | { status: 'error'; token: string; code: string };
```

Engine side:

```ts
function runCustomOperator(name: string, args: unknown[]) {
  const cmd = { kind: 'sensor-read', sensorId: args[0], token: nextToken() };
  host.send(cmd);

  return {
    status: 'yield',
    continuationId: cmd.token,
  };
}
```

Later, when the host completes:

```ts
host.onComplete((token, value) => {
  const continuation = engine.resumeContinuation(token, value);
  engine.schedule(continuation);
});
```

In PostScript terms, it still looks like:

```postscript
/read_sensor
{
  host "sensor-read" 0
} bind def
```

But underneath, it is a task queue, not a direct function call.

This is especially nice for:
- robot hardware access
- I/O
- network
- slower operations that must not freeze the VM

This is the most robust answer to your fairness concern.

A hybrid design I would actually prefer for psbots

If I were designing this for psbots, I would choose a hybrid:

- explicit capability registry
- typed bindings to wasm
- queue + continuation for long work
- optional memory buffer only for payloads

Conceptually:

```ts
interface PsBotsHost {
  call(name: string, args: number[], ctx: HostContext): CapabilityResult;
  queue(command: HostCommand): string;
  resume(token: string, value: unknown): void;
}
```

Then:
- fast operations are direct calls
- slow operations are queued
- shared memory is only used for bulk message payloads
- the VM stays fair and deterministic

This keeps the model very close to your current engine architecture:
- operators remain extensible
- the host is still a first-class participant
- wasm becomes just another implementation target

The most important rule

Do not make wasm “magically mutate engine state”.

Instead, make it this:

- The engine exposes a capability interface
- The host / wasm side implements that interface
- The engine schedules and bounds execution
- long actions become resumable continuations

That is the cleanest equivalent to “custom operators” in a wasm world.

If you want, I can now sketch:
- a direct “psbots operator registry + wasm binding” example in TypeScript
- or a small “tick budget + continuation” scheduler example close to the engine’s execution loop.

## @ArnaudBuchholz

The problem I see with your solution is double :
- cross boundaries calls between WASM and TS are costly
- we are dependent on the TS implementation that MUST be fair in terms of CPU usage

What I like with the input/output section :
- The engine is never impacted by TS code
- The fairness is induced by the host which can only read / write bits in the memory

This can be compared to a RaspBerry PI which exposes input / output bits to the outer world

## Copilot

Yes — your concern is valid, and I think you are pointing to the stronger model.

If the goal is:
- keep the engine isolated and deterministic
- avoid host-side CPU starvation
- make wasm feel like a “device” rather than a plugin

then the memory-mapped interface is actually the most natural design.

The key is not “arbitrary memory sharing”, but:
- fixed I/O regions
- explicit protocol
- host-level ownership of external world
- engine-level control of polling and scheduling

This is very close to how a Raspberry Pi or MCU exposes peripherals:
- the CPU reads/writes registers
- the outside world changes the pins / buffers
- the CPU decides when to poll, not the peripheral

What is wrong with JS/TS callbacks?
- yes, they are expensive at the boundary
- yes, they couple the engine to the host runtime
- yes, the host can become a source of unfairness if it is allowed to do arbitrary work in the middle of engine execution

Your memory model avoids all of that.

The right design is not “generic shared memory”
It is “device-like shared memory with a protocol”

A good pattern would be:

- The engine owns a fixed shared-memory area
- The host owns a separate fixed shared-memory area
- The document of valid zones is explicit and tiny
- The engine can only read/write a known set of fields
- The host can only read/write a known set of fields
- The engine never calls host code directly

Example memory layout

```ts
type IoMap = {
  version: u32;
  tick: u32;

  // engine -> host requests
  requestCount: u32;
  requestHead: u32;
  requestTail: u32;
  requests: [u8; 4096];

  // host -> engine responses
  responseCount: u32;
  responseHead: u32;
  responseTail: u32;
  responses: [u8; 4096];

  // state that is semantically visible to the host
  sensors: [i32; 128];
  actuators: [i32; 128];

  // flags
  hostHasInput: u32;
  engineHasOutput: u32;
  engineShouldPause: u32;
};
```

Then:
- host writes sensor values into `sensors[]`
- engine reads them when it decides
- engine writes desired actuator values into `actuators[]`
- host reads them and applies them to the real world
- request/response buffers are used for command messages:
  - “read sensor 7”
  - “set motor 2 to 42”
  - “return value 17”

This is exactly the “GPIO-like” model.

The fairness model

This is the crucial difference:

With callbacks:
- host code runs as part of engine execution
- host can do arbitrary work
- engine must trust host fairness

With shared memory:
- host code runs independently
- engine only polls memory
- fairness is enforced by the engine’s polling policy and by the fact that the host is not in the engine’s call graph

In other words:
- engine does not depend on host fairness
- engine decides how much work to consume per tick
- host may be slow, but it is outside the engine’s critical path

This is much closer to real hardware design.

What you must avoid
The dangerous version is:

- one giant shared memory buffer
- host writes arbitrary engine structure bytes
- engine reads those bytes as if they were internal objects
- no protocol, no ownership rules

That would be a disaster.

The safe version is:
- a strict I/O map
- fixed field layout
- canonical representation
- ring buffers for commands
- no direct access to engine internals

That makes it robust and fair.

I would even say:
- this is the best match for a wasm-based “host integration” model
- because in wasm, linear memory is already the perfect place for a device model

A command queue is still useful
Even if you like the memory model, I would not remove the queue idea entirely. I would embed it in the memory interface:

- engine writes a command into the request queue
- host reads it
- host writes completion result into the response queue
- engine sees a “response ready” flag and consumes it

This gives:
- no direct host calls
- no unbounded work from host
- bounded communication
- a possible event loop on the host side

So the model becomes:

- engine -> request queue
- host -> response queue
- device registers / sensor state in shared memory

This is close to a real embedded bus interface.

In A/B terms

If you want a hardware-like model, the split is:

A) Callback model
- better for JS ergonomics
- worse for fairness and isolation
- less deterministic

B) Shared memory + protocol model
- better for deterministic IO, wasm, device-like integration
- stronger encapsulation
- more “embedded systems” than “plugin system”

For psbots, I think B is more appropriate if the host system is robot hardware, sensors, or browser I/O.

The big philosophical point
Your memory section idea is not “bad design”; it is actually the right abstraction if you think of wasm as a co-processor or device module.

The core question is not “how do I call into TS?” but:
- what is the contract between the engine and the outside world?

And for a robot-like system, the answer is:
- a fixed I/O interface, not arbitrary function calls

This is much cleaner.

I would phrase it like this:

- The engine should not depend on host code being fair.
- The host should not be able to mutate engine semantics.
- The engine and host should communicate through a bounded, explicit I/O protocol.
- The memory region is the bus, not the state model.

That is a good design.

If you want, I can do one of these next:
- sketch a precise shared-memory protocol for psbots
- show a tiny ring-buffer request/response format
- or propose a hybrid design that keeps your current operator model while using memory-mapped device I/O under the hood.
