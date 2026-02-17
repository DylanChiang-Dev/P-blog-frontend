# P-blog-frontend

博客前端，基于 Astro + React + Tailwind CSS。

## 技术栈

- **Astro 5.x** - SSR 模式 (Cloudflare Pages)
- **React 19** - 交互式组件
- **Tailwind CSS 4** - 样式
- **Nanostores** - 客户端状态管理
- **Axios** - HTTP 请求

## 常用命令

```bash
npm install          # 安装依赖
npm run dev         # 启动开发服务器 (localhost:4321)
npm run build       # 构建生产版本
npm run preview     # 预览构建结果
```

## 项目结构

```
src/
├── components/     # UI 组件
├── layouts/       # 页面布局
├── lib/            # 工具函数 (API、认证)
├── pages/          # 路由页面
│   ├── index       # 首页
│   ├── posts/      # 文章详情
│   ├── admin/      # 管理后台
│   └── api/        # API 代理
├── stores/         # 状态管理
└── styles/         # 全局样式
```

## API

后端 API 地址通过环境变量 `PUBLIC_API_URL` 配置

### 认证

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/login` | POST | 登录 |
| `/api/token/refresh` | POST | 刷新 Token |
| `/api/logout` | POST | 登出 |
| `/api/me` | GET | 获取当前用户 |

### 文章

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/blog/articles` | GET | 文章列表 |
| `/api/blog/articles/{slug}` | GET | 文章详情 |
| `/api/blog/articles` | POST | 创建文章 (需认证) |
| `/api/blog/articles/{id}` | PUT | 更新文章 (需认证) |
| `/api/blog/articles/{id}` | DELETE | 删除文章 (需认证) |

### 评论

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/blog/articles/{id}/comments` | GET | 评论列表 |
| `/api/blog/articles/{id}/comments` | POST | 发表评论 |
| `/api/blog/comments/{id}/moderate` | PUT | 审核评论 (需认证) |

### 其他

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/blog/categories` | GET | 分类列表 |
| `/api/blog/tags` | GET | 标签列表 |
| `/api/posts` | POST | 上传图片 (需认证) |
| `/rss.xml` | GET | RSS 订阅 |

### 认证方式

- `access_token`: 存储在 localStorage，用于 Authorization Bearer header
- `refresh_token`: HttpOnly Cookie，自动处理 Token 刷新

### 错误响应

```json
{
  "success": false,
  "error": "错误信息"
}
```

常见状态码: `400`, `401`, `403`, `404`, `500`

## 环境变量

- `PUBLIC_API_URL` - 后端 API 地址
