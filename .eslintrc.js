module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2019: true,
  },
  extends: [
    "eslint:recommended",
    "prettier"
  ],
  parserOptions: {
    ecmaVersion: 13,
  },
  rules: {
    indent: ["error", 2, { SwitchCase: 1 }],
    "linebreak-style": ["error", "unix"],
    "operator-linebreak": ["error", "before"],
    quotes: ["error", "double"],
    semi: ["error", "always"],
    "no-constant-condition": ["error", { checkLoops: false }],
  },
};
