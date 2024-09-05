export interface IReplIO {
  readonly width: number;
  readonly height: number;
  input: (choices?: string[]) => Promise<string>;
  output: (text: string) => void;
}
