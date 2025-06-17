import './terminal.js';

globalThis.addEventListener('DOMContentLoaded', () => {
  const terminal = document.querySelector('psbots-terminal') as HTMLElement;

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
  terminal.addEventListener('ready', (event) => console.log('ready', (event as CustomEvent).detail));
  terminal.addEventListener('cycle', (event) => console.log('cycle', (event as CustomEvent).detail));
  terminal.addEventListener('terminated', (event) => console.log('terminated', (event as CustomEvent).detail));

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
});
