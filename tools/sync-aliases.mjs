import { readFile, writeFile } from 'node:fs/promises';

const main = async () => {
  const {
    compilerOptions: { paths: aliases }
  } = JSON.parse(await readFile('tsconfig.json', 'utf-8'));
  await writeFile(
    'vite.config.mjs',
    (await readFile('vite.config.mjs', 'utf-8')).replace(
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
};

main().catch((reason) => {
  console.error(reason);
  process.exitCode = -1;
});
