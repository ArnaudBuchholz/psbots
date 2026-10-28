import { readFileSync } from 'fs'

const buffer = readFileSync('add.wasm')
const { instance } = await WebAssembly.instantiate(buffer)
const { add } = instance.exports

console.log('3 + 4 =', add(3, 4))
