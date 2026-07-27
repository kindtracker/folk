import JavaScriptObfuscator from "javascript-obfuscator";
import { writeFile } from "node:fs/promises";
import { build } from "esbuild";
import path from "node:path";

const obfc = true;

const result = await build({
  entryPoints: ["src/main.js"],
  bundle: true,
  format: "esm",
  write: false,
  minify: obfc,
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

let code = result.outputFiles[0].text;

if (obfc) {
  code = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
  
    stringArray: true,
    stringArrayEncoding: ["rc4"],
    rotateStringArray: true,
    reservedNames: [
      "THREE",
      "CANNON"
    ],
    stringArrayThreshold: 1,

    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.25,

    deadCodeInjection: true,
    deadCodeInjectionThreshold: 1,

    transformObjectKeys: true,
    unicodeEscapeSequence: true,
    identifierNamesGenerator: "hexadecimal",

    renameGlobals: true,
    selfDefending: true,
    debugProtection: false
  });

  await writeFile("web/main.js", code.getObfuscatedCode());
} else {
  await writeFile("web/main.js", code);
}
