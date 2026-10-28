import { readFileSync, writeFileSync } from 'fs'
import wabt from 'wabt'

const wabtModule = await wabt()
const source = readFileSync('cycle.wat', 'utf8')
const parsed = wabtModule.parseWat('cycle.wat', source)
const { buffer } = parsed.toBinary({})
writeFileSync('cycle.wasm', Buffer.from(buffer))
console.log('cycle.wasm written')
