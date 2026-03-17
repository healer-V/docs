---
title: "PostgreSQL JSON 与数组"
category: "后端 · PostgreSQL"
tags:
  - PostgreSQL
  - JSON
  - JSONB
  - 数组
date: 2026-03-17
excerpt: "深入讲解 PostgreSQL 对 JSON/JSONB 的原生支持，涵盖 JSONB 操作符与索引、数组类型操作、全文搜索（tsvector/tsquery）以及 pg_trgm 模糊搜索，展示 PostgreSQL 强大的非结构化数据处理能力。"
---

# PostgreSQL JSON 与数组

## 一、JSON vs JSONB 对比

PostgreSQL 提供两种 JSON 类型，在功能和性能上有显著差异。

| 特性 | `JSON` | `JSONB` |
|------|--------|---------|
| 存储方式 | 文本原样存储（保留空格、键顺序） | 二进制格式，解析后存储 |
| 写入速度 | 更快（不解析） | 稍慢（需解析） |
| 读取速度 | 慢（每次读取都需解析） | 快（直接二进制操作） |
| 索引支持 | 不支持 GIN 索引 | 支持 GIN 索引 |
| 键顺序 | 保留原始顺序 | 不保证顺序 |
| 重复键 | 保留所有重复键 | 保留最后一个 |
| 查询操作符 | 基础 `->`, `->>` | 全部操作符，功能完整 |
| 推荐场景 | 仅存储、无需查询 | **生产环境推荐** |

::: tip 选择建议
绝大多数情况下选择 `JSONB`。除非你需要完整保留 JSON 的原始格式（如键顺序、重复键、格式化空白），才考虑使用 `JSON`。
:::

---

## 二、JSONB 操作符

### 1. 读取操作符

| 操作符 | 说明 | 示例 | 返回类型 |
|--------|------|------|----------|
| `->` | 按键/索引提取，返回 JSONB | `data->'name'` | `jsonb` |
| `->>` | 按键/索引提取，返回文本 | `data->>'name'` | `text` |
| `#>` | 按路径提取，返回 JSONB | `data#>'{address,city}'` | `jsonb` |
| `#>>` | 按路径提取，返回文本 | `data#>>'{address,city}'` | `text` |

::: details 读取操作符示例

```sql
-- 示例数据
CREATE TABLE products (
  id      SERIAL PRIMARY KEY,
  name    TEXT,
  attrs   JSONB   -- 存储商品属性
);

INSERT INTO products (name, attrs) VALUES
  ('iPhone 16', '{"brand":"Apple","specs":{"ram":8,"storage":256},"tags":["phone","5G"],"price":6999}'),
  ('MacBook Pro', '{"brand":"Apple","specs":{"ram":32,"storage":1024},"tags":["laptop","M4"],"price":18999}');

-- -> 返回 JSONB（用于嵌套访问）
SELECT attrs->'brand'                    FROM products;  -- "Apple"（带引号的JSONB）
SELECT attrs->'specs'->'ram'             FROM products;  -- 8

-- ->> 返回文本（用于最终取值）
SELECT attrs->>'brand'                   FROM products;  -- Apple（纯文本）
SELECT attrs->>'price'                   FROM products;  -- 6999

-- #> 路径访问（返回JSONB）
SELECT attrs#>'{specs,ram}'              FROM products;  -- 8
-- #>> 路径访问（返回文本）
SELECT attrs#>>'{specs,storage}'         FROM products;  -- 256

-- 数组元素访问（0-based 索引）
SELECT attrs->'tags'->0                  FROM products;  -- "phone"
SELECT attrs->'tags'->>1                 FROM products;  -- 5G
```

:::

### 2. 存在性与包含操作符

| 操作符 | 说明 | 示例 |
|--------|------|------|
| `?` | 键是否存在于顶层 | `attrs ? 'brand'` |
| `?|` | 任意一个键存在 | `attrs ?| ARRAY['brand','color']` |
| `?&` | 所有键都存在 | `attrs ?& ARRAY['brand','price']` |
| `@>` | 左边是否包含右边（子集） | `attrs @> '{"brand":"Apple"}'` |
| `<@` | 右边是否包含左边 | `'{"ram":8}' <@ attrs->'specs'` |

::: details 存在性查询示例

```sql
-- 查询有 brand 属性的商品
SELECT name FROM products WHERE attrs ? 'brand';

-- 查询 brand 为 Apple 的商品（包含查询，走 GIN 索引）
SELECT name FROM products WHERE attrs @> '{"brand":"Apple"}';

-- 查询 specs.ram >= 16 的商品
SELECT name FROM products
WHERE (attrs#>>'{specs,ram}')::int >= 16;

-- 查询 tags 包含 phone 的商品
SELECT name FROM products WHERE attrs->'tags' @> '["phone"]';
```

:::

### 3. 修改操作符

| 操作符/函数 | 说明 | 示例 |
|-------------|------|------|
| `\|\|` | 合并两个 JSONB 对象（右边覆盖左边） | `attrs \|\| '{"color":"black"}'` |
| `-` | 删除键或数组元素 | `attrs - 'brand'` |
| `#-` | 按路径删除 | `attrs #- '{specs,ram}'` |
| `jsonb_set()` | 设置指定路径的值 | `jsonb_set(attrs, '{price}', '5999')` |
| `jsonb_insert()` | 向数组插入元素 | `jsonb_insert(attrs, '{tags,0}', '"new"')` |

::: details JSONB 修改示例

```sql
-- 更新商品价格
UPDATE products
SET attrs = jsonb_set(attrs, '{price}', '5999')
WHERE name = 'iPhone 16';

-- 添加新属性
UPDATE products
SET attrs = attrs || '{"color":"space-gray","in_stock":true}'
WHERE name = 'iPhone 16';

-- 删除属性
UPDATE products
SET attrs = attrs - 'color'
WHERE name = 'iPhone 16';

-- 修改嵌套属性
UPDATE products
SET attrs = jsonb_set(attrs, '{specs,ram}', '16')
WHERE name = 'MacBook Pro';

-- 向标签数组追加元素
UPDATE products
SET attrs = jsonb_insert(attrs, '{tags,-1}', '"bestseller"', true)
WHERE name = 'iPhone 16';
```

:::

---

## 三、JSONB 索引（GIN 索引）

GIN（Generalized Inverted Index，通用倒排索引）是 JSONB 最常用的索引类型，支持包含查询（`@>`）和键存在查询（`?`）。

::: details JSONB GIN 索引示例

```sql
-- 为 attrs 列创建 GIN 索引（支持 @>、?、?|、?& 操作符）
CREATE INDEX idx_products_attrs ON products USING GIN (attrs);

-- 以下查询走 GIN 索引：
SELECT * FROM products WHERE attrs @> '{"brand":"Apple"}';
SELECT * FROM products WHERE attrs ? 'discount';
SELECT * FROM products WHERE attrs ?| ARRAY['tags', 'color'];

-- jsonb_path_ops 操作符类：只支持 @>，但索引更小更快
CREATE INDEX idx_products_attrs_path ON products USING GIN (attrs jsonb_path_ops);

-- 对特定 JSONB 路径建 B-Tree 索引（支持 =、>、< 等比较）
CREATE INDEX idx_products_price ON products ((attrs->>'price')::numeric);
-- 对应查询（走 B-Tree 索引）：
SELECT * FROM products WHERE (attrs->>'price')::numeric BETWEEN 5000 AND 10000;
```

:::

---

## 四、数组类型操作

PostgreSQL 原生支持一维和多维数组，任意数据类型都可以作为数组元素。

### 1. 数组创建与基本操作

::: details 数组操作示例

```sql
-- 建表时使用数组类型
CREATE TABLE articles (
  id       SERIAL  PRIMARY KEY,
  title    TEXT,
  tags     TEXT[],          -- 文本数组
  scores   INTEGER[],       -- 整数数组
  matrix   INTEGER[][]      -- 二维数组
);

-- 插入数组数据
INSERT INTO articles (title, tags, scores)
VALUES
  ('Redis 入门', ARRAY['Redis', 'NoSQL', '数据库'], ARRAY[95, 88, 92]),
  ('PostgreSQL 进阶', '{PostgreSQL,SQL,数据库}', '{98,90,95}');   -- 两种写法等价

-- 访问数组元素（1-based 索引！）
SELECT tags[1] FROM articles;   -- 第一个元素
SELECT tags[1:2] FROM articles; -- 切片（第1到第2个元素）

-- 数组长度
SELECT array_length(tags, 1) FROM articles;   -- 第1维的长度

-- 修改数组
UPDATE articles SET tags[1] = 'Redis 7' WHERE id = 1;

-- 追加元素
UPDATE articles SET tags = array_append(tags, 'Cache') WHERE id = 1;

-- 删除元素
UPDATE articles SET tags = array_remove(tags, 'NoSQL') WHERE id = 1;
```

:::

### 2. 数组查询操作符

| 操作符/函数 | 说明 | 示例 |
|-------------|------|------|
| `= ANY(array)` | 等于数组中任意一个值 | `'Redis' = ANY(tags)` |
| `<> ALL(array)` | 不等于数组中所有值 | `'draft' <> ALL(statuses)` |
| `@>` | 数组包含 | `tags @> ARRAY['Redis']` |
| `<@` | 数组被包含 | `ARRAY['Redis'] <@ tags` |
| `&&` | 数组有交集 | `tags && ARRAY['Redis','SQL']` |
| `unnest(array)` | 展开数组为行 | `SELECT unnest(tags) FROM articles` |
| `array_agg(col)` | 聚合列为数组 | `SELECT array_agg(tag) FROM t` |

::: details 数组查询示例

```sql
-- 查询标签包含 'Redis' 的文章（走 GIN 索引）
SELECT title FROM articles WHERE tags @> ARRAY['Redis'];

-- 查询标签包含 'Redis' 或 'SQL' 中任意一个的文章（交集）
SELECT title FROM articles WHERE tags && ARRAY['Redis', 'SQL'];

-- ANY：查询 score 在某个成绩列表中的记录
SELECT title FROM articles WHERE 95 = ANY(scores);

-- unnest：将标签展开，统计每个标签出现次数
SELECT tag, COUNT(*) AS cnt
FROM articles, unnest(tags) AS tag
GROUP BY tag
ORDER BY cnt DESC;

-- array_agg：将多行聚合为数组
SELECT user_id, array_agg(tag ORDER BY tag) AS all_tags
FROM user_tags
GROUP BY user_id;

-- 为数组列创建 GIN 索引
CREATE INDEX idx_articles_tags ON articles USING GIN (tags);
```

:::

---

## 五、全文搜索

### 1. tsvector 与 tsquery

PostgreSQL 内置全文搜索通过 `tsvector`（文本向量）和 `tsquery`（搜索查询）实现。

| 类型/函数 | 说明 |
|-----------|------|
| `tsvector` | 存储文档的词位（lexeme）及位置信息 |
| `tsquery` | 表示搜索条件（词 + 逻辑运算符） |
| `to_tsvector(config, text)` | 将文本转为 tsvector |
| `to_tsquery(config, query)` | 将查询字符串转为 tsquery |
| `plainto_tsquery(config, query)` | 将自然语言字符串转为 tsquery（空格作 AND） |
| `websearch_to_tsquery(config, query)` | 支持 Google 风格搜索语法（15.0+） |
| `@@` | tsvector 与 tsquery 匹配操作符 |
| `ts_rank(tsvector, tsquery)` | 计算相关性评分 |

::: details 全文搜索完整示例

```sql
-- 建表（使用 tsvector 列存储预计算向量）
CREATE TABLE articles (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT,
  search_vec  TSVECTOR   -- 存储预计算的搜索向量
);

-- 插入数据并生成搜索向量（使用 english 配置；中文需安装 pg_jieba 等扩展）
INSERT INTO articles (title, content, search_vec)
VALUES (
  'PostgreSQL Full-Text Search',
  'PostgreSQL provides powerful full-text search capabilities with tsvector and tsquery.',
  to_tsvector('english', 'PostgreSQL Full-Text Search PostgreSQL provides powerful full-text search capabilities with tsvector and tsquery.')
);

-- 自动维护搜索向量（触发器）
CREATE FUNCTION update_search_vec() RETURNS trigger AS $$
BEGIN
  NEW.search_vec := to_tsvector('english', NEW.title || ' ' || COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_update_search_vec
BEFORE INSERT OR UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION update_search_vec();

-- 建 GIN 索引加速全文搜索
CREATE INDEX idx_articles_search_vec ON articles USING GIN (search_vec);

-- 搜索：查询包含 'postgresql' AND 'search' 的文章
SELECT id, title, ts_rank(search_vec, query) AS rank
FROM articles, to_tsquery('english', 'postgresql & search') AS query
WHERE search_vec @@ query
ORDER BY rank DESC;

-- plainto_tsquery：自然语言查询
SELECT title FROM articles
WHERE search_vec @@ plainto_tsquery('english', 'full text search');

-- 高亮匹配词（ts_headline）
SELECT
  title,
  ts_headline('english', content,
    plainto_tsquery('english', 'full text search'),
    'StartSel=<mark>, StopSel=</mark>'
  ) AS highlighted
FROM articles
WHERE search_vec @@ plainto_tsquery('english', 'full text search');
```

:::

::: warning 中文全文搜索
PostgreSQL 内置分词器不支持中文，需安装第三方扩展：
- **pg_jieba**：基于结巴分词，适合通用中文场景。
- **zhparser**：基于 SCWS，性能更好。
- **ParadeDB**（BM25）：现代全文搜索扩展，支持中文并提供更好的相关性评分。
:::

---

## 六、pg_trgm 模糊搜索

`pg_trgm` 扩展基于三元组（trigram）实现高效的模糊搜索，支持 LIKE/ILIKE 前缀和中缀匹配走索引。

::: details pg_trgm 使用示例

```sql
-- 启用扩展
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 创建 GIN 或 GiST 三元组索引
-- GIN 适合静态数据（查询快，更新慢）；GiST 适合频繁更新的数据
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);

-- 以下 LIKE 查询现在走索引（包括中缀匹配）
SELECT * FROM products WHERE name LIKE '%iPhone%';   -- 普通 B-Tree 无法优化此查询
SELECT * FROM products WHERE name ILIKE '%iphone%';  -- 不区分大小写

-- 相似度查询（similarity 函数）
SELECT name, similarity(name, 'iPhone16') AS sim
FROM products
WHERE name % 'iPhone16'   -- % 操作符：相似度 > similarity_threshold（默认0.3）
ORDER BY sim DESC
LIMIT 10;

-- 设置相似度阈值
SET pg_trgm.similarity_threshold = 0.4;

-- 与全文搜索结合：先用 trgm 过滤候选集，再用全文搜索精排
SELECT p.name, similarity(p.name, 'iphone') AS trgm_score
FROM products p
WHERE p.name % 'iphone'
ORDER BY trgm_score DESC;
```

:::

| 对比 | 全文搜索（tsvector） | pg_trgm |
|------|---------------------|---------|
| 分词方式 | 基于语言规则（词干化） | 字符三元组 |
| 适合 | 自然语言段落搜索 | 用户名/商品名/短字符串模糊匹配 |
| LIKE '%xxx%' 索引支持 | 不支持 | 支持 |
| 相关性评分 | ts_rank（语义相关） | similarity（字符相似度） |
| 多语言支持 | 需配置分词器 | 语言无关 |
