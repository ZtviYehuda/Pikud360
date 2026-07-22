import path from "path";
import fs from "fs";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const useHttps = mode === "https" || process.env.VITE_USE_HTTPS === "true";
  const keyPath = path.resolve(__dirname, "toren.tail44b7c4.ts.net.key");
  const certPath = path.resolve(__dirname, "toren.tail44b7c4.ts.net.crt");
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
      entries: ["./src/main.tsx"],
      holdUntilCrawlEnd: true,
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-dev-runtime",
        "react-router-dom",
        "framer-motion",
        "lucide-react",
        "date-fns",
        "date-fns/locale",
        "axios",
        "sonner",
        "clsx",
        "tailwind-merge",
        "class-variance-authority",
        "zustand",
        "recharts",
        "html-to-image",
        "@hebcal/core",
        "react-day-picker",
        "@radix-ui/react-dialog",
        "@radix-ui/react-select",
        "@radix-ui/react-popover",
        "@radix-ui/react-tabs",
        "@radix-ui/react-tooltip",
        "@radix-ui/react-dropdown-menu",
        "@radix-ui/react-checkbox",
        "@radix-ui/react-switch",
        "@radix-ui/react-label",
        "@radix-ui/react-slot",
        "react-icons/fa",
      ],
    },

    // @ts-ignore: Vitest test config recognized at runtime
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
    },

    server: {
      https: httpsConfig,
      allowedHosts: true,
      host: "0.0.0.0",
      port: 5174,
      strictPort: false,
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

