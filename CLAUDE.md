# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器 (localhost:4321)
npm run build        # 构建生产版本到 ./dist/
npm run preview      # 本地预览构建结果
npm run astro ...    # 运行 Astro CLI 命令
```

## 技术栈

- **Astro 5.x** - SSR 模式 (Cloudflare Pages adapter)
- **React 19** - 交互式组件
- **Tailwind CSS 4** - 样式
- **Nanostores** - 客户端状态管理
- **Axios** - HTTP 请求

## 项目架构

### 路由结构
- `/` - 首页，文章列表
- `/posts/[id]` - 文章详情页
- `/rss.xml` - RSS 订阅
- `/admin/*` - 管理后台（需认证）
- `/admin/login` - 登录页
- `/admin/` - 管理仪表盘
- `/admin/editor/[id]` - 文章编辑器
- `/api/*` - API 代理，转发请求到后端

### API 代理
`src/pages/api/[...path].ts` 是全局 API 代理：
- 浏览器环境：同源请求到 `/api/*`（避免 CORS）
- 服务端环境：直接调用后端 `PUBLIC_API_URL` 环境变量指定的后端地址
- 处理 Cookie 重写（设置 Path=/ 以支持本地开发）
- 自动将 access_token Cookie 添加为 Authorization Bearer 头

### 认证流程
- 使用 HttpOnly Cookie 存储 token
- `src/lib/api.ts` 中的 Axios 拦截器自动处理 401 时的 token 刷新
- `src/stores/auth.ts` 使用 Nanostores 管理认证状态
- 刷新失败时清除 localStorage 并重定向到登录页

### 状态管理
- `src/stores/auth.ts` - 认证状态（用户信息、登录状态）
- `src/stores/toast.ts` - 通知消息

### 组件类型
- `.astro` 组件 - 静态页面（Layout, ArticleCard）
- `.tsx` 组件 - 交互式 React 组件（表单、编辑器、管理面板）

## 环境变量

- `PUBLIC_API_URL` - 后端 API 地址
