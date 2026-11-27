---
title: "MySQL面试题"
category: "面试题"
tags:
  - MySQL
  - InnoDB
  - 索引
  - 事务
excerpt: "围绕 InnoDB 的 B+ 树索引、聚簇索引与回表、联合索引与索引失效、事务隔离级别与 MVCC、行锁与间隙锁、redo log 与 binlog 两阶段提交，以及慢查询与深分页优化等面试题，给出机制和 EXPLAIN 证据。"
---

# MySQL面试题

MySQL 题大多可以回到 InnoDB 的三个设计：数据按主键组织在 B+ 树中，事务通过 undo log 和锁实现隔离，持久性依靠 redo log 先写日志。回答优化题时，用 `EXPLAIN` 的输出作为证据，而不是凭经验断言“索引失效”。

::: info 版本边界
本篇以 MySQL 8.0 / 8.4 LTS 和 InnoDB 存储引擎为准，默认隔离级别为 REPEATABLE READ。MySQL 8.0 已移除查询缓存，旧资料中的查询缓存优化不再适用。
:::

## 一、索引

### 1. 为什么 InnoDB 使用 B+ 树作为索引结构？

**B+ 树的非叶子节点只存键和子节点指针，一个 16KB 页可以容纳上千个键，树高通常只有 3 到 4 层，查找一行只需少量磁盘 I/O；叶子节点按键有序并用双向链表相连，范围查询可以顺序扫描。**

| 结构 | 不适合作为磁盘索引的原因 |
|------|--------------------------|
| 哈希表 | 只支持等值查询，不支持范围和排序 |
| 二叉搜索树、红黑树 | 每个节点只有两个分支，树太高，I/O 次数多 |
| B 树 | 非叶子节点也存数据，单页容纳的键更少；范围查询需要回溯 |

按主键为 BIGINT（8 字节）加 6 字节指针估算，一个非叶子页约可存 1170 个指针；叶子页每行 1KB 时可存约 16 行，三层 B+ 树约能存放 1170 × 1170 × 16 ≈ 2000 万行。这是估算方法而非固定上限，实际取决于行大小和页填充率。

参考：[MySQL 8.4：InnoDB 索引的物理结构](https://dev.mysql.com/doc/refman/8.4/en/innodb-physical-structure.html)。

### 2. 聚簇索引、二级索引和回表是什么？

**InnoDB 的聚簇索引就是按主键组织的 B+ 树，叶子节点存放整行数据；二级索引的叶子节点存放索引列和主键值。** 通过二级索引查到主键后，再到聚簇索引中取整行，这个过程称为回表。

表没有显式主键时，InnoDB 选择第一个非空唯一索引作为聚簇索引，仍没有则生成隐藏的 6 字节 `DB_ROW_ID`。主键建议使用自增或趋势递增的值：随机的 UUID 主键会让新行插入到 B+ 树的任意位置，引发频繁的页分裂和碎片，二级索引也因主键较长而变大。

**覆盖索引**是避免回表的方法：查询需要的列都包含在二级索引中时，直接从二级索引返回结果，`EXPLAIN` 的 `Extra` 列显示 `Using index`。例如在 `(user_id, status)` 上建索引后，`SELECT status FROM orders WHERE user_id = 1001` 不需要回表。

参考：[MySQL 8.4：聚簇索引与二级索引](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html)。

### 3. 什么是最左前缀原则，哪些情况会导致索引无法使用？

**联合索引 `(a, b, c)` 先按 a 排序，a 相同再按 b 排序，依此类推；查询只有从最左列开始连续匹配，才能利用索引的有序性。** `WHERE b = 2` 无法使用该索引定位，`WHERE a = 1 AND c = 3` 只能用 a 定位。

| 写法 | 索引使用情况 | 原因 |
|------|--------------|------|
| `a = 1 AND b > 2 AND c = 3` | a、b 用于定位，c 不能 | b 是范围条件，其后的 c 不再有序 |
| `WHERE YEAR(created_at) = 2026` | 不能用于定位 | 对索引列使用函数，改为范围条件 |
| `WHERE order_no = 20261127`（列为 VARCHAR） | 不能用于定位 | 隐式类型转换等价于对列做函数 |
| `WHERE name LIKE '%张'` | 不能用于定位 | 前导通配符无法利用有序性 |
| `WHERE a = 1 OR d = 2`（d 无索引） | 通常全表扫描 | `OR` 一侧无索引 |

MySQL 5.6 起的索引下推（ICP）让存储引擎在二级索引中先用 c 过滤再回表，`Extra` 显示 `Using index condition`，减少了回表次数，但 c 仍不参与定位。是否走索引最终由优化器按成本决定：若条件匹配表中大部分行，即使有可用索引，全表扫描也可能更便宜。

参考：[MySQL 8.4：多列索引](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html)、[MySQL 8.4：索引条件下推](https://dev.mysql.com/doc/refman/8.4/en/index-condition-pushdown-optimization.html)。

### 4. EXPLAIN 的输出应该重点看哪些列？

**`type` 看访问方式，`key` 看实际使用的索引，`rows` 看估算扫描行数，`Extra` 看额外操作。**

| 列 | 重点取值 | 含义 |
|----|----------|------|
| `type` | `const` > `eq_ref` > `ref` > `range` > `index` > `ALL` | `index` 是扫描整棵索引，`ALL` 是全表扫描 |
| `key` | 实际使用的索引，`NULL` 表示未使用 | 与 `possible_keys` 对比判断优化器选择 |
| `rows` | 估算值 | 不是精确行数，统计信息过旧时会偏差较大 |
| `Extra` | `Using filesort`、`Using temporary` | 需要额外排序或临时表，通常是优化目标 |

`EXPLAIN` 只显示执行计划不执行查询；MySQL 8.0.18 起的 `EXPLAIN ANALYZE` 会实际执行并输出每一步的真实耗时和行数，适合验证优化前后的差异，但对写操作和慢查询要谨慎使用。

参考：[MySQL 8.4：EXPLAIN 输出格式](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html)。

## 二、事务与锁

### 1. 四种隔离级别分别解决什么问题？

**隔离级别从低到高依次解决脏读、不可重复读和幻读。** InnoDB 默认使用 REPEATABLE READ。

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
|----------|------|------------|------|
| READ UNCOMMITTED | 可能 | 可能 | 可能 |
| READ COMMITTED | 避免 | 可能 | 可能 |
| REPEATABLE READ | 避免 | 避免 | 快照读避免；当前读由临键锁避免 |
| SERIALIZABLE | 避免 | 避免 | 避免 |

脏读是读到其他事务未提交的修改；不可重复读是同一事务两次读同一行结果不同；幻读是两次范围查询得到的行数不同。InnoDB 的 REPEATABLE READ 并非完全没有幻读：事务先快照读，再对另一个事务新插入并提交的行执行 `UPDATE`，这行会变为当前事务可见，再次快照读就能看到它。

参考：[MySQL 8.4：事务隔离级别](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)。

### 2. MVCC 是如何实现的？

**MVCC（多版本并发控制）让普通 `SELECT` 读取数据的历史版本，读写互不阻塞。** 它依赖三部分：每行的隐藏列、undo log 版本链和 Read View。

1. **隐藏列：** 每行有 `DB_TRX_ID`（最后修改它的事务 ID）和 `DB_ROLL_PTR`（指向 undo log 中上一个版本）。
2. **版本链：** 每次修改把旧版本写入 undo log，通过回滚指针串成链表。
3. **Read View：** 快照读时生成，记录当前活跃（未提交）事务 ID 列表、最小活跃 ID 和下一个待分配 ID。

读取一行时，若该版本的 `DB_TRX_ID` 小于最小活跃 ID 或等于自身事务 ID，则可见；若属于生成 Read View 时仍活跃的事务或之后才开始的事务，则沿版本链找更早的版本。

READ COMMITTED 与 REPEATABLE READ 的区别就在 Read View 的生成时机：前者每次 `SELECT` 都生成新的 Read View，所以能读到其他事务刚提交的修改；后者在事务中第一次快照读时生成，之后复用。`SELECT ... FOR UPDATE`、`UPDATE`、`DELETE` 是当前读，读取最新已提交版本并加锁，不走 MVCC 快照。

参考：[MySQL 8.4：InnoDB 多版本](https://dev.mysql.com/doc/refman/8.4/en/innodb-multi-versioning.html)、[MySQL 8.4：一致性非锁定读](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html)。

### 3. 行锁、间隙锁和临键锁有什么区别？

**InnoDB 的行锁加在索引记录上：记录锁锁住索引记录本身，间隙锁锁住两条记录之间的间隙，临键锁（Next-Key Lock）是记录锁加上它前面的间隙。** REPEATABLE READ 下当前读默认加临键锁，用来阻止其他事务在范围内插入新行。

假设 `age` 有普通索引，已有值 10、20、30。事务执行 `SELECT * FROM users WHERE age = 20 FOR UPDATE`，会锁住 `(10, 20]` 的临键锁和 `(20, 30)` 的间隙锁，其他事务插入 `age = 15` 或 `age = 25` 都会被阻塞。若 `age` 是唯一索引且等值命中，则退化为只锁 20 这一条记录。

::: warning 没有索引的更新会锁住整张表的记录
`UPDATE orders SET status = 'closed' WHERE remark = 'test'` 中 `remark` 没有索引时，InnoDB 需要扫描聚簇索引，并对扫描到的每条记录加锁，效果接近锁表，并发更新全部阻塞。高并发更新的条件列必须有合适的索引。
:::

参考：[MySQL 8.4：InnoDB 锁](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html)。

### 4. 死锁如何发生和排查？

**两个事务以相反顺序锁定同一组记录时会形成死锁，InnoDB 检测到等待环后回滚代价较小的事务，被回滚的一方收到错误 1213 `Deadlock found when trying to get lock`。**

排查时执行 `SHOW ENGINE INNODB STATUS`，在 `LATEST DETECTED DEADLOCK` 部分查看两个事务各自持有和等待的锁及 SQL。开启 `innodb_print_all_deadlocks` 可以把每次死锁写入错误日志，便于事后分析。

预防方法包括：所有事务按相同顺序访问记录（如按主键升序批量更新）；缩短事务，避免在事务中调用远程接口；为条件列建立索引减少锁定范围。应用层仍需对 1213 错误做有限次重试，因为死锁无法完全消除。

参考：[MySQL 8.4：InnoDB 死锁](https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks.html)。

## 三、日志与架构

### 1. redo log、undo log 和 binlog 分别有什么作用？

**redo log 保证崩溃后已提交事务不丢失，undo log 支持事务回滚和 MVCC，binlog 用于主从复制和按时间点恢复。**

| 日志 | 所属层 | 记录内容 | 主要用途 |
|------|--------|----------|----------|
| redo log | InnoDB | 物理日志：哪个页做了什么修改 | 崩溃恢复 |
| undo log | InnoDB | 逻辑反向操作：修改前的旧版本 | 回滚、MVCC |
| binlog | Server 层 | 逻辑日志：SQL 语句或行变化 | 主从复制、数据恢复 |

修改数据时，InnoDB 先改内存中的缓冲页并写 redo log，脏页稍后再刷回磁盘，这就是 WAL（先写日志）。顺序写日志比随机写数据页快得多；`innodb_flush_log_at_trx_commit = 1`（默认）时每次提交都把 redo log 刷到磁盘，崩溃后不会丢失已提交事务。

参考：[MySQL 8.4：redo log](https://dev.mysql.com/doc/refman/8.4/en/innodb-redo-log.html)、[MySQL 8.4：binlog](https://dev.mysql.com/doc/refman/8.4/en/binary-log.html)。

### 2. 为什么 redo log 和 binlog 需要两阶段提交？

**两阶段提交保证 redo log 和 binlog 的内容一致，否则崩溃恢复后的主库数据会与从库或备份恢复的数据不同。**

提交过程为：InnoDB 写 redo log 并标记为 prepare；Server 层写 binlog；InnoDB 把 redo log 标记为 commit。崩溃恢复时，处于 prepare 状态的事务若能在 binlog 中找到完整记录就提交，否则回滚。

如果不使用两阶段提交，先写 redo log 后崩溃，主库恢复出这条数据，但 binlog 缺失，从库就少了这次修改；反过来先写 binlog 后崩溃，从库多出一次主库没有的修改。`sync_binlog = 1` 与 `innodb_flush_log_at_trx_commit = 1` 组合（俗称“双 1”）才能保证每次提交都可靠落盘。

参考：[MySQL 8.4：InnoDB 与 binlog 一致性](https://dev.mysql.com/doc/refman/8.4/en/innodb-parameters.html#sysvar_innodb_flush_log_at_trx_commit)。

### 3. 主从复制如何工作，复制延迟如何处理？

**主库把变更写入 binlog；从库的 I/O 线程拉取 binlog 写入中继日志，SQL 线程（8.0 中称为 applier 线程）重放中继日志。** 默认是异步复制，主库提交时不等待从库确认。

延迟的常见原因有：大事务一次修改大量行、从库机器配置低、从库上有慢查询抢占资源、单线程重放跟不上主库并发。处理方式包括拆分大事务、开启基于 `WRITESET` 的并行复制、提升从库配置。

业务上要处理“写后立刻读”：用户下单后马上查询订单列表，读请求落到尚未同步的从库会看不到新订单。可以让写后短时间内的读走主库，或对强一致查询固定走主库。用 `SHOW REPLICA STATUS` 中的 `Seconds_Behind_Source` 观察延迟，它是估算值，重放停滞时可能显示为 0 或 NULL。

参考：[MySQL 8.4：复制实现](https://dev.mysql.com/doc/refman/8.4/en/replication-implementation.html)。

## 四、SQL 优化

### 1. 慢查询如何定位和优化？

**先用慢查询日志找到耗时 SQL，再用 `EXPLAIN` 看执行计划，最后按扫描行数、排序和回表的代价逐项优化。**

1. **开启记录：** 设置 `slow_query_log = ON` 和 `long_query_time = 1`，必要时开启 `log_queries_not_using_indexes`。
2. **聚合分析：** 用 `mysqldumpslow` 或 `pt-query-digest` 按执行总耗时排序，优先优化“总耗时高”的 SQL，而不只是单次最慢的那条。
3. **分析计划：** 关注 `type = ALL`、`rows` 过大、`Using filesort` 和 `Using temporary`。
4. **针对性优化：** 补充或调整联合索引，让排序列进入索引；用覆盖索引避免回表；避免 `SELECT *`；拆分复杂 JOIN。
5. **验证效果：** 用 `EXPLAIN ANALYZE` 或在同等数据量的环境中对比优化前后的耗时与扫描行数。

参考：[MySQL 8.4：慢查询日志](https://dev.mysql.com/doc/refman/8.4/en/slow-query-log.html)。

### 2. 深分页为什么慢，如何优化？

**`LIMIT 1000000, 20` 需要先读取并丢弃前 100 万行，再返回 20 行；若还需要回表，前 100 万行都要回表一次。**

| 方案 | 写法 | 适用条件 |
|------|------|----------|
| 游标分页 | `WHERE id > 上一页最后 id ORDER BY id LIMIT 20` | 只能上一页、下一页，不能任意跳页 |
| 延迟关联 | 先在索引上查出 20 个主键，再 JOIN 原表取整行 | 需要跳页，排序列有索引 |
| 限制最大页数 | 只允许查看前 N 页，配合搜索条件缩小范围 | 业务可接受 |

延迟关联的局部写法如下，子查询只扫描二级索引，最终只对 20 个主键回表：

```sql
SELECT o.* FROM orders o
JOIN (SELECT id FROM orders WHERE user_id = 1001
      ORDER BY created_at DESC LIMIT 1000000, 20) t ON o.id = t.id;
```

该写法要求 `(user_id, created_at)` 上有索引；InnoDB 二级索引的叶子节点自带主键，所以子查询使用覆盖索引。

参考：[MySQL 8.4：LIMIT 查询优化](https://dev.mysql.com/doc/refman/8.4/en/limit-optimization.html)。

### 3. 什么时候需要分库分表，有哪些代价？

**单表数据量或写入并发超过单机承载能力，且索引优化、读写分离、归档冷数据都无法解决时，才考虑分库分表。** 它是降低单库压力的手段，同时引入大量复杂度。

| 拆分方式 | 做法 | 解决的问题 |
|----------|------|------------|
| 垂直分库 | 按业务拆分到不同库 | 业务隔离、连接数压力 |
| 垂直分表 | 把大字段或冷字段拆到扩展表 | 单行过宽 |
| 水平分表 | 按分片键把行拆到多张表 | 单表行数过多 |

分片键应选择查询最常带的字段，例如订单按 `user_id` 分片，用户查自己的订单只访问一个分片；但商家按 `shop_id` 查询时需要扫描全部分片，通常再建一份按商家维度的异构索引表或同步到搜索引擎。分库后还要面对跨库事务、全局唯一 ID、跨分片排序分页和扩容时的数据迁移，因此应在业务增长前规划好分片规则。

参考：[Apache ShardingSphere：数据分片](https://shardingsphere.apache.org/document/current/en/features/sharding/)。
