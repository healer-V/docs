# 6.6 部署与CI/CD

## 6.6.1 构建生产版本

### 6.6.1.1 构建命令

```bash
npm run build
```

### 6.6.1.2 构建产物

::: tip 构建产物
构建后的文件在 `dist/` 目录，包含：
- `index.html`：入口 HTML 文件
- `js/`：JavaScript 文件
- `css/`：样式文件
- `img/`：图片资源
:::

## 6.6.2 部署方式

### 6.6.2.1 静态服务器部署

::: tip 静态部署
将 `dist/` 目录的内容部署到静态服务器，如 Nginx、Apache 等。
:::

### 6.6.2.2 Nginx 配置

```nginx
server {
  listen 80;
  server_name example.com;
  root /var/www/dist;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

## 6.6.3 CI/CD 配置

### 6.6.3.1 GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '14'
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Deploy
        run: # 部署命令
```

## 6.6.4 环境变量

::: tip 环境变量
使用 `.env` 文件管理不同环境的配置：
- `.env.development`：开发环境
- `.env.production`：生产环境
:::

## 6.6.5 总结

::: tip 总结
自动化部署可以大大提高开发效率，减少人为错误，保证部署的一致性。
:::
