import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

function inlineAssetsPlugin(): Plugin {
  return {
    name: 'inline-assets',
    enforce: 'post',
    generateBundle(_, bundle) {
      const htmlFile = Object.values(bundle).find(
        (file) => file.type === 'asset' && file.fileName.endsWith('.html')
      );
      if (!htmlFile || htmlFile.type !== 'asset') return;

      let html = htmlFile.source as string;
      const assetsDir = path.dirname(htmlFile.fileName);

      // Inline JavaScript
      html = html.replace(
        /<script[^>]*src=["']\/?([^"']+\.js)["'][^>]*><\/script>/g,
        (_, src) => {
          const jsFile = Object.values(bundle).find(
            (file) => file.type === 'chunk' && file.fileName === src
          );
          if (jsFile && jsFile.type === 'chunk') {
            return `<script type="module">${jsFile.code}</script>`;
          }
          return '';
        }
      );

      // Inline CSS
      html = html.replace(
        /<link[^>]*href=["']\/?([^"']+\.css)["'][^>]*>/g,
        (_, href) => {
          const cssFile = Object.values(bundle).find(
            (file) => file.type === 'asset' && file.fileName === href
          );
          if (cssFile && cssFile.type === 'asset') {
            return `<style>${cssFile.source}</style>`;
          }
          return '';
        }
      );

      htmlFile.source = html;

      // Remove JS and CSS files from bundle
      Object.keys(bundle).forEach((key) => {
        const file = bundle[key];
        if (
          file.type === 'chunk' ||
          (file.type === 'asset' && (file.fileName.endsWith('.js') || file.fileName.endsWith('.css')))
        ) {
          delete bundle[key];
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), inlineAssetsPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    assetsInlineLimit: 100000000,
  },
});
