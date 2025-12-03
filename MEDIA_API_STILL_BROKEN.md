# Media API 仍然返回 500 错误

## 问题
虽然后端团队声称已修复 Media API，但实际测试显示**所有上传请求仍然返回 500 Internal Server Error**。

## 测试结果

### 测试1：简单文本文件
```bash
curl -X POST \
  -H "Authorization: Bearer {有效token}" \
  -F "files[]=@test.txt" \
  "https://pyqapi.3331322.xyz/api/media"
```

**结果**：
```json
{
  "success": false,
  "error": "Internal Server Error"
}
```

### 测试2：WordPress图片迁移脚本
运行 `node migrate-images-to-media.mjs` 处理119篇文章。

**结果**：
- 发现7张需要迁移的图片
- **全部上传失败，返回500错误**：
  1. `截圖-2023-09-17-19.05.23.png` - 500
  2. `IMG_0450-1024x768.jpeg` - 500
  3. `IMG_0014-1-524x1024.jpg` - 500
  4. `IMG_0026.jpeg` - 500
  5. `Notes_1660386002000.jpeg` - 500
  6. `合照-005_16-.jpg` - 500
  7. `合照-011_ALIM0581-.jpg` - 500

## Token验证
Token是有效的：
- ✅ Token: `eyJhbGciOiJIUzI1NiIsInR...` (exp: 1764402899)
- ✅ 其他API（如获取文章）使用同一token正常工作
- ✅ Token未过期（15分钟有效期内）

## 可能的原因

1. **代码未部署**：后端修改的代码可能没有正确部署到服务器
2. **PHP-FPM未重启**：需要重启PHP-FPM才能加载新代码
3. **路由问题**：Media API的路由配置可能有问题
4. **权限问题**：uploads目录可能没有写入权限
5. **数据库问题**：media表可能有问题

## 需要后端检查

### 1. 确认代码已部署
```bash
cd /www/wwwroot/pyqapi.3331322.xyz
git log -1  # 检查最新commit
```

### 2. 重启PHP-FPM
```bash
/etc/init.d/php-fpm-82 restart
```

### 3. 检查错误日志
```bash
tail -50 /www/server/php/82/var/log/php-fpm.log
```

### 4. 检查uploads目录
```bash
ls -la /www/wwwroot/pyqapi.3331322.xyz/public/uploads
```

### 5. 测试端点是否存在
```bash
curl -i https://pyqapi.3331322.xyz/api/media
# 应该返回 405 Method Not Allowed (说明路由存在但不接受GET)
# 如果返回 404，说明路由不存在
```

## 优先级
**紧急** - 这是WordPress图片迁移的唯一阻塞问题。

## 时间线
- 2025-11-29 15:38 - 后端声称已修复
- 2025-11-29 15:42 - 实际测试发现仍然500错误

## 前端状态
✅ 前端已准备就绪：
- 迁移脚本完成并测试
- Token机制正常
- 只等后端Media API正常工作

**请后端团队提供实际的测试证据（curl命令和成功响应）来证明API已修复。**
