import js from "@eslint/js";
import perfectionist from "eslint-plugin-perfectionist";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from 'typescript-eslint';


const eslintConfig = defineConfig([
	{
		plugins: { js, perfectionist },
		extends: [js.configs.recommended, tseslint.configs.recommended],
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			"no-undef": "off",
			"perfectionist/sort-array-includes": "error",
			"perfectionist/sort-imports": "error",
			"perfectionist/sort-named-imports": "error",
		},
	},
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		"out/**",
		"build/**",
	]),
]);

export default eslintConfig;
