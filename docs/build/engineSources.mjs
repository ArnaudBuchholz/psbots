/* eslint-env node */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;

const red = '\u001B[31m';
const yellow = '\u001B[33m';
const white = '\u001B[37m';

const searchForCalls = (scope, node) => {
  const calls = new Map();
  scope.traverse(node, {
    enter({ node }) {
      if (node.type === 'CallExpression' && node.callee?.name) {
        const { name } = node.callee;
        if (calls.has(name)) {
          ++calls.get(name).count;
        } else {
          calls.set(name, { count: 1 });
        }
      }
    }
  });
  return calls;
};

const source = async (path) => {
  const name = path.pathname.split('engine/src/')[1];
  const content = await readFile(path, 'utf8');
  const ast = parse(content, { sourceType: 'module', plugins: ['typescript'] });
  await writeFile(new URL(path.toString().replace('.ts', '.ast')), JSON.stringify(ast, null, 2), { encoding: 'utf8' });
  console.log(`${yellow}${name}${white}`);
  traverse(ast, {
    enter(path) {
      const { node, parent, scope } = path;
      if (node.type === 'ImportDeclaration' && node.importKind === 'value') {
        for (const specifier of node.specifiers) {
          console.log(`\t← ${specifier.imported.name} (${node.source.value})`);
        }
      }
      if (node.type === 'ClassDeclaration') {
        const className = node.id.name;
        const exported = parent.type === 'ExportNamedDeclaration';
        console.log(`\t${exported ? red + 'export' + white + ' ' : ''}class ${className}`);
        scope.traverse(node, {
          enter({ scope, node }) {
            if (node.type === 'ClassMethod') {
              console.log(`\t${className}::${node.key.name}`);
              const calls = searchForCalls(scope, node);
              if (calls.size > 0) {
                for (const [name, { count }] of calls.entries()) {
                  console.log(`\t  → ${name}${count > 1 ? ' (' + count + ')' : ''}`);
                }
              }
            }
          }
        });
      }
      if (node.type === 'FunctionDeclaration') {
        const name = node.id.name;
        const exported = parent.type === 'ExportNamedDeclaration';
        console.log(`\t${exported ? red + 'export' + white + ' ' : ''}function ${name}`);
        const calls = searchForCalls(scope, node);
        if (calls.size > 0) {
          for (const [name, { count }] of calls.entries()) {
            console.log(`\t  → ${name}${count > 1 ? ' (' + count + ')' : ''}`);
          }
        }
      }
    }
  });
};

const lookup = async (path) => {
  const names = await readdir(path);
  for (const name of names) {
    if (name === 'index.ts' || name.endsWith('.md') || name.endsWith('.spec.ts') || name.endsWith('.ast')) {
      continue;
    }
    if (name.endsWith('.ts')) {
      source(new URL(name, path));
    } else if (name !== 'test') {
      await lookup(new URL(name + '/', path));
    }
  }
};

void lookup(new URL('../../engine/src/', import.meta.url), 'utf8');
