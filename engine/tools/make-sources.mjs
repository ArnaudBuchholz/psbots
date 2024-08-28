import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function generateIndexes(path, generate) {
  const names = await readdir(path);
  const files = {};
  for (const name of names) {
    files[name] = await stat(join(path, name));
  }
  if (files['index.ts']) {
    generate = true;
  }
  if (generate) {
    await writeFile(
      join(path, 'index.ts'),
      Object.entries(files)
        .filter(([name, stat]) => {
          return stat.isDirectory() || (name.endsWith('.ts') && !name.endsWith('.spec.ts') && name !== 'index.ts');
        })
        .map(([name, stat]) => {
          if (stat.isDirectory()) {
            name += '/index.js';
          }
          if (path.includes('operators') && name !== 'operator.ts') {
            return `import './${name.replace('.ts', '.js')}';`;
          }
          return `export * from './${name.replace('.ts', '.js')}';`;
        })
        .sort()
        .join('\n') + '\n'
    );
  }
  for (const [name, stat] of Object.entries(files)) {
    if (stat.isDirectory()) {
      await generateIndexes(join(path, name), generate);
    }
  }
}

async function generateExceptions() {
  const exceptions = JSON.parse(await readFile('src/sdk/exceptions/exceptions.json', 'utf-8'));
  for (const [name, message] of Object.entries(exceptions)) {
    const uppercasedName = name.charAt(0).toUpperCase() + name.substring(1);
    const fileName = `src/sdk/exceptions/${uppercasedName}Exception.ts`;
    writeFile(
      fileName,
      `import { BaseException } from '@sdk/exceptions/BaseException.js';

const MESSAGE = '${message}';

export class ${uppercasedName}Exception extends BaseException {
  constructor() {
    super(MESSAGE);
  }
}
`
    );
  }
}

async function main() {
  generateIndexes('src', false);
  generateExceptions();
}

main().catch((reason) => console.error(reason));
