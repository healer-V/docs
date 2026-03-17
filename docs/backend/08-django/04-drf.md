---
title: "Django REST Framework"
category: "后端 · Django"
tags:
  - Django
  - DRF
  - REST
  - API
date: 2026-03-17
excerpt: "Django REST Framework（DRF）是构建 RESTful API 的利器，提供序列化器、视图集、路由器、认证权限等完整工具链，极大提升 API 开发效率。"
---

# Django REST Framework

## 一、安装与基础配置

::: details 安装与全局配置
```bash
pip install djangorestframework
pip install djangorestframework-simplejwt  # JWT 支持
pip install drf-spectacular               # API 文档生成
```

```python
# src/mysite/settings.py
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'rest_framework_simplejwt',
    'drf_spectacular',
]

REST_FRAMEWORK = {
    # 默认认证方式
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    # 默认权限：需要登录才能访问
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    # 默认分页
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    # 默认过滤后端
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    # API 文档
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}
```
:::

---

## 二、Serializer 序列化器

### 1. 基础 Serializer

序列化器（Serializer）负责数据的序列化（Python 对象 → JSON）和反序列化（JSON → Python 对象），同时承担数据验证职责。

::: details Serializer 定义与使用
```python
# src/apps/users/serializers.py
from rest_framework import serializers
from .models import User


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(max_length=50)
    email = serializers.EmailField()
    # write_only=True：字段只接收输入，不出现在输出中
    password = serializers.CharField(max_length=128, write_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    def validate_username(self, value):
        """字段级校验：方法名格式为 validate_<field_name>"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('用户名已存在')
        return value

    def validate(self, attrs):
        """对象级校验：可访问多个字段"""
        # 例如：校验密码确认
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({'confirm_password': '两次密码不一致'})
        return attrs

    def create(self, validated_data):
        """反序列化时调用，创建对象"""
        validated_data.pop('confirm_password', None)
        validated_data['password'] = make_password(validated_data['password'])
        return User.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """反序列化时调用，更新对象"""
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.save()
        return instance
```

```python
# 在视图中使用序列化器
from rest_framework.views import APIView
from rest_framework.response import Response

class UserListView(APIView):
    def get(self, request):
        users = User.objects.all()
        # many=True：序列化列表
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=201)
        # serializer.errors：包含所有字段的错误信息
        return Response(serializer.errors, status=400)
```
:::

### 2. ModelSerializer

`ModelSerializer` 自动根据模型生成字段，大幅减少重复代码。

::: details ModelSerializer 完整示例
```python
# src/apps/products/serializers.py
from rest_framework import serializers
from .models import Product, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class ProductSerializer(serializers.ModelSerializer):
    # 嵌套序列化器（只读）
    category_info = CategorySerializer(source='category', read_only=True)
    # 自定义只读字段
    price_display = serializers.SerializerMethodField()
    # 写入时使用外键 ID，读取时使用嵌套对象
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        write_only=True
    )

    class Meta:
        model = Product
        # fields：明确列出要包含的字段（推荐，避免意外暴露敏感字段）
        fields = [
            'id', 'name', 'price', 'price_display',
            'stock', 'category', 'category_info',
            'is_published', 'created_at'
        ]
        # read_only_fields：声明只读字段
        read_only_fields = ['id', 'created_at']
        # extra_kwargs：为字段添加额外选项
        extra_kwargs = {
            'price': {'min_value': 0},
            'stock': {'min_value': 0, 'default': 0},
        }

    def get_price_display(self, obj):
        """SerializerMethodField 对应的方法，格式：get_<field_name>"""
        return f'¥{obj.price:.2f}'

    def validate_name(self, value):
        if len(value) < 2:
            raise serializers.ValidationError('商品名称至少 2 个字符')
        return value
```
:::

---

## 三、APIView 与 GenericAPIView

### 1. APIView

`APIView` 是 DRF 视图的基类，提供认证、权限、限流等功能，比 Django 原生 `View` 更适合 API 开发。

::: details APIView 使用示例
```python
# src/apps/products/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Product
from .serializers import ProductSerializer


class ProductListAPIView(APIView):
    # 覆盖全局权限设置
    permission_classes = [AllowAny]

    def get(self, request):
        products = Product.objects.filter(is_published=True)
        serializer = ProductSerializer(products, many=True)
        return Response({'code': 200, 'data': serializer.data})

    def post(self, request):
        serializer = ProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)  # 验证失败自动返回 400
        product = serializer.save()
        return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)


class ProductDetailAPIView(APIView):

    def get_object(self, pk):
        from django.shortcuts import get_object_or_404
        return get_object_or_404(Product, pk=pk)

    def get(self, request, pk):
        product = self.get_object(pk)
        return Response(ProductSerializer(product).data)

    def put(self, request, pk):
        product = self.get_object(pk)
        # partial=True：允许部分更新（PATCH 语义）
        serializer = ProductSerializer(product, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        product = self.get_object(pk)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
```
:::

### 2. GenericAPIView 与 Mixin

`GenericAPIView` 提供 `get_queryset()`、`get_serializer()` 等便利方法，配合 Mixin 可以快速实现标准 CRUD。

::: details GenericAPIView + Mixin 示例
```python
from rest_framework import generics, mixins
from rest_framework.permissions import IsAdminUser


class ProductListCreateView(generics.ListCreateAPIView):
    """GET（列表）+ POST（创建）合并在一个视图"""
    queryset = Product.objects.filter(is_published=True)
    serializer_class = ProductSerializer

    def get_permissions(self):
        # GET 请求无需登录，POST 需要管理员
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset


class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """GET（详情）+ PUT/PATCH（更新）+ DELETE（删除）"""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUser]
```
:::

---

## 四、ViewSet 与 Router

`ViewSet` 将同一资源的所有操作集中在一个类中，配合 `Router` 自动生成标准 URL。

### 1. ModelViewSet

::: details ModelViewSet 完整示例
```python
# src/apps/products/views.py
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend


class ProductViewSet(viewsets.ModelViewSet):
    """
    自动提供：
    GET    /products/          → list()
    POST   /products/          → create()
    GET    /products/{pk}/     → retrieve()
    PUT    /products/{pk}/     → update()
    PATCH  /products/{pk}/     → partial_update()
    DELETE /products/{pk}/     → destroy()
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_published']   # 精确过滤
    search_fields = ['name', 'description']           # 模糊搜索 ?search=手机
    ordering_fields = ['price', 'created_at']         # 排序 ?ordering=-price
    ordering = ['-created_at']                        # 默认排序

    def get_serializer_class(self):
        # 列表和详情使用不同序列化器
        if self.action == 'list':
            return ProductListSerializer
        return ProductDetailSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]

    # 自定义动作：GET /products/{pk}/toggle_publish/
    @action(detail=True, methods=['post'], url_path='toggle-publish')
    def toggle_publish(self, request, pk=None):
        product = self.get_object()
        product.is_published = not product.is_published
        product.save()
        return Response({'is_published': product.is_published})

    # 无主键的自定义动作：GET /products/featured/
    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured_products = self.get_queryset().filter(is_featured=True)
        serializer = self.get_serializer(featured_products, many=True)
        return Response(serializer.data)
```

```python
# src/apps/products/urls.py
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('products', views.ProductViewSet, basename='product')

urlpatterns = router.urls
# 自动生成：
# /products/
# /products/{pk}/
# /products/{pk}/toggle-publish/
# /products/featured/
```
:::

---

## 五、认证与权限

### 1. JWT 认证配置

::: details JWT 认证与刷新 Token 接口
```python
# src/mysite/urls.py
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    # POST /api/auth/token/ → 获取 access + refresh token
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain'),
    # POST /api/auth/token/refresh/ → 用 refresh token 换新的 access token
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]
```

```python
# src/mysite/settings.py
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,  # 刷新时同时轮换 refresh token
    'BLACKLIST_AFTER_ROTATION': True,  # 轮换后旧 token 加入黑名单
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```
:::

### 2. 权限类

| 权限类 | 说明 |
|--------|------|
| `AllowAny` | 允许所有请求（包括匿名） |
| `IsAuthenticated` | 需要已认证用户 |
| `IsAdminUser` | 需要 `is_staff=True` |
| `IsAuthenticatedOrReadOnly` | 已认证用户可读写，匿名用户只读 |

::: details 自定义权限类示例
```python
# src/apps/core/permissions.py
from rest_framework.permissions import BasePermission


class IsOwnerOrAdmin(BasePermission):
    """资源所有者或管理员才能操作"""

    def has_object_permission(self, request, view, obj):
        # 管理员可以操作所有对象
        if request.user.is_staff:
            return True
        # 只有对象的创建者可以操作
        return obj.user == request.user


class IsVerifiedUser(BasePermission):
    """已完成邮箱验证的用户"""
    message = '请先完成邮箱验证'

    def has_permission(self, request, view):
        return (request.user.is_authenticated and
                request.user.is_email_verified)
```
:::

---

## 六、过滤、分页与搜索

### 1. 自定义分页

::: details 分页配置示例
```python
# src/apps/core/pagination.py
from rest_framework.pagination import PageNumberPagination, CursorPagination


class StandardPagination(PageNumberPagination):
    page_size = 10                    # 默认每页条数
    page_size_query_param = 'page_size'  # 允许客户端指定每页条数
    max_page_size = 100               # 每页最多 100 条
    page_query_param = 'page'

    def get_paginated_response(self, data):
        from rest_framework.response import Response
        return Response({
            'code': 200,
            'total': self.page.paginator.count,
            'page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'results': data
        })


# 基于游标的分页（适合实时数据，避免深翻页问题）
class CursorPaginationByDate(CursorPagination):
    ordering = '-created_at'
    page_size = 20
```
:::

### 2. 过滤与搜索

::: details django-filter 过滤器示例
```bash
pip install django-filter
```

```python
# src/apps/products/filters.py
import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    # 价格范围过滤
    price_min = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    # 名称模糊过滤
    name = django_filters.CharFilter(lookup_expr='icontains')
    # 创建日期过滤
    created_after = django_filters.DateFilter(
        field_name='created_at', lookup_expr='date__gte')

    class Meta:
        model = Product
        fields = ['category', 'is_published', 'price_min', 'price_max']


# 在 ViewSet 中使用
class ProductViewSet(viewsets.ModelViewSet):
    filterset_class = ProductFilter
    # GET /products/?price_min=100&price_max=500&category=电子&search=手机&ordering=-price
```
:::

---

## 七、API 文档（drf-spectacular）

::: details API 文档配置与自定义
```python
# src/mysite/settings.py
SPECTACULAR_SETTINGS = {
    'TITLE': 'Demo API',
    'DESCRIPTION': '接口文档',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}
```

```python
# src/mysite/urls.py
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns += [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # Swagger UI：/api/docs/
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # ReDoc：/api/redoc/
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
```

```python
# 在视图中添加文档注解
from drf_spectacular.utils import extend_schema, OpenApiParameter


class ProductViewSet(viewsets.ModelViewSet):

    @extend_schema(
        summary='获取商品列表',
        description='支持按分类、价格区间过滤，支持关键词搜索',
        parameters=[
            OpenApiParameter('category', str, description='商品分类'),
            OpenApiParameter('price_min', float, description='最低价格'),
        ],
        responses={200: ProductSerializer(many=True)}
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
```
:::
