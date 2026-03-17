---
title: "Django 视图与路由"
category: "后端 · Django"
tags:
  - Django
  - 视图
  - URL路由
  - CBV
date: 2026-03-17
excerpt: "Django 的视图层负责接收 HTTP 请求、执行业务逻辑并返回响应。函数视图（FBV）灵活直观，类视图（CBV）通过继承减少重复代码，两种方式各有适用场景。"
---

# Django 视图与路由

## 一、URL 路由

### 1. 基础路由配置

Django 通过 `urls.py` 定义 URL 与视图的映射关系。

::: details URL 路由配置示例
```python
# src/mysite/urls.py（根路由）
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # include：将 /api/users/ 开头的路由分发到 users app
    path('api/users/', include('apps.users.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/orders/', include('apps.orders.urls')),
]
```

```python
# src/apps/users/urls.py（应用级路由）
from django.urls import path
from . import views

# app_name 用于命名空间，避免不同 app 中 URL 名称冲突
app_name = 'users'

urlpatterns = [
    # path：固定路径
    path('', views.UserListView.as_view(), name='list'),
    # <int:pk>：路径参数，类型为整数
    path('<int:pk>/', views.UserDetailView.as_view(), name='detail'),
    # <str:username>：字符串路径参数
    path('by-name/<str:username>/', views.get_by_username, name='by-name'),
]
```
:::

### 2. 路径转换器

| 转换器 | 匹配规则 | 示例 URL |
|--------|----------|----------|
| `int` | 正整数 | `/users/42/` |
| `str` | 非空字符串（不含 `/`） | `/users/john/` |
| `slug` | 字母、数字、连字符、下划线 | `/posts/hello-world/` |
| `uuid` | UUID 格式 | `/items/550e8400-e29b-41d4/` |
| `path` | 包含 `/` 的完整路径 | `/files/a/b/c.txt` |

### 3. re_path 正则路由

::: details 正则表达式路由示例
```python
from django.urls import re_path

urlpatterns = [
    # 匹配 4 位年份 + 2 位月份
    re_path(r'^archive/(?P<year>\d{4})/(?P<month>\d{2})/$',
            views.ArchiveView.as_view(),
            name='archive'),
]
```
:::

### 4. 命名 URL 反向解析

::: details 命名 URL 使用示例
```python
from django.urls import reverse

# 反向解析 URL（避免硬编码路径）
url = reverse('users:detail', kwargs={'pk': 42})
# 结果：'/api/users/42/'

# 在视图中使用
from django.http import HttpResponseRedirect

def create_user(request):
    # ... 创建逻辑
    return HttpResponseRedirect(reverse('users:list'))
```
:::

---

## 二、函数视图（FBV）

函数视图直接接收 `HttpRequest` 对象，返回 `HttpResponse` 对象，逻辑清晰、灵活。

::: details 函数视图完整示例
```python
# src/apps/products/views.py
import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from .models import Product


# require_http_methods：限制允许的 HTTP 方法
@require_http_methods(['GET'])
def product_list(request):
    """获取商品列表"""
    category = request.GET.get('category')  # 获取查询参数
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 10))

    queryset = Product.objects.filter(is_published=True)
    if category:
        queryset = queryset.filter(category=category)

    # 简单分页
    start = (page - 1) * page_size
    end = start + page_size
    products = queryset[start:end]

    data = [
        {
            'id': p.id,
            'name': p.name,
            'price': str(p.price),  # Decimal 转字符串
            'category': p.category,
        }
        for p in products
    ]
    return JsonResponse({'code': 200, 'data': data})


@login_required  # 需要登录
def product_detail(request, pk):
    """商品详情（支持 GET/PUT/DELETE）"""
    try:
        product = Product.objects.get(pk=pk, is_published=True)
    except Product.DoesNotExist:
        return JsonResponse({'code': 404, 'message': '商品不存在'}, status=404)

    if request.method == 'GET':
        data = {'id': product.id, 'name': product.name, 'price': str(product.price)}
        return JsonResponse({'code': 200, 'data': data})

    elif request.method == 'PUT':
        body = json.loads(request.body)
        product.name = body.get('name', product.name)
        product.price = body.get('price', product.price)
        product.save()
        return JsonResponse({'code': 200, 'message': '更新成功'})

    elif request.method == 'DELETE':
        product.delete()
        return HttpResponse(status=204)
```
:::

---

## 三、类视图（CBV）

类视图通过继承减少重复代码，不同 HTTP 方法对应不同方法（`get()`、`post()` 等），结构更清晰。

### 1. 基础类视图（View）

::: details View 类视图示例
```python
# src/apps/products/views.py
from django.views import View
from django.http import JsonResponse
import json


class ProductListView(View):

    def get(self, request):
        """GET /api/products/ — 获取列表"""
        products = Product.objects.filter(is_published=True).values(
            'id', 'name', 'price', 'category'
        )
        return JsonResponse({'code': 200, 'data': list(products)})

    def post(self, request):
        """POST /api/products/ — 创建商品"""
        body = json.loads(request.body)
        product = Product.objects.create(
            name=body['name'],
            price=body['price'],
            category=body.get('category', ''),
        )
        return JsonResponse(
            {'code': 201, 'data': {'id': product.id}},
            status=201
        )


class ProductDetailView(View):

    def get_object(self, pk):
        try:
            return Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return None

    def get(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return JsonResponse({'code': 404, 'message': '不存在'}, status=404)
        return JsonResponse({'code': 200, 'data': {'id': product.id, 'name': product.name}})

    def delete(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return JsonResponse({'code': 404, 'message': '不存在'}, status=404)
        product.delete()
        from django.http import HttpResponse
        return HttpResponse(status=204)
```
:::

### 2. 通用类视图

Django 提供了开箱即用的通用视图，适合快速构建标准页面。

| 通用视图 | 用途 |
|----------|------|
| `TemplateView` | 渲染模板，无模型绑定 |
| `ListView` | 展示模型列表 |
| `DetailView` | 展示单个模型详情 |
| `CreateView` | 创建模型表单 |
| `UpdateView` | 更新模型表单 |
| `DeleteView` | 删除确认 |

::: details 通用类视图示例
```python
# src/apps/blog/views.py
from django.views.generic import ListView, DetailView, CreateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from .models import Article


class ArticleListView(ListView):
    model = Article
    template_name = 'blog/article_list.html'
    context_object_name = 'articles'    # 模板中使用的变量名（默认 object_list）
    paginate_by = 10                    # 每页 10 条

    # 自定义 QuerySet（过滤、排序等）
    def get_queryset(self):
        queryset = super().get_queryset().filter(is_published=True)
        category = self.request.GET.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    # 向模板注入额外上下文
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = Article.objects.values_list(
            'category', flat=True).distinct()
        return context


class ArticleDetailView(DetailView):
    model = Article
    template_name = 'blog/article_detail.html'
    context_object_name = 'article'


class ArticleCreateView(LoginRequiredMixin, CreateView):
    model = Article
    fields = ['title', 'content', 'category', 'tags']
    template_name = 'blog/article_form.html'
    success_url = reverse_lazy('blog:list')  # 创建成功后跳转

    # 自动设置作者为当前登录用户
    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)
```
:::

---

## 四、请求与响应

### 1. HttpRequest 常用属性

| 属性/方法 | 说明 |
|-----------|------|
| `request.method` | HTTP 方法（`'GET'`、`'POST'` 等） |
| `request.GET` | 查询字符串参数（`QueryDict`） |
| `request.POST` | 表单数据（`QueryDict`） |
| `request.body` | 原始请求体（`bytes`） |
| `request.FILES` | 上传的文件 |
| `request.headers` | 请求头（Django 2.2+） |
| `request.user` | 当前用户（需启用认证中间件） |
| `request.session` | 会话数据 |
| `request.META` | 服务器/请求元信息（IP、Host 等） |

::: details 获取请求信息示例
```python
def example_view(request):
    # 获取客户端 IP
    client_ip = request.META.get('HTTP_X_FORWARDED_FOR',
                                  request.META.get('REMOTE_ADDR'))

    # 获取请求头
    content_type = request.headers.get('Content-Type', '')
    token = request.headers.get('Authorization', '')

    # 解析 JSON 请求体
    if 'application/json' in content_type:
        data = json.loads(request.body)

    # 获取查询参数（带默认值）
    page = request.GET.get('page', '1')
    keyword = request.GET.get('q', '')
```
:::

### 2. 响应类型

::: details 常用响应类示例
```python
from django.http import (
    HttpResponse, JsonResponse, HttpResponseRedirect,
    HttpResponseNotFound, Http404
)

# 纯文本响应
return HttpResponse('Hello World', content_type='text/plain', status=200)

# JSON 响应（自动序列化字典，设置 Content-Type: application/json）
return JsonResponse({'code': 200, 'data': {'id': 1}})
return JsonResponse({'code': 400, 'message': '参数错误'}, status=400)
# safe=False 允许序列化列表（非字典）
return JsonResponse([1, 2, 3], safe=False)

# 重定向
return HttpResponseRedirect('/api/users/1/')
return HttpResponseRedirect(reverse('users:detail', kwargs={'pk': 1}))

# 404 响应
raise Http404('商品不存在')  # 触发 Django 的 404 处理器
```
:::

---

## 五、中间件机制

### 1. 中间件工作原理

中间件是 Django 的请求/响应处理钩子，所有请求都会按顺序经过中间件链，响应则以相反顺序返回。

::: details 自定义中间件示例
```python
# src/apps/core/middleware.py
import time
import logging

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware:
    """记录请求耗时的中间件"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        # 请求到达视图之前
        request.start_time = start_time

        response = self.get_response(request)  # 调用下一个中间件或视图

        # 响应返回之后
        elapsed = (time.time() - start_time) * 1000
        logger.info(
            '%s %s %d %.2fms',
            request.method,
            request.path,
            response.status_code,
            elapsed
        )
        # 在响应头中注入耗时
        response['X-Response-Time'] = f'{elapsed:.2f}ms'
        return response


class JWTAuthMiddleware:
    """JWT 认证中间件"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            try:
                payload = verify_jwt(token)  # 自定义验证函数
                request.user_id = payload.get('user_id')
            except Exception:
                pass
        return self.get_response(request)
```

```python
# src/mysite/settings.py（注册中间件）
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'apps.core.middleware.RequestLoggingMiddleware',  # 自定义中间件
]
```
:::

---

## 六、装饰器

### 1. 内置装饰器

::: details 常用内置装饰器示例
```python
from django.contrib.auth.decorators import login_required, permission_required
from django.views.decorators.http import require_http_methods, require_GET, require_POST
from django.views.decorators.cache import cache_page
from django.views.decorators.csrf import csrf_exempt


# 需要登录，未登录跳转到 LOGIN_URL
@login_required(login_url='/api/auth/login/')
def profile_view(request):
    return JsonResponse({'user': request.user.username})


# 需要特定权限
@permission_required('products.add_product', raise_exception=True)
def create_product(request):
    pass


# 限制请求方法
@require_GET
def health_check(request):
    return JsonResponse({'status': 'ok'})


@require_http_methods(['GET', 'POST'])
def products(request):
    pass


# 视图缓存（缓存 15 分钟）
@cache_page(60 * 15)
def product_list(request):
    pass


# 跳过 CSRF 验证（仅用于第三方 Webhook 等场景）
@csrf_exempt
def webhook_handler(request):
    pass
```
:::

### 2. 自定义装饰器

::: details 自定义权限装饰器示例
```python
# src/apps/core/decorators.py
from functools import wraps
from django.http import JsonResponse


def require_admin(func):
    """要求用户为管理员"""
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'code': 401, 'message': '请先登录'}, status=401)
        if not request.user.is_staff:
            return JsonResponse({'code': 403, 'message': '无权限'}, status=403)
        return func(request, *args, **kwargs)
    return wrapper


def rate_limit(max_calls=60, period=60):
    """简单请求频率限制装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            from django.core.cache import cache
            client_ip = request.META.get('REMOTE_ADDR', 'unknown')
            cache_key = f'rate_limit:{func.__name__}:{client_ip}'
            count = cache.get(cache_key, 0)
            if count >= max_calls:
                return JsonResponse(
                    {'code': 429, 'message': '请求过于频繁，请稍后再试'},
                    status=429
                )
            cache.set(cache_key, count + 1, period)
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


# 使用示例
@require_admin
@rate_limit(max_calls=10, period=60)
def sensitive_operation(request):
    pass
```
:::
