export const abs = [
  {
    ref: 'https://hepunx.rl.ac.uk/~adye/psdocs/ref/PSL2a.html#abs',
    tags: ['integer', 'math'],
    description: 'returns the absolute value of an integer',
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
  (state) => {
    const { operands } = state.operands;
    const value = operands.at(0).integer;
    if (value < 0) {
      operands.popush(1, integer(-value));
    }
  }
] as const;