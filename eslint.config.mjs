import base from './eslint.base.mjs';
import globals from 'globals';

export default [
  ...base,
  {
    files: ['tools/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];
