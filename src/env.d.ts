/// <reference types="vite/client" />
/// <reference types="@dcloudio/types" />

interface ImportMetaEnv {
  /** 生产环境 API 基址，构建时注入；仓库里不写真实服务器地址。 */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
