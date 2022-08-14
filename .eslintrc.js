module.exports = {
  env: {
    node: true,
    commonjs: true,
    es20219: true,
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    indent: ["error", 2, { SwitchCase: 1 }],
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "double"],
    semi: ["error", "always"],
    "no-constant-condition": ["error", { checkLoops: false }],
  },
};
