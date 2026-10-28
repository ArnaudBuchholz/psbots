import { wasm, nameToId } from './engine.mjs'
import { createState, run } from '@psbots/engine'

const ITERATIONS = 100_000

// --- Wasm cycle engine: "3 4 add" ---
const wasmStart = performance.now()
for (let i = 0; i < ITERATIONS; ++i) {
  wasm.reset()
  wasm.push_integer(3)
  wasm.push_integer(4)
  wasm.push_name(nameToId['add'])
  wasm.run()
}
const wasmTime = performance.now() - wasmStart
const wasmResult = wasm.top_integer()

// --- Pure JS engine: "3 4 add" ---
const stateResult = createState()
if (!stateResult.success) throw new Error('createState failed')
const state = stateResult.value

const jsStart = performance.now()
for (let i = 0; i < ITERATIONS; ++i) {
  run(state, '3 4 add')
  state.operands.pop()  // remove result to keep stack depth stable
}
const jsTime = performance.now() - jsStart
const jsResult = state.operands.top

state.destroy()

console.log(`iterations : ${ITERATIONS.toLocaleString()}`)
console.log(`wasm result: ${wasmResult}`)
console.log(`js   result: ${jsResult.type === 'integer' ? jsResult.integer : '?'}`)
console.log()
console.log(`wasm cycle : ${wasmTime.toFixed(2)} ms  (${(wasmTime / ITERATIONS * 1000).toFixed(3)} µs/op)`)
console.log(`js engine  : ${jsTime.toFixed(2)} ms  (${(jsTime / ITERATIONS * 1000).toFixed(3)} µs/op)`)
console.log()
const ratio = wasmTime / jsTime
console.log(`ratio      : ${ratio < 1 ? `wasm ${(1/ratio).toFixed(2)}x faster` : `js ${ratio.toFixed(2)}x faster`}`)
