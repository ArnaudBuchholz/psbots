/* eslint-env node */
import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';
import { generate } from '@babel/generator';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;

const removeImportWhileTraversing = (traversePath, importedName) => {
  const { node } = traversePath;
  if (node.type === 'ImportDeclaration') {
    // Assuming name has not been changed and from is not relevant
    const { specifiers } = node;
    const assertIndex = specifiers.findIndex((specifier) => specifier.imported.name === importedName);
    if (assertIndex !== -1) {
      if (specifiers.length === 1) {
        traversePath.remove();
      } else {
        specifiers.splice(assertIndex, 1);
      }
    }
    traversePath.skip();
    return true;
  }
};

let toIntegerValueAstTemplate;
const buildToIntegerValueAstTemplate = async () => {
  if (toIntegerValueAstTemplate) {
    return;
  }
  const source = await readFile('dist/sdk/toValue.js', 'utf8');
  const ast = parse(source, { sourceType: 'module' });
  let base;
  let placeholderForValue;
  traverse(ast, {
    enter(path) {
      const { node } = path;
      delete node.loc;
      delete node.start;
      delete node.end;
      delete node.extra;
      if (node.type === 'FunctionDeclaration' && node.id.name === 'toIntegerValue') {
        const returnStatement = node.body.body.find((node) => node.type === 'ReturnStatement');
        base = returnStatement.argument;
      }
      if (node.type === 'ObjectProperty' && node.key.name === 'integer') {
        placeholderForValue = node;
      }
    }
  });
  placeholderForValue.shorthand = false;
  toIntegerValueAstTemplate = (integerValue) => {
    placeholderForValue.value = integerValue;
    return structuredClone(base);
  };
};

const inlineToIntegerValue = (ast) => {
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
        if (removableCount === totalCount) {
          removeImportWhileTraversing(path, 'toIntegerValue');
        }
        if (node.type === 'VariableDeclaration' && path.toString().includes('toIntegerValue')) {
          const [, variableName] = path.toString().match(/\b(\w+)\s+=\s+toIntegerValue/);
          if (path.getNextSibling().toString().startsWith(`assert(${variableName}`)) {
            const value = node.declarations[0].init.arguments[0];
            node.declarations[0].init = toIntegerValueAstTemplate(value);
            path.skip();
          }
        }
      }
    });
  }
};

const removeAsserts = (ast) => {
  traverse(ast, {
    enter(path) {
      if (removeImportWhileTraversing(path, 'assert')) {
        return;
      }
      const { node } = path;
      if (node.type === 'ExpressionStatement' && node.expression?.callee?.name === 'assert') {
        path.remove();
      }
    }
  });
};

const functionStatements = new Set(['FunctionDeclaration', 'ArrowFunctionExpression', 'ObjectMethod', 'ClassMethod']);
const breakableStatements = new Set([
  'WhileStatement',
  'DoWhileStatement',
  'ForStatement',
  'ForOfStatement',
  'ForInStatement',
  'SwitchStatement'
]);

let uniqueId = 0;
const analyzedForInlining = {};

const identifyFunctionWhileTraversing = (traversePath) => {
  const { node, parent } = traversePath;
  if (node.type === 'FunctionDeclaration') {
    return {
      name: node.id.name,
      exported: traversePath.parentPath.node.type === 'ExportNamedDeclaration'
    };
  }
  if (node.type === 'ObjectMethod') {
    return {
      name: node.key.name
    };
  }
  if (node.type === 'ArrowFunctionExpression') {
    return {
      name: parent.id?.name ?? '(anonymous arrow)',
      exported: traversePath.parentPath?.parentPath?.parentPath?.node?.type === 'ExportNamedDeclaration'
    };
  }
  if (node.type === 'ClassMethod') {
    return {
      name: `::${node.key.name}`
    };
  }
};

const identifyInlinableFunctionCall = (traversePath) => {
  const { node } = traversePath;
  if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && traversePath.parentPath.node.type === 'ExpressionStatement') {
    return node.callee.name;
  }
}

const analyzeForInlining = (itemPath, ast) => {
  const functions = {};
  const functionsStack = [];
  const importedIdentifiers = {};
  let currentFunction;
  let inBreakableStatement = 0;

  traverse(ast, {
    // eslint-disable-next-line sonarjs/cognitive-complexity -- will be improved later
    enter(path) {
      const { node } = path;
      if (node.type === 'ImportDeclaration') {
        const path = join(dirname(itemPath), node.source.value).replaceAll('\\', '/');
        for (const declaration of node.specifiers) {
          assert.strictEqual(declaration.imported.name, declaration.local.name);
          importedIdentifiers[declaration.imported.name] = path;
        }
      }
      if (node.type === 'Identifier') {
        const importedFrom = importedIdentifiers[node.name];
        if (importedFrom && currentFunction) {
          currentFunction.importedIdentifiers ??= {};
          currentFunction.importedIdentifiers[node.name] = importedFrom;
        }
      }

      const functionInfos = identifyFunctionWhileTraversing(path);
      if (functionInfos) {
        currentFunction = {
          id: ++uniqueId,
          line: node.loc.start.line,
          exported: false,
          ...functionInfos
        };
        functions[currentFunction.name] = currentFunction;
        functionsStack.push(currentFunction);
      }

      if (breakableStatements.has(node.type)) {
        ++inBreakableStatement;
      }
      if (node.type === 'ReturnStatement') {
        if (inBreakableStatement) {
          currentFunction.needBreakLabel = true;
        }
        try {
          currentFunction.useReturn = true;
          if (node.argument !== null) {
            currentFunction.returnValue = true;
          }
        } catch (error) {
          console.error(itemPath, uniquePathId(path));
          throw error;
        }
      }

      if (currentFunction) {
        const name = identifyInlinableFunctionCall(path);
        if (name) {
          if (!currentFunction.inlinePlaceholders) {
            currentFunction.inlinePlaceholders = {};
          }
          currentFunction.inlinePlaceholders[name] ??= [];
          currentFunction.inlinePlaceholders[name].push({
            id: ++uniqueId,
            line: node.loc.start.line
          });
        }
      }
    },
    exit(path) {
      const { node } = path;
      if (functionStatements.has(node.type)) {
        functionsStack.pop();
        currentFunction = functionsStack.length > 0 ? functionsStack.at(-1) : null;
      }
      if (breakableStatements.has(node.type)) {
        --inBreakableStatement;
      }
    }
  });
  if (Object.keys(functions).length > 0) {
    analyzedForInlining[itemPath] = functions;
  }
};

const optimize = async (basePath, path = basePath) => {
  if (/\bperf\b/.test(path)) {
    return;
  }
  const names = await readdir(path);
  const perfPath = path.replace(/\bdist\b/, 'dist/perf');
  await mkdir(perfPath, { recursive: true });

  await buildToIntegerValueAstTemplate();

  for (const name of names) {
    const itemPath = join(path, name).replaceAll('\\', '/');
    if (name.endsWith('.js')) {
      const source = await readFile(itemPath, 'utf8');
      const ast = parse(source, { sourceType: 'module' });
      await writeFile(join(perfPath, name.replace('.js', '.ast')), JSON.stringify(ast, null, 2), { encoding: 'utf8' });

      inlineToIntegerValue(ast);
      removeAsserts(ast);
      analyzeForInlining(itemPath, ast);

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
};
await optimize('dist');

await writeFile('dist/perf/analyzed.json', JSON.stringify(analyzedForInlining, null, 2), 'utf8');

process.exit(0);

const perf = (path) => path.replace('dist/', 'dist/perf/');

const inline = async (itemPath, targetFunctionName, functionNameToInline) => {
  let functionToInline;
  let sourceOfFunctionToInline;
  for (const [sourcePath, functions] of Object.entries(analyzedForInlining)) {
    if (functions[functionNameToInline]) {
      functionToInline = functions[functionNameToInline];
      sourceOfFunctionToInline = sourcePath;
      break;
    }
  }
  const sourceAst = parse(await readFile(perf(sourceOfFunctionToInline), 'utf8'), { sourceType: 'module' });
  let sourceFunctionAst;
  traverse(sourceAst, {
    enter(path) {
      if (uniquePathId(path) === functionToInline.pathId) {
        sourceFunctionAst = path.node;
        path.stop();
      }
    }
  });

  let imports;
  if (functionToInline.importedIdentifiers) {
    imports = {};
    for (const [name, path] of Object.entries(functionToInline.importedIdentifiers)) {
      const adjustedPath = relative(dirname(itemPath), path).replaceAll('\\', '/');
      if (!imports[adjustedPath]) {
        imports[adjustedPath] = [];
      }
      imports[adjustedPath].push(name);
    }
  }

  const targetAst = parse(await readFile(perf(itemPath), 'utf8'), { sourceType: 'module' });
  const targetFunction = analyzedForInlining[itemPath][targetFunctionName];
  const inlinePlaceholders = targetFunction.inlinePlaceholders[functionNameToInline];
  let pathForRemainingImports;
  traverse(targetAst, {
    // eslint-disable-next-line sonarjs/cognitive-complexity -- will be improved later
    enter(path) {
      const { node } = path;

      if (removeImportWhileTraversing(path, functionNameToInline)) {
        return;
      }
      if (node.type === 'ImportDeclaration') {
        const importPath = node.source.value;
        if (imports[importPath]) {
          for (const name of imports[importPath]) {
            const alreadyImported = node.specifiers.some((declaration) => declaration.imported.name === name);
            if (!alreadyImported) {
              node.specifiers.push({
                type: 'ImportSpecifier',
                imported: {
                  type: 'Identifier',
                  name
                },
                local: {
                  type: 'Identifier',
                  name
                }
              });
            }
          }
          delete imports[importPath];
        }
        return path.skip();
      } else if (
        Object.keys(imports).length > 0 &&
        !pathForRemainingImports &&
        !['Program', 'body'].includes(node.type)
      ) {
        pathForRemainingImports = path;
      }

      const inlinePlaceholder = inlinePlaceholders.find(({ pathId }) => uniquePathId(path) === pathId);
      if (inlinePlaceholder) {
        const blockStatement = path.parentPath.parentPath.node;
        assert.strictEqual(blockStatement.type, 'BlockStatement');
        const key = path.parentPath.key;
        assert.strictEqual(typeof key, 'number');
        let inlineAst = [];
        for (const [index] of Object.entries(sourceFunctionAst.params)) {
          const ast = parse(`const __${functionNameToInline}_arg${index} = '';`, { sourceType: 'module' }).program
            .body[0];
          ast.declarations[0].init = path.node.arguments[index];
          inlineAst.push(ast);
        }
        const inlineStatement = {
          type: 'BlockStatement',
          body: []
        };
        inlineAst.push(inlineStatement);
        for (const [index, parameter] of Object.entries(sourceFunctionAst.params)) {
          const ast = parse(`let ${parameter.name} = __${functionNameToInline}_arg${index};`, { sourceType: 'module' })
            .program.body[0];
          inlineStatement.body.push(ast);
        }
        inlineStatement.body.push(...sourceFunctionAst.body.body);
        blockStatement.body.splice(key, 1, ...inlineAst);
      }
    },
    exit(path) {
      const { node } = path;
      if (node.type === 'Program' && pathForRemainingImports) {
        for (const [importPath, names] of Object.entries(imports)) {
          const ast = parse(`import { ${names.join(', ')} } from '${importPath}';`, { sourceType: 'module' }).program
            .body[0];
          pathForRemainingImports.insertBefore(ast);
        }
      }
    }
  });

  await writeFile(perf(itemPath), generate(targetAst).code, { encoding: 'utf8' });
};

await inline('dist/core/state/State.js', '::cycle', 'operatorPop');
// await inline('dist/core/state/State.js', '::cycle', 'blockCycle');
// await inline('dist/core/state/State.js', '::cycle', 'callCycle');
