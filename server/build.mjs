import * as esbuild from "esbuild";
import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

mkdirSync(resolve(__dirname, "../dist"), { recursive: true });

await esbuild.build({
  entryPoints: [resolve(__dirname, "_core/index.ts")],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: resolve(__dirname, "../dist/index.js"),
  // Tell esbuild to look in server/node_modules when resolving deps
  // from files outside this package (e.g. ../drizzle/schema.ts)
  nodePaths: [resolve(__dirname, "node_modules")],
  external: [
    "mysql2",
    "mysql2/promise",
    "bufferutil",
    "utf-8-validate",
  ],
});

console.log("✓ Server built → dist/index.js");
