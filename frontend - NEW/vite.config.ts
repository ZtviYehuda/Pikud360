import path from "path";
import fs from "fs";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const useHttps = mode === "https" || process.env.VITE_USE_HTTPS === "true";
  const keyPath = path.resolve(__dirname, "matzevet.tail44b7c4.ts.net.key");
  const certPath = path.resolve(__dirname, "matzevet.tail44b7c4.ts.net.crt");
  const httpsConfig = useHttps && fs.existsSync(keyPath) && fs.existsSync(certPath)
    ? {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      }
    : undefined;

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "maskable-icon-512x512.png", "pwa-192x192.png", "pwa-512x512.png", "logo_unit.png"],
        manifest: {
          name: "UNIT",
          short_name: "UNIT",
          description: "UNIT - מערכת ניהול, נוכחות ושליטה מבצעית",
          theme_color: "#020617",
          background_color: "#020617",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          scope: "/",
          dir: "rtl",
          lang: "he",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api/],
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          runtimeCaching: [
            {
              urlPattern: /^\/api\/.*$/,
              handler: "NetworkOnly",
            },
          ],
        },
      }),
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    build: {
      // Target modern browsers — smaller, faster output
      target: "esnext",
      // Inline small assets directly into JS/CSS (faster: fewer round-trips)
      assetsInlineLimit: 4096,
      // Warn only if a single chunk exceeds 1 MB
      chunkSizeWarningLimit: 1000,
      // Minify with esbuild (much faster than terser, comparable output)
      minify: "esbuild",
      rollupOptions: {
        output: {
          // Smart chunk splitting: each vendor lib is its own cached chunk
          // → unchanged libs stay cached even when app code changes
          manualChunks: {
            "vendor-react":  ["react", "react-dom", "react-router-dom"],
            "vendor-motion": ["framer-motion"],
            "vendor-ui":     ["lucide-react", "@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-checkbox"],
            "vendor-dates":  ["date-fns"],
            "vendor-charts": ["recharts"],
            "vendor-misc":   ["axios", "sonner", "class-variance-authority", "clsx", "tailwind-merge"],
          },
        },
      },
    },

    // Optimise dev server — pre-bundle heavy deps so first page load is instant
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "framer-motion",
        "lucide-react",
        "date-fns",
        "axios",
        "sonner",
        "clsx",
        "tailwind-merge",
        "class-variance-authority",
      ],
      // Force re-bundle on dep changes
      force: false,
    },

    // @ts-ignore: Vitest test config recognized at runtime
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
    },

    server: {
      port: 5173,
      strictPort: false,
      https: httpsConfig,
      allowedHosts: true,
      host: "0.0.0.0",
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});

