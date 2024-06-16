import { readFile, stat, writeFile } from 'node:fs/promises';

async function main() {
  const { atimeMs: scriptTimestamp } = await stat('tools/update-sources.mjs');

  console.log('exceptions...');
  const { atimeMs: exceptionsTimestamp } = await stat('src/sdk/exceptions/exceptions.json');
  const exceptions = JSON.parse(await readFile('src/sdk/exceptions/exceptions.json', 'utf-8'));
  for (const [name, message] of Object.entries(exceptions)) {
    const uppercasedName = name.charAt(0).toUpperCase() + name.substring(1);
    const fileName = `src/sdk/exceptions/${uppercasedName}Exception.ts`;
    let update = false;
    try {
      const { atimeMs: fileTimestamp } = await stat(fileName);
      update = fileTimestamp < exceptionsTimestamp || fileTimestamp < scriptTimestamp;
    } catch (e) {
      update = true;
    }
    if (!update) {
      continue;
    }
    console.log(`\t${fileName}`);
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

main().catch((reason) => console.error(reason));
