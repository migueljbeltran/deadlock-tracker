import { createRequire } from "node:module";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

// Resolve the plugin through its owner so this also works without npm hoisting.
const requireFromConfig = createRequire(import.meta.resolve("eslint-config-next"));
const nextPlugin = requireFromConfig("@next/eslint-plugin-next");

describe("Next lint glob dependency compatibility", () => {
  it.each([
    { label: "single directory", rootDir: "." },
    { label: "directory array", rootDir: ["does-not-exist", "."] },
    { label: "brace pattern", rootDir: "{.,does-not-exist}" },
  ])("still detects internal HTML links with a $label", async ({ rootDir }) => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [{
        files: ["**/*.jsx"],
        languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
        plugins: { "@next/next": nextPlugin },
        settings: { next: { rootDir } },
        rules: { "@next/next/no-html-link-for-pages": "error" },
      }],
    });
    const [result] = await eslint.lintText('const link = <a href="/">Home</a>;', {
      filePath: "lint-compatibility.jsx",
    });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].ruleId).toBe("@next/next/no-html-link-for-pages");
  });
});
