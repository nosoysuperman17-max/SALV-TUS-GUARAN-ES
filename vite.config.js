import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Genera un único HTML auto-contenido (assets inline en base64)
    outDir: 'dist',
    assetsInlineLimit: 100_000_000, // forzar inline de todo
    rollupOptions: {
      output: {
        // Un solo bundle JS inline en el HTML
        inlineDynamicImports: true,
      },
    },
  },
  // En dev, sirve en localhost:5173 con hot reload
  server: {
    port: 5173,
  },
});
