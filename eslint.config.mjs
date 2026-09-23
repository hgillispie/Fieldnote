import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Separate Builder plugin package — its own toolchain/dependencies
    // (@builder.io/react), not part of this app's build. See
    // plugins/cloudinary-picker/README.md.
    "plugins/**",
  ]),
]);

export default eslintConfig;
