/* eslint-env node */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

let aliases;

async function removeAliases(basePath, path = basePath) {
  const names = await readdir(path);
  for (const name of names) {
    const itemPath = join(path, name);
    if (name.endsWith('.js') || name.endsWith('.d.ts')) {
      const source = await readFile(itemPath, 'utf-8');
      const updated = source.replace(/from '(@\w+\/)/g, (_, alias) => {
        const [aliasPathStar] = aliases[alias + '*'];
        const [aliasPath] = aliasPathStar.split('*');
        let relativePath = relative(path, join(basePath, aliasPath)).replace(/\\/g, '/');
        if (!relativePath.startsWith('.')) {
          relativePath = `./${relativePath}`;
        }
        if (!relativePath.endsWith('/')) {
          relativePath = `${relativePath}/`;
        }
        return `from '${relativePath}`;
      });
      if (updated !== source) {
        await writeFile(itemPath, updated, { encoding: 'utf-8' });
      }
    } else if ((await stat(itemPath)).isDirectory()) {
      await removeAliases(basePath, itemPath);
    }
  }
}

async function main() {
  const tsconfig = JSON.parse(await readFile('tsconfig.json'));
  aliases = tsconfig.compilerOptions.paths;
  const [, , basePath] = process.argv;
  removeAliases(basePath);
}

main().catch((reason) => {
  console.error(reason);
  process.exitCode = -1;
});
