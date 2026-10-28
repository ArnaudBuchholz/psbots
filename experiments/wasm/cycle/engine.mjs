import { readFileSync } from 'fs'

// Name table: name string -> id (index)
const NAMES = ['add', 'sub', 'mul']
const nameToId = Object.fromEntries(NAMES.map((n, i) => [n, i]))

// Operator table: id -> implementation
// Operators read/write the Wasm operand stack via exports
// We receive a reference to the Wasm instance after instantiation
let wasm

const OPERATORS = [
  // 0: add — pops 2 integers, pushes sum
  (memory) => {
    const depth = wasm.stack_depth()
    if (depth < 2) return 3 // stackUnderflow
    const view = new Int32Array(memory.buffer)
    // operand stack base = 0, each value = 8 bytes = 2 i32s
    // top is at (depth-1)*2, second is at (depth-2)*2
    const topPayload    = view[(depth - 1) * 2 + 1]
    const secondPayload = view[(depth - 2) * 2 + 1]
    const sum = topPayload + secondPayload
    // write sum into second slot, then pop top
    view[(depth - 2) * 2 + 1] = sum
    // pop top by decrementing depth stored at offset 1024 (i32 index 256)
    view[256] = depth - 1
    return 0
  },
  // 1: sub
  (memory) => {
    const depth = wasm.stack_depth()
    if (depth < 2) return 3
    const view = new Int32Array(memory.buffer)
    const topPayload    = view[(depth - 1) * 2 + 1]
    const secondPayload = view[(depth - 2) * 2 + 1]
    view[(depth - 2) * 2 + 1] = secondPayload - topPayload
    view[256] = depth - 1
    return 0
  },
  // 2: mul
  (memory) => {
    const depth = wasm.stack_depth()
    if (depth < 2) return 3
    const view = new Int32Array(memory.buffer)
    const topPayload    = view[(depth - 1) * 2 + 1]
    const secondPayload = view[(depth - 2) * 2 + 1]
    view[(depth - 2) * 2 + 1] = secondPayload * topPayload
    view[256] = depth - 1
    return 0
  }
]

// Encode a lookup result: type<<28 | exec_flag<<24 | payload
// exec_flag bit: 1 = executable (maps to bit 24 in the encoded i32)
function encodeValue(type, isExecutable, payload) {
  return ((type & 0x0f) << 28) | ((isExecutable ? 1 : 0) << 24) | (payload & 0x00ffffff)
}

// Operator type = 6, always executable
const OPERATOR_ENTRIES = OPERATORS.map((_, i) => encodeValue(6, true, i))

const buffer = readFileSync('cycle.wasm')
let memory

const { instance } = await WebAssembly.instantiate(buffer, {
  env: {
    js_lookup: (nameId) => {
      if (nameId < 0 || nameId >= OPERATORS.length) return -1
      return OPERATOR_ENTRIES[nameId]
    },
    js_operator_call: (opId) => {
      return OPERATORS[opId](memory)
    }
  }
})

wasm = instance.exports
memory = instance.exports.memory

export { wasm, memory, nameToId }
