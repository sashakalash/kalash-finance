import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.vercel/**',
      '**/coverage/**',
    ],
  },

  js.configs.recommended,

  // TypeScript + React (TS and TSX)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true, // @typescript-eslint v8 — auto-discovers tsconfig
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // --- React core ---
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',          // not needed in React 17+
      'react/prop-types': 'off',                   // TypeScript handles this
      'react/display-name': 'warn',
      'react/self-closing-comp': 'error',
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-no-useless-fragment': 'error',
      'react/no-array-index-key': 'warn',

      // --- React Hooks ---
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // --- Accessibility ---
      ...jsxA11y.configs.recommended.rules,

      // --- General JS ---
      'quotes': ['error', 'single'],
      'eqeqeq': ['error', 'smart'],
      'guard-for-in': 'error',
      'no-bitwise': 'error',
      'no-caller': 'error',
      'no-cond-assign': 'error',
      'no-debugger': 'error',
      'no-eval': 'error',
      'no-new-wrappers': 'error',
      'no-throw-literal': 'error',
      'no-undef-init': 'error',
      'no-unsafe-finally': 'error',
      'no-unused-labels': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'one-var': ['error', 'never'],
      'prefer-const': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'radix': 'error',
      'use-isnan': 'error',
      'constructor-super': 'error',
      'complexity': 'off',
      'max-classes-per-file': 'off',
      'sort-keys': 'off',

      // Disabled — TypeScript handles these
      'no-undef': 'off',
      'no-redeclare': 'off',
      'no-array-constructor': 'off',
      'no-unused-vars': 'off',
      'no-extra-semi': 'off',

      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-restricted-syntax': ['error', {
        selector: 'CallExpression[callee.object.name="console"][callee.property.name=/^(debug|info|time|timeEnd|trace)$/]',
        message: 'Unexpected property on console object was called',
      }],

      // --- TypeScript (v8 compatible) ---
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-array-constructor': 'error',
      '@typescript-eslint/no-extra-non-null-assertion': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/no-this-alias': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/adjacent-overload-signatures': 'error',
      '@typescript-eslint/consistent-type-assertions': 'error',
      '@typescript-eslint/dot-notation': 'error',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': ['error', { ignoreParameters: true }],
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-function-type': 'error',
      '@typescript-eslint/prefer-namespace-keyword': 'error',
      '@typescript-eslint/triple-slash-reference': ['error', { path: 'always', types: 'prefer-import', lib: 'always' }],
      '@typescript-eslint/unified-signatures': 'error',
      '@typescript-eslint/no-shadow': ['error', { hoist: 'all' }],

      // v8: ban-types was split into these three rules
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/no-wrapper-object-types': 'error',
      '@typescript-eslint/no-restricted-types': ['error', {
        types: {
          Boolean: { message: 'Use `boolean` instead.', fixWith: 'boolean' },
          Number: { message: 'Use `number` instead.', fixWith: 'number' },
          String: { message: 'Use `string` instead.', fixWith: 'string' },
          Symbol: { message: 'Use `symbol` instead.', fixWith: 'symbol' },
          BigInt: { message: 'Use `bigint` instead.', fixWith: 'bigint' },
        },
      }],

      // Naming conventions for React/TypeScript
      '@typescript-eslint/naming-convention': [
        'error',
        // Functions: camelCase (hooks) or PascalCase (components)
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        // Variables: camelCase, PascalCase (component refs), or UPPER_CASE (constants)
        { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'] },
        // Types and interfaces: PascalCase, no 'I' prefix enforced
        { selector: 'typeLike', format: ['PascalCase'] },
        // Enum members: PascalCase or UPPER_CASE
        { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
        // Parameters: camelCase (allow leading _ for unused)
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
      ],

      // Explicit return types on module boundaries (relax for components/hooks)
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },

  // Non-React TS files (lib, config, scripts)
  {
    files: ['**/*.ts'],
    ignores: ['**/*.tsx'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/member-ordering': ['error', {
        default: ['static-field', 'instance-field', 'static-method', 'instance-method'],
      }],
    },
  },
];
