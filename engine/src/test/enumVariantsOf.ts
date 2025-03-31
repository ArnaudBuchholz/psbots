export function* enumVariantsOf(value: object): Generator<object> {
  for (const property of Object.keys(value)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-unused-vars -- better than copy & delete
    const { [property as keyof typeof value]: removed, ...variant } = value;
    yield variant;
  }
}
