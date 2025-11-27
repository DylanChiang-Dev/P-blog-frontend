# Backend API 再次重測報告 (Article Detail 500)

**測試時間**: 2025-11-27 13:05 GMT+8  
**狀態**: ❌ Article Detail API 仍然失敗

---

## 🔴 嚴重問題：文章詳情 API 返回 500

儘管文章列表 API 已修復，但**文章詳情 API** 對於新創建的文章仍然返回 500 錯誤。

### 測試案例

**文章 Slug**: `backend-fix-verification` (剛剛通過 API 創建的文章)

**請求**:
```bash
curl -v "https://pyqapi.3331322.xyz/api/blog/articles/backend-fix-verification"
```

**響應**:
```json
HTTP/2 500 
{
  "success": false,
  "error": "Internal Server Error"
}
```

### 對比案例

**文章 Slug**: `welcome-to-astro-blog` (不存在的文章?)
**響應**: `404 Not Found` (Nginx HTML 頁面)

---

## 🔍 分析

1. **路由可達**: 請求 `backend-fix-verification` 返回了 JSON 格式的 500 錯誤，說明請求成功到達了 Laravel/PHP 應用層。
2. **應用崩潰**: 500 錯誤表明在控制器處理邏輯或數據庫查詢中發生了未捕獲的異常。
3. **可能原因**:
   - `content` 字段處理問題 (Markdown 解析?)
   - 關聯數據加載失敗 (`author`, `tags`, `categories`)
   - 權限檢查邏輯在詳情頁中仍然有誤

## 🛠 建議後端檢查

請檢查 `BlogController@show` 方法 (或對應的詳情頁控制器)：

1. **查看錯誤日志**:
   ```bash
   tail -n 50 /www/server/php/82/var/log/php-fpm.log
   # 或 Laravel 日志
   tail -n 50 storage/logs/laravel.log
   ```

2. **檢查關聯加載**:
   確認是否嘗試訪問了不存在的關聯對象屬性 (例如 `$article->author->name` 當 author 為 null 時)。

3. **檢查權限**:
   確認詳情頁的權限檢查邏輯是否也修復了 `$req->user` 的問題。

---

**前端狀態**:
前端已切換為 SSR 模式以規避構建錯誤，但由於後端返回 500，用戶訪問文章頁面時會被重定向到 404 頁面 (或顯示錯誤)。
