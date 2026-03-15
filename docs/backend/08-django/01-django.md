---
title: "Django 概述"
category: "后端 · Django"
tags:
  - Go
  - Django
excerpt: "Django 是一个基于 Python 的高级 Web 框架，遵循 MVT（Model-View-Template） 架构模式，强调快速开发和简洁实用的设计。 | 层级 | 职责 | 对应文件 | |------|------|------..."
---

# Django 概述

## 一、什么是 Django

Django 是一个基于 Python 的高级 Web 框架，遵循 **MVT（Model-View-Template）** 架构模式，强调快速开发和简洁实用的设计。

### 1. MVT 架构

| 层级 | 职责 | 对应文件 |
|------|------|----------|
| **Model** | 数据模型与数据库交互 | `models.py` |
| **View** | 业务逻辑处理，接收请求并返回响应 | `views.py` |
| **Template** | 页面渲染与展示 | `templates/*.html` |

::: tip MVT 与 MVC 的区别
Django 的 MVT 中，**View** 相当于传统 MVC 的 Controller，而 **Template** 对应 MVC 的 View。Django 框架本身充当了 Controller 的角色，负责 URL 路由分发。
:::

### 2. Django 核心特性

- 自带 ORM，无需手写 SQL
- 内置 Admin 管理后台
- 完善的用户认证系统
- 强大的 URL 路由机制
- 跨站请求伪造（CSRF）保护
- 国际化与本地化支持

## 二、项目搭建

### 1. 安装与创建项目

::: details 安装 Django 并创建项目
```bash
# 安装 Django
pip install django

# 创建项目
django-admin startproject mysite

# 进入项目目录
cd mysite

# 创建应用
python manage.py startapp blog

# 启动开发服务器
python manage.py runserver
```
:::

### 2. 项目目录结构

```
mysite/
├── manage.py              # 项目管理命令入口
├── mysite/
│   ├── __init__.py
│   ├── settings.py        # 项目配置
│   ├── urls.py            # 根 URL 路由
│   ├── asgi.py            # ASGI 部署入口
│   └── wsgi.py            # WSGI 部署入口
└── blog/
    ├── __init__.py
    ├── admin.py            # Admin 后台注册
    ├── apps.py             # 应用配置
    ├── models.py           # 数据模型
    ├── views.py            # 视图函数
    ├── urls.py             # 应用级路由（需手动创建）
    ├── tests.py            # 单元测试
    └── migrations/         # 数据库迁移文件
```

### 3. 注册应用

::: details 在 settings.py 中注册应用
```python{5}
# mysite/settings.py
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'blog',  # 注册自定义应用
]
```
:::

## 三、URL 路由与视图

### 1. URL 路由配置

Django 使用 `urlpatterns` 列表将 URL 路径映射到视图函数。

::: details 基本路由配置
```python
# blog/urls.py
from django.urls import path
from . import views

app_name = 'blog'

urlpatterns = [
    path('', views.post_list, name='post_list'),
    path('<int:post_id>/', views.post_detail, name='post_detail'),
    path('category/<slug:category_slug>/', views.category_posts, name='category_posts'),
]
```

```python
# mysite/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('blog/', include('blog.urls')),
]
```
:::

### 2. 视图函数

::: details 函数视图（FBV）
```python
# blog/views.py
from django.shortcuts import render, get_object_or_404
from .models import Post

def post_list(request):
    """获取文章列表"""
    posts = Post.objects.filter(status='published').order_by('-created_at')
    return render(request, 'blog/post_list.html', {'posts': posts})

def post_detail(request, post_id):
    """获取文章详情"""
    post = get_object_or_404(Post, id=post_id, status='published')
    return render(request, 'blog/post_detail.html', {'post': post})
```
:::

### 3. 类视图（CBV）

::: details 使用类视图简化代码
```python
from django.views.generic import ListView, DetailView
from .models import Post

class PostListView(ListView):
    model = Post
    template_name = 'blog/post_list.html'
    context_object_name = 'posts'
    queryset = Post.objects.filter(status='published')
    paginate_by = 10

class PostDetailView(DetailView):
    model = Post
    template_name = 'blog/post_detail.html'
    context_object_name = 'post'
```

```python
# blog/urls.py 中使用类视图
urlpatterns = [
    path('', PostListView.as_view(), name='post_list'),
    path('<int:pk>/', PostDetailView.as_view(), name='post_detail'),
]
```
:::

## 四、模型与 ORM

### 1. 定义模型

::: details 创建博客文章模型
```python
# blog/models.py
from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    name = models.CharField('分类名称', max_length=100)
    slug = models.SlugField('URL 别名', unique=True)

    class Meta:
        verbose_name = '分类'
        verbose_name_plural = '分类'

    def __str__(self):
        return self.name

class Post(models.Model):
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('published', '已发布'),
    ]

    title = models.CharField('标题', max_length=200)
    slug = models.SlugField('URL 别名', unique=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='作者')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, verbose_name='分类')
    content = models.TextField('内容')
    status = models.CharField('状态', max_length=10, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '文章'
        verbose_name_plural = '文章'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
```
:::

### 2. 数据库迁移

::: details 执行迁移命令
```bash
# 生成迁移文件
python manage.py makemigrations

# 执行迁移
python manage.py migrate

# 查看迁移状态
python manage.py showmigrations
```
:::

### 3. ORM 查询

::: details 常用查询操作
```python
# 创建记录
post = Post.objects.create(
    title='Django 入门',
    slug='django-intro',
    author=user,
    content='Django 是一个优秀的 Web 框架',
    status='published',
)

# 查询所有已发布文章
posts = Post.objects.filter(status='published')

# 排除草稿
posts = Post.objects.exclude(status='draft')

# 链式查询
posts = Post.objects.filter(
    status='published',
    category__name='Python',
).order_by('-created_at')[:5]

# 聚合查询
from django.db.models import Count, Avg
category_stats = Category.objects.annotate(post_count=Count('post'))

# Q 对象实现复杂查询
from django.db.models import Q
results = Post.objects.filter(
    Q(title__icontains='django') | Q(content__icontains='django')
)

# 更新记录
Post.objects.filter(id=1).update(status='published')

# 删除记录
Post.objects.filter(status='draft', created_at__lt='2025-01-01').delete()
```
:::

::: warning 注意 N+1 查询问题
使用 `select_related`（外键）和 `prefetch_related`（多对多）优化关联查询，避免在循环中触发额外的数据库查询。

```python
# 优化外键查询
posts = Post.objects.select_related('author', 'category').all()

# 优化多对多查询
posts = Post.objects.prefetch_related('tags').all()
```
:::

## 五、模板

### 1. 模板语法

::: details 模板基础语法
```html
<!-- templates/blog/post_list.html -->
{% extends 'base.html' %}

{% block title %}博客文章列表{% endblock %}

{% block content %}
<h1>文章列表</h1>

{% for post in posts %}
  <article>
    <h2><a href="{% url 'blog:post_detail' post.id %}">{{ post.title }}</a></h2>
    <p>作者：{{ post.author.username }} | 时间：{{ post.created_at|date:"Y-m-d" }}</p>
    <p>{{ post.content|truncatewords:30 }}</p>
  </article>
{% empty %}
  <p>暂无文章</p>
{% endfor %}

{% if is_paginated %}
  <nav>
    {% if page_obj.has_previous %}
      <a href="?page={{ page_obj.previous_page_number }}">上一页</a>
    {% endif %}
    <span>第 {{ page_obj.number }} / {{ page_obj.paginator.num_pages }} 页</span>
    {% if page_obj.has_next %}
      <a href="?page={{ page_obj.next_page_number }}">下一页</a>
    {% endif %}
  </nav>
{% endif %}
{% endblock %}
```
:::

### 2. 模板继承

::: details 基础模板与继承
```html
<!-- templates/base.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>{% block title %}我的网站{% endblock %}</title>
    {% block extra_css %}{% endblock %}
</head>
<body>
    <nav>
        <a href="{% url 'blog:post_list' %}">首页</a>
    </nav>

    <main>
        {% block content %}{% endblock %}
    </main>

    <footer>
        <p>&copy; 2026 My Blog</p>
    </footer>

    {% block extra_js %}{% endblock %}
</body>
</html>
```
:::

### 3. 自定义模板标签与过滤器

::: details 创建自定义模板标签
```python
# blog/templatetags/blog_tags.py
from django import template
from blog.models import Post

register = template.Library()

@register.simple_tag
def total_posts():
    """返回已发布文章总数"""
    return Post.objects.filter(status='published').count()

@register.filter
def reading_time(content):
    """估算阅读时间（按中文 400 字/分钟）"""
    word_count = len(content)
    minutes = max(1, word_count // 400)
    return f'{minutes} 分钟'
```

```html
<!-- 在模板中使用 -->
{% load blog_tags %}
<p>共 {% total_posts %} 篇文章</p>
<p>预计阅读：{{ post.content|reading_time }}</p>
```
:::

## 六、表单与验证

### 1. Django 表单

::: details 创建和使用表单
```python
# blog/forms.py
from django import forms
from .models import Post

class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ['title', 'slug', 'category', 'content', 'status']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'placeholder': '请输入标题'}),
            'content': forms.Textarea(attrs={'class': 'form-control', 'rows': 10}),
        }

    def clean_title(self):
        """自定义标题验证"""
        title = self.cleaned_data['title']
        if len(title) < 5:
            raise forms.ValidationError('标题长度不能少于 5 个字符')
        return title
```
:::

### 2. 视图中处理表单

::: details 在视图中使用表单
```python
# blog/views.py
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .forms import PostForm

@login_required
def post_create(request):
    if request.method == 'POST':
        form = PostForm(request.POST)
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user
            post.save()
            return redirect('blog:post_detail', post_id=post.id)
    else:
        form = PostForm()
    return render(request, 'blog/post_form.html', {'form': form})
```

```html
<!-- templates/blog/post_form.html -->
{% extends 'base.html' %}
{% block content %}
<form method="post" novalidate>
    {% csrf_token %}
    {{ form.as_p }}
    <button type="submit">发布</button>
</form>
{% endblock %}
```
:::

## 七、Admin 管理后台

### 1. 注册模型到 Admin

::: details Admin 配置
```python
# blog/admin.py
from django.contrib import admin
from .models import Post, Category

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'category', 'status', 'created_at']
    list_filter = ['status', 'category', 'created_at']
    search_fields = ['title', 'content']
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    list_editable = ['status']
    list_per_page = 20
```
:::

### 2. 创建超级用户

```bash
python manage.py createsuperuser
```

访问 `http://127.0.0.1:8000/admin/` 即可进入管理后台。

## 八、中间件

### 1. 中间件工作原理

中间件是处理请求和响应的钩子框架，在视图执行前后进行全局处理。

```
Request → Middleware (逐层进入) → View → Middleware (逆序返回) → Response
```

### 2. 自定义中间件

::: details 实现请求耗时统计中间件
```python
# blog/middleware.py
import time
import logging

logger = logging.getLogger(__name__)

class RequestTimingMiddleware:
    """记录每个请求的处理耗时"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        response = self.get_response(request)

        duration = time.time() - start_time
        logger.info(f'{request.method} {request.path} - {duration:.3f}s')

        return response
```

```python{3}
# mysite/settings.py
MIDDLEWARE = [
    'blog.middleware.RequestTimingMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]
```
:::

::: warning 中间件顺序
中间件的注册顺序很重要。请求按照 `MIDDLEWARE` 列表从上到下执行，响应则从下到上返回。确保依赖关系正确，例如 `AuthenticationMiddleware` 必须在 `SessionMiddleware` 之后。
:::

## 九、Django REST Framework

Django REST Framework（DRF）是构建 Web API 的强大工具包。

### 1. 安装与配置

::: details 安装 DRF
```bash
pip install djangorestframework
```

```python{2}
# mysite/settings.py
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'blog',
]

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
}
```
:::

### 2. 序列化器

::: details 创建 Serializer
```python
# blog/serializers.py
from rest_framework import serializers
from .models import Post, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
    )

    class Meta:
        model = Post
        fields = ['id', 'title', 'slug', 'author_name', 'category', 'category_id',
                  'content', 'status', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
```
:::

### 3. 视图集与路由

::: details ViewSet 与 Router
```python
# blog/views_api.py
from rest_framework import viewsets, permissions
from .models import Post
from .serializers import PostSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.filter(status='published')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
```

```python
# blog/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_api import PostViewSet

router = DefaultRouter()
router.register('posts', PostViewSet)

urlpatterns = [
    # ... 其他 URL
    path('api/', include(router.urls)),
]
```
:::

::: tip DRF 自动生成的 API 端点
使用 `DefaultRouter` 注册 ViewSet 后，会自动生成以下端点：

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/posts/` | 文章列表 |
| `POST` | `/api/posts/` | 创建文章 |
| `GET` | `/api/posts/{id}/` | 文章详情 |
| `PUT` | `/api/posts/{id}/` | 更新文章 |
| `DELETE` | `/api/posts/{id}/` | 删除文章 |
:::
