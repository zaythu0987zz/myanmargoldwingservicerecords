const esbuild = require("esbuild");
const path = require("path");

// Bundle the API handler with all server dependencies into a single file
esbuild.buildSync({
  entryPoints: [path.resolve(__dirname, "api/trpc/handler.ts")],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  outfile: path.resolve(__dirname, "api/trpc/[trpc].mjs"),
  external: ["mysql2", "mysql2/promise"],
  sourcemap: false,
  minify: false,
  tsconfig: path.resolve(__dirname, "tsconfig.json"),
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
});

console.log("API bundle created: api/trpc/[trpc].mjs");
