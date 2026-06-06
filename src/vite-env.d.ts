/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLOUDBASE_ENV_ID: string
  readonly VITE_TENCENT_MAP_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
