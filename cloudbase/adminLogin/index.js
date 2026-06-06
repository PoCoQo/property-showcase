// CloudBase 云函数：adminLogin
// 用途：管理员登录验证，签发自定义登录 ticket
//
// 部署方法（一次性，2 分钟）：
// 1. 打开 CloudBase 控制台 → 你的环境 → 云函数
// 2. 点击"新建云函数"
// 3. 函数名：adminLogin
// 4. 运行环境：Node.js 16+
// 5. 把本文件全部内容粘贴到 index.js
// 6. 点击"完成"部署
//
// 配套的数据集合：
// - admins 集合（你需要在 CloudBase 数据库里手动创建）
//   字段：username (string), password (string, 明文演示用)
//   权限：仅管理员可读写

const cloudbase = require('@cloudbase/node-sdk')

exports.main = async (event /*, context */) => {
  // 解析请求参数
  const { username, password } = event || {}
  if (!username || !password) {
    return { code: 400, message: '用户名或密码不能为空' }
  }

  // 初始化 CloudBase（用当前函数所在环境）
  const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV })
  const db = app.database()

  try {
    // 查 admins 集合
    const res = await db.collection('admins').where({ username }).limit(1).get()
    if (!res.data || res.data.length === 0) {
      return { code: 401, message: '账号或密码错误' }
    }
    const admin = res.data[0]

    // ⚠️ 演示用：明文比对。生产环境请用 bcrypt 哈希。
    if (admin.password !== password) {
      return { code: 401, message: '账号或密码错误' }
    }

    // 签发自定义登录 ticket（有效期 7 天）
    const ticket = app.auth().createTicket(admin._id, {
      refresh: 7 * 24 * 60 * 60,
    })

    return {
      code: 0,
      data: {
        ticket,
        user: { uid: admin._id, username: admin.username },
      },
    }
  } catch (e) {
    return { code: 500, message: '服务异常：' + (e?.message || String(e)) }
  }
}
