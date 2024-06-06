// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url';
import dts from 'vite-plugin-dts';
// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    plugins: [
        dts({
            rollupTypes: true
          })
    ],
    define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
      extensions: [
        '.js',
        '.json',
        '.jsx',
        '.mjs',
        '.ts',
        '.tsx',
        '.vue',
      ],
    },
    server: {
      port: 3000
    },
    build: {
      manifest: true,
      minify: true,
      reportCompressedSize: true,
      lib: {
        name: "LruMap",
        entry:"src/index.ts",
        fileName: (format) => `lru-map.${format}.js`,
        formats: ["es", "cjs"],
      },
      rollupOptions: {
        plugins: [],
      },
    },
  }
})
