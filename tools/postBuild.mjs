/* eslint-env node */
import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const tsconfig = JSON.parse(await readFile('tsconfig.json'));
const aliases = tsconfig.compilerOptions.paths;
const basePath = process.argv[2];

async function removeAliases(basePath, path = basePath) {
  const names = await readdir(path);
  for (const name of names) {
    const itemPath = join(path, name);
    if (name.endsWith('.js') || name.endsWith('.d.ts')) {
      const source = await readFile(itemPath, 'utf8');
      const updated = source.replaceAll(/from '(@\w+\/)/g, (_, alias) => {
        const [aliasPathStar] = aliases[alias + '*'];
        const [aliasPath] = aliasPathStar.split('*');
        let relativePath = relative(path, join(basePath, aliasPath)).replaceAll('\\', '/');
        if (!relativePath.startsWith('.')) {
          relativePath = `./${relativePath}`;
        }
        if (!relativePath.endsWith('/')) {
          relativePath = `${relativePath}/`;
        }
        return `from '${relativePath}`;
      });
      if (updated !== source) {
        await writeFile(itemPath, updated, { encoding: 'utf8' });
      }
    } else {
      const itemStat = await stat(itemPath);
      if (itemStat.isDirectory()) {
        await removeAliases(basePath, itemPath);
      }
    }
  }
}
await removeAliases(basePath);
