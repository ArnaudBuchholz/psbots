/** */
export interface ISharedReference {
  readonly refCount: number
  addRef: () => void
  release: () => void
}
