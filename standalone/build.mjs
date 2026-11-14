#!/usr/bin/env node
/**
 * Builds the offline app into standalone/dist: one HTML page, one script, one stylesheet.
 * No server needed — open dist/index.html, or host the folder anywhere to install it as a PWA.
 *
 *   node standalone/build.mjs
 *
 * Needs `esbuild` and `tailwindcss` (the project's own version) to be resolvable.
 */
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const esbuild = require("esbuild");
const { compile } = require("tailwindcss");

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "standalone", "dist");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1. Script
await esbuild.build({
  entryPoints: [join(root, "standalone/entry.tsx")],
  outfile: join(out, "app.js"),
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2022",
  jsx: "automatic",
  tsconfig: join(root, "standalone/tsconfig.json"),
  define: { "process.env.NODE_ENV": '"production"' },
  // Packages installed next to this script (CI) first, then anything in NODE_PATH.
  nodePaths: [join(root, "standalone", "node_modules"), ...(process.env.NODE_PATH ?? "").split(":").filter(Boolean)],
  legalComments: "none",
  logLevel: "info",
});

// 2. Styles: Tailwind compiled against every class name found in the sources.
const tailwindDir = dirname(require.resolve("tailwindcss/package.json"));
const compiler = await compile(readFileSync(join(root, "src/styles.css"), "utf8"), {
  base: join(root, "src"),
  loadStylesheet: async (id, base) => {
    const path =
      id === "tailwindcss"
        ? join(tailwindDir, "index.css")
        : id.startsWith("tailwindcss/")
          ? join(tailwindDir, id.slice("tailwindcss/".length))
          : resolve(base, id);
    return { path, base: dirname(path), content: readFileSync(path, "utf8") };
  },
});

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== "dist" && name !== "node_modules") yield* walk(path);
    } else if (/\.(tsx?|html)$/.test(name)) {
      yield path;
    }
  }
}
const tokens = new Set();
for (const dir of [join(root, "src"), join(root, "standalone")]) {
  for (const file of walk(dir)) {
    for (const token of readFileSync(file, "utf8").match(/[^\s"'`<>{}]+/g) ?? []) tokens.add(token);
  }
}
const css = await esbuild.transform(compiler.build([...tokens]), { loader: "css", minify: true });
writeFileSync(join(out, "app.css"), css.code);

// 3. Static files (page, manifest, offline cache, icons)
cpSync(join(root, "standalone/static"), out, { recursive: true });
const sw = join(out, "sw.js");
writeFileSync(sw, readFileSync(sw, "utf8").replace("__BUILD__", Date.now().toString(36)));

const size = (name) => (statSync(join(out, name)).size / 1024).toFixed(0);
console.log(`built: app.js ${size("app.js")} KB, app.css ${size("app.css")} KB -> ${out}`);
