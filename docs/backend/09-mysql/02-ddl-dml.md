---
title: "MySQL DDL 与 DML"
category: "后端 · MySQL"
tags:
  - MySQL
  - DDL
  - DML
  - SQL
date: 2026-03-17
excerpt: "系统讲解 MySQL 的 DDL（数据定义语言）与 DML（数据操纵语言），涵盖表结构设计、数据类型选择、各类约束、增删改查语法、多表联查与子查询等核心操作。"
---

# MySQL DDL 与 DML

## 一、DDL — 数据定义语言

DDL（Data Definition Language）用于定义和管理数据库对象结构，包括数据库、表、视图、索引等。

### 1. CREATE TABLE 建表

建表语句是数据库设计的起点，需同时指定字段类型、约束和表选项。

::: details 建表完整示例

```sql
-- 用户表建表语句
CREATE TABLE `users` (
  `id`         BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `username`   VARCHAR(64)      NOT NULL                COMMENT '用户名',
  `email`      VARCHAR(128)     NOT NULL                COMMENT '邮箱',
  `age`        TINYINT UNSIGNED          DEFAULT 0      COMMENT '年龄',
  `status`     TINYINT          NOT NULL DEFAULT 1      COMMENT '状态: 1=正常 0=禁用',
  `created_at` DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`),
  KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

:::

### 2. ALTER TABLE 修改表结构

ALTER TABLE 用于对已有表进行结构变更，是生产环境中最常用的 DDL 操作之一。

::: details ALTER TABLE 常用操作示例

```sql
-- 新增字段
ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号' AFTER `email`;

-- 修改字段类型
ALTER TABLE `users` MODIFY COLUMN `age` SMALLINT UNSIGNED DEFAULT 0 COMMENT '年龄';

-- 重命名字段（MySQL 5.7+）
ALTER TABLE `users` CHANGE `phone` `mobile` VARCHAR(20) DEFAULT NULL COMMENT '手机号';

-- 删除字段
ALTER TABLE `users` DROP COLUMN `mobile`;

-- 添加索引
ALTER TABLE `users` ADD INDEX `idx_status` (`status`);

-- 删除索引
ALTER TABLE `users` DROP INDEX `idx_status`;

-- 修改表注释
ALTER TABLE `users` COMMENT = '系统用户表';
```

:::

::: warning 生产环境注意事项
大表执行 ALTER TABLE 会锁表，建议使用 **pt-online-schema-change** 或 **gh-ost** 工具进行在线变更，避免业务阻塞。
:::

### 3. DROP TABLE 删除表

::: details DROP TABLE 示例

```sql
-- 删除表（如果存在）
DROP TABLE IF EXISTS `users`;

-- 清空表数据但保留结构（比 DELETE 更快，不记录行日志）
TRUNCATE TABLE `users`;
```

:::

::: danger 操作风险
`DROP TABLE` 和 `TRUNCATE TABLE` 均不可回滚，执行前务必备份数据或确认操作范围。
:::

### 4. 数据类型选择指南

选择合适的数据类型能显著影响存储空间和查询性能。

| 场景 | 推荐类型 | 说明 |
|------|----------|------|
| 主键 ID | `BIGINT UNSIGNED` | 预留足够空间，无符号翻倍范围 |
| 短字符串（固定长度） | `CHAR(n)` | 如手机号、状态码，存储效率高 |
| 变长字符串 | `VARCHAR(n)` | 最常用，n 不超过 255 时最优 |
| 长文本 | `TEXT` / `LONGTEXT` | 不建议存储超大内容，影响行格式 |
| 金额/精确小数 | `DECIMAL(10, 2)` | 禁止使用 FLOAT/DOUBLE，避免精度丢失 |
| 布尔/状态 | `TINYINT(1)` | 0/1 表示，节省空间 |
| 时间戳 | `DATETIME` | 存储范围更大；`TIMESTAMP` 受时区影响 |
| JSON 数据 | `JSON` | MySQL 5.7.8+ 支持，提供路径查询 |
| IP 地址 | `INT UNSIGNED` | 使用 `INET_ATON/INET_NTOA` 转换，比字符串节省 3/4 空间 |

::: tip 字符集选择
表和字段统一使用 `utf8mb4` + `utf8mb4_unicode_ci`，完整支持 Emoji 和多语言字符；`utf8` 是 MySQL 的残缺实现，最多只支持 3 字节字符。
:::

### 5. 约束类型详解

约束（Constraint）用于保证数据完整性，在建表或修改表时声明。

| 约束 | 关键字 | 说明 |
|------|--------|------|
| 主键 | `PRIMARY KEY` | 唯一且非空，一张表只能有一个 |
| 唯一 | `UNIQUE` | 列值唯一，允许多个 NULL |
| 非空 | `NOT NULL` | 列值不允许为 NULL |
| 默认值 | `DEFAULT` | 插入时未指定则使用默认值 |
| 外键 | `FOREIGN KEY` | 引用另一张表的主键，保证引用完整性 |
| 检查 | `CHECK` | MySQL 8.0.16+ 支持，限制列值范围 |

::: details 约束语法示例

```sql
CREATE TABLE `orders` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `amount`      DECIMAL(12, 2)  NOT NULL COMMENT '订单金额',
  `status`      VARCHAR(20)     NOT NULL DEFAULT 'pending' COMMENT '订单状态',
  `note`        VARCHAR(500)             DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  -- 外键约束：级联删除
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  -- CHECK 约束（MySQL 8.0.16+）
  CONSTRAINT `chk_amount` CHECK (`amount` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

:::

::: warning 外键使用建议
高并发互联网应用通常在**应用层**维护数据一致性而非依赖数据库外键，原因是外键会增加写操作的锁竞争并降低吞吐量。外键更适合数据仓库或低并发业务系统。
:::

---

## 二、DML — 数据操纵语言

DML（Data Manipulation Language）用于对表中数据进行增、删、改操作。

### 1. INSERT 插入数据

::: details INSERT 各种用法示例

```sql
-- 插入单行
INSERT INTO `users` (`username`, `email`, `status`)
VALUES ('alice', 'alice@example.com', 1);

-- 插入多行（批量插入效率更高）
INSERT INTO `users` (`username`, `email`, `status`) VALUES
  ('bob',   'bob@example.com',   1),
  ('carol', 'carol@example.com', 1),
  ('dave',  'dave@example.com',  0);

-- 从查询结果插入（INSERT INTO ... SELECT）
INSERT INTO `users_archive` (`id`, `username`, `email`)
SELECT `id`, `username`, `email`
FROM   `users`
WHERE  `status` = 0;

-- 重复键更新（UPSERT）
INSERT INTO `user_stats` (`user_id`, `login_count`)
VALUES (1001, 1)
ON DUPLICATE KEY UPDATE `login_count` = `login_count` + 1;
```

:::

### 2. UPDATE 更新数据

::: details UPDATE 用法示例

```sql
-- 更新单个字段
UPDATE `users`
SET    `status` = 0
WHERE  `id` = 1001;

-- 更新多个字段
UPDATE `users`
SET    `email`  = 'newemail@example.com',
       `status` = 1
WHERE  `username` = 'alice';

-- 基于另一张表更新（JOIN UPDATE）
UPDATE `orders` o
JOIN   `users`  u ON o.user_id = u.id
SET    o.`status` = 'cancelled'
WHERE  u.`status` = 0;
```

:::

::: danger 必须带 WHERE 子句
不带 WHERE 的 UPDATE 会更新全表所有行。生产环境建议开启 `sql_safe_updates=1`，强制要求 UPDATE/DELETE 必须使用索引列作为过滤条件。
:::

### 3. DELETE 删除数据

::: details DELETE 用法示例

```sql
-- 按条件删除
DELETE FROM `users`
WHERE  `status` = 0 AND `created_at` < '2024-01-01';

-- 限制删除行数（分批删除大表数据）
DELETE FROM `operation_logs`
WHERE  `created_at` < DATE_SUB(NOW(), INTERVAL 90 DAY)
LIMIT  1000;

-- JOIN DELETE（删除关联行）
DELETE o
FROM   `orders` o
JOIN   `users`  u ON o.user_id = u.id
WHERE  u.`status` = 0;
```

:::

::: tip 大表数据清理建议
对于千万级以上的历史数据清理，使用带 `LIMIT` 的循环分批删除，每批删除后短暂休眠（如 100ms），避免长时间持有行锁影响业务。
:::

---

## 三、DQL — 数据查询语言

### 1. SELECT 基础查询

::: details SELECT 基础语法示例

```sql
-- 指定列查询（避免 SELECT *）
SELECT `id`, `username`, `email`, `created_at`
FROM   `users`
WHERE  `status` = 1;

-- 列别名与表达式
SELECT
  `id`,
  `username`                                    AS `name`,
  CONCAT(`username`, '@system')                 AS `display_name`,
  DATE_FORMAT(`created_at`, '%Y-%m-%d')         AS `reg_date`
FROM `users`;
```

:::

### 2. WHERE 条件过滤

::: details WHERE 常用条件示例

```sql
-- 比较运算符
SELECT * FROM `users` WHERE `age` BETWEEN 18 AND 30;

-- IN 列表
SELECT * FROM `orders` WHERE `status` IN ('pending', 'paid');

-- 模糊匹配（注意：前缀模糊 LIKE '%xxx' 无法走索引）
SELECT * FROM `users` WHERE `username` LIKE 'alice%';

-- NULL 判断
SELECT * FROM `users` WHERE `phone` IS NULL;
SELECT * FROM `users` WHERE `phone` IS NOT NULL;

-- 逻辑组合
SELECT * FROM `users`
WHERE  `status` = 1
  AND  (`age` < 18 OR `age` > 60);
```

:::

### 3. GROUP BY 与 HAVING

GROUP BY 对结果集按指定列分组，HAVING 对分组后的结果再次过滤。

::: details GROUP BY / HAVING 示例

```sql
-- 统计每个用户的订单数和总金额
SELECT
  `user_id`,
  COUNT(*)            AS `order_count`,
  SUM(`amount`)       AS `total_amount`,
  AVG(`amount`)       AS `avg_amount`
FROM `orders`
WHERE `status` = 'paid'
GROUP BY `user_id`
HAVING `order_count` >= 5          -- 过滤：只保留下单5次及以上的用户
ORDER BY `total_amount` DESC;
```

:::

::: tip WHERE vs HAVING
- `WHERE` 在分组**之前**过滤原始行，可以使用索引，效率更高。
- `HAVING` 在分组**之后**过滤聚合结果，只能引用 GROUP BY 列或聚合函数结果。
- 能用 WHERE 解决的条件不要放在 HAVING 中。
:::

### 4. ORDER BY 与 LIMIT

::: details ORDER BY / LIMIT 示例

```sql
-- 多列排序
SELECT `id`, `username`, `created_at`
FROM   `users`
ORDER BY `status` DESC, `created_at` ASC;

-- 分页查询（小偏移量）
SELECT `id`, `username`
FROM   `users`
ORDER BY `id`
LIMIT 20 OFFSET 0;   -- 第1页

-- 深分页优化：使用游标代替大 OFFSET
-- 低效写法（OFFSET 很大时全表扫描）
-- SELECT * FROM `users` ORDER BY `id` LIMIT 10 OFFSET 100000;

-- 高效写法（记录上次最大ID，利用索引）
SELECT `id`, `username`
FROM   `users`
WHERE  `id` > 100000   -- 上一页最后一条的ID
ORDER BY `id`
LIMIT  10;
```

:::

---

## 四、多表联查

### 1. JOIN 类型

| JOIN 类型 | 说明 |
|-----------|------|
| `INNER JOIN` | 返回两表匹配的行（交集） |
| `LEFT JOIN` | 返回左表全部行 + 右表匹配行，不匹配的右表列为 NULL |
| `RIGHT JOIN` | 返回右表全部行 + 左表匹配行，不匹配的左表列为 NULL |
| `FULL JOIN` | MySQL 不直接支持，通过 `LEFT JOIN UNION RIGHT JOIN` 模拟 |
| `CROSS JOIN` | 笛卡尔积，慎用 |

::: details JOIN 查询示例

```sql
-- INNER JOIN：查询有订单的用户信息
SELECT u.`username`, o.`id` AS `order_id`, o.`amount`
FROM   `users`  u
INNER JOIN `orders` o ON u.id = o.user_id
WHERE  o.`status` = 'paid';

-- LEFT JOIN：查询所有用户及其订单数（包括没有订单的用户）
SELECT
  u.`id`,
  u.`username`,
  COUNT(o.`id`) AS `order_count`
FROM  `users` u
LEFT JOIN `orders` o ON u.id = o.user_id
GROUP BY u.`id`, u.`username`;

-- 模拟 FULL JOIN（MySQL 不支持 FULL OUTER JOIN）
SELECT u.`id`, u.`username`, o.`id` AS `order_id`
FROM   `users` u
LEFT  JOIN `orders` o ON u.id = o.user_id
UNION
SELECT u.`id`, u.`username`, o.`id` AS `order_id`
FROM   `users` u
RIGHT JOIN `orders` o ON u.id = o.user_id;
```

:::

### 2. 子查询

子查询（Subquery）是嵌套在另一个查询内部的 SELECT 语句。

::: details 子查询示例

```sql
-- WHERE 子查询：查询消费金额高于平均值的订单
SELECT `id`, `user_id`, `amount`
FROM   `orders`
WHERE  `amount` > (SELECT AVG(`amount`) FROM `orders` WHERE `status` = 'paid');

-- IN 子查询：查询有未付款订单的用户
SELECT `id`, `username`
FROM   `users`
WHERE  `id` IN (
  SELECT DISTINCT `user_id`
  FROM   `orders`
  WHERE  `status` = 'pending'
);

-- EXISTS 子查询（通常比 IN 更高效）
SELECT `id`, `username`
FROM   `users` u
WHERE  EXISTS (
  SELECT 1
  FROM   `orders` o
  WHERE  o.`user_id` = u.`id`
    AND  o.`status`  = 'pending'
);

-- FROM 子查询（派生表）
SELECT `user_id`, `total`
FROM (
  SELECT `user_id`, SUM(`amount`) AS `total`
  FROM   `orders`
  WHERE  `status` = 'paid'
  GROUP BY `user_id`
) AS `user_totals`
WHERE `total` > 1000;
```

:::

::: tip IN vs EXISTS 选择建议
- 子查询结果集**小**时用 `IN`，会将结果缓存在内存中再匹配。
- 子查询结果集**大**时用 `EXISTS`，逐行判断存在性，命中即退出，效率更高。
:::

---

## 五、聚合函数

常用聚合函数汇总：

| 函数 | 说明 | 示例 |
|------|------|------|
| `COUNT(*)` | 统计行数（含 NULL） | `COUNT(*)` |
| `COUNT(col)` | 统计非 NULL 行数 | `COUNT(email)` |
| `SUM(col)` | 求和 | `SUM(amount)` |
| `AVG(col)` | 平均值 | `AVG(score)` |
| `MAX(col)` | 最大值 | `MAX(price)` |
| `MIN(col)` | 最小值 | `MIN(price)` |
| `GROUP_CONCAT(col)` | 分组内字符串拼接 | `GROUP_CONCAT(tag SEPARATOR ',')` |

::: details 聚合函数综合示例

```sql
-- 订单统计报表
SELECT
  DATE_FORMAT(`created_at`, '%Y-%m')  AS `month`,
  COUNT(*)                             AS `total_orders`,
  COUNT(DISTINCT `user_id`)            AS `active_users`,
  SUM(`amount`)                        AS `gmv`,
  AVG(`amount`)                        AS `avg_order_value`,
  MAX(`amount`)                        AS `max_order`,
  MIN(`amount`)                        AS `min_order`
FROM  `orders`
WHERE `status` = 'paid'
  AND `created_at` >= '2025-01-01'
GROUP BY DATE_FORMAT(`created_at`, '%Y-%m')
ORDER BY `month` DESC;

-- GROUP_CONCAT：将每个用户的商品标签合并为一行
SELECT
  `user_id`,
  GROUP_CONCAT(DISTINCT `tag` ORDER BY `tag` SEPARATOR ', ') AS `tags`
FROM  `user_tags`
GROUP BY `user_id`;
```

:::
