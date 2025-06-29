/* eslint-env node */
import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { parse } from '@babel/parser';
import { generate } from '@babel/generator';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;

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

const red = '\u001B[31m';
const yellow = '\u001B[33m';
const white = '\u001B[37m';

// eslint-disable-next-line sonarjs/cognitive-complexity -- not relevant for this function
async function optimize(basePath, path = basePath) {
  if (/\bperf\b/.test(path)) {
    return;
  }
  const names = await readdir(path);
  const perfPath = path.replace(/\bdist\b/, 'dist/perf');
  await mkdir(perfPath, { recursive: true });
  for (const name of names) {
    const itemPath = join(path, name);
    if (name.endsWith('.js')) {
      const source = await readFile(itemPath, 'utf8');
      const ast = parse(source, { sourceType: 'module' });
      await writeFile(join(perfPath, name.replace('.js', '.ast')), JSON.stringify(ast, null, 2), { encoding: 'utf8' });

      // Remove calls to assert
      traverse(ast, {
        enter(path) {
          // TODO: check how assert is imported and remove statement
          const { node } = path;
          if (node.type === 'ExpressionStatement' && node.expression?.callee?.name === 'assert') {
            path.remove();
          }
        }
      });

      // Analyze functions to attempt inlining
      const functions = new Map();
      traverse(ast, {
        enter(path) {
          const { node, parent, scope } = path;
          // TODO: check for anonymous functions (like in operators)
          if (node.type === 'FunctionDeclaration') {
            const name = node.id.name;
            const exported = parent.type === 'ExportNamedDeclaration';
            const calls = new Map();
            scope.traverse(node, {
              enter({ node, parent }) {
                if (node.type === 'CallExpression' && node.callee?.name) {
                  const { name } = node.callee;
                  const yielded = parent.type === 'YieldExpression';
                  if (calls.has(name)) {
                    ++calls.get(name).count;
                  } else {
                    calls.set(name, { yielded, count: 1 });
                  }
                }
              }
            });
            functions.set(name, { node, exported, calls });
          }
        }
      });
      if (functions.size > 0) {
        let canInline = false;
        let infos = [`${yellow}${itemPath}${white}:`];
        for (const [name, { node, exported, calls }] of functions.entries()) {
          infos.push(
            `\t${exported ? red + 'export' + white + ' ' : ''}${node.async ? 'async ' : ''}function ${node.generator ? '* ' : ''}${name}`
          );
          if (calls.size > 0) {
            for (const [name, { yielded, count }] of calls.entries()) {
              const moduleFunction = functions.get(name);
              if (moduleFunction && !moduleFunction.exported) {
                infos.push(`\t  → ${yielded ? 'yield ' : ''}${name}${count > 1 ? ' (' + count + ')' : ''}`);
                canInline = true;
              }
            }
          }
        }
        if (canInline) {
          console.log(infos.join('\n'));
        }
      }

      await writeFile(join(perfPath, name), generate(ast).code, { encoding: 'utf8' });
    } else {
      const itemStat = await stat(itemPath);
      if (itemStat.isDirectory()) {
        await optimize(basePath, itemPath);
      }
    }
  }
}
await optimize(basePath);
