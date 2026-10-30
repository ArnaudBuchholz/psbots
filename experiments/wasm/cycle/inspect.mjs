// Demonstrates:
// 1. Injecting code: JS pre-tokenizes "3 4 add" and writes directly into Wasm memory
// 2. Extracting state: reads and decodes both stacks from the raw memory buffer

import { wasm, memory, nameToId } from './engine.mjs'

// ── Memory layout (must match cycle.wat) ─────────────────────────────────────
const OPERAND_BASE = 0       // each value: 4 bytes type+flags | 4 bytes payload
const CALL_BASE    = 512     // each frame: 4 bytes type+flags | 4 bytes payload | 4 bytes state
const VALUE_SIZE   = 8
const FRAME_SIZE   = 12
const SP_OPERAND   = 1024    // i32: operand stack depth
const SP_CALL      = 1028    // i32: call stack depth

// Type tags (matching cycle.wat globals)
const TYPES = { 0:'null', 1:'boolean', 2:'integer', 3:'string', 4:'name', 5:'mark', 6:'operator', 7:'array' }
const FLAG_EXEC = 0x10

// ── 1. INJECT: write pre-tokenized program into Wasm memory ──────────────────

function inject(program) {
  // program = array of { kind: 'integer'|'name', value: number|string }
  wasm.reset()
  const view = new DataView(memory.buffer)

  for (const token of program) {
    if (token.kind === 'integer') {
      // push integer directly to operand stack (type=2, not executable)
      wasm.push_integer(token.value)

    } else if (token.kind === 'name') {
      // push executable name to call stack (type=4 | FLAG_EXEC=0x10)
      const id = nameToId[token.value]
      if (id === undefined) throw new Error(`Unknown name: ${token.value}`)
      wasm.push_name(id)
    }
  }
}

// ── 2. EXTRACT: decode both stacks from raw memory ───────────────────────────

function decodeValue(typeFlags, payload) {
  const isExec = (typeFlags & FLAG_EXEC) !== 0
  const type = TYPES[typeFlags & 0x0f] ?? `unknown(${typeFlags & 0x0f})`
  return { type, isExecutable: isExec, payload }
}

function extractState() {
  const view = new DataView(memory.buffer)

  const operandDepth = view.getInt32(SP_OPERAND, true)
  const callDepth    = view.getInt32(SP_CALL, true)

  const operands = []
  for (let i = 0; i < operandDepth; ++i) {
    const base    = OPERAND_BASE + i * VALUE_SIZE
    const tf      = view.getInt32(base,     true)
    const payload = view.getInt32(base + 4, true)
    operands.push(decodeValue(tf, payload))
  }

  const calls = []
  for (let i = 0; i < callDepth; ++i) {
    const base    = CALL_BASE + i * FRAME_SIZE
    const tf      = view.getInt32(base,      true)
    const payload = view.getInt32(base + 4,  true)
    const state   = view.getInt32(base + 8,  true)
    calls.push({ ...decodeValue(tf, payload), operatorState: state })
  }

  return { operands, calls }
}

function printState(label) {
  const { operands, calls } = extractState()
  console.log(`\n── ${label} ──`)
  console.log(`  operand stack (${operands.length}):`)
  for (const v of operands) {
    const exec = v.isExecutable ? ' [exec]' : ''
    console.log(`    ${v.type}(${v.payload})${exec}`)
  }
  console.log(`  call stack (${calls.length}):`)
  for (const v of calls) {
    const exec = v.isExecutable ? ' [exec]' : ''
    const state = v.operatorState === 0x7fffffff ? 'UNKNOWN'
                : v.operatorState === 0          ? 'FIRST_CALL'
                : v.operatorState === 0x80000000 ? 'POP'
                : String(v.operatorState)
    console.log(`    ${v.type}(${v.payload})${exec}  state=${state}`)
  }
}

// ── Run through "3 4 add" step by step ───────────────────────────────────────

const program = [
  { kind: 'integer', value: 3 },
  { kind: 'integer', value: 4 },
  { kind: 'name',    value: 'add' },
]

// ── Step-by-step trace of "3 4 add" ─────────────────────────────────────────

console.log('\n════ Step-by-step trace ════')
inject(program)
printState('initial (after inject)')

let cycle = 0
while (wasm.call_stack_depth() > 0) {
  const ex = wasm.step()
  printState(`after cycle ${++cycle}${ex !== 0 ? `  !! exception ${ex}` : ''}`)
}
console.log(`\n  result: ${wasm.top_integer()}`)
