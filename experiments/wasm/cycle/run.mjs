import { readFileSync } from 'fs'
import { wasm, nameToId } from './engine.mjs'

// Run "3 4 add" once to verify correctness
wasm.reset()
wasm.push_integer(3)
wasm.push_integer(4)
wasm.push_name(nameToId['add'])
const ex = wasm.run()
console.log(`exception : ${ex}`)
console.log(`result    : ${wasm.top_integer()}`)  // expected 7
