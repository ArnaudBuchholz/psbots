import type { IState } from '@psbots/engine';

export interface IReplIO {
  readonly abortSignal?: AbortSignal;
  readonly width: number;
  readonly height: number;
  readonly on?: (event: 'start' | 'ready' | 'cycle' | 'terminated', detail: { state: IState }) => void | Promise<void>;
  input: (onData: (data: string) => void) => void;
  output: (text: string) => void;
}
