export interface IReplIO {
  input: (choices?: string[]) => Promise<string>;
  output: (text: string) => void;
}
