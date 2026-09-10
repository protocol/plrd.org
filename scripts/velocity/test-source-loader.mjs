// Run the real TypeScript/TSX sources with node:test, using the project's compiler.
// No second bundler or test framework; aliases match tsconfig.json.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
const require = createRequire(import.meta.url)
const Module = require('node:module')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (id, ...args) {
  // Next aliases this marker to its empty entry in the server compilation.
  if (id === 'server-only') id = 'next/dist/compiled/server-only/empty.js'
  return originalResolve.call(this, id.startsWith('@/') ? path.resolve('src', id.slice(2)) : id, ...args)
}
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
      fileName: filename,
    })
    module._compile(outputText, filename)
  }
}
export const source = (file) => require(path.resolve('src', file))
