import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['**/dist/**', '**/coverage/**', '**/node_modules/**', 'data/**']),
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
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },
  {
    files: ['**/*.{ts,vue}'],
    extends: [tseslint.configs.recommended],
  },
  {
    files: ['**/*.vue'],
    extends: [vue.configs['flat/recommended']],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  {
    files: ['src/**/*.{js,ts,vue}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['server/**/*.{js,ts}', '*.{js,mjs,cjs,ts}'],
    languageOptions: { globals: globals.node },
  },
]);
