/** Debug source (associated memory is *not* managed by the engine) */
export interface IDebugSource {
  /** Source code */
  source: string;
  /** Source file name */
  filename: string;
  /** Position of the corresponding token in the source code */
  pos: number;
  /** Length of the corresponding token in the code */
  length: number;
}
