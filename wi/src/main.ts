import './terminal.js';

globalThis.addEventListener('DOMContentLoaded', () => {
  const terminal = document.querySelector('psbots-terminal') as HTMLElement;

  terminal.addEventListener('resize', (event) => console.log('resize', event.detail));
  terminal.addEventListener('ready', (event: any) => console.log('ready', event.detail));
  terminal.addEventListener('cycle', (event: any) => console.log('cycle', event.detail));
  terminal.addEventListener('terminated', (event: any) => console.log('terminated', event.detail));

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
