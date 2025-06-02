export interface IReplIO {
  readonly abort?: AbortSignal;
  readonly width: number;
  readonly height: number;
  input: (onData: (data: string) => void) => void;
  output: (text: string) => void;
}
