module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true
  },
  extends: ['react-app', 'react-app/jest'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'react/prop-types': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  }
};
