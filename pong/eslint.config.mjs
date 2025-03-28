import base from '../eslint.base.mjs';
import globals from 'globals';

export default [
  ...base,
  {
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  }
];
