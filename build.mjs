import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/bundle.js',
  external: [],
  sourcemap: true,
  minify: false,
});

console.log('Bundle created: dist/bundle.js');
