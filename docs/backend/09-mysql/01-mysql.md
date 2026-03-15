---
title: "MySQL 基础与实践"
category: "后端 · MySQL"
tags:
  - MySQL
excerpt: "关系型数据库（RDBMS）以表格形式组织数据，通过行和列存储结构化信息，表与表之间通过外键建立关系。MySQL 是最流行的开源关系型数据库之一，广泛应用于 Web 开发领域。 | 概念 | 说明 | |------|------| | Da..."
---

# MySQL 基础与实践

## 一、关系型数据库概述

关系型数据库（RDBMS）以表格形式组织数据，通过行和列存储结构化信息，表与表之间通过外键建立关系。MySQL 是最流行的开源关系型数据库之一，广泛应用于 Web 开发领域。

### 1. 核心概念

| 概念 | 说明 |
|------|------|
| Database | 数据库，存储表的容器 |
| Table | 表，由行和列组成的数据集合 |
| Row | 行（记录），一条完整的数据 |
| Column | 列（字段），数据的某个属性 |
| Primary Key | 主键，唯一标识一条记录 |
| Foreign Key | 外键，建立表间关联 |
| Index | 索引，加速数据查询 |

### 2. MySQL 特点

- 开源免费，社区活跃
- 支持大规模数据存储，性能优秀
- 支持多种存储引擎（InnoDB、MyISAM 等）
- 跨平台支持（Linux、Windows、macOS）
- 完善的事务支持（InnoDB 引擎）

## 二、安装与配置

### 1. 各平台安装方式

::: code-group

```bash [macOS]
# 使用 Homebrew 安装
brew install mysql

# 启动服务
brew services start mysql

# 设置 root 密码
mysql_secure_installation
```

```bash [Ubuntu/Debian]
# 安装 MySQL Server
sudo apt update
sudo apt install mysql-server

# 启动服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation
```

```bash [Docker]
# 拉取镜像并运行
docker run -d \
  --name mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=your_password \
  -v mysql_data:/var/lib/mysql \
  mysql:8.0
```

:::

### 2. 连接数据库

::: details 连接示例

```bash
# 命令行连接
mysql -u root -p

# 指定主机和端口
mysql -h 127.0.0.1 -P 3306 -u root -p
```

:::

## 三、数据类型

### 1. 数值类型

| 类型 | 大小 | 范围（有符号） | 用途 |
|------|------|----------------|------|
| TINYINT | 1 字节 | -128 ~ 127 | 小整数值 |
| INT | 4 字节 | -2^31 ~ 2^31-1 | 标准整数 |
| BIGINT | 8 字节 | -2^63 ~ 2^63-1 | 大整数值 |
| DECIMAL(M,D) | 变长 | 取决于 M 和 D | 精确小数（金额等） |
| FLOAT | 4 字节 | - | 单精度浮点 |
| DOUBLE | 8 字节 | - | 双精度浮点 |

### 2. 字符串类型

| 类型 | 最大长度 | 用途 |
|------|----------|------|
| CHAR(N) | 255 字符 | 定长字符串 |
| VARCHAR(N) | 65535 字符 | 变长字符串 |
| TEXT | 65535 字符 | 长文本 |
| LONGTEXT | 4GB | 超长文本 |
| ENUM | - | 枚举值 |
| JSON | - | JSON 数据（MySQL 5.7+） |

### 3. 日期时间类型

| 类型 | 格式 | 用途 |
|------|------|------|
| DATE | YYYY-MM-DD | 日期 |
| TIME | HH:MM:SS | 时间 |
| DATETIME | YYYY-MM-DD HH:MM:SS | 日期时间 |
| TIMESTAMP | YYYY-MM-DD HH:MM:SS | 时间戳（自动更新） |

::: tip
金额字段请使用 `DECIMAL` 而非 `FLOAT/DOUBLE`，避免浮点精度问题。时间字段推荐使用 `DATETIME`，`TIMESTAMP` 存在 2038 年问题。
:::

## 四、CRUD 操作

### 1. 创建数据库与表

::: details 建库建表示例

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS shop
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shop;

-- 创建用户表
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status TINYINT DEFAULT 1 COMMENT '1:启用 0:禁用',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建订单表
CREATE TABLE orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  order_no VARCHAR(32) NOT NULL UNIQUE,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status ENUM('pending', 'paid', 'shipped', 'completed', 'cancelled') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

:::

### 2. 插入数据（INSERT）

::: details 插入示例

```sql
-- 单条插入
INSERT INTO users (username, email, password_hash)
VALUES ('zhangsan', 'zhangsan@example.com', SHA2('password123', 256));

-- 批量插入
INSERT INTO users (username, email, password_hash) VALUES
  ('lisi', 'lisi@example.com', SHA2('pass456', 256)),
  ('wangwu', 'wangwu@example.com', SHA2('pass789', 256));

-- 插入或更新（唯一键冲突时更新）
INSERT INTO users (username, email, password_hash)
VALUES ('zhangsan', 'new@example.com', SHA2('newpass', 256))
ON DUPLICATE KEY UPDATE email = VALUES(email);
```

:::

### 3. 查询数据（SELECT）

::: details 查询示例

```sql
-- 基础查询
SELECT id, username, email FROM users WHERE status = 1;

-- 条件查询
SELECT * FROM users
WHERE created_at >= '2026-01-01'
  AND status = 1
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;

-- 模糊查询
SELECT * FROM users WHERE username LIKE '张%';

-- 聚合查询
SELECT status, COUNT(*) AS count, SUM(total_amount) AS total
FROM orders
GROUP BY status
HAVING total > 1000;

-- 子查询
SELECT * FROM users
WHERE id IN (
  SELECT DISTINCT user_id FROM orders WHERE status = 'completed'
);
```

:::

### 4. 更新数据（UPDATE）

::: details 更新示例

```sql
-- 单条更新
UPDATE users SET email = 'newemail@example.com' WHERE id = 1;

-- 批量更新
UPDATE orders SET status = 'cancelled'
WHERE status = 'pending'
  AND created_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE);
```

:::

::: warning
执行 UPDATE 和 DELETE 时务必带 WHERE 条件，建议先用 SELECT 确认影响的行数。
:::

### 5. 删除数据（DELETE）

::: details 删除示例

```sql
-- 条件删除
DELETE FROM orders WHERE status = 'cancelled' AND created_at < '2025-01-01';

-- 软删除（推荐，添加 deleted_at 字段）
UPDATE users SET deleted_at = NOW() WHERE id = 5;
```

:::

## 五、索引

### 1. 索引类型

| 类型 | 说明 |
|------|------|
| PRIMARY KEY | 主键索引，唯一且不允许 NULL |
| UNIQUE | 唯一索引，值不可重复 |
| INDEX | 普通索引 |
| FULLTEXT | 全文索引，用于文本搜索 |
| 联合索引 | 多列组合索引 |

### 2. 索引操作

::: details 索引操作示例

```sql
-- 创建索引
CREATE INDEX idx_username ON users(username);
CREATE UNIQUE INDEX idx_order_no ON orders(order_no);

-- 创建联合索引
CREATE INDEX idx_user_status ON orders(user_id, status);

-- 查看索引
SHOW INDEX FROM users;

-- 删除索引
DROP INDEX idx_username ON users;

-- 使用 EXPLAIN 分析查询是否命中索引
EXPLAIN SELECT * FROM users WHERE username = 'zhangsan';
```

:::

### 3. 索引优化原则

::: tip 索引使用建议

- 遵循最左前缀原则：联合索引 `(a, b, c)` 可命中 `a`、`a,b`、`a,b,c`，但无法命中 `b,c`
- 避免在索引列上使用函数或运算：`WHERE YEAR(created_at) = 2026` 不走索引
- 选择区分度高的列建索引，如 `username` 优于 `status`
- 避免过多索引，影响写入性能
- 使用覆盖索引减少回表查询
:::

## 六、JOIN 连接查询

### 1. 连接类型

| 类型 | 说明 |
|------|------|
| INNER JOIN | 返回两表匹配的行 |
| LEFT JOIN | 返回左表所有行，右表无匹配则为 NULL |
| RIGHT JOIN | 返回右表所有行，左表无匹配则为 NULL |
| CROSS JOIN | 笛卡尔积，返回两表所有组合 |

### 2. 连接查询示例

::: details JOIN 示例

```sql
-- INNER JOIN：查询有订单的用户
SELECT u.username, o.order_no, o.total_amount
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed';

-- LEFT JOIN：查询所有用户及其订单数
SELECT u.username, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.username;

-- 多表关联
SELECT u.username, o.order_no, p.product_name, oi.quantity
FROM users u
INNER JOIN orders o ON u.id = o.user_id
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
WHERE o.status = 'completed';
```

:::

## 七、事务

### 1. ACID 特性

| 特性 | 说明 |
|------|------|
| Atomicity（原子性） | 事务内操作要么全部成功，要么全部回滚 |
| Consistency（一致性） | 事务前后数据保持一致状态 |
| Isolation（隔离性） | 并发事务互不干扰 |
| Durability（持久性） | 事务提交后数据永久保存 |

### 2. 事务操作

::: details 事务示例

```sql
-- 转账场景：从账户 A 转 100 元到账户 B
START TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE user_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE user_id = 2;

-- 检查余额是否为负
SELECT balance FROM accounts WHERE user_id = 1;
-- 如果余额 >= 0 则提交，否则回滚

COMMIT;
-- 或 ROLLBACK;
```

:::

### 3. 隔离级别

| 级别 | 脏读 | 不可重复读 | 幻读 |
|------|------|-----------|------|
| READ UNCOMMITTED | 可能 | 可能 | 可能 |
| READ COMMITTED | 不可能 | 可能 | 可能 |
| REPEATABLE READ（默认） | 不可能 | 不可能 | 可能 |
| SERIALIZABLE | 不可能 | 不可能 | 不可能 |

::: tip
MySQL InnoDB 默认使用 `REPEATABLE READ` 隔离级别，并通过 MVCC 和间隙锁在一定程度上解决了幻读问题。
:::

## 八、存储过程与函数

### 1. 存储过程

::: details 存储过程示例

```sql
-- 创建存储过程：按月统计订单
DELIMITER //
CREATE PROCEDURE get_monthly_stats(IN target_year INT)
BEGIN
  SELECT
    MONTH(created_at) AS month,
    COUNT(*) AS order_count,
    SUM(total_amount) AS total_revenue
  FROM orders
  WHERE YEAR(created_at) = target_year
  GROUP BY MONTH(created_at)
  ORDER BY month;
END //
DELIMITER ;

-- 调用存储过程
CALL get_monthly_stats(2026);
```

:::

### 2. 自定义函数

::: details 自定义函数示例

```sql
-- 创建函数：计算订单折扣价
DELIMITER //
CREATE FUNCTION calc_discount(amount DECIMAL(10,2), level VARCHAR(20))
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
  DECLARE discount DECIMAL(3,2);
  CASE level
    WHEN 'vip' THEN SET discount = 0.80;
    WHEN 'svip' THEN SET discount = 0.70;
    ELSE SET discount = 1.00;
  END CASE;
  RETURN amount * discount;
END //
DELIMITER ;

-- 使用函数
SELECT order_no, total_amount, calc_discount(total_amount, 'vip') AS discounted
FROM orders;
```

:::

## 九、性能优化

### 1. 查询优化

- 使用 `EXPLAIN` 分析执行计划，关注 `type`、`key`、`rows` 字段
- 避免 `SELECT *`，只查询需要的字段
- 使用 `LIMIT` 限制返回行数
- 将大事务拆分为小事务，减少锁竞争

### 2. 表设计优化

- 选择合适的数据类型，尽量使用小类型
- 使用 `UNSIGNED` 存储非负整数，扩大范围
- 合理设置 `VARCHAR` 长度，不要一律 `VARCHAR(255)`
- 适当冗余字段，减少 JOIN 查询

### 3. 配置优化

::: details 常用配置调优

```ini
[mysqld]
# InnoDB 缓冲池大小，建议设为物理内存的 60%-80%
innodb_buffer_pool_size = 4G

# 日志文件大小
innodb_log_file_size = 256M

# 最大连接数
max_connections = 500

# 慢查询日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

:::

### 4. 监控与排查

::: details 常用监控命令

```sql
-- 查看当前连接与执行中的查询
SHOW PROCESSLIST;

-- 查看 InnoDB 状态
SHOW ENGINE INNODB STATUS;

-- 查看慢查询日志
SHOW VARIABLES LIKE 'slow_query%';

-- 查看表的大小
SELECT table_name, table_rows,
  ROUND(data_length / 1024 / 1024, 2) AS data_mb,
  ROUND(index_length / 1024 / 1024, 2) AS index_mb
FROM information_schema.tables
WHERE table_schema = 'shop'
ORDER BY data_length DESC;
```

:::
