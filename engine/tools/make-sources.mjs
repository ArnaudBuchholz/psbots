import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function generateIndexes(path, generate) {
  const names = await readdir(path);
  const files = {};
  for (const name of names) {
    files[name] = await stat(join(path, name));
  }
  if (files['index.ts'] && path !== 'src') {
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
          if (path.includes('operators') && name !== 'operators.ts') {
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

    writeFile(
      `src/sdk/exceptions/${uppercasedName}Exception.ts`,
      `import { BaseException } from '@sdk/exceptions/BaseException.js';

const MESSAGE = '${message}';

export class ${uppercasedName}Exception extends BaseException {
  constructor() {
    super(MESSAGE);
  }
}
`
    );

    const lowercasedName = name.toLowerCase();

    writeFile(
      `src/core/operators/exceptions/${name}.ts`,
      `import { ${uppercasedName}Exception } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: '${lowercasedName}',
    description: 'throws the exception : ${message}',
    labels: ['exception'],
    signature: {
      input: [],
      output: [],
      exceptions: ['${lowercasedName}']
    },
    samples: [
      {
        in: '${lowercasedName}',
        out: '${lowercasedName}'
      }
    ]
  },
  () => {
    throw new ${uppercasedName}Exception();
  }
);
`
    );
  }
}

async function updateVersion() {
  const projectPackage = JSON.parse(await readFile('./package.json', 'utf-8'));
  const VERSION_OPERATOR_PATH = './src/core/operators/value/version.ts';
  await writeFile(
    VERSION_OPERATOR_PATH,
    (await readFile(VERSION_OPERATOR_PATH, 'utf-8')).replace(
      /const VERSION = '[^']*';/,
      () => `const VERSION = '${projectPackage.name}@${projectPackage.version}';`
    )
  );
}

async function main() {
  generateExceptions();
  generateIndexes('src', false);
  updateVersion();
}

main().catch((reason) => {
  console.error(reason);
  process.exitCode = -1;
});
