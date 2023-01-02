module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'airbnb',
    'airbnb-typescript'
  ],
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['tsconfig.json']
  },
  plugins: [
    'react'
  ],
  rules: {
  },
  ignorePatterns: ["src/vendor/**"]
}
