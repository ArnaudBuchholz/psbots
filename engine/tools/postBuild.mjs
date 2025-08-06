/* eslint-env node */
import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';
import { generate } from '@babel/generator';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;

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

const cleanAstNode = (node) => {
  delete node.loc;
  delete node.start;
  delete node.end;
  delete node.extra;
};

let toIntegerValueAST;
const buildToIntegerValueAST = async () => {
  if (toIntegerValueAST) {
    return;
  }
  const source = await readFile('dist/sdk/toValue.js', 'utf8');
  const ast = parse(source, { sourceType: 'module' });
  let base;
  let placeholderForValue;
  traverse(ast, {
    enter(path) {
      const { node } = path;
      cleanAstNode(node);
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
  toIntegerValueAST = (integerValue) => {
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
        if (removableCount === totalCount && removeImport(path, 'toIntegerValue')) {
          path.skip();
          return;
        }
        if (node.type === 'VariableDeclaration' && path.toString().includes('toIntegerValue')) {
          const [, variableName] = path.toString().match(/\b(\w+)\s+=\s+toIntegerValue/);
          if (path.getNextSibling().toString().startsWith(`assert(${variableName}`)) {
            const value = node.declarations[0].init.arguments[0];
            node.declarations[0].init = toIntegerValueAST(value);
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
};

let lastId = 0;
const analyzed = {};

const uniquePathId = (path) => {
  let currentPath = path;
  const pathParts = [];
  while (currentPath) {
    const key = currentPath.key;
    // path.inList is true if the container is an array
    if (currentPath.inList) {
      pathParts.unshift(`[${key}]`);
    } else if (currentPath.parentPath) {
      pathParts.unshift(`.${key}`);
    } else {
      pathParts.unshift(key);
    }
    currentPath = currentPath.parentPath;
  }
  return pathParts.join('');
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

const analyzeForInlining = (itemPath, ast) => {
  const functions = {};
  const functionsStack = [];
  let functionDetails;
  let inBreakableStatement = 0;
  traverse(ast, {
    // eslint-disable-next-line sonarjs/cognitive-complexity -- will be improved later
    enter(path) {
      const { node, parent } = path;
      if (node.type === 'FunctionDeclaration') {
        functionDetails = {
          id: ++lastId,
          pathId: uniquePathId(path),
          name: node.id.name,
          exported: path.parentPath.node.type === 'ExportNamedDeclaration'
        };
        functions[functionDetails.name] = functionDetails;
        functionsStack.push(functionDetails);
      }
      if (node.type === 'ObjectMethod') {
        functionDetails = {
          id: ++lastId,
          pathId: uniquePathId(path),
          name: node.key.name,
          exported: false
        };
        functions[functionDetails.name] = functionDetails;
        functionsStack.push(functionDetails);
      }
      if (node.type === 'ArrowFunctionExpression') {
        functionDetails = {
          id: ++lastId,
          pathId: uniquePathId(path),
          name: parent.id?.name ?? '(anonymous arrow)',
          exported: path.parentPath?.parentPath?.parentPath?.node?.type === 'ExportNamedDeclaration'
        };
        functions[functionDetails.name] = functionDetails;
        functionsStack.push(functionDetails);
      }
      if (node.type === 'ClassMethod') {
        functionDetails = {
          id: ++lastId,
          pathId: uniquePathId(path),
          name: `::${node.key.name}`,
          exported: false // Not relevant for being inlined
        };
        functions[functionDetails.name] = functionDetails;
        functionsStack.push(functionDetails);
      }
      if (breakableStatements.has(node.type)) {
        ++inBreakableStatement;
      }
      if (node.type === 'ReturnStatement') {
        if (inBreakableStatement) {
          functionDetails.needBreakLabel = true;
        }
        try {
          functionDetails.useReturn = true;
          if (node.argument !== null) {
            functionDetails.returnValue = true;
          }
        } catch (error) {
          console.error(itemPath, uniquePathId(path));
          throw error;
        }
      }
      if (functionDetails && node.type === 'CallExpression' && node.callee.type === 'Identifier') {
        const { name } = node.callee;
        let inlineIsPossible = false;
        if (path.parentPath.node.type === 'ExpressionStatement') {
          inlineIsPossible = true;
        }
        if (inlineIsPossible) {
          if (!functionDetails.inlinePlaceholders) {
            functionDetails.inlinePlaceholders = {};
          }
          functionDetails.inlinePlaceholders[name] ??= [];
          functionDetails.inlinePlaceholders[name].push({
            id: ++lastId,
            pathId: uniquePathId(path)
          });
        }
      }
    },
    exit(path) {
      const { node } = path;
      if (functionStatements.has(node.type)) {
        functionsStack.pop();
        functionDetails = functionsStack.length > 0 ? functionsStack.at(-1) : null;
      }
      if (breakableStatements.has(node.type)) {
        --inBreakableStatement;
      }
    }
  });
  if (Object.keys(functions).length > 0) {
    analyzed[itemPath.replaceAll('\\', '/')] = functions;
  }
};

const optimize = async (basePath, path = basePath) => {
  if (/\bperf\b/.test(path)) {
    return;
  }
  const names = await readdir(path);
  const perfPath = path.replace(/\bdist\b/, 'dist/perf');
  await mkdir(perfPath, { recursive: true });

  await buildToIntegerValueAST();

  for (const name of names) {
    const itemPath = join(path, name);
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

await writeFile('dist/perf/analyzed.json', JSON.stringify(analyzed, null, 2), 'utf8');

const inline = async (itemPath, targetFunctionName, functionNameToInline) => {
  const perf = (path) => path.replace('dist/', 'dist/perf/');

  let functionToInline;
  let sourceOfFunctionToInline;
  for (const [sourcePath, functions] of Object.entries(analyzed)) {
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
  
  const targetAst = parse(await readFile(perf(itemPath), 'utf8'), { sourceType: 'module' });
  const targetFunction = analyzed[itemPath][targetFunctionName];
  const inlinePlaceholders = targetFunction.inlinePlaceholders[functionNameToInline];
  traverse(targetAst, {
    enter(path) {
      const inlinePlaceholder = inlinePlaceholders.find(({ pathId }) => uniquePathId(path) === pathId);
      if (inlinePlaceholder) {
        const blockStatement = path.parentPath.parentPath.node;
        assert.strictEqual(blockStatement.type, 'BlockStatement');
        const key = path.parentPath.key;
        assert.strictEqual(typeof key, 'number');
        let inlineAst = [];
        for (const [index, param] of Object.entries(sourceFunctionAst.params)) {
          const ast = parse(`const __${functionNameToInline}_arg${index} = '';`).program.body[0];
          ast.declarations[0].init = path.node.arguments[index];
          inlineAst.push(ast);
        }
        const inlineStatement = {
          type: 'BlockStatement',
          body: []
        };
        inlineAst.push(inlineStatement);
        for (const [index, param] of Object.entries(sourceFunctionAst.params)) {
          const ast = parse(`let ${param.name} = __${functionNameToInline}_arg${index};`).program.body[0];
          inlineStatement.body.push(ast);
        }
        inlineStatement.body.push(...sourceFunctionAst.body.body);
        blockStatement.body.splice(key, 1, ...inlineAst);
      }
    }
  });

  await writeFile(perf(itemPath), generate(targetAst).code, { encoding: 'utf8' });
}

await inline ('dist/core/state/State.js', '::cycle', 'operatorPop');

