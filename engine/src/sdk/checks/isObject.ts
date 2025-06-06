export function isObject<T extends object>(value: unknown): value is T {
  return typeof value === 'object' && value !== null;
}
