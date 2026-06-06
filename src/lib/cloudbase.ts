// 腾讯云 CloudBase 客户端
// 国内 CDN，国内访问速度跟微信打开网页一样快

import cloudbase from '@cloudbase/js-sdk'

const envId = import.meta.env.VITE_CLOUDBASE_ENV_ID

if (!envId) {
  throw new Error(
    '缺少 CloudBase 配置。请在 .env 中设置 VITE_CLOUDBASE_ENV_ID，参考 .env.example。'
  )
}

const app = cloudbase.init({
  env: envId,
})

export const db = app.database()
export const auth = app.auth()
export { app }
