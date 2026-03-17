---
title: "MySQL 事务与锁机制"
category: "后端 · MySQL"
tags:
  - MySQL
  - 事务
  - ACID
  - 锁
  - MVCC
date: 2026-03-17
excerpt: "深入讲解 MySQL 事务的 ACID 特性、四种隔离级别与并发问题、MVCC 多版本并发控制原理，以及行锁、间隙锁、Next-Key Lock 等锁机制与死锁处理方案。"
---

# MySQL 事务与锁机制

## 一、ACID 特性

事务（Transaction）是数据库操作的基本单位，InnoDB 的事务通过以下四个特性保证数据一致性：

| 特性 | 英文 | 说明 | 实现机制 |
|------|------|------|----------|
| 原子性 | Atomicity | 事务中的操作要么全部成功，要么全部回滚 | undo log |
| 一致性 | Consistency | 事务前后数据库处于合法状态（业务约束不被破坏） | 原子性 + 隔离性 + 持久性共同保证 |
| 隔离性 | Isolation | 并发事务之间互不干扰 | 锁 + MVCC |
| 持久性 | Durability | 事务提交后数据永久保存，即使宕机也不丢失 | redo log |

### 1. 事务基本操作

::: details 事务控制语句示例

```sql
-- 开启事务（两种等价写法）
START TRANSACTION;
-- 或
BEGIN;

-- 执行业务操作
UPDATE `accounts` SET `balance` = `balance` - 500 WHERE `id` = 1001;
UPDATE `accounts` SET `balance` = `balance` + 500 WHERE `id` = 1002;

-- 提交事务
COMMIT;

-- 回滚事务（发生异常时）
ROLLBACK;

-- 设置保存点（部分回滚）
SAVEPOINT `sp1`;
-- ... 执行一些操作
ROLLBACK TO SAVEPOINT `sp1`;  -- 回滚到保存点，不影响保存点之前的操作

-- 查看自动提交状态
SHOW VARIABLES LIKE 'autocommit';
-- 关闭自动提交（当前会话）
SET autocommit = 0;
```

:::

---

## 二、事务隔离级别

### 1. 四种隔离级别与并发问题

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 说明 |
|----------|------|------------|------|------|
| `READ UNCOMMITTED` | 可能 | 可能 | 可能 | 最低，可读未提交数据 |
| `READ COMMITTED` | 不会 | 可能 | 可能 | Oracle/SQL Server 默认级别 |
| `REPEATABLE READ` | 不会 | 不会 | 基本解决 | **MySQL InnoDB 默认级别** |
| `SERIALIZABLE` | 不会 | 不会 | 不会 | 最高，完全串行化，性能最差 |

### 2. 并发问题详解

**脏读（Dirty Read）**：事务 A 读取了事务 B **未提交**的修改，若 B 随后回滚，A 读到的是无效数据。

**不可重复读（Non-repeatable Read）**：事务 A 在同一事务内两次读取同一行，因事务 B 在中间**修改并提交**，导致两次读取结果不同。

**幻读（Phantom Read）**：事务 A 按条件查询时，因事务 B 在中间**插入或删除**了行，导致两次查询结果集行数不同，"凭空多出"或"消失"的行如同幻觉。

::: details 并发问题演示

```sql
-- 演示不可重复读
-- 事务A（REPEATABLE READ 可避免此问题）
START TRANSACTION;
SELECT balance FROM accounts WHERE id = 1001;  -- 结果: 1000

-- 此时事务B执行并提交：
-- UPDATE accounts SET balance = 800 WHERE id = 1001;
-- COMMIT;

SELECT balance FROM accounts WHERE id = 1001;  -- READ COMMITTED 下结果变为 800（不可重复读）
COMMIT;

-- 演示幻读
-- 事务A
START TRANSACTION;
SELECT COUNT(*) FROM orders WHERE user_id = 1001;  -- 结果: 3

-- 此时事务B插入一条新订单并提交

SELECT COUNT(*) FROM orders WHERE user_id = 1001;  -- SERIALIZABLE 下结果仍为 3
COMMIT;
```

:::

### 3. 隔离级别配置

::: details 隔离级别设置示例

```sql
-- 查看当前隔离级别
SHOW VARIABLES LIKE 'transaction_isolation';
-- 或（MySQL 8.0+）
SELECT @@transaction_isolation;

-- 设置当前会话隔离级别
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 设置全局隔离级别（重启后生效）
SET GLOBAL TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- my.cnf 配置（永久生效）
-- [mysqld]
-- transaction_isolation = READ-COMMITTED
```

:::

---

## 三、MVCC 多版本并发控制

MVCC（Multi-Version Concurrency Control）是 InnoDB 实现 `READ COMMITTED` 和 `REPEATABLE READ` 隔离的核心机制，通过维护数据的历史版本，使读操作无需加锁，大幅提升并发性能。

### 1. 版本链

InnoDB 为每行数据维护两个隐藏字段：

| 隐藏字段 | 说明 |
|----------|------|
| `trx_id` | 最后修改该行的事务 ID |
| `roll_pointer` | 指向 undo log 中该行的上一个版本（构成版本链） |

每次更新操作都会在 undo log 中记录旧版本数据，通过 `roll_pointer` 将各版本串成链表。

::: details 版本链示意

```
当前行：id=1, name='Alice', trx_id=100, roll_pointer→

undo log 版本链：
  版本3(当前): name='Charlie', trx_id=100
       ↓ roll_pointer
  版本2: name='Bob',     trx_id=80
       ↓ roll_pointer
  版本1: name='Alice',   trx_id=50
       ↓ roll_pointer
  NULL（最初版本）
```

:::

### 2. ReadView 快照读

当事务执行**快照读**（普通 SELECT，不加锁）时，InnoDB 生成一个 ReadView，包含以下关键信息：

| 字段 | 说明 |
|------|------|
| `m_ids` | 当前活跃（未提交）的事务 ID 列表 |
| `min_trx_id` | 活跃事务中最小的 ID |
| `max_trx_id` | 下一个要分配的事务 ID（当前最大已分配 ID + 1） |
| `creator_trx_id` | 创建该 ReadView 的事务 ID |

**版本可见性判断规则**：对版本链上的每个版本，判断其 `trx_id`：

1. `trx_id == creator_trx_id`：当前事务自己修改的，**可见**。
2. `trx_id < min_trx_id`：在 ReadView 创建前已提交，**可见**。
3. `trx_id >= max_trx_id`：在 ReadView 创建后才开启的事务，**不可见**。
4. `min_trx_id <= trx_id < max_trx_id`：检查是否在 `m_ids` 中：在则**不可见**（未提交），不在则**可见**（已提交）。

### 3. RC 与 RR 的区别

| 隔离级别 | ReadView 生成时机 | 效果 |
|----------|-------------------|------|
| `READ COMMITTED` | **每次** SELECT 都生成新的 ReadView | 能读到其他事务已提交的最新数据 |
| `REPEATABLE READ` | 事务中**第一次** SELECT 时生成，之后复用 | 同一事务内多次读取结果一致 |

::: tip 当前读 vs 快照读
- **快照读**：普通 `SELECT`，通过 MVCC 读取历史版本，无锁，高并发。
- **当前读**：`SELECT ... FOR UPDATE`、`SELECT ... LOCK IN SHARE MODE`、`INSERT`、`UPDATE`、`DELETE`，读取最新版本并加锁。
:::

---

## 四、锁机制

### 1. 锁的粒度分类

| 锁类型 | 粒度 | 开销 | 并发度 | 适用场景 |
|--------|------|------|--------|----------|
| 表锁（Table Lock） | 整张表 | 低 | 低 | MyISAM；DDL 操作 |
| 行锁（Row Lock） | 单行 | 高 | 高 | InnoDB DML 操作 |
| 页锁（Page Lock） | 数据页 | 中 | 中 | BerkeleyDB（较少用） |

InnoDB 默认使用行锁，但只有通过**索引**访问数据时才会加行锁；若无法使用索引，会退化为表锁。

### 2. 行锁类型

#### (1) 记录锁（Record Lock）

锁住索引上的某个具体记录，防止其他事务修改或删除该行。

```sql
-- 加排他记录锁（X Lock）
SELECT * FROM `orders` WHERE `id` = 1001 FOR UPDATE;

-- 加共享记录锁（S Lock）
SELECT * FROM `orders` WHERE `id` = 1001 LOCK IN SHARE MODE;
```

#### (2) 间隙锁（Gap Lock）

锁住索引记录**之间的间隙**，防止其他事务在间隙中插入新记录，解决幻读问题。间隙锁只在 `REPEATABLE READ` 隔离级别下生效。

::: details 间隙锁示例

```sql
-- 假设 orders 表中 id 有 10, 20, 30 三行
-- 执行范围查询并加锁
SELECT * FROM `orders` WHERE `id` BETWEEN 10 AND 30 FOR UPDATE;

-- 间隙锁锁住的范围：(10, 20) 和 (20, 30) 之间的间隙
-- 其他事务无法插入 id=15 或 id=25 的记录
-- 但可以更新已有的 id=10/20/30 的记录（记录锁的范围）
```

:::

#### (3) Next-Key Lock

Next-Key Lock = 记录锁 + 间隙锁，锁住**当前记录及其左侧的间隙**，是 InnoDB 在 `REPEATABLE READ` 下默认的行锁算法。

例如索引值为 `(10, 20, 30)`，对应的 Next-Key Lock 范围为：`(-∞, 10]`、`(10, 20]`、`(20, 30]`、`(30, +∞)`。

::: tip Next-Key Lock 与幻读
InnoDB 通过 Next-Key Lock 解决了幻读问题：当你用 `SELECT ... FOR UPDATE` 进行范围查询时，间隙中无法插入新记录，后续查询结果一致。但普通快照读通过 MVCC 解决幻读，无需加锁。
:::

#### (4) 插入意向锁（Insert Intention Lock）

插入前先获取，表示有事务想在此间隙插入数据。多个事务可以同时持有同一间隙的插入意向锁（只要插入位置不同），不互相阻塞。

### 3. 表级锁

| 锁类型 | 说明 |
|--------|------|
| 意向共享锁（IS） | 事务在加行级 S 锁前，先在表上加 IS 锁 |
| 意向排他锁（IX） | 事务在加行级 X 锁前，先在表上加 IX 锁 |
| AUTO-INC 锁 | 保证 AUTO_INCREMENT 字段的连续性 |
| 元数据锁（MDL） | 保护表结构，DML 加读 MDL，DDL 加写 MDL |

::: details 意向锁作用说明
意向锁是 InnoDB 自动加的表级锁，目的是让表级锁与行级锁共存：当加表锁时，无需遍历所有行判断是否有行锁，只需检查表上是否有意向锁。
:::

---

## 五、死锁检测与处理

### 1. 死锁产生条件

两个或多个事务相互持有对方需要的锁，形成循环等待，即产生死锁。

::: details 死锁场景示例

```sql
-- 事务A
START TRANSACTION;
UPDATE `accounts` SET balance = balance - 100 WHERE id = 1001;  -- 加锁 id=1001
-- ... 等待锁 id=1002

-- 事务B（同时执行）
START TRANSACTION;
UPDATE `accounts` SET balance = balance - 100 WHERE id = 1002;  -- 加锁 id=1002
UPDATE `accounts` SET balance = balance + 100 WHERE id = 1001;  -- 等待锁 id=1001
-- 死锁：A 等 B 释放 1002，B 等 A 释放 1001
```

:::

### 2. InnoDB 死锁检测

InnoDB 内置死锁检测机制，当检测到死锁时会自动选择**代价最小**（undo log 量最少）的事务进行回滚，另一个事务继续执行。

```sql
-- 查看最近一次死锁信息
SHOW ENGINE INNODB STATUS\G
-- 关注 LATEST DETECTED DEADLOCK 部分

-- 死锁相关配置
-- innodb_deadlock_detect = ON（默认开启自动检测）
-- innodb_lock_wait_timeout = 50（等待锁超时秒数，默认50s）
```

### 3. 死锁预防最佳实践

1. **固定加锁顺序**：多个事务操作相同的多行时，按相同顺序加锁（如总是先锁 id 较小的行）。
2. **缩短事务**：将不必要的操作移出事务，减少锁持有时间。
3. **减少锁粒度**：尽量精确 WHERE 条件，避免锁住不必要的行。
4. **合理使用隔离级别**：非必要场景使用 `READ COMMITTED`，减少间隙锁的使用。
5. **批量操作使用一致顺序**：批量更新时按主键排序后再操作。

::: details 死锁监控查询

```sql
-- 查看当前等待锁的事务
SELECT
  r.trx_id                     AS waiting_trx_id,
  r.trx_mysql_thread_id        AS waiting_thread,
  r.trx_query                  AS waiting_query,
  b.trx_id                     AS blocking_trx_id,
  b.trx_mysql_thread_id        AS blocking_thread,
  b.trx_query                  AS blocking_query
FROM       information_schema.innodb_lock_waits  w
INNER JOIN information_schema.innodb_trx         b ON b.trx_id = w.blocking_trx_id
INNER JOIN information_schema.innodb_trx         r ON r.trx_id = w.requesting_trx_id;

-- 强制终止阻塞事务（谨慎使用）
KILL <blocking_thread_id>;
```

:::
