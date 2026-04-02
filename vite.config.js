import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: [],
            manifest: {
                name: "Ramon's Care Hub",
                short_name: 'Care Hub',
                description: 'Family care coordination for stroke recovery in SNF settings.',
                theme_color: '#0f2438',
                background_color: '#f4f8fb',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/',
                icons: [
                    {
                        src: '/pwa-icon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml'
                    },
                    {
                        src: '/pwa-icon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ]
});
