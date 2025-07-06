/* eslint-env node */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;

const sources = {};

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
  const definition = {
    name,
    imports: [],
    classes: [],
    functions: []
  };
  traverse(ast, {
    enter(path) {
      const { node, parent, scope } = path;
      if (node.type === 'ImportDeclaration' && node.importKind === 'value') {
        for (const specifier of node.specifiers) {
          definition.imports.push({
            name: specifier.imported.name,
            from: node.source.value
          });
        }
      }
      if (node.type === 'ClassDeclaration') {
        const classDefinition = {
          name: node.id.name,
          exported: parent.type === 'ExportNamedDeclaration',
          methods: []
        };
        scope.traverse(node, {
          enter({ scope, node }) {
            if (node.type === 'ClassMethod') {
              const calls = searchForCalls(scope, node);
              classDefinition.methods.push({
                name: node.key.name,
                calls
              });
            }
          }
        });
      }
      if (node.type === 'FunctionDeclaration') {
        definition.functions.push({
          name: node.id.name,
          exported: parent.type === 'ExportNamedDeclaration',
          calls: searchForCalls(scope, node)
        })
      }
    }
  });
  sources[name] = definition;
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

await lookup(new URL('../../engine/src/', import.meta.url), 'utf8');

for(const [name, definition] of Object.entries(sources)) {
  console.log(`${yellow}${name}${white}`);
  for (const { name, from } of definition.imports) {
    console.log(`\t← ${name} (${from})`);
  }
  for (const { name: className, exported, methods } of definition.classes) {
    console.log(`\t${exported ? red + 'export' + white + ' ' : ''}class ${className}`);
    for (const { name: methodName, calls } of methods) {
      console.log(`\t${className}::${methodName}`);
      for (const [name, { count }] of calls.entries()) {
        console.log(`\t  → ${name}${count > 1 ? ' (' + count + ')' : ''}`);
      }
    }
  }
  for (const { name: functionName, exported, calls } of definition.functions) {
    console.log(`\t${exported ? red + 'export' + white + ' ' : ''}function ${functionName}`);
    for (const [name, { count }] of calls.entries()) {
        console.log(`\t  → ${name}${count > 1 ? ' (' + count + ')' : ''}`);
    }
  }
}
