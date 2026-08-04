const esbuild = require("esbuild");
const path = require("path");

// Bundle the API handler with ALL dependencies (including mysql2) into a single file
// This ensures Vercel serverless functions can run it without needing node_modules
esbuild.buildSync({
  entryPoints: [path.resolve(__dirname, "api/trpc/handler.ts")],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  outfile: path.resolve(__dirname, "api/trpc/[trpc].mjs"),
  // Don't externalize anything - bundle everything
  external: [],
  sourcemap: false,
  minify: false,
  tsconfig: path.resolve(__dirname, "tsconfig.json"),
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
  // Ensure process.env is preserved at runtime
  define: {},
});

console.log("API bundle created: api/trpc/[trpc].mjs");
