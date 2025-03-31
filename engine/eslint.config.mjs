import baseConfig from '../eslint.config.mjs';
import globals from 'globals';

export default [
  ...baseConfig,
  {
    rules: {
      'unicorn/prevent-abbreviations': [
        'error',
        {
          'checkFilenames': false
        }
      ]
    }
  },
  {
    // testIsFunction is a test wrapper
    files: ['src/sdk/checks/isObject.spec.ts'],
    rules: {
      'sonarjs/no-empty-test-file': 'off'
    }
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];
