operator(
  {
    name: 'abs',
    description: 'returns the absolute value of an integer',
    ref: 'https://hepunx.rl.ac.uk/~adye/psdocs/ref/PSL2a.html#abs',
    labels: ['integer', 'math'],
    signature: {
      input: [{ type: 'integer' }],
      output: [{ type: 'integer' }]
    },
    samples: [
      {
        in: '1 abs',
        out: '1'
      },
      {
        in: '-1 abs',
        out: '1'
      }
    ]
  },
  ({ operands }, { integer: value }) => {
    if (value < 0) {
      return operands.popush(1, toIntegerValue(-value));
    }
    return { success: true, value: undefined };
  }
);
