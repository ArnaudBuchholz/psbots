import type { StateFactorySettings } from '@psbots/engine';
import { green, white, yellow } from './colors.js';
import type { IReplIO } from './IReplIo.js';
import { formatBytes } from './formatBytes.js';

const checkOption = (options: string[], replIO: IReplIO | undefined, option: string): boolean => {
  if (options.includes(option)) {
    replIO?.output(`${green}💡${option} is set${white}\r\n`);
    return true;
  }
  return false;
};

export const buildOptions = (options: string[], replIO?: IReplIO): StateFactorySettings => {
  let maxMemoryBytes: number | undefined;
  const maxMemory = options.find((option) => option.startsWith('max-memory='));
  if (maxMemory) {
    maxMemoryBytes = Number.parseInt(maxMemory.split('=')[1]!, 10); // = exists
    replIO?.output(`${green}💡max-memory set to ${yellow}${formatBytes(maxMemoryBytes)}${white}\r\n`);
  }
  return {
    debugMemory: checkOption(options, replIO, 'debug-memory'),
    maxMemoryBytes,
    experimentalGarbageCollector: checkOption(options, replIO, 'experimental-garbage-collector')
  };
};
