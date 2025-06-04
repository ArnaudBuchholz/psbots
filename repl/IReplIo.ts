import type { IState } from '@psbots/engine';

export interface IReplIO {
  readonly abortSignal?: AbortSignal;
  readonly width: number;
  readonly height: number;
  readonly on?: (event: 'ready', detail: { state: IState }) => void;
  input: (onData: (data: string) => void) => void;
  output: (text: string) => void;
}
