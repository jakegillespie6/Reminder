import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@lib': path.resolve(__dirname, './src/lib'),
            '@features': path.resolve(__dirname, './src/features'),
            '@components': path.resolve(__dirname, './src/components'),
            '@store': path.resolve(__dirname, './src/store')
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                rewrite: (p) => p.replace(/^\/api/, ''), // /api/items -> /items
            },
        },
    },
});
