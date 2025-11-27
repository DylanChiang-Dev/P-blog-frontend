# Blog API 後端問題報告

**測試時間**: 2025-11-27  
**測試人員**: Frontend Team  
**API Base URL**: `https://pyqapi.3331322.xyz`  
**測試帳號**: 3331322@gmail.com

---

## 執行摘要

經過完整的 API 端點測試，發現以下**嚴重問題**需要後端團隊緊急修復：

- ✅ **正常工作** (3個端點)
- ❌ **返回 500 錯誤** (2個核心端點)
- ⚠️ **數據為空** (1個端點)

---

## 🔴 嚴重問題 (CRITICAL)

### 1. 文章列表 API - 500 Internal Server Error

**端點**: `GET /api/blog/articles`  
**狀態**: ❌ 失敗  
**錯誤訊息**:
```json
{
  "success": false,
  "error": "Internal Server Error"
}
```

**測試 URL**: 
- `https://pyqapi.3331322.xyz/api/blog/articles?status=published&limit=100`
- `https://pyqapi.3331322.xyz/api/blog/articles?limit=10`

**重現步驟**:
```bash
curl "https://pyqapi.3331322.xyz/api/blog/articles?status=published&limit=100"
```

**影響範圍**:
- 🔴 **前端首頁無法顯示文章列表**
- 🔴 **後台管理頁面無法加載文章**
- 🔴 **SSG 構建失敗**

**優先級**: 🔴 **P0 - 阻塞性問題**

**建議檢查項目**:
1. 數據庫連接是否正常
2. `blog_articles` 表是否存在
3. SQL 查詢語句是否有語法錯誤
4. 是否有關聯查詢失敗 (例如 JOIN categories/tags/author)
5. 後端日志中的具體錯誤堆棧

---

### 2. 文章詳情 API - 500 Internal Server Error

**端點**: `GET /api/blog/articles/{slug}`  
**狀態**: ❌ 失敗  
**錯誤訊息**:
```json
{
  "success": false,
  "error": "Internal Server Error"
}
```

**測試案例**:
- `https://pyqapi.3331322.xyz/api/blog/articles/welcome-to-astro-blog`
- `https://pyqapi.3331322.xyz/api/blog/articles/the-art-of-design`

**重現步驟**:
```bash
curl "https://pyqapi.3331322.xyz/api/blog/articles/welcome-to-astro-blog"
```

**影響範圍**:
- 🔴 **文章詳情頁無法顯示**
- 🔴 **SSG 無法生成靜態頁面**

**優先級**: 🔴 **P0 - 阻塞性問題**

**建議檢查項目**:
1. slug 路由參數解析是否正確
2. 是否有文章數據在數據庫中
3. Markdown 內容字段讀取是否有問題
4. 關聯數據加載 (author, categories, tags) 是否失敗

---

### 3. 評論列表 API - 500 Internal Server Error

**端點**: `GET /api/blog/articles/{id}/comments`  
**狀態**: ❌ 失敗  
**錯誤訊息**:
```json
{
  "success": false,
  "error": "Internal Server Error"
}
```

**測試案例**:
- `https://pyqapi.3331322.xyz/api/blog/articles/1/comments`

**重現步驟**:
```bash
curl "https://pyqapi.3331322.xyz/api/blog/articles/1/comments"
```

**影響範圍**:
- 🟡 **評論區無法顯示**
- 🟡 **用戶無法看到已有評論**

**優先級**: 🟡 **P1 - 重要功能受影響**

**建議檢查項目**:
1. `blog_comments` 表是否存在
2. article_id 關聯查詢是否正確
3. 評論審核狀態篩選邏輯是否有問題

---

## ⚠️ 次要問題 (WARNING)

### 4. 標籤列表 API - 返回空數據

**端點**: `GET /api/blog/tags`  
**狀態**: ⚠️ **正常響應但數據為空**  
**響應**:
```json
{
  "success": true,
  "data": []
}
```

**測試 URL**: `https://pyqapi.3331322.xyz/api/blog/tags`

**影響範圍**:
- 🟡 **標籤篩選功能無法使用**
- 🟡 **文章編輯器無法顯示可用標籤**

**優先級**: 🟡 **P2 - 功能不完整**

**建議操作**:
1. 確認是否需要預先插入一些常用標籤
2. 或確認是否應該通過文章創建時自動生成標籤

---

## ✅ 正常工作的端點

### 1. 登入 API ✅
**端點**: `POST /api/login`  
**狀態**: ✅ 正常  
**備註**: 成功返回 access_token 和用戶信息

### 2. 分類列表 API ✅
**端點**: `GET /api/blog/categories`  
**狀態**: ✅ 正常  
**備註**: 成功返回 3 個分類（技術、生活、隨筆）

### 3. 標籤列表 API ✅
**端點**: `GET /api/blog/tags`  
**狀態**: ✅ 正常（但數據為空）

---

## 📋 待測試的端點

由於核心 API 失敗，以下端點無法有效測試：

1. ❓ `POST /api/blog/articles` - 創建文章
2. ❓ `PUT /api/blog/articles/{slug}` - 更新文章
3. ❓ `DELETE /api/blog/articles/{slug}` - 刪除文章
4. ❓ `POST /api/blog/articles/{id}/comments` - 發表評論
5. ❓ `PUT /api/blog/comments/{id}/moderate` - 審核評論
6. ❓ `POST /api/posts` - 圖片上傳
7. ❓ `POST /api/token/refresh` - 刷新 Token
8. ❓ `POST /api/logout` - 登出

**原因**: 需要先有可用的文章數據才能測試相關操作。

---

## 🎯 修復優先級建議

### P0 - 立即修復 (阻塞前端開發)
1. ✅ 文章列表 API (`GET /api/blog/articles`)
2. ✅ 文章詳情 API (`GET /api/blog/articles/{slug}`)

### P1 - 盡快修復 (影響用戶體驗)
3. ✅ 評論列表 API (`GET /api/blog/articles/{id}/comments`)

### P2 - 後續優化
4. 標籤數據初始化

---

## 📊 測試環境信息

- **測試時間**: 2025-11-27 12:00 GMT+8
- **測試工具**: 
  - 自定義 HTML API 測試頁面
  - curl 命令行工具
- **認證方式**: Bearer Token (JWT)
- **測試帳號**: 3331322@gmail.com

---

## 🔧 後續協作流程

1. **後端修復 P0 問題** → 通知前端團隊
2. **前端重新測試** → 確認修復
3. **測試剩餘端點** → 提交新的問題報告（如有）
4. **前端繼續開發** → 集成已修復的 API

---

## 📎 附件

- API 測試頁面: `/Users/dc/Documents/P-blog-frontend/api-test.html`
- API 文檔參考: `/Users/dc/Documents/P-blog-frontend/blog_api_documentation.md`

---

**報告人**: Frontend Team  
**日期**: 2025-11-27  
**聯絡方式**: [通過項目管理工具溝通]
