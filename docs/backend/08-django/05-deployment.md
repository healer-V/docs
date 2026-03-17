---
title: "Django 项目部署"
category: "后端 · Django"
tags:
  - Django
  - 部署
  - Nginx
  - Gunicorn
date: 2026-03-17
excerpt: "Django 项目的生产部署通常采用 Nginx + Gunicorn 的经典架构，Nginx 负责静态文件和反向代理，Gunicorn 作为 WSGI 服务器运行 Django 应用，配合 Docker 实现标准化部署。"
---

# Django 项目部署

## 一、生产环境配置

### 1. settings.py 分环境管理

生产环境与开发环境的配置差异显著，推荐使用多配置文件方案管理。

::: details 多环境配置结构
```
mysite/
├── settings/
│   ├── __init__.py
│   ├── base.py       # 公共配置
│   ├── dev.py        # 开发环境
│   └── prod.py       # 生产环境
```

```python
# mysite/settings/base.py（公共配置）
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'apps.users',
    'apps.products',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # 静态文件服务
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

ROOT_URLCONF = 'mysite.urls'
WSGI_APPLICATION = 'mysite.wsgi.application'

LANGUAGE_CODE = 'zh-hans'
TIME_ZONE = 'Asia/Shanghai'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'  # collectstatic 输出目录
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

```python
# mysite/settings/prod.py（生产环境）
from .base import *

DEBUG = False

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# 生产数据库
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
        'CONN_MAX_AGE': 60,  # 数据库连接持久化（秒）
    }
}

# Redis 缓存
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
    }
}

# 安全配置
SECURE_HSTS_SECONDS = 31536000       # 强制 HTTPS（1年）
SECURE_SSL_REDIRECT = True           # HTTP 自动跳转 HTTPS
SESSION_COOKIE_SECURE = True         # Cookie 仅通过 HTTPS 传输
CSRF_COOKIE_SECURE = True

# 日志配置
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{asctime} {levelname} {name} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/django/app.log',
            'maxBytes': 100 * 1024 * 1024,  # 100MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {'handlers': ['file'], 'level': 'WARNING', 'propagate': False},
        'apps': {'handlers': ['file'], 'level': 'INFO', 'propagate': False},
    }
}
```
:::

::: danger SECRET_KEY 与敏感配置
生产环境的 `SECRET_KEY`、数据库密码、第三方 API Key 等绝对不能硬编码在代码中，必须通过环境变量或 `.env` 文件注入，并确保 `.env` 已加入 `.gitignore`。
:::

---

## 二、WSGI 与 ASGI

### 1. WSGI vs ASGI 选择

| 协议 | 说明 | 适用场景 |
|------|------|----------|
| **WSGI** | 同步接口，历史最长，生态成熟 | 传统 HTTP API，无 WebSocket 需求 |
| **ASGI** | 异步接口，Django 3.0+ 支持 | WebSocket、HTTP/2、异步视图 |

Django 同时提供 `wsgi.py` 和 `asgi.py`，根据需求选择对应的服务器。

::: details WSGI/ASGI 入口文件
```python
# mysite/wsgi.py
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings.prod')
application = get_wsgi_application()
```

```python
# mysite/asgi.py（ASGI 入口，用于 Daphne/Uvicorn）
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings.prod')
application = get_asgi_application()
```
:::

---

## 三、Gunicorn 配置

Gunicorn 是一个轻量级的 Python WSGI HTTP 服务器，是 Django 生产部署最常用的选择。

### 1. 安装与启动

```bash
pip install gunicorn

# 基本启动命令
gunicorn mysite.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \         # Worker 进程数
    --threads 2 \         # 每个 Worker 的线程数
    --timeout 60          # 请求超时时间（秒）
```

### 2. Gunicorn 配置文件

::: details gunicorn.conf.py 完整配置
```python
# gunicorn.conf.py
import multiprocessing

# 绑定地址（Nginx 反代时使用 Unix Socket 更高效）
bind = 'unix:/run/gunicorn/gunicorn.sock'
# bind = '127.0.0.1:8000'  # TCP 方式

# Worker 数量建议：CPU 核心数 * 2 + 1
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'        # sync（默认）/ gevent / uvicorn（ASGI）
threads = 2                  # 每个 Worker 的线程数（worker_class=sync 时有效）

# 超时配置
timeout = 60                 # Worker 响应超时，超时则重启该 Worker
keepalive = 5                # Keep-Alive 连接超时

# 进程管理
max_requests = 1000          # Worker 处理 1000 个请求后自动重启（防内存泄漏）
max_requests_jitter = 100    # 添加随机抖动，避免所有 Worker 同时重启

# 日志
accesslog = '/var/log/gunicorn/access.log'
errorlog = '/var/log/gunicorn/error.log'
loglevel = 'info'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s %(f)s %(a)s'

# 进程名称（ps 命令可见）
proc_name = 'demo-gunicorn'

# 预加载应用（减少内存，但不支持代码热更新）
preload_app = True
```

```bash
# 使用配置文件启动
gunicorn -c gunicorn.conf.py mysite.wsgi:application
```
:::

---

## 四、Nginx 反向代理

Nginx 在 Gunicorn 前端承担以下职责：处理静态文件、SSL 终止、请求限流、负载均衡。

### 1. Nginx 配置

::: details Nginx + Gunicorn 配置示例
```nginx
# /etc/nginx/sites-available/demo.conf

# 限流：每个 IP 每秒最多 10 个请求
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

upstream gunicorn {
    server unix:/run/gunicorn/gunicorn.sock fail_timeout=0;
    # 多实例负载均衡
    # server 127.0.0.1:8000;
    # server 127.0.0.1:8001;
}

server {
    listen 80;
    server_name your-domain.com;
    # HTTP 强制跳转 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 客户端请求体大小限制（文件上传）
    client_max_body_size 20M;

    # 静态文件（Nginx 直接处理，不经过 Gunicorn）
    location /static/ {
        alias /var/www/demo/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        gzip_static on;
    }

    location /media/ {
        alias /var/www/demo/media/;
        expires 7d;
    }

    # API 请求转发给 Gunicorn
    location / {
        limit_req zone=api burst=20 nodelay;  # 允许突发 20 个请求

        proxy_pass http://gunicorn;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 10s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

```bash
# 测试配置并重载 Nginx
nginx -t && nginx -s reload
```
:::

---

## 五、静态文件处理

### 1. collectstatic

Django 开发环境的静态文件分散在各 app 的 `static/` 目录下，部署前需要使用 `collectstatic` 命令将其汇总到 `STATIC_ROOT`。

```bash
# 收集所有静态文件到 STATIC_ROOT
python manage.py collectstatic --noinput
```

### 2. WhiteNoise（无 Nginx 场景）

在不使用 Nginx 的情况下（如 Heroku、Railway 等 PaaS 平台），可以用 WhiteNoise 直接从 Django 服务静态文件。

::: details WhiteNoise 配置
```bash
pip install whitenoise
```

```python
# mysite/settings/prod.py
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # 紧跟 SecurityMiddleware 之后
    # ...
]

# 开启 Gzip 压缩和文件指纹缓存
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```
:::

---

## 六、Celery 异步任务

### 1. 安装与配置

::: details Celery 基础配置
```bash
pip install celery redis
```

```python
# mysite/celery.py
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings.prod')

app = Celery('mysite')
# 从 Django settings 中读取 celery 配置（以 CELERY_ 为前缀）
app.config_from_object('django.conf:settings', namespace='CELERY')
# 自动发现各 app 下的 tasks.py
app.autodiscover_tasks()
```

```python
# mysite/__init__.py
from .celery import app as celery_app
__all__ = ('celery_app',)
```

```python
# mysite/settings/base.py
CELERY_BROKER_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/1')
CELERY_RESULT_BACKEND = os.environ.get('REDIS_URL', 'redis://localhost:6379/1')
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TIMEZONE = 'Asia/Shanghai'
```

```python
# src/apps/users/tasks.py
from celery import shared_task
from django.core.mail import send_mail


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_welcome_email(self, user_id: int):
    """发送欢迎邮件（异步任务）"""
    try:
        from .models import User
        user = User.objects.get(id=user_id)
        send_mail(
            subject='欢迎注册',
            message=f'你好，{user.username}！欢迎加入我们。',
            from_email='noreply@example.com',
            recipient_list=[user.email],
        )
    except Exception as exc:
        # 失败时重试
        raise self.retry(exc=exc)


# 在视图中调用异步任务
def register_view(request):
    user = create_user(request.data)
    # .delay() 异步执行，不阻塞当前请求
    send_welcome_email.delay(user.id)
    return Response({'message': '注册成功'})
```

```bash
# 启动 Worker
celery -A mysite worker --loglevel=info --concurrency=4

# 启动定时任务调度器（如有 beat 任务）
celery -A mysite beat --loglevel=info
```
:::

---

## 七、Docker 部署

### 1. Dockerfile

::: details 多阶段构建 Dockerfile
```dockerfile
# Dockerfile

# 第一阶段：安装依赖
FROM python:3.12-slim AS builder
WORKDIR /build

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# 第二阶段：运行环境
FROM python:3.12-slim
WORKDIR /app

# 安装运行时依赖
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# 从构建阶段复制已安装的包
COPY --from=builder /root/.local /root/.local

# 创建非 root 用户
RUN useradd -m -s /bin/bash appuser
USER appuser

COPY --chown=appuser:appuser . .

ENV PYTHONPATH=/app
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# 启动脚本（收集静态文件 + 运行迁移 + 启动 Gunicorn）
COPY --chown=appuser:appuser docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

```bash
#!/bin/bash
# docker-entrypoint.sh

set -e

echo "正在执行数据库迁移..."
python manage.py migrate --noinput

echo "正在收集静态文件..."
python manage.py collectstatic --noinput

echo "启动 Gunicorn..."
exec gunicorn mysite.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "${GUNICORN_WORKERS:-4}" \
    --timeout 60 \
    --access-logfile - \
    --error-logfile -
```
:::

### 2. docker-compose 编排

::: details docker-compose.yml 完整示例
```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    container_name: demo-web
    expose:
      - "8000"
    environment:
      - DJANGO_SETTINGS_MODULE=mysite.settings.prod
      - DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}
      - DB_HOST=mysql
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
      - ALLOWED_HOSTS=${ALLOWED_HOSTS}
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped

  celery:
    build: .
    container_name: demo-celery
    command: celery -A mysite worker --loglevel=info --concurrency=4
    environment:
      - DJANGO_SETTINGS_MODULE=mysite.settings.prod
      - DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}
      - DB_HOST=mysql
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/1
    depends_on:
      - web
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: demo-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/ssl:ro
      - static_volume:/var/www/static:ro
      - media_volume:/var/www/media:ro
    depends_on:
      - web
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    container_name: demo-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: demo-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
  static_volume:
  media_volume:
```

```bash
# 启动全部服务
docker-compose up -d

# 查看各服务状态
docker-compose ps

# 查看 Web 服务日志
docker-compose logs -f web

# 进入容器执行管理命令
docker-compose exec web python manage.py createsuperuser
```
:::

::: tip 部署检查清单
部署前确认以下事项：
- `DEBUG = False`，`ALLOWED_HOSTS` 已正确配置
- `SECRET_KEY` 已通过环境变量注入，不在代码中
- 已执行 `collectstatic` 收集静态文件
- 已执行 `migrate` 完成数据库迁移
- 数据库有定期备份策略
- 日志已配置且有可用空间
:::
