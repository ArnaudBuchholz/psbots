/* eslint-env node */
import { readFile, writeFile } from 'node:fs/promises';

const viteConfig = await readFile('vite.config.mjs', 'utf8');
const {
  compilerOptions: { paths: aliases }
} = JSON.parse(await readFile('tsconfig.json', 'utf8'));
await writeFile(
  'vite.config.mjs',
  viteConfig.replace(
    /alias: \{[^}]*}/,
    () => `alias: {
      ${Object.entries(aliases)
      .map(([alias, [path]]) => {
        const [, relativePath] = path.match(/\.\/(.*)\/\*/);
        return `'${alias.split('/*')[0]}': path('src/${relativePath}')`;
      })
      .join(',\n      ')}
    }`
  )
);
