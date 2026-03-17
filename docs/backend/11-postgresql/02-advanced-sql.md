---
title: "PostgreSQL 进阶 SQL"
category: "后端 · PostgreSQL"
tags:
  - PostgreSQL
  - SQL
  - 窗口函数
  - CTE
date: 2026-03-17
excerpt: "系统讲解 PostgreSQL 的进阶 SQL 能力，包括与 MySQL 的主要差异、窗口函数、递归 CTE、LATERAL JOIN、Upsert 语法、多种索引类型及 EXPLAIN ANALYZE 执行计划深度解读。"
---

# PostgreSQL 进阶 SQL

## 一、PostgreSQL vs MySQL 主要差异

| 特性 | PostgreSQL | MySQL（InnoDB） |
|------|------------|-----------------|
| ACID 事务 | 完整支持 | 完整支持 |
| 窗口函数 | 完整支持（标准 SQL） | 8.0+ 支持 |
| 递归 CTE | 支持 | 8.0+ 支持 |
| FULL OUTER JOIN | 原生支持 | 需 UNION 模拟 |
| 数组类型 | 原生支持 | 不支持 |
| JSON/JSONB | 原生支持，功能强大 | 5.7.8+ 支持，功能较弱 |
| 全文搜索 | 内置，功能完整 | 内置，功能有限 |
| 继承表 | 支持（表继承） | 不支持 |
| 自定义类型/函数 | 非常灵活 | 有限支持 |
| 行级安全（RLS） | 支持 | 不支持 |
| 索引类型 | B-Tree/Hash/GiST/GIN/BRIN/SP-GiST | 主要 B+Tree/Hash/全文 |
| 并发控制 | MVCC（堆表方式，旧版本存于表中） | MVCC（undo log 方式） |
| 自增 ID | `SERIAL` / `IDENTITY` / `SEQUENCE` | `AUTO_INCREMENT` |
| 字符串连接 | `\|\|` 或 `CONCAT()` | `CONCAT()` 或 `+`（不推荐） |
| 大小写敏感 | 默认不区分（标识符）；数据区分 | 依字符集排序规则 |
| 存储过程 | PL/pgSQL（功能强大） | 支持但较弱 |

::: tip 选型建议
- 需要**复杂查询、窗口函数、JSON 操作、地理数据**（PostGIS）时优先选 PostgreSQL。
- 需要**超高写入吞吐**、成熟生态（如阿里云 RDS）、运维成本低时可选 MySQL。
:::

---

## 二、窗口函数

窗口函数在**不聚合行**的前提下，为每一行计算基于"窗口"（相关行集合）的聚合或排名结果。

### 1. 基本语法

```sql
函数名() OVER (
    [PARTITION BY 分组列]
    [ORDER BY 排序列]
    [ROWS/RANGE BETWEEN 帧起点 AND 帧终点]
)
```

### 2. 排名函数

| 函数 | 说明 |
|------|------|
| `ROW_NUMBER()` | 每行唯一序号（无并列） |
| `RANK()` | 并列时跳号（1,2,2,4） |
| `DENSE_RANK()` | 并列时不跳号（1,2,2,3） |
| `NTILE(n)` | 将行分为 n 个桶，返回桶号 |

::: details 排名函数示例

```sql
-- 按部门统计员工薪资排名
SELECT
  department,
  employee_name,
  salary,
  ROW_NUMBER()  OVER (PARTITION BY department ORDER BY salary DESC) AS row_num,
  RANK()        OVER (PARTITION BY department ORDER BY salary DESC) AS rank,
  DENSE_RANK()  OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rank
FROM employees;

-- 结果示例（Engineering 部门）：
-- Engineering | Alice | 18000 | 1 | 1 | 1
-- Engineering | Bob   | 15000 | 2 | 2 | 2
-- Engineering | Carol | 15000 | 3 | 2 | 2
-- Engineering | Dave  | 12000 | 4 | 4 | 3
```

:::

### 3. 偏移函数

| 函数 | 说明 |
|------|------|
| `LAG(col, n, default)` | 获取当前行往前第 n 行的值 |
| `LEAD(col, n, default)` | 获取当前行往后第 n 行的值 |
| `FIRST_VALUE(col)` | 窗口第一行的值 |
| `LAST_VALUE(col)` | 窗口最后一行的值（需注意帧范围） |

::: details LAG/LEAD 环比计算示例

```sql
-- 计算每月销售额及环比增长率
SELECT
  month,
  revenue,
  LAG(revenue, 1, 0) OVER (ORDER BY month)   AS prev_month_revenue,
  ROUND(
    (revenue - LAG(revenue, 1, 0) OVER (ORDER BY month))
    / NULLIF(LAG(revenue, 1, 0) OVER (ORDER BY month), 0) * 100,
    2
  ) AS mom_growth_pct   -- Month-over-Month 环比增长率(%)
FROM monthly_sales
ORDER BY month;
```

:::

### 4. 聚合窗口函数

::: details SUM OVER PARTITION BY 示例

```sql
-- 计算每个部门的薪资总和及个人薪资占比
SELECT
  department,
  employee_name,
  salary,
  SUM(salary)   OVER (PARTITION BY department)       AS dept_total,
  AVG(salary)   OVER (PARTITION BY department)       AS dept_avg,
  COUNT(*)      OVER (PARTITION BY department)       AS dept_headcount,
  ROUND(salary::numeric /
        SUM(salary) OVER (PARTITION BY department) * 100, 2) AS pct
FROM employees
ORDER BY department, salary DESC;

-- 累计求和（Running Total）
SELECT
  order_date,
  daily_amount,
  SUM(daily_amount) OVER (ORDER BY order_date
                          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                         ) AS cumulative_amount
FROM daily_orders;
```

:::

---

## 三、CTE 公用表表达式

### 1. 基本 CTE

CTE（Common Table Expression）用 `WITH` 关键字定义临时结果集，使复杂查询结构更清晰。

::: details 基本 CTE 示例

```sql
-- 多层 CTE：统计高价值用户的订单信息
WITH
-- 第一步：找出消费金额 TOP 10% 的用户
high_value_users AS (
  SELECT
    user_id,
    SUM(amount) AS total_spent
  FROM orders
  WHERE status = 'paid'
  GROUP BY user_id
  HAVING SUM(amount) > (
    SELECT PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY total)
    FROM (SELECT SUM(amount) AS total FROM orders WHERE status='paid' GROUP BY user_id) t
  )
),
-- 第二步：获取这些用户的最近订单
recent_orders AS (
  SELECT
    o.user_id,
    o.id          AS order_id,
    o.amount,
    o.created_at,
    ROW_NUMBER() OVER (PARTITION BY o.user_id ORDER BY o.created_at DESC) AS rn
  FROM orders o
  JOIN high_value_users hvu ON o.user_id = hvu.user_id
  WHERE o.status = 'paid'
)
-- 最终查询：取每个用户最近3笔订单
SELECT
  ro.user_id,
  hvu.total_spent,
  ro.order_id,
  ro.amount,
  ro.created_at
FROM recent_orders ro
JOIN high_value_users hvu ON ro.user_id = hvu.user_id
WHERE ro.rn <= 3
ORDER BY hvu.total_spent DESC, ro.created_at DESC;
```

:::

### 2. 递归 CTE

递归 CTE 包含一个基础查询（非递归部分）和一个递归查询（引用自身），用 `UNION ALL` 连接，适合处理树形/层级结构数据。

::: details 递归 CTE 查询树形组织结构

```sql
-- 部门表（department_id, name, parent_id）
-- 递归获取某部门下的所有子部门（包含自身）
WITH RECURSIVE dept_tree AS (
  -- 基础部分：起始节点
  SELECT
    department_id,
    name,
    parent_id,
    0            AS level,
    name::TEXT   AS path
  FROM departments
  WHERE department_id = 1   -- 从根部门开始

  UNION ALL

  -- 递归部分：连接子节点
  SELECT
    d.department_id,
    d.name,
    d.parent_id,
    dt.level + 1,
    dt.path || ' > ' || d.name
  FROM departments d
  JOIN dept_tree dt ON d.parent_id = dt.department_id
)
SELECT
  department_id,
  REPEAT('  ', level) || name AS dept_name,   -- 缩进展示层级
  level,
  path
FROM dept_tree
ORDER BY path;

-- 生成 1~100 的数字序列（递归生成序列）
WITH RECURSIVE nums AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM nums WHERE n < 100
)
SELECT n FROM nums;
```

:::

---

## 四、LATERAL JOIN

`LATERAL` 关键字允许子查询引用其左侧表的列，使子查询变为**相关子查询**，功能类似逐行处理的循环。

::: details LATERAL JOIN 示例

```sql
-- 获取每个用户最近的3笔订单（高效实现）
SELECT
  u.id,
  u.username,
  recent.order_id,
  recent.amount,
  recent.created_at
FROM users u
LEFT JOIN LATERAL (
  SELECT id AS order_id, amount, created_at
  FROM   orders
  WHERE  user_id = u.id          -- 引用外层 u.id（LATERAL 的关键）
  ORDER BY created_at DESC
  LIMIT 3
) AS recent ON true
WHERE u.status = 1
ORDER BY u.id;

-- LATERAL 等同于 MySQL 的 CROSS APPLY（SQL Server 语法）
-- 比子查询更高效，因为可以在子查询中使用索引
```

:::

---

## 五、Upsert（INSERT ON CONFLICT）

PostgreSQL 9.5+ 支持 `INSERT ... ON CONFLICT` 语法实现原子的插入或更新操作（Upsert）。

::: details Upsert 语法示例

```sql
-- 1. 冲突时忽略（DO NOTHING）
INSERT INTO user_preferences (user_id, theme, language)
VALUES (1001, 'dark', 'zh-CN')
ON CONFLICT (user_id) DO NOTHING;

-- 2. 冲突时更新（DO UPDATE SET）
INSERT INTO user_stats (user_id, login_count, last_login_at)
VALUES (1001, 1, NOW())
ON CONFLICT (user_id)
DO UPDATE SET
  login_count   = user_stats.login_count + 1,
  last_login_at = EXCLUDED.last_login_at;
-- EXCLUDED 表示被冲突拒绝的那条新数据

-- 3. 多列唯一约束冲突
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (2001, 3001, 2, 99.00)
ON CONFLICT (order_id, product_id)
DO UPDATE SET
  quantity   = order_items.quantity + EXCLUDED.quantity,
  unit_price = EXCLUDED.unit_price;

-- 4. 指定约束名称
INSERT INTO products (sku, name, price)
VALUES ('SKU-001', 'Widget Pro', 299.00)
ON CONFLICT ON CONSTRAINT products_sku_unique
DO UPDATE SET
  price      = EXCLUDED.price,
  updated_at = NOW();
```

:::

---

## 六、索引类型

PostgreSQL 提供多种索引类型，针对不同数据类型和查询模式优化。

| 索引类型 | 适用数据 | 支持操作 | 典型用途 |
|----------|----------|----------|----------|
| **B-Tree** | 可排序数据（整数/字符串/日期） | `=`、`<`、`>`、`BETWEEN`、`IN`、`LIKE 'abc%'` | 最通用，默认类型 |
| **Hash** | 等值比较 | 仅 `=` | 大量等值查询（很少用，B-Tree 通常更好） |
| **GiST** | 几何、地理、范围、全文向量 | 包含、相交、最近邻 | PostGIS 地理查询、范围类型 |
| **GIN** | 数组、JSONB、全文搜索（tsvector） | `@>`、`?`、`@@` | JSONB 字段查询、全文搜索、数组包含 |
| **BRIN** | 物理顺序与值顺序高度相关的大表 | 范围查询 | 时序数据、日志表（按时间顺序插入） |
| **SP-GiST** | 非平衡树结构数据（前缀树、四叉树） | 几何查询 | 电话号码前缀、IP 地址范围 |

::: details 各类索引创建示例

```sql
-- B-Tree（默认）
CREATE INDEX idx_orders_created_at ON orders (created_at DESC);

-- 复合索引（联合索引）
CREATE INDEX idx_orders_user_status ON orders (user_id, status, created_at DESC);

-- 部分索引（只索引满足条件的行，节省空间）
CREATE INDEX idx_orders_pending ON orders (created_at)
WHERE status = 'pending';

-- 函数索引（对表达式结果建索引）
CREATE INDEX idx_users_lower_email ON users (LOWER(email));
-- 对应查询：WHERE LOWER(email) = 'alice@example.com'

-- GIN 索引（用于 JSONB 和全文搜索）
CREATE INDEX idx_products_attrs ON products USING GIN (attributes);
CREATE INDEX idx_articles_fts ON articles USING GIN (to_tsvector('chinese', content));

-- BRIN 索引（时序大表，极小内存占用）
CREATE INDEX idx_logs_created_at ON operation_logs USING BRIN (created_at)
WITH (pages_per_range = 128);
```

:::

---

## 七、EXPLAIN ANALYZE 执行计划

`EXPLAIN ANALYZE` 实际执行查询并返回真实的执行统计信息，是 PostgreSQL 性能调优最重要的工具。

### 1. 基本用法

::: details EXPLAIN ANALYZE 示例

```sql
-- EXPLAIN：只显示计划，不执行
EXPLAIN SELECT * FROM orders WHERE user_id = 1001;

-- EXPLAIN ANALYZE：执行并显示实际耗时
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 1001;

-- 完整输出（推荐）
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
  u.username,
  COUNT(o.id) AS order_count,
  SUM(o.amount) AS total_amount
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 1
GROUP BY u.id, u.username
HAVING COUNT(o.id) >= 3
ORDER BY total_amount DESC
LIMIT 10;
```

:::

### 2. 关键指标解读

::: details 执行计划输出解读

```
-- 典型 EXPLAIN ANALYZE 输出：
Sort  (cost=1523.45..1523.58 rows=52 width=48)
      (actual time=18.234..18.241 rows=10 loops=1)
  Sort Key: (sum(o.amount)) DESC
  Sort Method: top-N heapsort  Memory: 27kB
  ->  HashAggregate  (cost=1519.23..1521.28 rows=52 width=48)
                     (actual time=18.102..18.175 rows=52 loops=1)
        Group Key: u.id, u.username
        Filter: (count(o.id) >= 3)
        Rows Removed by Filter: 18
        ->  Hash Join  (cost=125.00..1495.00 rows=4923 width=32)
                       (actual time=1.234..15.892 rows=4923 loops=1)
              Hash Cond: (o.user_id = u.id)
              ->  Seq Scan on orders o  (cost=0.00..1200.00 rows=50000 width=16)
                                        (actual time=0.012..8.234 rows=50000 loops=1)
              ->  Hash  (cost=100.00..100.00 rows=2000 width=24)
                         (actual time=1.100..1.100 rows=2000 loops=1)
                    ->  Index Scan using idx_users_status on users u
                         (cost=0.28..100.00 rows=2000 width=24)
                         (actual time=0.021..0.892 rows=2000 loops=1)
                         Index Cond: (status = 1)
Planning Time: 0.892 ms
Execution Time: 18.456 ms
```

| 字段 | 说明 |
|------|------|
| `cost=X..Y` | 估算代价：X=获取第一行代价，Y=获取所有行代价 |
| `rows=N`（计划） | 优化器估算返回行数 |
| `actual time=X..Y` | 实际耗时：X=第一行耗时，Y=所有行耗时（毫秒） |
| `rows=N`（实际） | 实际返回行数；与估算差距大时说明统计信息不准 |
| `loops=N` | 该节点被执行的次数（嵌套循环时大于1） |
| `Rows Removed by Filter` | 被过滤掉的行数 |
| `Buffers: shared hit/read` | 缓存命中/磁盘读取次数（需 BUFFERS 选项） |

:::

### 3. 常见节点类型

| 节点 | 说明 | 性能提示 |
|------|------|----------|
| `Seq Scan` | 全表顺序扫描 | 小表正常；大表出现则需考虑加索引 |
| `Index Scan` | 索引扫描 + 堆表访问 | 良好，有回表 |
| `Index Only Scan` | 仅索引扫描（覆盖索引） | 最优，无需访问堆表 |
| `Bitmap Index Scan` | 先扫索引收集 TID，再访问堆表 | 适合返回大量行的索引扫描 |
| `Nested Loop` | 嵌套循环 JOIN | 小结果集高效；大结果集差 |
| `Hash Join` | 构建哈希表再探测 | 等值 JOIN 常见，内存允许时高效 |
| `Merge Join` | 对两侧有序数据做归并 | 数据已排序时最优 |

::: tip 优化思路
1. `Seq Scan` 在大表出现 → 检查 WHERE 列是否有索引，或添加索引。
2. 估算行数（rows=N）与实际行数差异大 → 执行 `ANALYZE tablename` 更新统计信息。
3. `Nested Loop` 出现在大表 JOIN → 检查 JOIN 条件列是否有索引，或考虑 `Hash Join`。
4. `actual time` 远大于 `cost` → 可能存在锁等待或 I/O 瓶颈。
:::
