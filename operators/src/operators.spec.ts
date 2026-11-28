import { describe, it, expect } from 'vitest';
import { parse } from '@psbots/tokenizer';
import { readdir } from 'node:fs/promises';
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const files = await readdir(__dirname);
const operators = files.filter(name => !name.endsWith('.d.ts') || !name.endsWith('.spec.ts'));

console.log(operators);
