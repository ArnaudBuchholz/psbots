import base from './eslint.base.mjs';
import globals from 'globals';

export default [
  ...base,
  {
    files: ['tools/*.mjs', 'eslint.base.mjs'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];
