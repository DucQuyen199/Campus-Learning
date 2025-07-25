/*-----------------------------------------------------------------
* File: vite.config.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5004,
    proxy: {
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
        external: ['simple-peer'],
      }
    }
  },
  define: {
    'process.env': {},
    global: 'window',
  },
  optimizeDeps: {
    exclude: ['simple-peer', '@wasmer/wasi', '@wasmer/wasmfs', 'pyodide', 'quickjs-emscripten'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
}); 
