---
title: "Flask 与 FastAPI 入门"
category: "后端 · Python"
tags:
  - Python
  - Flask
  - FastAPI
  - Web框架
date: 2026-03-17
---

# Flask 与 FastAPI 入门

Flask 是轻量、灵活的微框架，适合快速构建小型应用和原型；FastAPI 是现代高性能框架，基于类型注解提供自动验证和文档，适合构建 API 服务。两者都是 Python Web 开发的主流选择。

## 一、Flask

### 1. 路由与请求响应

::: details Flask 基础路由示例

```python
# src/app.py
from flask import Flask, request, jsonify, abort

app = Flask(__name__)

# GET 路由
@app.route("/")
def index():
    return "Hello, Flask!"

# 路径参数
@app.route("/users/<int:user_id>")
def get_user(user_id: int):
    user = find_user_by_id(user_id)
    if user is None:
        abort(404)
    return jsonify(user)

# 多方法路由
@app.route("/users", methods=["GET", "POST"])
def users():
    if request.method == "GET":
        # 查询参数：?page=1&size=20
        page = request.args.get("page", 1, type=int)
        size = request.args.get("size", 20, type=int)
        return jsonify({"page": page, "size": size, "data": []})

    elif request.method == "POST":
        # JSON 请求体
        data = request.get_json()
        if not data or "name" not in data:
            return jsonify({"error": "name 字段必填"}), 400
        new_user = create_user(data)
        return jsonify(new_user), 201

# 自定义错误处理
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "资源不存在", "code": 404}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "服务器内部错误"}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
```

:::

### 2. Blueprint 模块化

`Blueprint` 将路由按功能模块拆分，避免所有代码堆在一个文件中。

::: details Blueprint 示例

```python
# src/routes/product.py
from flask import Blueprint, request, jsonify
from src.services.product_service import ProductService

product_bp = Blueprint("product", __name__, url_prefix="/api/v1/products")
service    = ProductService()

@product_bp.route("/")
def list_products():
    category = request.args.get("category")
    products = service.list(category=category)
    return jsonify({"data": products})

@product_bp.route("/<int:product_id>")
def get_product(product_id: int):
    product = service.get_by_id(product_id)
    if not product:
        return jsonify({"error": "商品不存在"}), 404
    return jsonify(product)

@product_bp.route("/", methods=["POST"])
def create_product():
    data = request.get_json(force=True)
    product = service.create(data)
    return jsonify(product), 201
```

```python
# src/app.py
from flask import Flask
from src.routes.product import product_bp
from src.routes.user import user_bp
from src.routes.order import order_bp

def create_app(config: dict = None) -> Flask:
    """应用工厂函数。"""
    app = Flask(__name__)

    if config:
        app.config.update(config)

    # 注册蓝图
    app.register_blueprint(product_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(order_bp)

    return app
```

:::

### 3. SQLAlchemy 集成

::: details Flask-SQLAlchemy 示例

```python
# src/extensions.py
from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()

# src/models/product.py
from src.extensions import db
from datetime import datetime

class Product(db.Model):
    __tablename__ = "product"

    id         = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name       = db.Column(db.String(200), nullable=False)
    price      = db.Column(db.Numeric(10, 2), nullable=False)
    category   = db.Column(db.String(100))
    stock      = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id":       self.id,
            "name":     self.name,
            "price":    float(self.price),
            "category": self.category,
            "stock":    self.stock,
        }

# src/app.py（集成 SQLAlchemy）
def create_app(config: dict = None) -> Flask:
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root:password@localhost/shop"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    with app.app_context():
        db.create_all()  # 创建所有表（开发环境）

    return app

# 查询示例
products = Product.query.filter(
    Product.category == "electronics",
    Product.stock > 0
).order_by(Product.price.asc()).paginate(page=1, per_page=20)
```

:::

## 二、FastAPI

### 1. 路由与参数验证

FastAPI 基于 Pydantic 进行请求/响应数据的自动验证和序列化，结合类型注解提供极简的开发体验。

::: details FastAPI 路由与 Pydantic 示例

```python
# src/main.py
from fastapi import FastAPI, HTTPException, Query, Path, Depends
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional
from datetime import datetime

app = FastAPI(
    title="商品管理 API",
    description="电商平台商品管理接口",
    version="1.0.0",
)

# Pydantic 模型：请求体验证与响应序列化
class ProductCreate(BaseModel):
    name:     str        = Field(..., min_length=1, max_length=200, description="商品名称")
    price:    float      = Field(..., gt=0, description="商品价格，必须大于 0")
    category: str        = Field(..., description="商品分类")
    stock:    int        = Field(default=0, ge=0, description="库存数量")
    tags:     list[str]  = Field(default=[], max_items=10)

    @validator("name")
    def name_must_not_be_blank(cls, v: str) -> str:
        if v.strip() == "":
            raise ValueError("商品名称不能为空白字符串")
        return v.strip()


class ProductResponse(BaseModel):
    id:         int
    name:       str
    price:      float
    category:   str
    stock:      int
    created_at: datetime

    class Config:
        from_attributes = True  # 兼容 ORM 对象


# 路径参数 + 查询参数
@app.get("/products/{product_id}", response_model=ProductResponse, tags=["商品"])
async def get_product(
    product_id: int = Path(..., gt=0, description="商品 ID"),
):
    product = await ProductService.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail=f"商品 {product_id} 不存在")
    return product


@app.get("/products", response_model=list[ProductResponse], tags=["商品"])
async def list_products(
    category: Optional[str] = Query(None, description="按分类筛选"),
    page:     int           = Query(1,    ge=1, description="页码"),
    size:     int           = Query(20,   ge=1, le=100, description="每页数量"),
):
    return await ProductService.list(category=category, page=page, size=size)


@app.post("/products", response_model=ProductResponse, status_code=201, tags=["商品"])
async def create_product(payload: ProductCreate):
    return await ProductService.create(payload.dict())
```

:::

### 2. 依赖注入

FastAPI 的依赖注入系统让公共逻辑（认证、数据库会话、分页参数）可以被多个路由复用。

::: details 依赖注入示例

```python
from fastapi import Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

# 认证依赖
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    token = credentials.credentials
    user  = await verify_jwt_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="无效的认证令牌")
    return user

# 分页参数依赖（复用）
class PaginationParams:
    def __init__(
        self,
        page: int = Query(1, ge=1),
        size: int = Query(20, ge=1, le=100),
    ):
        self.page   = page
        self.size   = size
        self.offset = (page - 1) * size

# 数据库会话依赖
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

# 在路由中使用依赖
@app.get("/orders", tags=["订单"])
async def list_orders(
    pagination: PaginationParams = Depends(),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db),
):
    return await OrderService.list(
        user_id=current_user["id"],
        offset=pagination.offset,
        limit=pagination.size,
        db=db,
    )
```

:::

### 3. 自动文档与异步支持

::: details FastAPI 中间件与事件钩子

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time

app = FastAPI()

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://example.com", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 自定义请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - start
    print(f"{request.method} {request.url.path} → {response.status_code} ({elapsed:.3f}s)")
    return response

# 启动/关闭事件（初始化连接池、关闭资源）
@app.on_event("startup")
async def on_startup():
    await database.connect()
    print("数据库连接已建立")

@app.on_event("shutdown")
async def on_shutdown():
    await database.disconnect()
    print("数据库连接已关闭")
```

:::

::: tip 自动 API 文档
FastAPI 内置两个文档界面，无需任何额外配置：
- **Swagger UI**：`http://localhost:8000/docs`
- **ReDoc**：`http://localhost:8000/redoc`

所有路由、请求体、响应模型、参数描述均自动生成 OpenAPI 规范文档。
:::

## 三、Flask vs FastAPI 对比

| 对比项 | Flask | FastAPI |
|--------|-------|---------|
| 发布年份 | 2010 | 2018 |
| 异步支持 | 部分（Flask 2.0+） | 原生（async/await） |
| 数据验证 | 需手动或引入 marshmallow | 内置（Pydantic） |
| API 文档 | 需引入 Flask-RESTX 等 | 内置 Swagger/ReDoc |
| 类型提示集成 | 弱 | 深度集成 |
| 性能 | 中等 | 高（接近 Node.js） |
| 学习曲线 | 平缓 | 稍陡（需了解类型注解） |
| 生态 | 成熟、插件丰富 | 快速增长 |
| 适用场景 | 传统 Web 应用、小型 API | 高性能 API、微服务 |

## 四、环境与依赖管理

### 1. venv 虚拟环境

每个项目应使用独立虚拟环境，避免依赖版本冲突。

::: details venv 使用示例

```bash
# 创建虚拟环境
python -m venv .venv

# 激活（macOS/Linux）
source .venv/bin/activate

# 激活（Windows PowerShell）
.venv\Scripts\Activate.ps1

# 安装依赖
pip install flask sqlalchemy pymysql

# 导出依赖
pip freeze > requirements.txt

# 从依赖文件安装（部署时）
pip install -r requirements.txt

# 退出虚拟环境
deactivate
```

:::

### 2. requirements.txt 管理规范

::: details requirements.txt 示例

```text
# requirements.txt
# Web 框架
fastapi==0.110.0
uvicorn[standard]==0.29.0

# 数据验证
pydantic[email]==2.6.4

# 数据库
sqlalchemy==2.0.29
asyncpg==0.29.0         # PostgreSQL 异步驱动

# HTTP 客户端
httpx==0.27.0

# 工具
python-dotenv==1.0.1    # 环境变量管理
loguru==0.7.2           # 日志

# 开发依赖（可拆分到 requirements-dev.txt）
pytest==8.1.1
pytest-asyncio==0.23.6
mypy==1.9.0
ruff==0.3.4             # 代码检查与格式化
```

:::

::: tip 现代包管理工具
`pip` + `requirements.txt` 是最基础的方案，但缺少依赖锁定和依赖解析能力。新项目推荐考虑：
- **Poetry**：依赖管理 + 虚拟环境 + 发布一体化
- **uv**：Rust 编写的极速包管理器（pip 速度的 10-100 倍），正快速成为主流
:::
