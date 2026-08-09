import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const googleAppsScriptProxyPath = '/google-app-script'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appsScriptUrl = env.VITE_GOOGLE_APPS_SCRIPT_URL
  const proxy = appsScriptUrl
    ? {
        [googleAppsScriptProxyPath]: {
          target: new URL(appsScriptUrl).origin,
          changeOrigin: true,
          followRedirects: true,
          rewrite: (requestPath: string) =>
            requestPath.replace(
              new RegExp(`^${googleAppsScriptProxyPath}`),
              new URL(appsScriptUrl).pathname,
            ),
        },
      }
    : undefined

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      proxy,
    },
  }
})
