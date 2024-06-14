/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function isObject(value: unknown): value is any {
  return typeof value === 'object' && value !== null;
}
