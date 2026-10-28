import { readFileSync } from 'fs'

const buffer = readFileSync('add.wasm')
const { instance } = await WebAssembly.instantiate(buffer)
const wasmWork = instance.exports.work

// equivalent JS: n additions per call
const jsWork = (n) => {
  let acc = 0
  for (let i = 0; i < n; ++i) acc += 1
  return acc
}

const CALLS = 10_000
const WORK_LEVELS = [1, 5, 10, 50, 100, 500, 1_000]

console.log(`${'work/call'.padEnd(12)} ${'wasm (ms)'.padStart(10)} ${'js (ms)'.padStart(10)} ${'winner'.padStart(8)}`)
console.log('-'.repeat(44))

for (const work of WORK_LEVELS) {
  let result

  const wasmStart = performance.now()
  for (let i = 0; i < CALLS; ++i) result = wasmWork(work)
  const wasmTime = performance.now() - wasmStart

  const jsStart = performance.now()
  for (let i = 0; i < CALLS; ++i) result = jsWork(work)
  const jsTime = performance.now() - jsStart

  const winner = wasmTime < jsTime ? `wasm (${(jsTime / wasmTime).toFixed(1)}x)` : `js (${(wasmTime / jsTime).toFixed(1)}x)`
  console.log(`${String(work).padEnd(12)} ${wasmTime.toFixed(3).padStart(10)} ${jsTime.toFixed(3).padStart(10)} ${winner.padStart(8)}`)
}
