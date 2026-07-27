import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [
        fileURLToPath(new URL('.', import.meta.url)),
        fileURLToPath(
          new URL(
            '../docs/routing/golden-routes/GR-001-Telluride-Multi-Zone',
            import.meta.url,
          ),
        ),
      ],
    },
  },
})
