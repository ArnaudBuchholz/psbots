import { readFileSync, writeFileSync } from 'fs'
import wabt from 'wabt'

const wabtModule = await wabt()
const source = readFileSync('add.wat', 'utf8')
const parsed = wabtModule.parseWat('add.wat', source)
const { buffer } = parsed.toBinary({})
writeFileSync('add.wasm', Buffer.from(buffer))
console.log('add.wasm written')
