export interface IReplIO {
  readonly abortSignal?: AbortSignal;
  readonly width: number;
  readonly height: number;
  input: (onData: (data: string) => void) => void;
  output: (text: string) => void;
}
