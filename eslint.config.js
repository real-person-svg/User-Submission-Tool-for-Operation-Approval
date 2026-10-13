import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    '**/dist/**',
    '**/coverage/**',
    '**/node_modules/**',
    'data/**',
  ]),
  {
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    extends: [
      js.configs.recommended,
      stylistic.configs.customize({
        indent: 2,
        quotes: 'single',
        semi: true,
        braceStyle: '1tbs',
        commaDangle: 'always-multiline',
        jsx: false,
      }),
    ],
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      '@stylistic/padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: [
            'const',
            'let',
            'var',
          ],
        },
        {
          blankLine: 'always',
          prev: [
            'const',
            'let',
            'var',
          ],
          next: '*',
        },
        {
          blankLine: 'any',
          prev: [
            'const',
            'let',
            'var',
          ],
          next: [
            'const',
            'let',
            'var',
          ],
        },
        {
          blankLine: 'always',
          prev: '*',
          next: [
            'function',
            'return',
            'if',
            'for',
            'try',
            'throw',
          ],
        },
        {
          blankLine: 'always',
          prev: ['function', 'block-like'],
          next: '*',
        },
      ],
      '@stylistic/max-len': [
        'error',
        {
          code: 100,
          ignoreUrls: true,
          ignoreRegExpLiterals: true,
        },
      ],
      '@stylistic/object-curly-newline': [
        'error',
        {
          ObjectExpression: {
            multiline: true,
            minProperties: 1,
            consistent: true,
          },
          ObjectPattern: {
            multiline: true,
            minProperties: 3,
            consistent: true,
          },
          ImportDeclaration: {
            multiline: true,
            minProperties: 4,
            consistent: true,
          },
          ExportDeclaration: {
            multiline: true,
            minProperties: 4,
            consistent: true,
          },
          TSTypeLiteral: 'always',
          TSInterfaceBody: 'always',
        },
      ],
      '@stylistic/object-property-newline': [
        'error',
        {
          allowAllPropertiesOnSameLine: false,
        },
      ],
      '@stylistic/function-call-argument-newline': ['error', 'consistent'],
      '@stylistic/array-bracket-newline': [
        'error',
        {
          multiline: true,
          minItems: 3,
        },
      ],
      '@stylistic/array-element-newline': [
        'error',
        {
          multiline: true,
          minItems: 3,
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,vue}'],
    extends: [tseslint.configs.recommended],
  },
  {
    files: ['**/*.vue'],
    extends: [vue.configs['flat/recommended']],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    files: ['src/**/*.{js,ts,vue}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['server/**/*.{js,ts}', '*.{js,mjs,cjs,ts}'],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
