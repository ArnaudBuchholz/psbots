/* eslint-env node */
import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from '@babel/parser';
import { generate } from '@babel/generator';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;

const basePath = process.argv[2];

const removeImport = (path, importedName) => {
  const { node } = path;
  if (node.type === 'ImportDeclaration') {
    // Assuming name has not been changed and from is not relevant
    const { specifiers } = node;
    const assertIndex = specifiers.findIndex((specifier) => specifier.imported.name === importedName);
    if (assertIndex !== -1) {
      if (specifiers.length === 1) {
        path.remove();
      } else {
        specifiers.splice(assertIndex, 1);
      }
    }
    return true;
  }
  return false;
};

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

      // Search for valid replacements of toIntegerValue
      let totalCount = 0;
      let removableCount = 0;
      traverse(ast, {
        enter(path) {
          const { node } = path;
          if (node.type === 'VariableDeclaration' && path.toString().includes('toIntegerValue')) {
            ++totalCount;
            const [, variableName] = path.toString().match(/\b(\w+)\s+=\s+toIntegerValue/);
            if (path.getNextSibling().toString().startsWith(`assert(${variableName}`)) {
              ++removableCount;
            }
          }
        }
      });
      if (removableCount > 0) {
        traverse(ast, {
          enter(path) {
            const { node } = path;
            if (removableCount === totalCount && removeImport(path, 'toIntegerValue')) {
              path.skip();
              return;
            }
            if (node.type === 'VariableDeclaration' && path.toString().includes('toIntegerValue')) {
              const [, variableName] = path.toString().match(/\b(\w+)\s+=\s+toIntegerValue/);
              if (path.getNextSibling().toString().startsWith(`assert(${variableName}`)) {
                // replace with inline
              }
            }
          }
        });
      }

      // Remove calls to assert
      traverse(ast, {
        enter(path) {
          const { node } = path;
          if (removeImport(path, 'assert')) {
            path.skip();
            return;
          }
          if (node.type === 'ExpressionStatement' && node.expression?.callee?.name === 'assert') {
            path.remove();
          }
        }
      });

      await writeFile(join(perfPath, name.replace('.js', '.optimized.ast')), JSON.stringify(ast, null, 2), {
        encoding: 'utf8'
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
