---
title: "MySQL 索引原理与优化"
category: "后端 · MySQL"
tags:
  - MySQL
  - 索引
  - B+Tree
  - 查询优化
date: 2026-03-17
excerpt: "深入讲解 MySQL 索引的底层数据结构、聚簇索引与二级索引的区别、各类索引的适用场景，以及 EXPLAIN 执行计划解读、15 个索引失效场景和覆盖索引等优化技巧。"
---

# MySQL 索引原理与优化

## 一、索引数据结构

### 1. B+Tree 索引

B+Tree 是 InnoDB 存储引擎默认的索引结构，也是 MySQL 中最常用的索引类型。

B+Tree 的核心特点：

- **多路平衡树**：每个节点可以存储多个键值，树的高度低（通常 3-4 层），磁盘 I/O 次数少。
- **叶子节点存储完整数据（或主键）**：所有叶子节点通过双向链表连接，支持高效范围查询。
- **非叶子节点仅存索引键**：加载更多键值到内存，减少磁盘访问次数。

::: details B+Tree 查询过程示意

```
非叶子节点（仅索引键）：
       [30 | 60]
      /    |    \
  [10|20] [40|50] [70|80]
   ↓  ↓    ↓  ↓    ↓  ↓
 叶子节点（存完整行数据，双向链表连接）
 [10]→[20]→[30]→[40]→[50]→[60]→[70]→[80]

查询 id=40：根节点→右子树→叶子，共3次IO
范围查询 id BETWEEN 30 AND 60：找到30后沿链表顺序扫描
```

:::

B+Tree 适合的查询类型：全键值匹配、最左前缀匹配、键值范围查询、排序、分组。

### 2. Hash 索引

Hash 索引通过哈希函数将键映射为桶地址，等值查询时间复杂度为 O(1)。

| 特性 | B+Tree | Hash |
|------|--------|------|
| 等值查询 | O(log n) | O(1) |
| 范围查询 | 支持 | 不支持 |
| 排序 | 支持 | 不支持 |
| 最左前缀 | 支持 | 不支持 |
| 存储引擎 | InnoDB / MyISAM | Memory（InnoDB 自适应哈希） |

::: tip InnoDB 自适应哈希索引
InnoDB 会自动为热点 B+Tree 索引页构建内存哈希索引（Adaptive Hash Index），无需手动干预。通过 `SHOW ENGINE INNODB STATUS` 可查看其命中情况。
:::

---

## 二、聚簇索引与二级索引

### 1. 聚簇索引（Clustered Index）

InnoDB 中，表数据本身按主键顺序存储在 B+Tree 的叶子节点中，这棵树就是聚簇索引。

- 每张 InnoDB 表有且仅有一个聚簇索引。
- 如果表没有显式主键，InnoDB 会选取第一个唯一非空索引作为聚簇索引；若也没有，则自动生成一个隐藏的 6 字节 `rowid` 列作为主键。
- 聚簇索引的叶子节点存储完整行数据，按主键顺序排列，因此主键查询效率极高。

::: warning 主键设计原则
- 使用**自增整型**（`BIGINT AUTO_INCREMENT`）作为主键，保证新行总是插入到页尾，避免页分裂。
- 使用 UUID 或随机字符串作为主键会导致大量页分裂，严重影响写性能和存储效率。
:::

### 2. 二级索引（Secondary Index）

除聚簇索引外，所有其他索引均为二级索引（也称辅助索引）。

二级索引的叶子节点存储的是**索引键值 + 主键值**，而非完整行数据。

**回表查询**：通过二级索引找到主键后，再去聚簇索引查询完整行数据的过程。回表会产生额外的 I/O。

::: details 回表过程示意

```sql
-- 假设 email 列上有二级索引
SELECT id, username, email FROM users WHERE email = 'alice@example.com';

-- 执行过程：
-- 1. 在 email 二级索引 B+Tree 中查找 'alice@example.com'
-- 2. 找到对应的主键 id = 1001
-- 3. 用 id=1001 在聚簇索引中查询完整行（回表）
-- 4. 返回 id, username, email
```

:::

---

## 三、索引类型

### 1. 普通索引（INDEX）

最基本的索引类型，无唯一性限制。

```sql
-- 建表时创建
KEY `idx_status` (`status`)

-- 单独添加
ALTER TABLE `users` ADD INDEX `idx_created_at` (`created_at`);
```

### 2. 唯一索引（UNIQUE INDEX）

列值唯一，允许一个 NULL 值。等值查询性能优于普通索引（找到即停止扫描）。

```sql
ALTER TABLE `users` ADD UNIQUE INDEX `uq_email` (`email`);
```

### 3. 联合索引（Composite Index）

多列组合的索引，遵循**最左前缀原则**：查询条件必须包含索引的最左列，索引才能生效。

::: details 联合索引最左前缀原则示例

```sql
-- 创建联合索引 (a, b, c)
ALTER TABLE `t` ADD INDEX `idx_abc` (`a`, `b`, `c`);

-- 可以使用索引的查询
WHERE a = 1                    -- 使用索引前缀 (a)
WHERE a = 1 AND b = 2          -- 使用索引前缀 (a, b)
WHERE a = 1 AND b = 2 AND c=3  -- 使用完整索引 (a, b, c)
WHERE a = 1 AND c = 3          -- 使用索引前缀 (a)，c 不连续跳过 b
WHERE a > 1 AND b = 2          -- a 范围查询后 b 无法用索引

-- 不能使用索引的查询
WHERE b = 2                    -- 缺少最左列 a
WHERE b = 2 AND c = 3          -- 缺少最左列 a
```

:::

::: tip 联合索引列顺序设计原则
1. **区分度高**的列放左边，减少扫描行数。
2. 频繁出现在 `WHERE` 等值条件中的列放前面；范围查询列放后面（范围查询后的列无法使用索引过滤）。
3. 考虑**覆盖索引**场景，将 `SELECT` 中的列纳入索引。
:::

### 4. 前缀索引（Prefix Index）

对字符串列的前 N 个字符建索引，节省索引空间，但不支持覆盖索引。

```sql
-- 对 email 的前 20 个字符建索引
ALTER TABLE `users` ADD INDEX `idx_email_prefix` (`email`(20));
```

### 5. 全文索引（FULLTEXT）

用于全文搜索，支持 `MATCH ... AGAINST` 语法，适合文章、评论等长文本搜索。

::: details 全文索引示例

```sql
-- 建立全文索引
ALTER TABLE `articles` ADD FULLTEXT INDEX `ft_content` (`title`, `content`);

-- 自然语言模式搜索
SELECT `id`, `title`
FROM   `articles`
WHERE  MATCH(`title`, `content`) AGAINST ('MySQL索引优化' IN NATURAL LANGUAGE MODE);

-- 布尔模式搜索（支持 +/- 等操作符）
SELECT `id`, `title`
FROM   `articles`
WHERE  MATCH(`title`, `content`) AGAINST ('+MySQL +索引 -慢查询' IN BOOLEAN MODE);
```

:::

::: warning 全文索引局限
MySQL 内置全文索引功能有限，生产环境中的全文搜索建议使用 **Elasticsearch** 或 **Meilisearch**，功能更强大，支持分词、相关性评分等。
:::

---

## 四、EXPLAIN 执行计划解读

`EXPLAIN` 是分析 SQL 查询性能最重要的工具，能展示优化器选择的执行路径。

```sql
EXPLAIN SELECT u.username, COUNT(o.id) AS cnt
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 1
GROUP BY u.id;
```

### 1. 关键字段说明

| 字段 | 重要程度 | 说明 |
|------|----------|------|
| `type` | ★★★★★ | 访问类型，性能从高到低见下表 |
| `key` | ★★★★★ | 实际使用的索引名；NULL 表示未使用索引 |
| `rows` | ★★★★ | 估计需要扫描的行数，越小越好 |
| `Extra` | ★★★★ | 附加信息，包含重要优化提示 |
| `possible_keys` | ★★★ | 可能使用的索引列表 |
| `key_len` | ★★★ | 使用的索引字节长度，判断联合索引使用了几列 |
| `filtered` | ★★★ | 按条件过滤后剩余行的百分比估算 |

### 2. type 访问类型（性能从高到低）

| type 值 | 说明 | 目标 |
|---------|------|------|
| `system` | 只有一行数据（系统表） | 最优 |
| `const` | 通过主键或唯一索引等值查询，最多一行 | 最优 |
| `eq_ref` | JOIN 时被驱动表走主键/唯一索引等值匹配 | 优秀 |
| `ref` | 走普通索引等值查询，可能多行 | 良好 |
| `range` | 索引范围扫描（BETWEEN/IN/>/<） | 可接受 |
| `index` | 全索引扫描（比 ALL 快，但仍是全扫） | 较差 |
| `ALL` | 全表扫描，无索引可用 | 最差，需优化 |

::: tip 优化目标
线上 SQL 的 `type` 至少要达到 `range`，核心业务 SQL 应达到 `ref` 或 `const`。发现 `ALL` 或 `index` 扫描需立即排查。
:::

### 3. Extra 常见值解读

| Extra 值 | 说明 |
|----------|------|
| `Using index` | 覆盖索引，无需回表，性能最优 |
| `Using where` | 在存储引擎层面无法过滤，需 Server 层再过滤 |
| `Using index condition` | 索引下推（ICP），部分 WHERE 条件在索引层过滤 |
| `Using filesort` | 排序无法用索引，需额外排序操作，需优化 |
| `Using temporary` | 使用临时表，通常出现在 GROUP BY/DISTINCT，需优化 |
| `Using join buffer` | JOIN 时被驱动表无索引，使用 Join Buffer 缓存 |

---

## 五、索引失效场景

以下 15 个场景会导致索引失效，造成全表扫描：

| # | 场景 | 示例（失效写法） | 解决方案 |
|---|------|----------------|----------|
| 1 | 最左前缀缺失 | `WHERE b=1`（联合索引 a,b,c） | 查询条件包含最左列 |
| 2 | 列上使用函数 | `WHERE YEAR(created_at)=2025` | 改为范围：`created_at BETWEEN '2025-01-01' AND '2025-12-31'` |
| 3 | 列上进行运算 | `WHERE id+1=100` | 改为 `id=99` |
| 4 | 隐式类型转换 | `WHERE phone=13800138000`（phone 是 VARCHAR） | 加引号：`WHERE phone='13800138000'` |
| 5 | 隐式字符集转换 | 两表 JOIN 字段字符集不同 | 统一字符集为 utf8mb4 |
| 6 | LIKE 前缀通配符 | `WHERE name LIKE '%alice%'` | 改前缀匹配或使用全文索引 |
| 7 | OR 包含无索引列 | `WHERE id=1 OR name='alice'`（name 无索引） | 为 name 建索引，或改用 UNION |
| 8 | IN 子查询 | `WHERE id IN (SELECT ...)` | 改写为 JOIN 或 EXISTS |
| 9 | NOT IN / != | `WHERE status != 1` | 改为正向条件 `WHERE status IN (0, 2)` |
| 10 | IS NULL / IS NOT NULL | `WHERE email IS NULL` | 给列设 DEFAULT，避免 NULL；或建索引（视情况） |
| 11 | 范围查询后的列 | `WHERE a>1 AND b=2`（联合索引 a,b） | 将等值列放前面：先 b 再 a |
| 12 | ORDER BY 方向混合 | `ORDER BY a ASC, b DESC` | 统一排序方向或建对应索引 |
| 13 | SELECT * 触发回表 | `SELECT * ... WHERE email='...'` | 只查索引包含的列，使用覆盖索引 |
| 14 | 数据量极少时 | 全表扫描代价低于走索引 | 理解优化器行为，不强制加索引 |
| 15 | 索引列区分度低 | `WHERE gender='M'`（只有两种值） | 考虑联合索引或不建单列索引 |

---

## 六、覆盖索引与索引下推

### 1. 覆盖索引（Covering Index）

当查询所需的所有列都包含在索引中时，无需回表，直接从索引返回结果，称为覆盖索引。EXPLAIN 中 `Extra` 显示 `Using index`。

::: details 覆盖索引示例

```sql
-- 建立联合索引 (status, username, email)
ALTER TABLE `users` ADD INDEX `idx_status_name_email` (`status`, `username`, `email`);

-- 以下查询命中覆盖索引（SELECT 的列全部在索引中）
SELECT `username`, `email`
FROM   `users`
WHERE  `status` = 1;
-- Extra: Using index（无回表）

-- 以下查询无法覆盖（SELECT 包含了 age，索引中没有）
SELECT `username`, `email`, `age`
FROM   `users`
WHERE  `status` = 1;
-- Extra: Using index condition（需要回表获取 age）
```

:::

### 2. 索引下推（Index Condition Pushdown，ICP）

MySQL 5.6 引入，在存储引擎层利用索引中的列对 WHERE 条件进行提前过滤，减少回表次数。

::: details 索引下推示例

```sql
-- 联合索引 (age, username)
-- 查询：WHERE age > 10 AND username LIKE 'alice%'

-- 无 ICP（MySQL 5.6 之前）：
-- 1. 在索引中找到所有 age > 10 的记录
-- 2. 每条记录都回表取完整行
-- 3. Server 层再过滤 username LIKE 'alice%'

-- 有 ICP（MySQL 5.6+）：
-- 1. 在索引中找到所有 age > 10 的记录
-- 2. 在存储引擎层直接用索引中的 username 过滤 LIKE 'alice%'
-- 3. 只对满足条件的行回表（减少回表次数）
-- EXPLAIN Extra: Using index condition
```

:::

---

## 七、SQL 优化案例

### 1. 慢查询改写

::: details 慢查询优化案例

```sql
-- 场景：查询最近30天注册的活跃用户列表，按注册时间倒序，分页
-- 问题版本（全表扫描）
SELECT *
FROM   `users`
WHERE  DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  AND  status = 1
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
-- 问题：DATE(created_at) 函数导致索引失效

-- 优化版本
-- 1. 去掉函数包裹，改为范围查询
-- 2. 建联合索引 (status, created_at)
-- 3. 只查需要的列，避免 SELECT *
SELECT `id`, `username`, `email`, `created_at`
FROM   `users`
WHERE  `status`     = 1
  AND  `created_at` >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY `created_at` DESC
LIMIT 20;
-- 使用索引：idx_status_created (status, created_at)
-- type: range, Extra: Using index condition
```

:::

### 2. 深分页优化

::: details 深分页优化案例

```sql
-- 低效：OFFSET 10万时需扫描10万行再丢弃
SELECT `id`, `title`, `created_at`
FROM   `articles`
ORDER BY `id`
LIMIT  10 OFFSET 100000;

-- 优化方案1：子查询定位（利用覆盖索引获取ID，再回表）
SELECT a.*
FROM   `articles` a
JOIN (
  SELECT `id` FROM `articles` ORDER BY `id` LIMIT 10 OFFSET 100000
) AS t ON a.id = t.id;

-- 优化方案2：游标分页（最优方案，适合顺序翻页）
-- 前端记录上一页最后一条的 id（如 last_id = 100000）
SELECT `id`, `title`, `created_at`
FROM   `articles`
WHERE  `id` > 100000   -- 上一页最后一条ID
ORDER BY `id`
LIMIT  10;
```

:::
