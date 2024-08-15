export function waitForGenerator (iterator: Generator): any[] {
  const result = []
  while (true) {
    const { value, done } = iterator.next()
    result.push(value)
    if (result.length > 1000) {
      throw new Error('Too many cycles (infinite loop ?)')
    }
    if (done === true) {
      break
    }
  }
  return result
}
