import baseConfig from '../eslint.config.mjs';
import globals from 'globals';

export default [
  ...baseConfig,
  {
    rules: {
      'unicorn/prevent-abbreviations': [
        'error',
        {
          checkFilenames: false
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
    ignores: ['**/*.mjs', '**/*.spec.ts', 'tools/performances/index.js'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[regex]',
          message: 'Regular expressions are not allowed'
        },
        {
          selector: "NewExpression[callee.name='RegExp']",
          message: 'Regular expressions are not allowed'
        },
        {
          selector: "CallExpression[callee.name='setTimeout']",
          message: 'setTimeout calls are not allowed'
        },
        {
          selector: "CallExpression[callee.name='setInterval']",
          message: 'setInterval calls are not allowed'
        }
      ]
    }
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ['tools/performances/index.js'],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  }
];
