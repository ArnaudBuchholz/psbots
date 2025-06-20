import { IMemoryByType, IState } from '../../engine/dist/api/index.js';
import './terminal.js';

globalThis.addEventListener('DOMContentLoaded', () => {
  const terminal = document.querySelector('psbots-terminal') as HTMLElement;
  const status = document.querySelector('.terminal-header .status') as HTMLElement;

  const MONITOR_WIDTH = 60;
  const MONITOR_HEIGHT = 15;
  const memoryMonitor = document.querySelector('.terminal-header #monitor-memory') as HTMLCanvasElement;
  const cpuMonitor = document.querySelector('.terminal-header #monitor-cpu') as HTMLCanvasElement;
  memoryMonitor.setAttribute('width', MONITOR_WIDTH.toString());
  memoryMonitor.setAttribute('height', MONITOR_HEIGHT.toString());
  const memoryCanvas = memoryMonitor.getContext('2d')!;
  cpuMonitor.setAttribute('width', MONITOR_WIDTH.toString());
  cpuMonitor.setAttribute('height', MONITOR_HEIGHT.toString());
  // const cpuCanvas = cpuMonitor.getContext('2d');

  let lastMonitorTick = Date.now();
  const MONITOR_SAMPLE_RESOLUTION = 10; // number of cycles displayed as in pixel in the monitor
  const MONITOR_SAMPLE_SIZE = MONITOR_SAMPLE_RESOLUTION * MONITOR_WIDTH;
  const memory: IMemoryByType[] = [];

  const monitor = (state: IState, forceRender = false): void | Promise<void> => {
    const now = Date.now();
    if (memory.length >= MONITOR_SAMPLE_SIZE) {
      memory.shift();
    }
    const byType = { ...state.memoryTracker.byType };
    memoryMonitor.title = `System: ${byType.system}
String: ${byType.string}
User: ${byType.user}
Total: ${state.memoryTracker.used}
Peak: ${state.memoryTracker.peak}`;
    memory.push(byType);
    if (now - lastMonitorTick > 100 || forceRender) {
      memoryCanvas.clearRect(0, 0, MONITOR_WIDTH, MONITOR_HEIGHT);
      const { peak: maxMemory } = state.memoryTracker;
      for (let index = 0; index < MONITOR_WIDTH && index * MONITOR_SAMPLE_RESOLUTION < memory.length; ++index) {
        let totalOfString = 0;
        let totalOfSystem = 0;
        let totalOfUser = 0;
        for (let i = 0; i < MONITOR_SAMPLE_RESOLUTION && index * MONITOR_SAMPLE_RESOLUTION + i < memory.length; ++i) {
          const sample = memory[index * MONITOR_SAMPLE_RESOLUTION + i];
          totalOfString += sample.string;
          totalOfSystem += sample.system;
          totalOfUser += sample.user;
        }
        const total = totalOfString + totalOfSystem + totalOfUser;
        const height = (MONITOR_HEIGHT * total) / (maxMemory * MONITOR_SAMPLE_RESOLUTION);
        const heightString = (MONITOR_HEIGHT * totalOfString) / (maxMemory * MONITOR_SAMPLE_RESOLUTION);
        const heightSystem = (MONITOR_HEIGHT * totalOfSystem) / (maxMemory * MONITOR_SAMPLE_RESOLUTION);
        const heightUser = (MONITOR_HEIGHT * totalOfUser) / (maxMemory * MONITOR_SAMPLE_RESOLUTION);
        memoryCanvas.fillStyle = '#f00';
        memoryCanvas.fillRect(index, MONITOR_HEIGHT - height,  1, heightSystem);
        memoryCanvas.fillStyle = '#00f';
        memoryCanvas.fillRect(index, MONITOR_HEIGHT - height + heightSystem,  1, heightString);
        memoryCanvas.fillStyle = '#0f0';
        memoryCanvas.fillRect(index, MONITOR_HEIGHT - height + heightSystem + heightString,  1, heightUser);
      }
      lastMonitorTick = now;
      return new Promise<void>((resolve) => setTimeout(resolve, 0))
    }
  }

  terminal.addEventListener('start', (event) => {
    const terminalEvent = event as CustomEvent;
    memory.length = 0;
    terminalEvent.detail.wait = monitor(terminalEvent.detail.state)
    status.innerHTML = '⭕';
  });

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
    terminalEvent.detail.wait = monitor(terminalEvent.detail.state, true);
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
