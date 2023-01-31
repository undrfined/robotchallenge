module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb',
    'airbnb-typescript',
    'plugin:react-hooks/recommended',
  ],
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['tsconfig.json'],
  },
  plugins: [
    'react',
    'react-hooks',
  ],
  rules: {
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
      },
    ],
    'max-len': [
      'error',
      {
        code: 120,
        ignoreComments: true,
      },
    ],
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'max-classes-per-file': 'off',
    'array-bracket-newline': [
      2,
      'consistent',
    ],
    'no-console': 'error',
    semi: 'error',
    'react-hooks/exhaustive-deps': 'error',
    'no-implicit-coercion': 'error',
    'arrow-body-style': 'off',
    'no-else-return': 'off',
    'no-plusplus': 'off',
    'no-void': 'off',
    'no-continue': 'off',
    'default-case': 'off',
    'no-param-reassign': 'off',
    'no-prototype-builtins': 'off',
    'react/jsx-props-no-spreading': 'off',
    'no-await-in-loop': 'off',
    'no-nested-ternary': 'off',
    'function-paren-newline': [
      'error',
      'consistent',
    ],
    'prefer-destructuring': 'off',
    // Allow for...of. Edited from:
    // https://github.com/airbnb/javascript/blob/b4377fb03089dd7f08955242695860d47f9caab4/packages/eslint-config-airbnb-base/rules/style.js#L333
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. '
            + 'Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    'import/named': 'off',
    'import/no-webpack-loader-syntax': 'off',
    'react/prop-types': 'off',
    'react/jsx-no-bind': 'off',
    'react/jsx-one-expression-per-line': 'off',
    'react/button-has-type': 'off',
    'react/require-default-props': 'off',
    'react/function-component-definition': 'off',
  },
  ignorePatterns: ['vendor/**', 'scripts/**', 'config/**'],
};
