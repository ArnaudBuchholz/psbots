import { IState } from '../index'
import { blue, cyan, green, red, white, yellow } from './colors'

const bytesScales: Array<{
  factor: number
  unit: string
}> = [
  { factor: 1024 * 1024, unit: 'MB' },
  { factor: 1024, unit: 'kB' }
]

function scaleBytes (bytes: number): string {
  for (const scale of bytesScales) {
    if (bytes > scale.factor) {
      return `${(bytes / scale.factor).toFixed(2)}${scale.unit}`
    }
  }
  return `${bytes}B`
}

export function memory (state: IState): string {
  const { used, peak, total } = state.memory
  const usage = scaleBytes(used) + ' (top:' + scaleBytes(peak) + ')' + blue + '/'
  if (total === Infinity) {
    return usage + '∞' + white
  }
  return usage + scaleBytes(total) + white
}

interface StatusOptions {
  cycle: number
  absolute: boolean
  lastOperandsCount: number
  lastUsedMemory: number
  concat?: string
}

export function status (state: IState, options: StatusOptions): string {
  let cycleLabel: string
  if (options.absolute) {
    cycleLabel = 'cycle: #'
  } else {
    cycleLabel = 'cycles: '
  }
  let operandsVariation = ''
  const { lastOperandsCount } = options
  if (lastOperandsCount !== undefined) {
    const currentOperandsCount = state.operands.length
    if (currentOperandsCount > lastOperandsCount) {
      operandsVariation = ` ${red}+${currentOperandsCount - lastOperandsCount}`
    } else if (currentOperandsCount < lastOperandsCount) {
      operandsVariation = ` ${red}-${lastOperandsCount - currentOperandsCount}`
    }
  }
  let memoryVariation = ''
  const { lastUsedMemory } = options
  if (lastUsedMemory !== undefined) {
    const currentUsedMemory = state.memory.used
    if (currentUsedMemory > lastUsedMemory) {
      memoryVariation = ` ${red}+${scaleBytes(currentUsedMemory - lastUsedMemory)}`
    } else if (currentUsedMemory < lastUsedMemory) {
      memoryVariation = ` ${green}-${scaleBytes(lastUsedMemory - currentUsedMemory)}`
    }
  }
  let flags = ''
  if (!state.flags.call) {
    flags = ` ${red}!call`
  }
  return [
    `${cyan}${cycleLabel}${yellow}${options.cycle}`,
    flags,
    `${cyan} operands: ${yellow}${state.operands.length}${operandsVariation}`,
    `${cyan} memory: ${yellow}${memory(state)}${memoryVariation}`,
    white,
    options.concat,
    white
  ].join('')
}
