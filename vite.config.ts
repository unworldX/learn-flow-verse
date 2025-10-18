import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs/dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // Use relative base so built assets resolve when loaded via file:// in Electron
  base: mode === 'development' ? '/' : './',
  build: {
    outDir: 'web-dist'
  },
  optimizeDeps: {
    include: [
      '@tiptap/core',
      '@tiptap/starter-kit',
      '@tiptap/react',
      '@tiptap/extension-underline',
      '@tiptap/extension-text-style',
      '@tiptap/extension-color',
      '@tiptap/extension-highlight',
      '@tiptap/extension-text-align',
      '@tiptap/extension-link',
      '@tiptap/extension-image',
      '@tiptap/extension-table',
      '@tiptap/extension-table-row',
      '@tiptap/extension-table-header',
      '@tiptap/extension-table-cell',
      '@tiptap/extension-task-list',
      '@tiptap/extension-task-item',
      '@tiptap/extension-code-block-lowlight',
      '@tiptap/extension-placeholder',
      'lowlight'
    ],
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      '@tiptap/core/jsx-runtime': '@tiptap/core/dist/jsx-runtime.js',
    },
  },
}));

