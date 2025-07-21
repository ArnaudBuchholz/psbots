/* eslint-env node */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;

let lastId = 0;
const sources = {};
const exportedFunctions = {};

const addExportedFunction = (functionDefinition) => {
  const { name, exported } = functionDefinition;
  if (!exported) {
    return;
  }
  functionDefinition.externalCalls = 0;
  const existingFunction = exportedFunctions[name];
  if (existingFunction) {
    throw new Error(`❌ duplicate exported function name:
${name} from ${functionDefinition.module}
${existingFunction.name} from ${existingFunction.module}`);
  }
  exportedFunctions[name] = functionDefinition;
}

const searchForCalls = (scope, node, existingCalls = {}) => {
  const calls = existingCalls;
  scope.traverse(node, {
    enter(path) {
      const { node } = path;
      if (node.type === 'CallExpression' && node.callee?.name) {
        const { name } = node.callee;
        if (name === 'Symbol') {
          return; // ignore
        }
        if (name in calls) {
          ++calls[name];
        } else {
          calls[name] = 1;
        }
        path.skip();
      }
    }
  });
  return calls;
};

const source = async (path) => {
  const sourceName = path.pathname.split('engine/src/')[1];
  const content = await readFile(path, 'utf8');
  const ast = parse(content, { sourceType: 'module', plugins: ['typescript'] });
  await writeFile(new URL(path.toString().replace('.ts', '.ast')), JSON.stringify(ast, null, 2), { encoding: 'utf8' });
  const sourceDefinition = {
    id: ++lastId,
    name: sourceName,
    imports: [],
    calls: {},
    classes: [],
    functions: []
  };
  traverse(ast, {
    enter(path) {
      const { node, parent, scope } = path;
      if (node.type === 'ImportDeclaration' && node.importKind === 'value') {
        for (const specifier of node.specifiers) {
          sourceDefinition.imports.push({
            name: specifier.imported.name,
            from: node.source.value
          });
        }
      }
      if (node.type === 'ClassDeclaration') {
        const classDefinition = {
          name: node.id.name,
          extends: node.superClass?.name,
          exported: parent.type === 'ExportNamedDeclaration',
          methods: []
        };
        scope.traverse(node, {
          enter({ scope, node }) {
            if (node.type === 'ClassMethod') {
              const definition = {
                id: ++lastId,
                module: sourceName,
                name: node.key.name,
                calls: searchForCalls(scope, node)
              };
              if (['get', 'set'].includes(node.kind)) {
                definition.kind = node.kind;
              }
              classDefinition.methods.push(definition);
            }
          }
        });
        sourceDefinition.classes.push(classDefinition);
        path.skip();
      }
      if (node.type === 'FunctionDeclaration') {
        const name = node.id.name;
        const exported = parent.type === 'ExportNamedDeclaration';
        const functionDefinition = {
          id: ++lastId,
          module: sourceName,
          name,
          exported,
          calls: searchForCalls(scope, node)
        };
        sourceDefinition.functions.push(functionDefinition);
        addExportedFunction(functionDefinition);
        path.skip();
      }
      if (node.type === 'VariableDeclaration') {
        const exported = path.parentPath?.node?.type === 'ExportNamedDeclaration';
        const declaration = node.declarations[0];
        const name = declaration.id.name;
        if (declaration.init.type === 'CallExpression' && declaration.init.callee.name === 'buildFunctionOperator') {
          const functionDefinition = {
            id: ++lastId,
            module: sourceName,
            name,
            exported,
            calls: {}
          };
          sourceDefinition.functions.push(functionDefinition);
          addExportedFunction(functionDefinition);
          sourceDefinition.calls.buildFunctionOperator = 1;
        }
      }
      if (node.type === 'ArrowFunctionExpression') {
        const functionDefinition = {
          id: ++lastId,
          module: sourceName,
          name: parent.id?.name ?? '(anonymous arrow)',
          exported: path.parentPath?.parentPath?.parentPath?.node?.type === 'ExportNamedDeclaration',
          calls: searchForCalls(scope, node)
        };
        addExportedFunction(functionDefinition);
        sourceDefinition.functions.push(functionDefinition);
        path.skip();
      }
      if (node.type === 'ExpressionStatement') {
        sourceDefinition.calls = searchForCalls(scope, node, sourceDefinition.calls);
      }
    }
  });
  sources[sourceName] = sourceDefinition;
};

const lookup = async (path) => {
  const names = await readdir(path);
  names.sort((a, b) => a.localeCompare(b));
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

const moduleNames = Object.keys(sources).sort((a, b) => a.localeCompare(b));

for(const moduleName of moduleNames) {
  const sourceDefinition = sources[moduleName];
  const increaseMember = (object, member, count) => {
    if (member in object) {
      object[member] += count;
    } else {
      object[member] = count;
    }
  }
  const increaseCallsCount = (calls) => {
    for (const [name, count] of Object.entries(calls)) {
      const exportedFunction = exportedFunctions[name];
      if (exportedFunction) {
        const member = exportedFunction.module === sourceDefinition.name ? 'internal' : 'external';
        increaseMember(exportedFunction, `${member}Calls`, count);
      } else {
        const internalFunction = sourceDefinition.functions.find(({ name: funcName }) => funcName === name);
        if (internalFunction) {
          increaseMember(internalFunction, 'internalCalls', count);
        }
      }
    }
  }
  increaseCallsCount(sourceDefinition.calls);
  for (const { methods } of sourceDefinition.classes) {
    for (const { calls } of methods) {
      increaseCallsCount(calls);
    }
  }
  for (const { calls } of sourceDefinition.functions) {
    increaseCallsCount(calls);
  }
}

await writeFile(new URL('../engine/exported.json', import.meta.url), JSON.stringify(exportedFunctions, undefined, 2), 'utf8');
const structuredSources = {};
for (const moduleName of moduleNames) {
  const names = moduleName.split('/');
  let placeholder = structuredSources;
  for (const part of names) {
    placeholder = (placeholder[part] ??= {});
  }
  Object.assign(placeholder, sources[moduleName]);
  delete placeholder.name;
}
await writeFile(new URL('../engine/sources.json', import.meta.url), JSON.stringify(structuredSources, (key, value) => {
  if (['module', 'id', 'imports'].includes(key)) {
    return undefined;
  }
  if (Array.isArray(value) && !value.length) {
    return undefined;
  }
  if (value && typeof value === 'object' && !Object.keys(value).length) {
    return undefined;
  }
  return value;
}, 2), 'utf8');

const exportedPrefix = '📦&nbsp;';
const markdown = [
  '# Sources analysis',
  '',
  '## Sources',
  '',
];

const funcId = (name) => {
  const exportedFunction = exportedFunctions[name];
  if (exportedFunction) {
    return `export_${exportedFunction.id}("${name}")`;
  }
  return name;
};

for(const moduleName of moduleNames) {
  const definition = sources[moduleName];
  const { calls, classes, functions } = definition;
  if (Object.keys(calls).length === 0 && classes.length === 0 && functions.length === 0) {
    // Nothing to show
    continue;
  }
  markdown.push(`### ${moduleName}`, '');
  if (Object.keys(calls).length !== 0 || classes.length || functions.filter(({ calls, exported }) => exported || Object.keys(calls).length !== 0).length !== 0) {
    markdown.push(
      '```mermaid',
      'graph'
    );
    const externalCalls = new Set();
    const checkForExternalCalls = (calls) => {
      for (const name of Object.keys(calls)) {
        const exportedFunction = exportedFunctions[name];
        if (exportedFunction && exportedFunction.module !== moduleName && !externalCalls.has(name)) {
          externalCalls.add(name);
          markdown.push(
            `  subgraph "${exportedFunction.module}"`,
            `    ${exportedFunction.name}("${exportedPrefix}${exportedFunction.name}");`,
            `  end`
          );
        }
      }
    }
    checkForExternalCalls(calls);
    for (const { calls } of functions) {
      checkForExternalCalls(calls);
    }
    for (const classDefinition of classes) {
      if (classDefinition.extends) {
        const classExtends = classDefinition.extends;
        for (const extendsModuleName of moduleNames) {
          const extendsModule = sources[extendsModuleName];
          if (extendsModule && extendsModule.classes.some(({ name }) => name === classExtends)) {
            markdown.push(
              `  subgraph "${extendsModuleName}"`,
              `    ${classExtends}("${exportedPrefix}_class_&nbsp;${classExtends}");`,
              `  end`
            );
          }
        }
      }
      for (const { calls } of classDefinition.methods) {
        checkForExternalCalls(calls);
      }
    }

    markdown.push(
      `  subgraph "${moduleName}"`
    );
    for (const name of Object.keys(calls)) {
      markdown.push(`    main_${definition.id}("main") --> ${name};`);
    }
    for (const { name, id, exported, calls } of functions) {
      if (exported) {
        markdown.push(`    ${name}("${exportedPrefix}${name}");`);
      }
      for (const calledName of Object.keys(calls)) {
        if (name === '(anonymous arrow)') {
          markdown.push(`    anon${id}("(anonymous function)") --> ${calledName};`);
        } else {
          markdown.push(`    ${name} --> ${calledName};`);
        }
      }
    }
    for (const { name: className, extends: classExtends, exported, methods } of classes) {
      markdown.push(`    ${className}("${exported ? exportedPrefix : ''}_class_&nbsp;${className}")`);
      if (classExtends) {
        markdown.push(`    ${className} --> ${classExtends};`);
      }
      for (const { name: methodName, calls } of methods) {
        if (Object.keys(calls).length) {
          markdown.push(`    ${className} --- ${methodName === 'constructor' ? 'ctor("' + className + '::constructor")' : methodName + '("' + className + '::' + methodName + '")' };`);
          for (const calledName of Object.keys(calls)) {
            markdown.push(`    ${methodName === 'constructor' ? 'ctor' : methodName} --> ${calledName};`);
          }
        }
      }
    }
    markdown.push(
      '  end',
      '```',
      ''
    );
  }

  // for (const [name, { count }] of definition.calls.entries()) {
  //   console.log(`\t→ ${name}${count > 1 ? ' (' + count + ')' : ''}`);
  //   markdown.push(`\n→ \`${name}\`${count > 1 ? ' (' + count + ')' : ''}`);
  // }
  // for (const { name: className, exported, methods } of definition.classes) {
  //   console.log(`\t${exported ? red + 'export' + white + ' ' : ''}class ${className}`);
  //   markdown.push(`\n${exported ? '<span style="color: red;"><code>export</code></span> ' : ''}\`class ${className}\``);
  //   for (const { name: methodName, calls } of methods) {
  //     if (calls.size) {
  //       console.log(`\t${className}::${methodName}`);
  //       markdown.push(`\n\`${className}::${methodName}\``);
  //       for (const [name, { count }] of calls.entries()) {
  //         console.log(`\t  → ${name}${count > 1 ? ' (' + count + ')' : ''}`);
  //         markdown.push(`\n  → \`${name}\`${count > 1 ? ' (' + count + ')' : ''}`);
  //       }
  //     }
  //   }
  // }
  // for (const { name: functionName, exported, calls, externalCalls } of definition.functions) {
  //   if (exported || calls.size) {
      // console.log(`\t${exported ? red + 'export' + white + ' ' : ''}function ${functionName} ${ externalCalls ? '(' + externalCalls + ')' : '' }`);
      // markdown.push(`\n${exported ? '<span style="color: red;"><code>export</code></span> ' : ''}\`function ${functionName} ${ externalCalls ? '(' + externalCalls + ')' : '' }\``);
      // for (const [name, { count }] of calls.entries()) {
      //     console.log(`\t  → ${name}${count > 1 ? ' (' + count + ')' : ''}`);
      //     markdown.push(`\n  → \`${name}\`${count > 1 ? ' (' + count + ')' : ''}`);
      // }
  //   }
  // }
  const hasExportedFunctions = definition.functions.some(({ exported }) => exported);
  if (hasExportedFunctions) {
    for (const { name: functionName, exported, externalCalls } of definition.functions) {
      if (exported && !externalCalls && moduleName.startsWith('core/')) {
        markdown.push(`* ⚠️ \`${functionName}\` is exported but not used _(and not part of API or SDK)_`, '');
      }
    }
  }
}

await writeFile(new URL('../engine/sources.md', import.meta.url), markdown.join('\n'), 'utf8')

process.exit(0);

markdown.push(
  '## Grap',
  '```mermaid',
  'graph LR'
);
let index = 0;
console.log('names: ', moduleNames.length);
for(const name of moduleNames) {
  const definition = sources[name];
  if (definition.calls.size === 0 && definition.functions.length === 0 && definition.classes.length === 0) {
    // No dependency to show, ignore
    continue;
  }

  markdown.push(`  subgraph ${name}`);
  for (const [name, { count }] of definition.calls.entries()) {
    markdown.push(`    main_${definition.id}("main") --> ${funcId(name)};`);
  }
  for (const { name: functionName, exported, calls, externalCalls, id } of definition.functions) {
    const name = exported ? `export_${id}` : `func_${id}`;
    markdown.push(`    ${name}("${functionName}");`);
    for (const [calledName, { count }] of calls.entries()) {
      markdown.push(`    ${name} --> ${funcId(calledName)};`);
    }
  }
  markdown.push(`  end`);
}
markdown.push('```');
await writeFile(new URL('../engine/sources.md', import.meta.url), markdown.join('\n'), 'utf8')
