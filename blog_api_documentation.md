# 博客 API 文档

## 概述

本文档为**博客前端**提供完整的API对接指南，包括：
- **共享功能**：认证、用户、媒体上传（与微博共用）
- **博客功能**：文章、评论、点赞、搜索、RSS等

### 基础信息

- **Base URL**: `https://pyqapi.3331322.xyz`
- **认证方式**: 
  - Bearer Token (JWT) - 存储在 `Authorization` header
  - Refresh Token - 存储在 HttpOnly Cookie
- **Content-Type**: `application/json`
- **CORS**: 已开放，支持 `localhost` 和生产域名

### 目录

1. [认证系统](#1-认证系统) - 登录、刷新Token、登出
2. [用户管理](#2-用户管理) - 获取用户信息
3. [媒体上传](#3-媒体上传) - 图片上传（文章封面）
4. [博客文章](#4-博客文章) - 文章CRUD
5. [评论系统](#5-评论系统) - 评论、审核
6. [点赞功能](#6-点赞功能) - 点赞/取消
7. [SEO与发现](#7-seo与发现) - RSS、Sitemap、搜索、归档
8. [分类标签](#8-分类标签) - 分类、标签管理
9. [高级功能](#9-高级功能) - 自动保存、版本历史

---

## 1. 认证系统

### 1.1 登录

```http
POST /api/login
Content-Type: application/json
```

**请求体**：
```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

**说明**：
- `access_token` 用于后续API调用（有效期通常15分钟）
- `refresh_token` 自动存储在 HttpOnly Cookie 中
- 前端应将 `access_token` 存储在 localStorage 或内存中

### 1.2 刷新Token

```http
POST /api/token/refresh
Cookie: refresh_token={token}
```

**请求体**：空（或可选传递 refresh_token）

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "access_token": "new_access_token_here"
  }
}
```

**说明**：
- 当 access_token 过期时调用
- refresh_token 从 Cookie 自动读取
- 返回新的 access_token
- 如果 refresh_token 也过期，返回 `401 Unauthorized`，需要重新登录

### 1.3 登出

```http
POST /api/logout
Authorization: Bearer {token}
```

**响应** (200 OK):
```json
{
  "success": true
}
```

**说明**：
- 清除服务端的 refresh_token
- 前端应同时清除本地存储的 access_token

---

## 2. 用户管理

### 2.1 获取当前用户信息

```http
GET /api/me
Authorization: Bearer {token}
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "admin@example.com",
    "role": "admin",
    "display_name": "管理员",
    "avatar_path": "/uploads/avatars/admin.jpg",
    "created_at": "2025-01-01 00:00:00"
  }
}
```

**使用场景**：
- 页面加载时验证用户登录状态
- 获取用户头像、昵称等信息
- 判断用户角色（admin/user）

---

## 3. 媒体上传

### 3.1 上传图片（文章封面）

```http
POST /api/posts
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**请求体**（FormData）：
```javascript
const formData = new FormData();
formData.append('content', '临时内容');  // 必须字段
formData.append('visibility', 'private');
formData.append('images[]', imageFile);  // 图片文件
```

**响应** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "images": [
      {
        "path": "/uploads/posts/2025/11/27/abc123.jpg",
        "url": "https://pyqapi.3331322.xyz/uploads/posts/2025/11/27/abc123.jpg"
      }
    ]
  }
}
```

**前端使用示例**：
```javascript
// 上传封面图
const uploadCoverImage = async (file) => {
  const formData = new FormData();
  formData.append('content', 'Cover upload');
  formData.append('visibility', 'private');
  formData.append('images[]', file);
  
  const response = await fetch('https://pyqapi.3331322.xyz/api/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const data = await response.json();
  return data.data.images[0].url; // 返回图片URL
};
```

**说明**：
- 博客文章的封面图通过此接口上传
- 上传后获得图片URL，创建文章时传入 `cover_image` 字段
- 支持的格式：jpg, jpeg, png, gif, webp
- 文件大小限制：5MB

---

## 4. 博客文章

| 角色 | 查看文章 | 创建文章 | 编辑文章 | 删除文章 | 评论 |
|------|---------|---------|---------|---------|------|
| 游客 | ✅ 已发布 | ❌ | ❌ | ❌ | ✅ |
| 用户 | ✅ 已发布 | ❌ | ❌ | ❌ | ✅ |
| 管理员 | ✅ 全部 | ✅ | ✅ | ✅ | ✅ |


---

## 权限说明

| 角色 | 文章查看 | 文章创建 | 文章编辑 | 评论 | 审核评论 | 点赞 |
|------|---------|---------|---------|------|---------|------|
| 游客 | ✅ 已发布 | ❌ | ❌ | ✅ | ❌ | ✅ |
| 用户 | ✅ 已发布 | ❌ | ❌ | ✅ | ❌ | ✅ |
| 管理员 | ✅ 全部 | ✅ | ✅ | ✅ | ✅ | ✅ |

**说明**：
- 博客仅**管理员**可发布文章
- 游客可评论（需提供姓名和邮箱）
- 所有人可点赞（用户通过user_id去重，游客通过IP去重）

---

## 快速开始

### 前端认证流程

```javascript
// 1. 登录
const login = async (email, password) => {
  const response = await fetch('https://pyqapi.3331322.xyz/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  
  // 保存 access_token
  localStorage.setItem('access_token', data.data.access_token);
  localStorage.setItem('user', JSON.stringify(data.data.user));
};

// 2. 创建axios实例（推荐）
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://pyqapi.3331322.xyz',
  withCredentials: true  // 重要：允许携带Cookie
});

// 请求拦截器：自动添加token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：自动刷新token
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token过期，尝试刷新
      try {
        const { data } = await axios.post(
          'https://pyqapi.3331322.xyz/api/token/refresh',
          {},
          { withCredentials: true }
        );
        localStorage.setItem('access_token', data.data.access_token);
        
        // 重试原请求
        error.config.headers.Authorization = `Bearer ${data.data.access_token}`;
        return axios(error.config);
      } catch {
        // 刷新失败，跳转登录
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 3. 使用示例
const getArticles = () => api.get('/api/blog/articles');
const createArticle = (data) => api.post('/api/blog/articles', data);
```

---

## 4. 博客文章

### 1. 文章管理

#### 1.1 创建文章

```http
POST /api/blog/articles
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**：
```json
{
  "title": "我的第一篇博客",
  "content": "# 标题\n\n这是**Markdown**内容",
  "excerpt": "文章摘要（可选）",
  "cover_image": "https://example.com/image.jpg",
  "status": "draft",
  "visibility": "public",
  "category_ids": [1, 2],
  "tag_names": ["技术", "PHP", "后端"]
}
```

**参数说明**：
- `title` (必填): 文章标题
- `content` (必填): 文章内容（Markdown格式）
- `excerpt` (可选): 摘要，如不提供将自动生成
- `cover_image` (可选): 封面图片URL
- `status` (可选): `draft`(草稿) | `published`(发布) | `archived`(归档)，默认 `draft`
- `visibility` (可选): `public` | `private`，默认 `public`
- `slug` (可选): URL友好标识，如不提供将从标题自动生成
- `category_ids` (可选): 分类ID数组
- `tag_names` (可选): 标签名称数组（自动创建不存在的标签）
- `tag_ids` (可选): 标签ID数组（与tag_names二选一）

**响应** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1
  }
}
```

#### 1.2 文章列表

```http
GET /api/blog/articles?limit=20&cursor={cursor}&status=published
```

**查询参数**：
- `limit` (可选): 每页数量，默认20，最大50
- `cursor` (可选): 分页游标
- `status` (可选): 状态筛选，仅管理员可看草稿

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "我的第一篇博客",
        "slug": "wo-de-di-yi-pian-bo-ke",
        "excerpt": "文章摘要",
        "cover_image": "https://example.com/image.jpg",
        "status": "published",
        "visibility": "public",
        "view_count": 100,
        "published_at": "2025-11-27 10:00:00",
        "created_at": "2025-11-27 09:00:00",
        "updated_at": "2025-11-27 10:00:00",
        "author": {
          "id": 1,
          "email": "admin@example.com",
          "display_name": "管理员",
          "avatar_path": "/uploads/avatar.jpg"
        },
        "categories": [
          {"id": 1, "name": "技术", "slug": "tech"}
        ],
        "tags": [
          {"id": 1, "name": "PHP", "slug": "php"}
        ]
      }
    ],
    "meta": {
      "has_more": true,
      "cursor": "MjAyNS0xMS0yN1QxMDowMDowMHwx"
    }
  }
}
```

#### 1.3 获取文章详情

```http
GET /api/blog/articles/{slug}
```

**路径参数**：
- `slug`: 文章的URL友好标识

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "我的第一篇博客",
    "slug": "wo-de-di-yi-pian-bo-ke",
    "content": "# 标题\n\n这是**Markdown**内容",
    "excerpt": "文章摘要",
    "cover_image": "https://example.com/image.jpg",
    "status": "published",
    "visibility": "public",
    "view_count": 101,
    "published_at": "2025-11-27 10:00:00",
    "created_at": "2025-11-27 09:00:00",
    "updated_at": "2025-11-27 10:00:00",
    "author": {
      "id": 1,
      "email": "admin@example.com",
      "display_name": "管理员",
      "avatar_path": "/uploads/avatar.jpg"
    },
    "categories": [...],
    "tags": [...]
  }
}
```

**注意**: 非管理员访问时会自动增加浏览量

#### 1.4 更新文章

```http
PUT /api/blog/articles/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体** (与创建相同，所有字段都是可选的):
```json
{
  "title": "更新后的标题",
  "content": "更新后的内容",
  "status": "published"
}
```

**响应** (200 OK): 返回完整的更新后文章

#### 1.5 删除文章

```http
DELETE /api/blog/articles/{id}
Authorization: Bearer {token}
```

**响应** (200 OK):
```json
{
  "success": true
}
```

#### 1.6 发布文章

```http
POST /api/blog/articles/{id}/publish
Authorization: Bearer {token}
```

快捷发布草稿文章（将status改为published并设置published_at）

**响应** (200 OK):
```json
{
  "success": true
}
```

### 2. 分类管理

#### 2.1 分类列表

```http
GET /api/blog/categories
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "技术",
      "slug": "tech",
      "description": "技术相关文章",
      "created_at": "2025-11-27 09:00:00"
    }
  ]
}
```

#### 2.2 创建分类

```http
POST /api/blog/categories
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "生活",
  "slug": "life",
  "description": "生活随笔"
}
```

### 3. 标签管理

#### 3.1 标签列表

```http
GET /api/blog/tags
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "PHP",
      "slug": "php",
      "created_at": "2025-11-27 09:00:00"
    }
  ]
}
```

#### 3.2 创建标签

```http
POST /api/blog/tags
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "JavaScript",
  "slug": "javascript"
}
```

**注意**: 标签通常通过创建文章时的 `tag_names` 自动创建

## 错误响应

所有错误都遵循统一格式：

```json
{
  "success": false,
  "error": "错误信息"
}
```

常见状态码：
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 无权限
- `404` - 资源不存在
- `500` - 服务器错误

## 使用示例

### cURL 示例

```bash
# 创建文章
curl -X POST https://pyqapi.3331322.xyz/api/blog/articles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hello World",
    "content": "# 你好世界\n\n这是我的第一篇博客",
    "tag_names": ["技术", "博客"]
  }'

# 获取文章列表
curl https://pyqapi.3331322.xyz/api/blog/articles

# 获取文章详情
curl https://pyqapi.3331322.xyz/api/blog/articles/hello-world
```

### JavaScript 示例

```javascript
// 获取文章列表
const response = await fetch('https://pyqapi.3331322.xyz/api/blog/articles')
const data = await response.json()

// 创建文章（需要认证）
const response = await fetch('https://pyqapi.3331322.xyz/api/blog/articles', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'My Article',
    content: '# Content\n\nHello!',
    tag_names: ['tech']
  })
})
```

## Slug 规则

- 自动从标题生成
- 转小写，特殊字符替换为连字符
- 支持中文
- 自动保证唯一性（重复时添加数字后缀）
- 示例: "我的博客" → "wo-de-bo-ke"

---

## 10. 环境配置

### CORS设置

后端已配置允许以下域名访问：
- `localhost:*`（本地开发）
- 生产域名（需在 `.env` 中配置）

**前端请求配置**：
```javascript
// 必须设置 withCredentials 以携带Cookie（refresh_token）
fetch(url, {
  credentials: 'include'  // 或 axios: withCredentials: true
});
```

### Token存储建议

**Access Token**：
- 存储位置：`localStorage` 或内存中
- 有效期：15分钟
- 用途：所有API请求的认证

**Refresh Token**：
- 存储位置：HttpOnly Cookie（后端自动管理）
- 有效期：7天
- 用途：刷新 access_token

### 错误处理

所有错误响应格式统一：
```json
{
  "success": false,
  "error": "错误信息"
}
```

**HTTP状态码**：
- `400` - 请求参数错误
- `401` - 未认证或Token过期
- `403` - 无权限
- `404` - 资源不存在
- `429` - 请求过于频繁
- `500` - 服务器错误

---

## 11. 完整示例

### React示例：文章列表组件

```javascript
import { useEffect, useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://pyqapi.3331322.xyz',
  withCredentials: true
});

function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data } = await api.get('/api/blog/articles');
        setArticles(data.data.items);
      } catch (error) {
        console.error('获取文章失败', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticles();
  }, []);

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      {articles.map(article => (
        <article key={article.id}>
          <h2>{article.title}</h2>
          <p>{article.excerpt}</p>
          <a href={`/articles/${article.slug}`}>阅读更多</a>
        </article>
      ))}
    </div>
  );
}
```

### Vue示例：游客评论组件

```vue
<template>
  <form @submit.prevent="submitComment">
    <input v-model="name" placeholder="您的姓名" required />
    <input v-model="email" type="email" placeholder="您的邮箱" required />
    <textarea v-model="content" placeholder="评论内容" required></textarea>
    <button type="submit">提交评论</button>
    <p v-if="message">{{ message }}</p>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const props = defineProps(['articleId']);
const name = ref('');
const email = ref('');
const content = ref('');
const message = ref('');

const submitComment = async () => {
  try {
    const { data } = await axios.post(
      `https://pyqapi.3331322.xyz/api/blog/articles/${props.articleId}/comments`,
      {
        author_name: name.value,
        author_email: email.value,
        content: content.value
      }
    );
    
    message.value = data.data.message; // "评论已提交审核"
    // 清空表单
    name.value = email.value = content.value = '';
  } catch (error) {
    message.value = '评论提交失败';
  }
};
</script>
```

---

## 12. API总览

### 认证 (3个端点)
- `POST /api/login` - 登录
- `POST /api/token/refresh` - 刷新Token
- `POST /api/logout` - 登出

### 用户 (1个端点)
- `GET /api/me` - 获取当前用户

### 媒体 (1个端点)
- `POST /api/posts` - 上传图片（用于封面）

### 博客文章 (9个端点)
- `POST /api/blog/articles` - 创建文章
- `GET /api/blog/articles` - 文章列表
- `GET /api/blog/articles/{slug}` - 文章详情
- `PUT /api/blog/articles/{id}` - 更新文章
- `DELETE /api/blog/articles/{id}` - 删除文章
- `POST /api/blog/articles/{id}/publish` - 发布文章
- `POST /api/blog/articles/{id}/auto-save` - 自动保存
- `GET /api/blog/articles/{id}/revisions` - 版本列表
- `POST /api/blog/articles/{id}/restore/{num}` - 恢复版本

### 评论 (6个端点)
- `GET /api/blog/articles/{id}/comments` - 评论列表
- `POST /api/blog/articles/{id}/comments` - 发表评论
- `GET /api/blog/comments/pending` - 待审核列表
- `POST /api/blog/comments/{id}/approve` - 审核通过
- `POST /api/blog/comments/{id}/reject` - 审核拒绝
- `DELETE /api/blog/comments/{id}` - 删除评论

### 点赞 (2个端点)
- `POST /api/blog/articles/{id}/like` - 点赞/取消
- `GET /api/blog/articles/{id}/like-status` - 点赞状态

### SEO (5个端点)
- `GET /api/blog/rss.xml` - RSS Feed
- `GET /api/blog/sitemap.xml` - Sitemap
- `GET /api/blog/archives` - 归档统计
- `GET /api/blog/archives/{year}/{month}` - 月度文章
- `GET /api/blog/search?q={keyword}` - 全文搜索

### 分类标签 (4个端点)
- `GET /api/blog/categories` - 分类列表
- `POST /api/blog/categories` - 创建分类
- `GET /api/blog/tags` - 标签列表
- `POST /api/blog/tags` - 创建标签

**总计：31个API端点**

---

## 支持

如有问题或需要帮助，请联系后端开发团队。

**API版本**: v1.0  
**最后更新**: 2025-11-27  
**维护者**: System
