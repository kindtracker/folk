import { writeFile } from "node:fs/promises";
import { build } from "esbuild";
import path from "node:path";

const minify = false;

const result = await build({
  entryPoints: ["src/client/main.js"],
  bundle: true,
  format: "esm",
  write: false,
  minify,
  absWorkingDir: process.cwd(),
  plugins: [
    {
      name: "rewrite-root-imports",
      setup(build) {
        build.onResolve({ filter: /^\// }, args => {
          return {
            path: path.join(process.cwd(), "src", args.path)
          };
        });
      }
    }
  ]
});

const code = result.outputFiles[0].text;
await writeFile("web/main.js", code);
