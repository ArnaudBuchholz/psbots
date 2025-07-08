/* eslint-env node */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;

let lastId = 0;
const sources = Object.create(null);
const exportedFunctions = Object.create(null);

const red = '\u001B[31m';
const yellow = '\u001B[33m';
const white = '\u001B[37m';

const checkForCall = (node, calls) => {
  if (node.type === 'CallExpression' && node.callee?.name) {
    const { name } = node.callee;
    if (calls.has(name)) {
      ++calls.get(name).count;
    } else {
      calls.set(name, { count: 1 });
    }
  }
};

const searchForCalls = (scope, node) => {
  const calls = new Map();
  scope.traverse(node, {
    enter({ node }) {
      checkForCall(node, calls);
    }
  });
  return calls;
};

const source = async (path) => {
  const moduleName = path.pathname.split('engine/src/')[1];
  const content = await readFile(path, 'utf8');
  const ast = parse(content, { sourceType: 'module', plugins: ['typescript'] });
  await writeFile(new URL(path.toString().replace('.ts', '.ast')), JSON.stringify(ast, null, 2), { encoding: 'utf8' });
  const definition = {
    id: ++lastId,
    name: moduleName,
    imports: [],
    calls: new Map(),
    classes: [],
    functions: []
  };
  traverse(ast, {
    enter(path) {
      const { node, parent, scope } = path;
      checkForCall(node, definition.calls);
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
        definition.classes.push(classDefinition);
        path.skip();
      }
      if (node.type === 'FunctionDeclaration') {
        const name = node.id.name;
        const exported = parent.type === 'ExportNamedDeclaration';
        const functionDefinition = {
          id: ++lastId,
          module: moduleName,
          name,
          exported,
          calls: searchForCalls(scope, node),
          externalCalls: 0
        };
        definition.functions.push(functionDefinition);
        if (exported) {
          const existingFunction = exportedFunctions[name];
          if (existingFunction) {
            throw new Error(`❌ duplicate exported function name:
${name} from ${moduleName}
${existingFunction.name} from ${existingFunction.module}`);
          }
          exportedFunctions[name] = functionDefinition;
        }
        path.skip();
      }
      if (node.type === 'ArrowFunctionExpression') {
        definition.functions.push({
          id: ++lastId,
          name: parent.id?.name ?? '(anonymous arrow)',
          exported: false, // TODO ?
          calls: searchForCalls(scope, node)
        });
        path.skip();
      }
    }
  });
  sources[moduleName] = definition;
};

const lookup = async (path) => {
  const names = await readdir(path);
  for (const name of names) {
    if (name === 'index.ts' || name.endsWith('.md') || name.endsWith('.spec.ts') || name.endsWith('.ast')) {
      continue;
    }
    if (name.endsWith('.ts')) {
      await source(new URL(name, path));
    } else if (name !== 'test') {
      await lookup(new URL(name + '/', path));
    }
  }
};

await lookup(new URL('../../engine/src/', import.meta.url), 'utf8');

const names = Object.keys(sources).sort((a, b) => a.localeCompare(b));

for(const name of names) {
  const definition = sources[name];
  for (const [name, { count }] of definition.calls.entries()) {
    const functionDefinition = exportedFunctions[name];
    if (functionDefinition) {
      functionDefinition.externalCalls += count;
    }
  }
  for (const { methods } of definition.classes) {
    for (const { calls } of methods) {
      for (const [name, { count }] of calls.entries()) {
        const functionDefinition = exportedFunctions[name];
        if (functionDefinition) {
          functionDefinition.externalCalls += count;
        }
      }
    }
  }
  for (const { calls } of definition.functions) {
    for (const [name, { count }] of calls.entries()) {
      const functionDefinition = exportedFunctions[name];
      if (functionDefinition) {
        functionDefinition.externalCalls += count;
      }
    }
  }
}

const markdown = [
  '# Sources',
  '## Dependencies',
];

for(const name of names) {
  const definition = sources[name];
  console.log(`${yellow}${name}${white}`);
  markdown.push(`### ${name}`);
  for (const { name, from } of definition.imports) {
    console.log(`\t← ${name} (${from})`);
    markdown.push(`\n* ← ${name} (${from})`);
  }
  for (const [name, { count }] of definition.calls.entries()) {
    console.log(`\t→ ${name}${count > 1 ? ' (' + count + ')' : ''}`);
    markdown.push(`\n* → ${name}${count > 1 ? ' (' + count + ')' : ''}`);
  }
  for (const { name: className, exported, methods } of definition.classes) {
    console.log(`\t${exported ? red + 'export' + white + ' ' : ''}class ${className}`);
    markdown.push(`\n${exported ? '<span style="color: red;">export</span> ' : ''}class ${className}`);
    for (const { name: methodName, calls } of methods) {
      if (calls.size) {
        console.log(`\t${className}::${methodName}`);
        markdown.push(`  ${className}::${methodName}`);
        for (const [name, { count }] of calls.entries()) {
          console.log(`\t  → ${name}${count > 1 ? ' (' + count + ')' : ''}`);
          markdown.push(`\n*  → ${name}${count > 1 ? ' (' + count + ')' : ''}`);
        }
      }
    }
  }
  for (const { name: functionName, exported, calls, externalCalls } of definition.functions) {
    if (exported || calls.size) {
      console.log(`\t${exported ? red + 'export' + white + ' ' : ''}function ${functionName} ${ externalCalls ? '(' + externalCalls + ')' : '' }`);
      markdown.push(`\n${exported ? '<span style="color: red;">export</span> ' : ''}function ${functionName} ${ externalCalls ? '(' + externalCalls + ')' : '' }`);
      for (const [name, { count }] of calls.entries()) {
          console.log(`\t  → ${name}${count > 1 ? ' (' + count + ')' : ''}`);
          markdown.push(`\n*  → ${name}${count > 1 ? ' (' + count + ')' : ''}`);
      }
    }
  }
}

markdown.push(
  '## Grap',
  '```mermaid',
  'graph LR'
);
for(const name of names) {
  const definition = sources[name];
  markdown.push(`  subgraph ${name}`);
  for (const [name, { count }] of definition.calls.entries()) {
    markdown.push(`    main_${definition.id}("main") --> ${name};`);
  }
  markdown.push(`  end`);
}
markdown.push('```');
await writeFile(new URL('../engine/sources.md', import.meta.url), markdown.join('\n'), 'utf8')
