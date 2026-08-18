import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "images/site/logo-white-angels.png",
        "pwa/apple-touch-icon.png",
        "pwa/icon-192x192.png",
        "pwa/icon-512x512.png",
        "pwa/icon-512x512-maskable.png"
      ],
      manifest: {
        name: "White Angels",
        short_name: "White Angels",
        display: "standalone",
        start_url: "/",
        scope: "/",
        theme_color: "#183B80",
        background_color: "#FFFFFF",
        icons: [
          {
            src: "/pwa/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/pwa/icon-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/pwa/icon-512x512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/whiteangels\.178\.238\.227\.229\.sslip\.io\/api\/v1\/.*$/i,
            handler: "NetworkOnly",
            options: {
              cacheName: "wa-api-network-only"
            }
          },
          {
            urlPattern: /^https:\/\/whiteangels\.178\.238\.227\.229\.sslip\.io\/uploads\/.*$/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "wa-uploads-network-first",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 32,
                maxAgeSeconds: 60 * 60
              }
            }
          }
        ]
      }
    })
  ]
});
