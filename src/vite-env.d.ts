/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_APPS_SCRIPT_URL?: string
  readonly VITE_GOOGLE_APPS_SCRIPT_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
