/** @type {import("eslint").Linter.Config} */
const config = {
	root: true,
	ignores: [".config/*"],
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint"],
	parserOptions: {
		sourceType: "module",
		ecmaVersion: 2020
	},
	env: {
		browser: true,
		es2017: true,
		node: true
	},
	rules: {
		"no-console": "error",
		"no-unused-vars": "warn",
		quotes: ["error", "double"]
	}
};

module.exports = config;
