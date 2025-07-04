import { readFile, writeFile } from 'node:fs/promises';
import { getOperatorDefinitionRegistry } from '../../engine/dist/index.js';
import { write } from 'node:fs';

const reference2 = JSON.parse(await readFile(new URL('../operators/ref2.json', import.meta.url), 'utf8'));

const registry = getOperatorDefinitionRegistry();

/*
|✅| implemented |
|✅∗| implemented but non compliant |
|⚙️| implemented in REPL |
|🚧| implementation to come |
|❓| status to be determined |
|❌| won't be implemented |
|📄| device API (not part of engine) |
*/

for (const [name, label] of Object.entries(reference2)) {
  const tags =
    {
      '⚙️': ['repl'],
      '❓': ['unknown'],
      '❌': ['not-implemented'],
      '📄': ['device']
    }[label] ?? [];
  const markdown = [
    '---',
    'tags:',
    '  - operator',
    ...tags.map((tag) => `  - ${tag}`),
    '---',
    `[Postscript Level 2 documentation](https://hepunx.rl.ac.uk/~adye/psdocs/ref/PSL2${name.charAt(0)}.html#${name})`
  ];
  const definition = registry[name];
  if (definition) {
    markdown.push(`🏷️ ${definition.labels.map((label) => '[[' + label + ']]').join(' ')}`, definition.description);
  }
  await writeFile(new URL(`../operators/${name}.md`, import.meta.url), markdown.join('\n'), 'utf8');
}

// extensions (operators defined in registry but not in ref2.json)
const extensions = Object.keys(registry).filter((name) => name.match(/\w+/) && !reference2.hasOwnProperty(name));
for (const name of extensions) {
  const markdown = ['---', 'tags:', '  - operator', '  - extension', '---'];
  const definition = registry[name];
  if (definition) {
    markdown.push(
      `🏷️ [[extension]] ${definition.labels.map((label) => '[[' + label + ']]').join(' ')}`,
      definition.description
    );
  }
  await writeFile(new URL(`../operators/${name}.md`, import.meta.url), markdown.join('\n'), 'utf8');
}
