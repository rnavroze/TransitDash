import {fileURLToPath, URL} from "node:url";

import {defineConfig} from "vite";
import vue from "@vitejs/plugin-vue";
import {VitePWA} from 'vite-plugin-pwa';


// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), VitePWA({
        registerType: 'autoUpdate',
        manifest: {
            name: "TransitDash",
            short_name: "TransitDash",
            description: "Transit Dashboard",
            theme_color: "#000055",
            icons: [
                {
                    src: 'android-chrome-192x192.png',
                    sizes: '192x192',
                    type: 'image/png',
                },
                {
                    src: 'android-chrome-512x512.png',
                    sizes: '512x512',
                    type: 'image/png',
                }
            ]
        }
    })],
    base: '/transitdash',
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
});
