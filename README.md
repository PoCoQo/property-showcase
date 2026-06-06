# 白云城建物业展示系统

> 给广州市白云城市建设开发有限公司用的物业展示 + 管理后台  
> 技术栈：React + TypeScript + Supabase + Vercel + 腾讯地图  
> 部署后访问：公开展示页（公开）+ 管理后台（需登录）

---

## 📋 你需要注册的账号（全部免费）

| 账号 | 用途 | 注册地址 |
|---|---|---|
| GitHub | 托管代码 | https://github.com |
| Supabase | 数据库 + 后台登录 | https://supabase.com |
| Vercel | 部署前端 | https://vercel.com |
| 腾讯位置服务 | 地图 API | https://lbs.qq.com |

> 💡 建议都用**同一个邮箱**注册，方便管理。GitHub、Supabase、Vercel 都支持**用 GitHub 账号一键登录**。

---

## 🚀 部署步骤（约 30-60 分钟）

### 第 1 步：准备 GitHub 仓库

1. 打开 https://github.com ，注册账号（如果还没有）
2. 登录后，点击右上角 `+` → `New repository`
3. Repository name 填 `property-showcase`
4. 选择 `Public`（公开仓库 Vercel 才能免费部署）
5. 点击 `Create repository`
6. **保留这个页面**，下一步要用到仓库地址

### 第 2 步：把代码上传到 GitHub

在你自己电脑上操作（需要安装 Git，下载 https://git-scm.com ）：

```bash
# 进入项目目录
cd property-showcase

# 初始化 Git
git init
git add .
git commit -m "init: 物业展示系统"

# 关联到 GitHub 仓库（把下面的 URL 换成你刚才创建的）
git remote add origin https://github.com/你的用户名/property-showcase.git
git branch -M main
git push -u origin main
```

> 💡 如果不熟悉 Git 命令，可以下载 [GitHub Desktop](https://desktop.github.com) ，图形化操作更简单。

### 第 3 步：创建 Supabase 项目

1. 打开 https://supabase.com ，用 GitHub 账号登录
2. 点击 `New Project`
3. 填写：
   - **Name**：`property-showcase`（或你喜欢的名字）
   - **Database Password**：设一个强密码，**记下来备用**
   - **Region**：选 `Singapore`（离中国最近）
4. 点击 `Create new project`，等待 1-2 分钟创建完成

### 第 4 步：初始化数据库

1. 在 Supabase 项目页面，左侧菜单点 `SQL Editor`
2. 点击 `New query`
3. 打开本项目里的 `supabase/schema.sql`，**复制全部内容**粘贴进去
4. 点击右下角 `Run`（或按 Ctrl+Enter）
5. 应该看到 `Success. No rows returned`，说明执行成功
6. 再新建一个 Query，复制 `supabase/seed.sql` 里的内容粘贴执行（这是测试数据）

### 第 5 步：获取 Supabase 密钥

1. 在 Supabase 项目页面，左侧菜单点 `Project Settings`（齿轮图标）→ `API`
2. 找到这两个值，**复制下来**：
   - **Project URL**（形如 `https://xxxxx.supabase.co`）
   - **anon public key**（一串很长的字符，以 `eyJ` 开头）

### 第 6 步：创建管理员账号

1. 在 Supabase 项目页面，左侧菜单点 `Authentication` → `Users`
2. 点击 `Add user` → `Create new user`
3. 填写：
   - **Email**：你的工作邮箱
   - **Password**：一个强密码（**记下来**，登录要用）
   - 勾选 `Auto Confirm User`
4. 点击 `Create user`

### 第 7 步：申请腾讯地图 Key

1. 打开 https://lbs.qq.com ，用微信扫码登录
2. 顶部菜单 `控制台` → `应用管理` → `我的应用` → `创建应用`
3. 应用名称填 `白云城建物业`，应用类型选 `其它`
4. 创建后，点击 `添加 Key`
5. Key 名称随便填，勾选 `WebService API` 和 `JavaScript API`
6. 完成后，**复制这个 Key**

### 第 8 步：在 Vercel 部署

1. 打开 https://vercel.com ，用 GitHub 账号登录
2. 点击 `Add New...` → `Project`
3. 选择 `Import` 你刚才创建的 `property-showcase` 仓库
4. 在配置页面，展开 `Environment Variables`，**添加以下三个变量**：

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | 第 5 步复制的 Project URL |
| `VITE_SUPABASE_ANON_KEY` | 第 5 步复制的 anon public key |
| `VITE_TENCENT_MAP_KEY` | 第 7 步复制的腾讯地图 Key |

5. 点击 `Deploy`，等待 1-2 分钟
6. 部署完成后，Vercel 会给你一个域名，**形如 `https://property-showcase-xxx.vercel.app`**

### 第 9 步：测试

打开 Vercel 给你的域名，你应该能看到物业展示页（包含测试数据）。

试试访问 `https://你的域名/admin`：
- 用第 6 步创建的邮箱密码登录
- 应该能看到管理后台，能增删改数据

### 第 10 步：挂到微信公众号

1. 登录微信公众平台（https://mp.weixin.qq.com）
2. 你的服务号「白云城建」→ `自定义菜单`
3. 添加一个菜单，菜单名称填「物业展示」
4. 菜单内容选 `跳转网页`，填写 Vercel 给你的域名
5. 保存并发布（可能需要几分钟生效）

---

## 🔄 后续修改数据

- 改物业信息：访问 `你的域名/admin` → 登录 → 增删改
- 改代码（比如加新功能）：在 GitHub 仓库直接改 → Vercel 会自动重新部署

---

## ❓ 常见问题

### Q1: 经纬度怎么填？

打开 https://lbs.qq.com/web/demo/map-marker-demo ，在地图上找到位置，鼠标点击就能看到经纬度。

也可以在百度地图 https://api.map.baidu.com/lbsapi/getpoint/index.html 拾取，然后转换（高德/百度用的坐标系是 GCJ-02，腾讯地图也是，无需转换）。

### Q2: 部署后地图不显示？

检查 `VITE_TENCENT_MAP_KEY` 是否正确配置。打开浏览器控制台（F12）看错误信息。

### Q3: 怎么增加新的区？

修改 `src/lib/types.ts` 里的 `District` 类型和 `DISTRICTS` 数组，然后重新部署。

### Q4: 怎么让多个管理员都能登录？

在 Supabase → `Authentication` → `Users` 里继续 `Add user` 就行。

---

## 📂 项目结构

```
property-showcase/
├── supabase/
│   ├── schema.sql        ← 数据库表结构
│   └── seed.sql          ← 示例数据
├── src/
│   ├── App.tsx           ← 路由
│   ├── main.tsx          ← 入口
│   ├── lib/
│   │   ├── supabase.ts   ← Supabase 客户端
│   │   └── types.ts      ← 类型定义
│   ├── components/       ← 复用组件
│   │   ├── Header.tsx
│   │   ├── PropertyCard.tsx
│   │   ├── FilterBar.tsx
│   │   └── MapView.tsx
│   └── pages/
│       ├── Home.tsx      ← 公开展示页
│       ├── Login.tsx     ← 登录页
│       └── Admin.tsx     ← 管理后台
├── .env.example          ← 环境变量模板
└── README.md             ← 本文档
```

---

## 🆘 遇到问题

1. 看 README 里的「常见问题」
2. 把错误信息截图发给帮你搭系统的同事或 agent
3. 大部分问题都是「环境变量没配对」或「SQL 没执行成功」

---

部署完成后，访问你的 Vercel 域名，把链接发给客户/同事测试即可。
