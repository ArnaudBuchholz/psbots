/* eslint-env node */
import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
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

const extractInlinedCycleFunction = async (name) => {
  const source = await readFile(`dist/perf/core/state/${name}.js`, 'utf8');
  const ast = parse(source, { sourceType: 'module' });
  let functions = {};
  let functionDetails;
  traverse(ast, {
    enter(path) {
      const { node } = path;
      cleanAstNode(node);
      if (node.type === 'FunctionDeclaration') {
        functionDetails = {
          name: node.id.name,
          body: node.body,
          exported: path.parentPath.node.type === 'ExportNamedDeclaration',
          inlinePlaceholders: {}
        };
        functions[node.id.name] = functionDetails;
      }
      if (
        node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        node.callee.property.name === 'call'
      ) {
        const name = node.callee.object.name;
        functionDetails.inlinePlaceholders[name] ??= [];
        functionDetails.inlinePlaceholders[name].push(path);
      }
      if (node.type === 'ReturnStatement') {
        functionDetails.usesReturn = true;
        if (node.argument !== null) {
          functionDetails.returnsValue = true;
        }
      }
    },
    exit(path) {
      const { node } = path;
      if (node.type === 'FunctionDeclaration') {
        functionDetails = null;
      }
    }
  });
  const failed = () => {
    throw new Error(`Not able to find ${name}Cycle in dist/perf/core/state/${name}.js: ${Object.keys(functions)}`);
  };
  return functions[`${name}Cycle`] ?? failed();
};

const blockCycle = await extractInlinedCycleFunction('block');
const callCycle = await extractInlinedCycleFunction('call');
const operatorCycle = await extractInlinedCycleFunction('operator');
console.log(blockCycle, callCycle, operatorCycle);
