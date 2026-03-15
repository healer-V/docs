---
title: "PostgreSQL 基础与实践"
category: "后端 · PostgreSQL"
tags:
  - PostgreSQL
excerpt: "PostgreSQL 是一个功能强大的开源对象关系型数据库，以其标准合规性、可扩展性和数据完整性著称。它支持丰富的数据类型（JSON、Array、HStore 等）、高级索引、窗口函数、CTE 等特性，适用于复杂业务场景。 标准合规：最接近..."
---

# PostgreSQL 基础与实践

## 一、PostgreSQL 概述

PostgreSQL 是一个功能强大的开源对象关系型数据库，以其标准合规性、可扩展性和数据完整性著称。它支持丰富的数据类型（JSON、Array、HStore 等）、高级索引、窗口函数、CTE 等特性，适用于复杂业务场景。

### 1. 核心特点

- **标准合规**：最接近 SQL 标准的数据库实现
- **丰富数据类型**：JSON/JSONB、Array、Range、UUID、几何类型等
- **MVCC**：多版本并发控制，读写互不阻塞
- **可扩展性**：支持自定义类型、函数、操作符、索引方法
- **高级特性**：窗口函数、CTE、物化视图、全文搜索、分区表

### 2. 安装与连接

::: code-group

```bash [macOS]
brew install postgresql@16
brew services start postgresql@16

# 创建数据库用户
createuser --interactive
# 创建数据库
createdb mydb
```

```bash [Ubuntu/Debian]
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 切换到 postgres 用户
sudo -u postgres psql
```

```bash [Docker]
docker run -d \
  --name postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=mydb \
  -v pg_data:/var/lib/postgresql/data \
  postgres:16-alpine
```

:::

::: details 连接示例

```bash
# psql 连接
psql -h localhost -p 5432 -U admin -d mydb

# 连接字符串格式
# postgresql://admin:your_password@localhost:5432/mydb

# psql 常用命令
\l          -- 列出数据库
\dt         -- 列出表
\d users    -- 查看表结构
\di         -- 列出索引
\df         -- 列出函数
\q          -- 退出
```

:::

## 二、数据类型

### 1. 基础类型

| 类型 | 说明 | 示例 |
|------|------|------|
| INTEGER / BIGINT | 整数 | `42` |
| NUMERIC(p, s) | 精确小数 | `99.99` |
| TEXT | 变长字符串（无长度限制） | `'hello'` |
| VARCHAR(n) | 有限变长字符串 | `'hello'` |
| BOOLEAN | 布尔值 | `true / false` |
| UUID | 通用唯一标识符 | `gen_random_uuid()` |
| TIMESTAMP / TIMESTAMPTZ | 时间戳 | `NOW()` |

### 2. 高级类型

#### (1) JSON / JSONB

JSONB 是二进制 JSON 格式，支持索引，查询性能优于 JSON。

::: details JSON/JSONB 示例

```sql
-- 创建包含 JSONB 的表
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  attrs JSONB DEFAULT '{}'
);

-- 插入 JSON 数据
INSERT INTO products (name, attrs) VALUES
  ('iPhone 16', '{"color": "black", "storage": 256, "tags": ["phone", "apple"]}'),
  ('MacBook Pro', '{"color": "silver", "ram": 32, "tags": ["laptop", "apple"]}');

-- 查询 JSON 字段
SELECT name, attrs->>'color' AS color FROM products;
SELECT name FROM products WHERE attrs->>'storage' = '256';

-- 嵌套查询
SELECT name FROM products WHERE attrs @> '{"tags": ["apple"]}';

-- 更新 JSON 字段
UPDATE products
SET attrs = jsonb_set(attrs, '{price}', '7999')
WHERE name = 'iPhone 16';

-- 创建 GIN 索引加速 JSONB 查询
CREATE INDEX idx_products_attrs ON products USING GIN (attrs);
```

:::

#### (2) Array（数组）

::: details Array 示例

```sql
-- 创建包含数组的表
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}'
);

-- 插入数组数据
INSERT INTO articles (title, tags) VALUES
  ('PostgreSQL 入门', ARRAY['database', 'postgresql', 'tutorial']),
  ('Redis 缓存实践', ARRAY['database', 'redis', 'cache']);

-- 查询数组包含某元素
SELECT * FROM articles WHERE 'postgresql' = ANY(tags);

-- 查询数组包含所有指定元素
SELECT * FROM articles WHERE tags @> ARRAY['database', 'postgresql'];

-- 数组长度
SELECT title, array_length(tags, 1) AS tag_count FROM articles;

-- 展开数组
SELECT title, unnest(tags) AS tag FROM articles;
```

:::

#### (3) 其他高级类型

| 类型 | 说明 |
|------|------|
| INET / CIDR | IP 地址 |
| DATERANGE / TSRANGE | 范围类型 |
| POINT / LINE / POLYGON | 几何类型 |
| TSVECTOR / TSQUERY | 全文搜索 |
| HSTORE | 键值对（轻量替代 JSONB） |

## 三、CRUD 操作

### 1. 建表

::: details 建表示例

```sql
-- 创建用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  profile JSONB DEFAULT '{}',
  roles TEXT[] DEFAULT ARRAY['user'],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建订单表
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_no VARCHAR(32) NOT NULL UNIQUE,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

:::

### 2. 插入数据

::: details 插入示例

```sql
-- 单条插入
INSERT INTO users (username, email, password_hash, profile)
VALUES ('zhangsan', 'zhangsan@example.com', crypt('password', gen_salt('bf')),
        '{"city": "北京", "age": 28}');

-- 批量插入
INSERT INTO users (username, email, password_hash) VALUES
  ('lisi', 'lisi@example.com', crypt('pass456', gen_salt('bf'))),
  ('wangwu', 'wangwu@example.com', crypt('pass789', gen_salt('bf')));

-- 插入并返回结果
INSERT INTO users (username, email, password_hash)
VALUES ('newuser', 'new@example.com', crypt('pass', gen_salt('bf')))
RETURNING id, username, created_at;

-- 冲突处理（UPSERT）
INSERT INTO users (username, email, password_hash)
VALUES ('zhangsan', 'updated@example.com', crypt('newpass', gen_salt('bf')))
ON CONFLICT (username)
DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
```

:::

### 3. 查询数据

::: details 查询示例

```sql
-- 基础查询
SELECT id, username, email FROM users WHERE is_active = true;

-- CTE（公用表表达式）
WITH active_users AS (
  SELECT id, username FROM users WHERE is_active = true
)
SELECT u.username, COUNT(o.id) AS order_count
FROM active_users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.username;

-- 窗口函数
SELECT
  username,
  total_amount,
  ROW_NUMBER() OVER (ORDER BY total_amount DESC) AS rank,
  SUM(total_amount) OVER () AS grand_total,
  total_amount / SUM(total_amount) OVER () * 100 AS percentage
FROM orders o
JOIN users u ON o.user_id = u.id;

-- LATERAL JOIN
SELECT u.username, recent_orders.*
FROM users u
LEFT JOIN LATERAL (
  SELECT order_no, total_amount, created_at
  FROM orders
  WHERE user_id = u.id
  ORDER BY created_at DESC
  LIMIT 3
) recent_orders ON true;
```

:::

### 4. 更新与删除

::: details 更新与删除示例

```sql
-- 更新并返回
UPDATE users
SET profile = profile || '{"vip": true}'::jsonb, updated_at = NOW()
WHERE username = 'zhangsan'
RETURNING *;

-- 从其他表更新
UPDATE orders o
SET status = 'cancelled'
FROM users u
WHERE o.user_id = u.id AND u.is_active = false;

-- 删除并返回
DELETE FROM orders
WHERE status = 'cancelled' AND created_at < NOW() - INTERVAL '90 days'
RETURNING id, order_no;
```

:::

## 四、索引

### 1. 索引类型

| 类型 | 适用场景 |
|------|----------|
| B-Tree（默认） | 等值查询、范围查询、排序 |
| Hash | 等值查询 |
| GIN | JSONB、数组、全文搜索 |
| GiST | 几何类型、范围类型、全文搜索 |
| BRIN | 大表中物理有序的数据（如时间序列） |

### 2. 索引操作

::: details 索引示例

```sql
-- B-Tree 索引
CREATE INDEX idx_users_email ON users(email);

-- 唯一索引
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- 复合索引
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- 部分索引（只索引满足条件的行）
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;

-- GIN 索引（用于 JSONB）
CREATE INDEX idx_users_profile ON users USING GIN (profile);

-- 表达式索引
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- BRIN 索引（适合时间序列数据）
CREATE INDEX idx_orders_created ON orders USING BRIN (created_at);

-- 并发创建索引（不阻塞写操作）
CREATE INDEX CONCURRENTLY idx_orders_amount ON orders(total_amount);

-- 查看索引使用情况
SELECT indexrelname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

:::

::: tip
部分索引可以显著减小索引体积。例如只对 `is_active = true` 的用户建索引，适用于大部分查询只关注活跃用户的场景。
:::

## 五、视图与物化视图

### 1. 普通视图

::: details 视图示例

```sql
-- 创建视图
CREATE VIEW user_order_summary AS
SELECT
  u.id AS user_id,
  u.username,
  COUNT(o.id) AS order_count,
  COALESCE(SUM(o.total_amount), 0) AS total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.username;

-- 使用视图
SELECT * FROM user_order_summary WHERE total_spent > 1000;
```

:::

### 2. 物化视图

物化视图将查询结果缓存到磁盘，适合复杂统计查询。

::: details 物化视图示例

```sql
-- 创建物化视图
CREATE MATERIALIZED VIEW monthly_revenue AS
SELECT
  date_trunc('month', created_at) AS month,
  COUNT(*) AS order_count,
  SUM(total_amount) AS revenue
FROM orders
WHERE status = 'completed'
GROUP BY date_trunc('month', created_at)
ORDER BY month;

-- 创建索引（提高查询效率）
CREATE INDEX idx_mv_month ON monthly_revenue(month);

-- 刷新数据
REFRESH MATERIALIZED VIEW monthly_revenue;

-- 并发刷新（不阻塞查询，需要唯一索引）
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_revenue;
```

:::

## 六、函数与触发器

### 1. 自定义函数

::: details 函数示例

```sql
-- 创建函数：计算用户等级
CREATE OR REPLACE FUNCTION get_user_level(spent NUMERIC)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN spent >= 10000 THEN 'VIP'
    WHEN spent >= 5000 THEN 'Gold'
    WHEN spent >= 1000 THEN 'Silver'
    ELSE 'Normal'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 使用函数
SELECT username, total_spent, get_user_level(total_spent) AS level
FROM user_order_summary;
```

:::

### 2. 触发器

::: details 触发器示例

```sql
-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 绑定触发器到表
CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- 审计日志触发器
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT,
  operation TEXT,
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, operation, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_audit
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger();
```

:::

## 七、MVCC 与并发控制

### 1. MVCC 原理

PostgreSQL 使用 MVCC（多版本并发控制）实现事务隔离，每行数据包含隐藏字段 `xmin`（创建事务 ID）和 `xmax`（删除事务 ID），通过事务快照判断行的可见性。

### 2. 事务隔离级别

| 级别 | 脏读 | 不可重复读 | 幻读 | 序列化异常 |
|------|------|-----------|------|-----------|
| READ COMMITTED（默认） | 不可能 | 可能 | 可能 | 可能 |
| REPEATABLE READ | 不可能 | 不可能 | 不可能 | 可能 |
| SERIALIZABLE | 不可能 | 不可能 | 不可能 | 不可能 |

::: tip
PostgreSQL 的 REPEATABLE READ 实际上已经解决了幻读问题（基于 SSI 实现）。SERIALIZABLE 级别使用序列化快照隔离（SSI），可以检测到更多的异常。
:::

### 3. 锁机制

::: details 锁示例

```sql
-- 行级锁（SELECT FOR UPDATE）
BEGIN;
SELECT * FROM users WHERE id = 'uuid-here' FOR UPDATE;
-- 其他事务无法修改这一行，直到当前事务提交
UPDATE users SET profile = profile || '{"verified": true}'::jsonb WHERE id = 'uuid-here';
COMMIT;

-- 跳过已锁定行（避免等待）
SELECT * FROM tasks WHERE status = 'pending'
ORDER BY created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;

-- 咨询锁（应用层分布式锁）
SELECT pg_advisory_lock(12345);      -- 获取锁
-- 执行业务逻辑
SELECT pg_advisory_unlock(12345);    -- 释放锁
```

:::

## 八、扩展与高级特性

### 1. 常用扩展

::: details 扩展示例

```sql
-- 查看可用扩展
SELECT * FROM pg_available_extensions;

-- 启用 UUID 生成
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SELECT uuid_generate_v4();

-- 启用加密函数
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SELECT crypt('password', gen_salt('bf'));

-- 启用模糊匹配
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_users_name_trgm ON users USING GIN (username gin_trgm_ops);
SELECT * FROM users WHERE username % '张三';  -- 相似度查询

-- 启用全文搜索（中文需要 zhparser 等分词插件）
SELECT to_tsvector('english', 'PostgreSQL is a powerful database')
  @@ to_tsquery('english', 'powerful & database');
```

:::

### 2. 分区表

::: details 分区表示例

```sql
-- 按范围分区（按月分区订单表）
CREATE TABLE orders_partitioned (
  id BIGSERIAL,
  order_no VARCHAR(32) NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- 创建分区
CREATE TABLE orders_2026_01 PARTITION OF orders_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE orders_2026_02 PARTITION OF orders_partitioned
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE orders_2026_03 PARTITION OF orders_partitioned
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- 查询自动路由到对应分区
SELECT * FROM orders_partitioned
WHERE created_at >= '2026-02-01' AND created_at < '2026-03-01';
```

:::

## 九、性能调优

### 1. 查询分析

::: details EXPLAIN 分析

```sql
-- 查看执行计划
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.username, COUNT(o.id)
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.is_active = true
GROUP BY u.username;

-- 关注指标：
-- Seq Scan vs Index Scan（是否走索引）
-- Actual Time（实际执行时间）
-- Rows（返回行数与预估行数的差异）
-- Buffers（缓冲区命中与读盘次数）
```

:::

### 2. 配置调优

::: details postgresql.conf 关键参数

```ini
# 共享缓冲区，建议物理内存的 25%
shared_buffers = 4GB

# 工作内存，每个排序/哈希操作可用的内存
work_mem = 64MB

# 维护操作内存（VACUUM、CREATE INDEX 等）
maintenance_work_mem = 512MB

# 有效缓存大小，帮助优化器评估索引成本，建议物理内存的 75%
effective_cache_size = 12GB

# WAL 相关
wal_buffers = 64MB
checkpoint_completion_target = 0.9
max_wal_size = 2GB

# 并行查询
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
```

:::

### 3. VACUUM 维护

由于 MVCC 机制，UPDATE 和 DELETE 不会立即释放空间，需要 VACUUM 回收。

::: details VACUUM 示例

```sql
-- 手动 VACUUM
VACUUM VERBOSE users;

-- VACUUM ANALYZE（回收空间并更新统计信息）
VACUUM ANALYZE users;

-- 查看表膨胀情况
SELECT
  relname,
  n_live_tup,
  n_dead_tup,
  ROUND(n_dead_tup::NUMERIC / GREATEST(n_live_tup, 1) * 100, 2) AS dead_ratio
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

:::

::: warning
PostgreSQL 默认开启 autovacuum，通常不需要手动执行。但对于写入密集的大表，可能需要调整 autovacuum 的触发阈值以提高回收效率。
:::
