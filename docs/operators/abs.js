function abs({ operands }) {
  const value = operands.at(0).integer
  if (value < 0) {
    const result = integer(-value)
    operands.popush(1, result)
  }
}
