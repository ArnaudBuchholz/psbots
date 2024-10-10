import type { IReplIO } from './IReplIO.js';

export function buildInputHandler(replIO: IReplIO): () => Promise<string> {
  const inputs: string[] = [];

  let newInput: () => void;
  let waitForInput = Promise.resolve();
  let newInputTimerId: ReturnType<typeof setTimeout> | undefined;

  const noInputs = () => {
    waitForInput = new Promise((resolve) => {
      newInput = resolve;
    });
  };
  noInputs();

  replIO.setInputBuffer({
    addLine(input: string) {
      if (newInputTimerId !== undefined) {
        clearTimeout(newInputTimerId);
      }
      inputs.push(input);
      newInputTimerId = setTimeout(newInput, 100);
    }
  });

  return async () => {
    if (inputs.length === 0) {
      await waitForInput;
    }
    const input = inputs.join('\n');
    inputs.length = 0;
    noInputs();
    return input;
  };
}
