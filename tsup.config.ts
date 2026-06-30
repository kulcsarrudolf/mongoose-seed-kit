import { defineConfig } from 'tsup';

export default defineConfig({
  // Separate entries for the library and the CLI (dist/cli/index.js for the bin).
  entry: ['src/index.ts', 'src/cli/index.ts'],
  // CJS-only: the toolkit relies on dynamic require() of user seeder/config files
  // and on require.main, which have no clean ESM equivalent. (mongoose, a
  // peerDependency, is externalized automatically.)
  format: ['cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node18',
});
