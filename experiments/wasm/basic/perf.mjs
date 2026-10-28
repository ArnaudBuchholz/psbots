import { readFileSync } from 'fs'

const buffer = readFileSync('add.wasm')
const { instance } = await WebAssembly.instantiate(buffer)
const wasmAdd = instance.exports.add
const wasmAddLoop = instance.exports.add_loop

const jsAdd = (a, b) => a + b

const ITERATIONS = 10_000

let result

// --- boundary cost: 10_000 JS->Wasm calls ---
const wasmStart = performance.now()
for (let i = 0; i < ITERATIONS; ++i) result = wasmAdd(3, 4)
const wasmTime = performance.now() - wasmStart

// --- loop inside Wasm: 1 JS->Wasm call, 10_000 iterations inside ---
const wasmLoopStart = performance.now()
result = wasmAddLoop(ITERATIONS)
const wasmLoopTime = performance.now() - wasmLoopStart

// --- pure JS loop ---
const jsStart = performance.now()
for (let i = 0; i < ITERATIONS; ++i) result = jsAdd(3, 4)
const jsTime = performance.now() - jsStart

console.log(`result         : ${result}`)
console.log(`wasm (N calls) : ${wasmTime.toFixed(3)} ms`)
console.log(`wasm (1 call)  : ${wasmLoopTime.toFixed(3)} ms`)
console.log(`js             : ${jsTime.toFixed(3)} ms`)
