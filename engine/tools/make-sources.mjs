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
  const exceptions = JSON.parse(await readFile('tools/system-exceptions.json', 'utf-8'));

  writeFile(
    `src/api/Exception.ts`,
    `export type Exception =
${Object.keys(exceptions)
  .map((name) => `  | '${name}'`)
  .join('\n')};

const messages: { [key in Exception]: string } = {
${Object.entries(exceptions)
  .map(([name, message]) => `  ${name}: '${message}'`)
  .join(',\n')}
};

export const getExceptionMessage = (exception: Exception): string => messages[exception];
`
  );

  for (const [name, message] of Object.entries(exceptions)) {
    const lowercasedName = name.toLowerCase();

    writeFile(
      `src/core/operators/exceptions/${name}.ts`,
      `import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: '${lowercasedName}',
    description: 'throws the exception : ${message}',
    labels: ['exception'],
    signature: {
      exceptions: ['${lowercasedName}']
    },
    samples: [
      {
        in: '${lowercasedName}',
        out: '${lowercasedName}'
      }
    ]
  },
  () => ({ success: false, exception: '${name}' })
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

async function checkSources(path) {
  const names = await readdir(path);
  const files = {};
  for (const name of names) {
    files[name] = await stat(join(path, name));
  }
  let errors = 0;
  for (const [name, stat] of Object.entries(files)) {
    const fullPath = join(path, name);
    if (stat.isDirectory()) {
      errors += await checkSources(fullPath);
    } else {
      const source = await readFile(fullPath, 'utf-8');
      const lines = [];
      source.replace(/import (?:type )?\{[^}]+\} from '((?:@|\.)[^']+)';/g, (line, src) => {
        if (!src.endsWith('.js')) {
          lines.push(line);
        }
      });
      if (lines.length) {
        errors += lines.length;
        console.error('⚠️', fullPath, ': check imports');
        lines.forEach((line) => console.error('\t', line));
      }
    }
  }
  return errors;
}

async function main() {
  await generateExceptions();
  await generateIndexes('src', false);
  await updateVersion();
  process.exitCode = 0;
  process.exitCode += await checkSources('src');
}

main().catch((reason) => {
  console.error(reason);
  process.exitCode = -1;
});
