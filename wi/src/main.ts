import { IState } from '../../engine/dist/api/index.js';
import './terminal.js';

globalThis.addEventListener('DOMContentLoaded', () => {
  const terminal = document.querySelector('psbots-terminal') as HTMLElement;
  const status = document.querySelector('.terminal-header .status') as HTMLElement;

  let lastMonitorTick = Date.now();

  const monitor = (state: IState): void | Promise<void> => {
    const now = Date.now();
    if (now - lastMonitorTick > 100) {
      lastMonitorTick = now;
      return new Promise<void>((resolve) => setTimeout(resolve, 0))
    }
  }

  const sizeElement = document.querySelector('.terminal-header .size');
  if (!sizeElement) {
    throw new Error('Size element not found');
  }
  let sizeTimeout: ReturnType<typeof setTimeout> | null = null;
  terminal.addEventListener('resize', (event: UIEvent) => {
    const { width, height } = event.detail as any;
    sizeElement.setAttribute('style', '');
    if (sizeTimeout) {
      clearTimeout(sizeTimeout);
    }
    sizeTimeout = setTimeout(() => {
      sizeElement.setAttribute('style', 'display: none;');
    }, 500);
    sizeElement.textContent = `🖵 ${width}x${height}`;
  });
  terminal.addEventListener('ready', (event) => {
    const terminalEvent = event as CustomEvent;
    terminalEvent.detail.wait = monitor(terminalEvent.detail.state)
    status.innerHTML = '🟢';
  });
  terminal.addEventListener('cycle', (event) => {
    const terminalEvent = event as CustomEvent;
    terminalEvent.detail.wait = monitor(terminalEvent.detail.state)
    status.innerHTML = '🟡';
  });
  terminal.addEventListener('terminated', () => {
    status.innerHTML = '🔴';
  });

  const getOptions = (filter: (option: string) => boolean = () => true): string[] => {
    return terminal.getAttribute('options')?.split(',')?.filter(filter) ?? [];
  };

  document.querySelector('#memory')?.addEventListener('change', (event) => {
    const memory = (event.target as HTMLInputElement).value;
    const options = getOptions((option: string) => !option.startsWith('max-memory='));
    if (memory) {
      options.push(`max-memory=${memory}`);
    }
    terminal.setAttribute('options', options.join(','));
  });

  const checkableOption = (id: string, option: string = id) => {
    document.querySelector(`#${id}`)?.addEventListener('click', (event) => {
      const options = getOptions((item: string) => item !== option);
      if ((event.target as HTMLInputElement).checked) {
        options.push(option);
      }
      terminal.setAttribute('options', options.join(','));
    });
  };

  checkableOption('garbage-collection', 'experimental-garbage-collector');
  checkableOption('debug-memory');

  document.querySelector('#rows')?.addEventListener('change', (event) => {
    const rows = (event.target as HTMLInputElement).value;
    if (rows === '') {
      terminal.removeAttribute('rows');
    } else {
      terminal.setAttribute('rows', rows);
    }
  });

  terminal.setAttribute('options', '');
});
