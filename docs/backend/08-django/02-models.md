---
title: "Django 模型与数据库"
category: "后端 · Django"
tags:
  - Django
  - 模型
  - ORM
  - 数据库迁移
date: 2026-03-17
excerpt: "Django 的 ORM 通过 Python 类映射数据库表，提供直观的 QuerySet API 进行数据操作，配合迁移系统（migrations）实现数据库结构的版本化管理。"
---

# Django 模型与数据库

## 一、模型定义

### 1. 字段类型

Django 模型中每个字段对应数据库中的一列，不同字段类型映射到不同的数据库类型。

| 字段类型 | 说明 | 数据库类型 |
|----------|------|------------|
| `CharField(max_length)` | 短字符串，必须指定 `max_length` | `VARCHAR` |
| `TextField` | 长文本，无长度限制 | `TEXT` |
| `IntegerField` | 整数 | `INTEGER` |
| `BigAutoField` | 自增大整数（Django 默认主键类型） | `BIGINT AUTO_INCREMENT` |
| `FloatField` | 浮点数 | `FLOAT` |
| `DecimalField(max_digits, decimal_places)` | 精确小数，用于金额 | `DECIMAL` |
| `BooleanField` | 布尔值 | `TINYINT(1)` |
| `DateField` | 日期 | `DATE` |
| `DateTimeField` | 日期时间 | `DATETIME` |
| `EmailField` | 邮箱（带格式验证） | `VARCHAR(254)` |
| `URLField` | URL | `VARCHAR(200)` |
| `JSONField` | JSON 数据（Django 3.1+） | `JSON` |
| `FileField` / `ImageField` | 文件/图片路径 | `VARCHAR` |

### 2. 字段选项

::: details 常用字段选项说明与示例
```python
# src/apps/users/models.py
from django.db import models


class User(models.Model):
    # null=True：数据库允许 NULL；blank=True：表单验证允许空值
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(null=True, blank=True)

    # default：字段默认值
    is_active = models.BooleanField(default=True)

    # choices：枚举选项，第一项存入数据库，第二项用于展示
    class Status(models.TextChoices):
        ACTIVE = 'active', '正常'
        BANNED = 'banned', '封禁'
        PENDING = 'pending', '待审核'

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    # auto_now_add：创建时自动设置；auto_now：每次保存时自动更新
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # verbose_name：字段的可读名称（用于 Admin 和表单展示）
    phone = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name='手机号'
    )

    def __str__(self):
        return self.username
```
:::

### 3. Meta 类

`Meta` 类用于配置模型的元数据，如排序规则、数据库表名、索引等。

::: details Meta 类配置示例
```python
# src/apps/products/models.py
from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=200, verbose_name='商品名称')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    category = models.CharField(max_length=50)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 't_product'           # 自定义数据库表名（默认：appname_modelname）
        verbose_name = '商品'
        verbose_name_plural = '商品列表'  # 复数名称（用于 Admin）
        ordering = ['-created_at']       # 默认排序：按创建时间降序（加 - 为降序）
        indexes = [
            models.Index(fields=['category', 'is_published']),  # 联合索引
            models.Index(fields=['price'], name='price_idx'),    # 命名索引
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(price__gte=0),
                name='price_non_negative'
            )
        ]
        unique_together = [['name', 'category']]  # 联合唯一约束

    def __str__(self):
        return self.name
```
:::

---

## 二、数据库迁移

### 1. 迁移流程

Django 的迁移系统将模型变更记录为迁移文件，实现数据库结构的版本控制。

```bash
# 第一步：检测模型变更，生成迁移文件（不会修改数据库）
python manage.py makemigrations

# 为指定 app 生成迁移
python manage.py makemigrations users

# 第二步：执行迁移，将变更应用到数据库
python manage.py migrate

# 查看迁移状态
python manage.py showmigrations

# 回滚到指定迁移
python manage.py migrate users 0001
```

::: tip 迁移文件要纳入版本控制
迁移文件（`migrations/` 目录下的 `*.py` 文件）必须提交到 Git，团队成员通过拉取代码后执行 `migrate` 保持数据库结构一致。
:::

### 2. 数据迁移

除了结构迁移，还可以编写数据迁移脚本在迁移过程中处理存量数据。

::: details 数据迁移示例
```bash
# 创建空白迁移文件
python manage.py makemigrations --empty users --name fill_default_status
```

```python
# src/apps/users/migrations/0002_fill_default_status.py
from django.db import migrations


def fill_status(apps, schema_editor):
    # 通过历史模型操作数据（不能直接 import 当前模型）
    User = apps.get_model('users', 'User')
    User.objects.filter(status='').update(status='active')


def reverse_fill_status(apps, schema_editor):
    # 可选的反向迁移函数
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(fill_status, reverse_fill_status),
    ]
```
:::

---

## 三、QuerySet API

### 1. 基础查询

::: details 常用 QuerySet 方法示例
```python
# src/apps/products/views.py
from .models import Product

# 获取所有记录（返回 QuerySet，惰性执行）
all_products = Product.objects.all()

# 过滤（AND 关系）
active_products = Product.objects.filter(is_published=True, category='电子')

# 排除
non_electronic = Product.objects.exclude(category='电子')

# 获取单条记录（不存在或多条时抛出异常）
try:
    product = Product.objects.get(id=1)
except Product.DoesNotExist:
    pass  # 处理不存在
except Product.MultipleObjectsReturned:
    pass  # 处理多条

# 链式调用（惰性 QuerySet）
results = (Product.objects
    .filter(is_published=True)
    .exclude(stock=0)
    .order_by('-created_at')
    [:10])  # LIMIT 10

# 字段查找运算符
Product.objects.filter(price__gte=100)          # price >= 100
Product.objects.filter(price__range=(50, 200))   # 50 <= price <= 200
Product.objects.filter(name__contains='手机')    # LIKE '%手机%'
Product.objects.filter(name__startswith='苹果')  # LIKE '苹果%'
Product.objects.filter(name__icontains='iphone') # 不区分大小写
Product.objects.filter(created_at__date=date.today())  # 按日期
Product.objects.filter(category__in=['电子', '数码'])   # IN

# 聚合
from django.db.models import Count, Avg, Sum, Max, Min
stats = Product.objects.aggregate(
    total=Count('id'),
    avg_price=Avg('price'),
    max_price=Max('price')
)
# stats = {'total': 100, 'avg_price': 299.5, 'max_price': 9999.0}

# 分组统计（annotate）
from django.db.models import Count
category_stats = (Product.objects
    .values('category')
    .annotate(count=Count('id'), avg_price=Avg('price'))
    .order_by('-count'))
```
:::

### 2. 创建、更新、删除

::: details CUD 操作示例
```python
# 创建
product = Product.objects.create(
    name='iPhone 16',
    price=7999.00,
    stock=100,
    category='电子'
)

# 或使用 save()
product = Product(name='iPhone 16', price=7999.00)
product.save()

# 获取或创建（避免重复创建）
product, created = Product.objects.get_or_create(
    name='iPhone 16',
    defaults={'price': 7999.00, 'stock': 100}
)

# 更新单条（先查询再修改）
product = Product.objects.get(id=1)
product.price = 6999.00
product.save()  # 默认更新所有字段；save(update_fields=['price']) 只更新指定字段

# 批量更新（直接生成 UPDATE SQL，不触发信号）
Product.objects.filter(category='电子').update(is_published=True)

# 删除
Product.objects.get(id=1).delete()

# 批量删除
Product.objects.filter(stock=0).delete()
```
:::

---

## 四、Q 对象与 F 对象

### 1. Q 对象（复杂条件）

`Q` 对象用于构建 `OR`、`NOT` 等复杂查询条件，`filter()` 默认只支持 `AND`。

::: details Q 对象使用示例
```python
from django.db.models import Q

# OR 查询：名称包含"手机"或价格低于 1000
products = Product.objects.filter(
    Q(name__contains='手机') | Q(price__lt=1000)
)

# NOT 查询
products = Product.objects.filter(~Q(status='banned'))

# 组合：(category='电子' AND price < 5000) OR stock > 0
products = Product.objects.filter(
    (Q(category='电子') & Q(price__lt=5000)) | Q(stock__gt=0)
)
```
:::

### 2. F 对象（字段间引用）

`F` 对象用于引用模型字段的值，实现字段间比较或基于当前值的更新，避免先查再改的竞态问题。

::: details F 对象使用示例
```python
from django.db.models import F

# 字段间比较：查询库存数量大于销量的商品
products = Product.objects.filter(stock__gt=F('sales'))

# 基于当前值更新（原子操作，避免并发问题）
# 错误做法：先读后写，存在竞态条件
# product.stock = product.stock - 1; product.save()

# 正确做法：使用 F 对象
Product.objects.filter(id=1).update(stock=F('stock') - 1)

# 注解中使用 F 对象
from django.db.models import ExpressionWrapper, FloatField
products = Product.objects.annotate(
    profit_rate=ExpressionWrapper(
        (F('price') - F('cost')) / F('price'),
        output_field=FloatField()
    )
)
```
:::

---

## 五、关联关系

### 1. 关联字段

::: details 关联关系完整示例
```python
# src/apps/shop/models.py
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100)


class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    # 多对一（多个商品属于一个分类）
    # on_delete=PROTECT：分类被删除时，若有关联商品则拒绝删除
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='products'  # 反向关联名：category.products.all()
    )


class Order(models.Model):
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,  # 用户删除时，订单一并删除
        related_name='orders'
    )
    created_at = models.DateTimeField(auto_now_add=True)


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )
    # 多对多（一个订单包含多个商品，一个商品可属于多个订单）
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)


# 多对多关系
class Article(models.Model):
    title = models.CharField(max_length=200)
    # through：指定中间表（需要存额外字段时使用）
    tags = models.ManyToManyField(Tag, related_name='articles', blank=True)
```
:::

### 2. 关联查询与性能

::: details select_related 与 prefetch_related
```python
# select_related：JOIN 查询（用于 ForeignKey/OneToOneField，单次查询）
orders = Order.objects.select_related('user').all()
for order in orders:
    print(order.user.username)  # 不产生额外查询

# prefetch_related：Python 层面合并（用于 ManyToManyField 和反向关系）
orders = Order.objects.prefetch_related('items__product').all()
for order in orders:
    for item in order.items.all():  # 不产生额外查询
        print(item.product.name)

# 结合使用
orders = (Order.objects
    .select_related('user')               # JOIN 用户
    .prefetch_related('items__product')   # 预取订单项和商品
    .filter(user__is_active=True)
    .order_by('-created_at'))
```
:::

---

## 六、数据库事务

::: details 事务使用示例
```python
# src/apps/shop/services.py
from django.db import transaction
from .models import Order, OrderItem, Product


def create_order(user, items_data):
    """创建订单（原子操作，任意步骤失败则全部回滚）"""
    with transaction.atomic():
        # 创建订单
        order = Order.objects.create(user=user)

        for item_data in items_data:
            product = Product.objects.select_for_update().get(
                id=item_data['product_id']  # select_for_update：加行锁防止并发超卖
            )
            if product.stock < item_data['quantity']:
                raise ValueError(f'商品 {product.name} 库存不足')

            # 扣减库存
            Product.objects.filter(id=product.id).update(
                stock=F('stock') - item_data['quantity']
            )

            # 创建订单项
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item_data['quantity'],
                price=product.price
            )

        return order


# 装饰器方式
@transaction.atomic
def cancel_order(order_id):
    order = Order.objects.get(id=order_id)
    for item in order.items.all():
        Product.objects.filter(id=item.product_id).update(
            stock=F('stock') + item.quantity
        )
    order.status = 'cancelled'
    order.save()
```
:::

::: warning select_for_update 注意事项
`select_for_update()` 必须在 `transaction.atomic()` 块内使用，否则会抛出 `TransactionManagementError`。在高并发场景下谨慎使用，行锁会降低并发性能。
:::
