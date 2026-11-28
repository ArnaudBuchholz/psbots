import { describe, it, expect } from 'vitest';
import type { OperatorDefinition, IState, Value } from '@psbots/types';
import { parse } from '@psbots/tokenizer';
import { readdir } from 'node:fs/promises';
import { dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const files = await readdir(__dirname);
const operatorFilenames = files.filter(name => !name.endsWith('.d.ts') && !name.endsWith('.spec.ts'));

const definitions: Record<string, OperatorDefinition> = {};
const implementations: Record<string, (state: IState, ...values: Value[]) => void> = {};

globalThis.operator = (definition: OperatorDefinition, implementation: (state: IState, ...values: Value[]) => void) => {
  const { name } = definition;
  definitions[name] = definition;
  implementations[name] = implementation;
};

for (const operatorFilename of operatorFilenames) {
  const name = basename(operatorFilename, '.ts');
  await import('./' + operatorFilename);
  const definition = definitions[name];
  describe(name, () => {
    it('ok', () => expect(definition).not.toBeUndefined());
  });
}

