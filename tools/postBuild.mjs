/* eslint-env node */
import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
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
const functionDeclaration = esquery.parse('FunctionDeclaration');
const callFunctionExpression = esquery.parse('CallExpression[callee.type=Identifier]');

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

const red = '\u001B[31m';
// const green = '\u001B[32m';
const yellow = '\u001B[33m';
// const blue = '\u001B[34m';
// const magenta = '\u001B[35m';
// const cyan = '\u001B[36m';
const white = '\u001B[37m';

async function optimize(basePath, path = basePath) {
  if (path.match(/\bperf\b/)) {
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

      forEachMatch(ast, assertCallExpression, (parent, member, match) => {
        if (!Array.isArray(parent)) {
          throw new Error('Unexpected');
        }
        parent.splice(member, 1);
      });

      let dumpFilePath = true;
      forEachMatch(ast, functionDeclaration, (parent, _, functionAst) => {
        if (dumpFilePath) {
          console.log(`${yellow}${itemPath}${white}:`)
          dumpFilePath = false;
        }
        console.log(`\t${parent.type === 'ExportNamedDeclaration' ? `${red}export${white} ` : ''}${functionAst.async ? 'async ': '' }function ${functionAst.generator ? '* ': '' }${functionAst.id.name}`)
        forEachMatch(functionAst, callFunctionExpression, (parent, _, callAst) => {
          console.log(`\t  → ${parent.type === 'YieldExpression' ? 'yield ' : '' }${callAst.callee.name}`);
        });
      });

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
