interface IInputBuffer {
  addLine: (input: string) => void;
}

export interface IReplIO {
  readonly width: number;
  readonly height: number;
  setInputBuffer: (buffer: IInputBuffer) => void;
  /** Should be a blocking call (no input can be added while waiting for a key) */
  waitForKey: () => Promise<string>;
  output: (text: string) => void;
}
