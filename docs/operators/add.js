function add ({ operands }) {
  const value1 = operands.at(0).integer
  const value2 = operands.at(1).integer
  const result = integer(value1 + value2)
  operands.popush(2, result)
}
