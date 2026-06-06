# 白云城建物业展示系统

> 基于 React + Vite + 腾讯云 CloudBase，部署在 EdgeOne Pages。
> 国内 CDN，国内访问速度跟微信打开网页一样快。

---

## 功能

- **公开页**：4 个区（白云/荔湾/海珠/越秀）共 10+ 物业，支持按区域/类型/状态筛选、关键字搜索、地图标注
- **管理后台**（`/admin`）：增删改查物业，登录后才能访问
- **地图**：腾讯地图 JS API GL，物业位置可视化
- **响应式**：PC + 手机 H5 都适配

---

## 快速开始（本地开发）

```bash
npm install
cp .env.example .env  # 填好 VITE_CLOUDBASE_ENV_ID 和 VITE_TENCENT_MAP_KEY
npm run dev
```

打开 http://localhost:5173

---

## 生产环境部署（5 步）

### 第 1 步：开通腾讯云 CloudBase

> 国内 CDN，跟 EdgeOne Pages 同生态，国内访问 0 障碍。

1. 打开 https://console.cloud.tencent.com/tcb
2. 用 EdgeOne 那个 QQ 邮箱对应的腾讯云账号登录（同一账号）
3. 点 **创建环境** → 选 **基础版（免费）** → 等 1-2 分钟
4. 进环境 → 顶部"环境总览"找 **`envId`**（形如 `bycjh5-xxxxxx`）
5. **复制 envId**，下一步要用

### 第 2 步：创建数据库 + 集合

1. CloudBase 控制台 → 你的环境 → **数据库** → 创建集合
2. 创建以下 2 个集合（**集合名必须完全一致**）：

   | 集合名 | 权限 |
   |--------|------|
   | `properties` | 所有人可读，**仅登录用户可写** |
   | `admins` | **仅管理员可读写** |

3. **配置权限**（点集合名 → 权限设置）：

   **`properties` 集合**：
   - 选"自定义安全规则" → 粘贴：
     ```json
     {
       "read": true,
       "write": "auth.uid != null"
     }
     ```
   - 点保存

   **`admins` 集合**：
   - 选"仅管理员可读写"

4. **导入 10 条物业数据**：
   - 进入 `properties` 集合 → 点 **文档管理** → **导入**
   - 把 [`cloudbase/seed-data.txt`](./cloudbase/seed-data.txt) 里 `[...]` 之间的 JSON 数组粘贴进去
   - 选"JSON 数组"格式 → 点 **导入**

5. **创建第一个管理员账号**：
   - 进入 `admins` 集合 → 点 **添加记录**
   - 填：
     ```
     username: admin
     password: 你的密码（6 位以上）
     ```
   - 点 **保存**

### 第 3 步：部署云函数 adminLogin

> 这是管理员登录的鉴权后端。

1. CloudBase 控制台 → 你的环境 → **云函数** → **新建云函数**
2. 函数名：`adminLogin`
3. 运行环境：Node.js 16+
4. 把 [`cloudbase/adminLogin/index.js`](./cloudbase/adminLogin/index.js) 全部内容粘贴到 `index.js`
5. 点 **完成** 等部署完（约 30 秒）

### 第 4 步：配置 EdgeOne Pages 环境变量

> 前端代码部署在 EdgeOne Pages。

1. EdgeOne 控制台 → 你的项目 → **项目设置** → **环境变量**
2. **删除**之前 Vercel 那 3 个 Supabase 变量（`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `VITE_TENCENT_MAP_KEY`）
3. **添加** 2 个新变量：

   | 变量名 | 值 |
   |--------|-----|
   | `VITE_CLOUDBASE_ENV_ID` | 第 1 步拿到的 `envId` |
   | `VITE_TENCENT_MAP_KEY` | 你的腾讯地图 Key（不变） |

4. 点保存

### 第 5 步：触发自动重新部署

1. 回到本地代码（或者直接在你的 GitHub 仓库）
2. 把新代码 push 到 `main` 分支：
   ```bash
   git add .
   git commit -m "迁移到 CloudBase"
   git push
   ```
3. EdgeOne Pages 会自动重新部署（30-60 秒）
4. 部署完点"预览"按钮 → 看到 10 条数据加载出来 = **成功** 🎉

---

## 挂到微信公众号菜单

1. 微信公众号后台 → **自定义菜单** → 添加菜单
2. 菜单名：**物业展示**
3. 菜单内容：**跳转网页**（view 类型）
4. 跳转链接：EdgeOne 返回的 **`xxx.edgeone.app`** 域名

> ⚠️ 用 EdgeOne 默认的 `.edgeone.app` 域名**不用 ICP 备案**。
> 备案只在你以后**绑自己的域名**时才需要。

---

## 目录结构

```
property-showcase/
├── src/
│   ├── components/        # React 组件
│   │   ├── FilterBar.tsx
│   │   ├── Header.tsx
│   │   ├── MapView.tsx
│   │   └── PropertyCard.tsx
│   ├── pages/             # 页面
│   │   ├── Home.tsx       # 公开页
│   │   ├── Login.tsx      # 登录
│   │   └── Admin.tsx      # 管理后台
│   ├── lib/
│   │   ├── cloudbase.ts   # CloudBase 客户端
│   │   ├── api.ts         # 数据访问层
│   │   ├── auth.ts        # 管理员认证
│   │   └── types.ts       # 业务类型
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── cloudbase/
│   ├── adminLogin/        # 云函数代码
│   │   └── index.js
│   └── seed-data.txt      # 10 条示例数据
├── .env.example
├── package.json
└── README.md
```

---

## 常见问题

**Q: 部署完页面打开 0 条数据？**
A: 99% 是 CloudBase 集合权限没配好。检查 `properties` 集合的"自定义安全规则"是不是 `{"read": true, "write": "auth.uid != null"}`。

**Q: 登录提示"登录失败"？**
A: 检查三件事：
1. CloudBase 云函数 `adminLogin` 是否部署成功（云函数列表里有，状态是"运行中"）
2. `admins` 集合里是否有一条 `{username, password}` 记录
3. EdgeOne Pages 环境变量里 `VITE_CLOUDBASE_ENV_ID` 是否填对

**Q: 地图不显示？**
A: 腾讯地图 Key 没配或失效。检查 EdgeOne 环境变量 `VITE_TENCENT_MAP_KEY`。

**Q: 数据能读不能写？**
A: `properties` 集合的安全规则 `write` 字段要 `auth.uid != null`（要求登录后才能写）。
