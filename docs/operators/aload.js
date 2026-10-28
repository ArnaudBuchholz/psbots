function aload ({ calls, operands }) {
  using arrayValue = operands.at(0) // addRef and release
  const array = arrayValue.array
  if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
    operands.reserve(1 + array.length)
    calls.topOperatorState = 1
  } else {
    const index = calls.topOperatorState - 1
      if (index >= array.length) {
      calls.topOperatorState = OPERATOR_STATE_POP
    } else {
      const value = array.at(index)
      operands.popush(1, value, arrayValue)
      calls.topOperatorState = index + 2
    }
  }
}
