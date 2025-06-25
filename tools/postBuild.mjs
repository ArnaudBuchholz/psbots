/* eslint-env node */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { parse } from '@babel/parser';
import { generate } from '@babel/generator';
import esquery from 'esquery';

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

const assertCallExpression = esquery.parse('ExpressionStatement[expression.callee.name=assert]');

function forEachMatch(ast, selector, callback/*parent, member, match*/) {
  function traverseArray(array) {
    for (let i = array.length - 1; i >= 0; i--) {
      if (matches.includes(array[i])) {
        callback(array, i, array[i]);
      } else {
        traverse(array[i]);
      }
    }
  }

  function traverse(node) {
    for (const key in node) {
      const value = node[key];
      if (Array.isArray(value)) {
        traverseArray(value);
      } else if (typeof value === 'object' && value) {
        if (matches.includes(value)) {
          callback(node, key, value);
        } else {
          traverse(value);
        }
      }
    }
  }

  const matches = esquery.match(ast, selector);
  if (matches.length) {
    traverse(ast);
  }
}

async function removeAsserts(basePath, path = basePath) {
  const names = await readdir(path);
  for (const name of names) {
    const itemPath = join(path, name);
    if (name.endsWith('.js') && !name.endsWith('.ast.js')) {
      const source = await readFile(itemPath, 'utf8');
      const ast = parse(source, { sourceType: 'module' });
      await writeFile(itemPath.replace('.js', '.ast'), JSON.stringify(ast, null, 2), { encoding: 'utf8' });

      forEachMatch(ast, assertCallExpression, (parent, member, match) => {
        if (!Array.isArray(parent)) {
          throw new Error('Unexpected');
        }
        parent.splice(member, 1);
      });

      await writeFile(itemPath.replace('.js', '.ast.js'), generate(ast).code, { encoding: 'utf8' });
    } else {
      const itemStat = await stat(itemPath);
      if (itemStat.isDirectory()) {
        await removeAsserts(basePath, itemPath);
      }
    }
  }
}
await removeAsserts(basePath);
