import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Read PORT from sibling backend/.env so the proxy matches `npm run dev` in backend without a second env file. */
function backendPortFromEnvFile() {
  try {
    const envPath = path.resolve(__dirname, '../backend/.env')
    const raw = fs.readFileSync(envPath, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const m = /^\s*PORT\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))\s*$/.exec(trimmed)
      if (m) {
        const v = m[1] ?? m[2] ?? m[3]
        const n = Number.parseInt(v, 10)
        if (Number.isFinite(n) && n > 0) return n
      }
    }
  } catch {
    /* no backend/.env */
  }
  return 5000
}

const backendTarget =
  process.env.VITE_BACKEND_URL ||
  `http://127.0.0.1:${backendPortFromEnvFile()}`

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: backendTarget, changeOrigin: true },
      '/uploads': { target: backendTarget, changeOrigin: true },
    },
  },
})
