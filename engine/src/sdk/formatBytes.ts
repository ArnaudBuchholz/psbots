const bytesScales: Array<{
  factor: number;
  unit: string;
}> = [
  { factor: 1024 * 1024, unit: 'MB' },
  { factor: 1024, unit: 'kB' }
];

export function formatBytes(bytes: number): string {
  for (const scale of bytesScales) {
    if (bytes >= scale.factor) {
      return `${(bytes / scale.factor).toFixed(2)}${scale.unit}`;
    }
  }
  return `${bytes}B`;
}
