---
title: "Node.js 流"
category: "后端 · Node.js"
tags:
  - Node.js
  - Stream
  - 流处理
excerpt: "Node.js 的 Stream 模块提供处理流式数据的接口，分为可读流、可写流、双工流和转换流四种类型，适合处理大文件、网络数据等场景，可显著降低内存占用。"
date: 2024-01-19
---

# Node.js 流

## 一、流的概念与核心原理

流（Stream）是 Node.js 中用于处理连续数据的抽象接口。它的核心思想是将数据分割成小块（chunk）逐步传输，而不是等待全部数据就绪后再一次性处理。这种方式直接解决了两个关键问题：**内存占用**和**响应延迟**。

以读取一个 1GB 的日志文件为例，若不使用流，Node.js 必须将全部 1GB 数据读入内存后才能开始处理；而使用流，内存中同一时刻只保留一个缓冲区大小（默认 64KB）的数据，处理第一块数据的同时，磁盘正在读取第二块，整个管道并发运行，延迟也更低。

### 1. 四种流类型

Node.js 提供四种基础流类型，覆盖了数据输入、输出和转换的所有场景：

| 类型 | 方向 | 说明 | 典型示例 |
|------|------|------|----------|
| **Readable**（可读流） | 只读 | 从数据源产生数据供消费者读取 | `fs.createReadStream`、HTTP 请求体、数据库查询结果 |
| **Writable**（可写流） | 只写 | 接收数据并写入目标 | `fs.createWriteStream`、HTTP 响应体、数据库写入 |
| **Duplex**（双工流） | 可读且��写 | 读写两端相互独立，有各自的缓冲区 | TCP Socket、`net.Socket` |
| **Transform**（转换流） | 可读且可写 | 输出数据由输入数据转换而来 | `zlib.createGzip`、加密流、CSV 解析器 |

### 2. 背压（Backpressure）机制

背压是流系统中最重要的概念之一。当数据生产速度快于消费速度时，数据会在内存中堆积，最终导致内存溢出或程序崩溃。背压机制的作用是让消费者能够通知生产者"暂停发送"，等我处理完再继续。

Node.js 的背压机制基于以下规则：
- 可写流的内部缓冲区有一个水位线（`highWaterMark`），默认 16KB（对象模式为 16 个对象）
- 当调用 `writable.write(chunk)` 后，若缓冲区超过水位线，该方法返回 `false`，这是一个信号，告知调用方应当停止写入
- 当缓冲区排空后，可写流触发 `drain` 事件，通知生产者可以继续写入

> [!tip]
> `highWaterMark` 不是硬限制，而是一个建议值。超过它后 `write()` 仍然可以写入数据，但返回值变为 `false` 提示你应该暂停。若完全忽略背压，缓冲区会无限增长。

### 3. highWaterMark 的含义和调整建议

`highWaterMark` 控制流内部缓冲区的"高水位线"，它影响内存使用和吞吐量之间的平衡：

| 场景 | 建议值 | 原因 |
|------|--------|------|
| 磁盘 I/O（小文件，高并发） | `16KB`（默认） | 避免过多内存占用 |
| 磁盘 I/O（大文件，低并发） | `1MB ~ 4MB` | 减少系统调用次数，提升吞吐 |
| 网络传输 | `64KB ~ 256KB` | 匹配网络 MTU 和 TCP 窗口 |
| 对象模式（数据库记录） | `100 ~ 1000` | 以对象数量为单位控制批处理大小 |

## 二、可读流（Readable）

可读流是数据的生产者，数据从可读流流出供下游消费。Node.js 中的 HTTP 请求体、文件读取、数据库游标都是可读流的实现。理��可读流的两种模式是正确使用它的前提。

### 1. 流动模式 vs 暂停模式

可读流有两种工作模式，理解它们的区别能帮助你在正确场景下选择合适的读取方式。

**流动模式**：数据自动从底层系统读取并通过 `data` 事件推送给消费者。只要监听 `data` 事件，流就自动进入流动模式。适用场景：你需要尽快读取所有数据，且消费速度足够快。

**暂停模式**：流不会主动推送数据，你必须显式调用 `read()` 方法来取出数据。适用场景：需要手动控制消费节奏，与外部背压机制配合。

| 特性 | 流动模式 | 暂停模式 |
|------|---------|---------|
| 数据触发方式 | 自动触发 `data` 事件 | 手动调用 `read()` |
| 切换方式 | 监听 `data` 或调用 `resume()` | 调用 `pause()` 或移除 `data` 监听 |
| 背压控制 | 需要手动暂停/恢复 | 天然支持，只在需要时调用 `read()` |
| 适用场景 | 简单管道、快速消费 | 精细控制读取节奏 |

以下示例展示流动模式与暂停模式的切换方式：

::: details 流动模式与暂停模式
```js
// src/streams/readable-modes.js
import { createReadStream } from 'fs'

// —— 流动模式 ——
const readable = createReadStream('large-log.txt', { encoding: 'utf-8' })

// 监听 data 事件会自动将流切换到流动模式
readable.on('data', (chunk) => {
  console.log(`收到 ${chunk.length} 字节`)
})

readable.on('end', () => {
  console.log('读取完成')
})

readable.on('error', (err) => {
  console.error('读取错误:', err.message)
})

// —— 暂停模式 ——
const paused = createReadStream('data.txt', { encoding: 'utf-8' })

// readable 事件表示"现在有数据可以读取了"
paused.on('readable', () => {
  let chunk
  // 循环手动读取，直到返回 null（暂时没有更多数据）
  while (null !== (chunk = paused.read(1024))) {
    console.log('手动读取块:', chunk.length)
  }
})

paused.on('end', () => {
  console.log('暂停模式读取完成')
})
```
:::

### 2. 异步迭代器（推荐）

`for await...of` 是 Node.js 10+ 引入的可读流消费方式，它在底层使用暂停模式，自动处理 `readable` 和 `end` 事件，并且能与 `try/catch` 配合捕获流错误，是目前最简洁、最安全的流消费方式。

> [!tip]
> 使用 `for await...of` 时，若流发生错误，异常会被 `try/catch` 捕获，不再需要单独监听 `error` 事件。这是其相比事件监听方式的重要优势。

以下示例展示异步迭代器逐行读取并统计大文件词频：

::: details 异步迭代器读取可读流
```js
// src/streams/async-iterator.js
import { createReadStream } from 'fs'
import { createInterface } from 'readline'

async function countWords(filePath) {
  const wordCount = new Map()

  // readline 接口将字节流转换为行迭代器
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity, // 兼容 Windows \r\n 换行
  })

  // for await...of 自动处理流的生命周期
  for await (const line of rl) {
    const words = line.trim().split(/\s+/)
    for (const word of words) {
      if (word) {
        wordCount.set(word, (wordCount.get(word) ?? 0) + 1)
      }
    }
  }

  return wordCount
}

try {
  const result = await countWords('access.log')
  // 按出现次数降序排列
  const sorted = [...result.entries()].sort((a, b) => b[1] - a[1])
  console.log('词频 Top 10:', sorted.slice(0, 10))
} catch (err) {
  // 文件不存在、权限不足等错误统一在此捕获
  console.error('处理失败:', err.message)
}
```
:::

### 3. 自定义可读流

当数据源是数据库、外部 API 或需要特殊逻辑生成的数据时，你需要自定义可读流。继承 `Readable` 类并实现 `_read()` 方法，该方法会在下��需要数据时被 Node.js 自动调用。`_read()` 内部通过调用 `this.push(chunk)` 推送数据，调用 `this.push(null)` 标志流结束。

以下示例展示一个从数据库分页查询并以流的方式向下游推送的可读流，适用于导出百万级数据的场景：

::: details 自定义数据库分页可读流
```js
// src/streams/db-readable.js
import { Readable } from 'stream'

class DatabaseReadable extends Readable {
  #db
  #table
  #pageSize
  #offset = 0
  #done = false

  /**
   * @param {object} db      - 数据库连接对象（需有 query 方法）
   * @param {string} table   - 要导出的表名
   * @param {number} pageSize - 每页记录数，默认 1000
   */
  constructor(db, table, pageSize = 1000) {
    // objectMode: true 表示流传输 JS 对象而非 Buffer
    super({ objectMode: true, highWaterMark: 100 })
    this.#db = db
    this.#table = table
    this.#pageSize = pageSize
  }

  // Node.js 在需要更多数据时自动调用此方法
  async _read() {
    if (this.#done) {
      this.push(null) // 通知流已结束
      return
    }

    try {
      const rows = await this.#db.query(
        `SELECT * FROM ${this.#table} LIMIT ? OFFSET ?`,
        [this.#pageSize, this.#offset],
      )

      if (rows.length === 0) {
        this.#done = true
        this.push(null) // 没有更多数据，结束流
        return
      }

      this.#offset += rows.length

      // 逐条推送，下游背压会自动暂停 _read 的调用
      for (const row of rows) {
        this.push(row)
      }
    } catch (err) {
      // 通过 destroy 将错误传播到流管道
      this.destroy(err)
    }
  }
}

// 使用示例：将百万用户数据导出为 CSV
import { pipeline } from 'stream/promises'
import { createWriteStream } from 'fs'

const db = await connectDatabase()
const userStream = new DatabaseReadable(db, 'users', 1000)

await pipeline(
  userStream,
  new CsvTransform(),      // 转换为 CSV 格式（见第五章）
  createWriteStream('users-export.csv'),
)

console.log('导出完成')
```
:::

## 三、可写流（Writable）

可写流是数据的消费者，数据从上游流入可写流并最终写入目标（文件、数据库、网络套接字等）。正确处理可写流的背压是保证内存安全的关键。

### 1. 基本写入

可写流提供两个核心方法：`write(chunk)` 用于写入数据，`end(chunk?)` 用于写入最后一块数据并关闭流，随后触发 `finish` 事件。

以下示例展示日志文件的基本写入操作：

::: details 可写流基本写入
```js
// src/streams/basic-writable.js
import { createWriteStream } from 'fs'

const logStream = createWriteStream('app.log', {
  encoding: 'utf-8',
  flags: 'a', // 追加模式，不覆盖原有内容
})

// 写入结构化日志
function writeLog(level, message) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
  }) + '\n'

  logStream.write(entry)
}

writeLog('INFO', '服务器启动')
writeLog('WARN', '配置文件缺少 timeout 字段，使用默认值 30s')
writeLog('ERROR', '数据库连接失败')

// 写入完成后关闭流
logStream.end(() => {
  console.log('日志文件已关闭')
})

// 监听 finish 事件确认写入完成
logStream.on('finish', () => {
  console.log('所有数据已写入磁盘')
})

// 必须监听 error 事件，否则进程会崩溃
logStream.on('error', (err) => {
  console.error('日志写入失败:', err.message)
})
```
:::

### 2. drain 事件与背压处理

`write()` 方法在缓冲区超过 `highWaterMark` 时返回 `false`，此时必须停止写入并等待 `drain` 事件。`drain` 事件表示缓冲区已排空，可以继续写入。若忽略返回值持续写入，缓冲区会无限增长直至内存溢出。

> [!warning]
> 忽略 `write()` 的返回值是常见的内存泄漏来源。在高吞吐量场景下，生产者速度远快于消费者（如磁盘写入）��必须正确实现背压控制。

以下示例展示完整的背压控制逻辑，确保在写入速度超过磁盘能力时正确暂停读取：

::: details drain 事件与背压控制
```js
// src/streams/backpressure.js
import { createReadStream, createWriteStream } from 'fs'

async function copyWithBackpressure(src, dest) {
  const readable = createReadStream(src)
  const writable = createWriteStream(dest)

  return new Promise((resolve, reject) => {
    readable.on('data', (chunk) => {
      // write() 返回 false 时，内部缓冲区已满
      const canContinue = writable.write(chunk)

      if (!canContinue) {
        // 立即暂停读取，避免缓冲区无限增长
        readable.pause()
        console.log('背压触发：暂停读取，等待写入缓冲区排空')
      }
    })

    // 缓冲区排空后，drain 事件触发
    writable.on('drain', () => {
      console.log('缓冲区已排空：恢复读取')
      readable.resume()
    })

    readable.on('end', () => {
      // 所有数据已读取，关闭写入流
      writable.end()
    })

    writable.on('finish', () => {
      console.log(`文件复制完成: ${src} → ${dest}`)
      resolve()
    })

    readable.on('error', reject)
    writable.on('error', reject)
  })
}

await copyWithBackpressure('input-4gb.dat', 'output.dat')
```
:::

### 3. 自定义可写流

当需要将数据写入数据库、发送到消息队列或其他自定义目标时，继承 `Writable` 类并实现 `_write()` 方法。`callback` 必须在处理完成后调用，告知 Node.js 可以继续传递下一块数据。

以下示例展示批量写入数据库的自定义可写流，通过积累一定数量的记录后批量插入，提升数据库写入效率：

::: details 自定义数据库批量写入可写流
```js
// src/streams/db-writable.js
import { Writable } from 'stream'

class DatabaseBatchWritable extends Writable {
  #db
  #table
  #batch = []
  #batchSize

  constructor(db, table, batchSize = 500) {
    super({ objectMode: true })
    this.#db = db
    this.#table = table
    this.#batchSize = batchSize
  }

  // 每次收到一个对象时调用
  async _write(record, encoding, callback) {
    this.#batch.push(record)

    // 积累到批次大小时，批量插入数据库
    if (this.#batch.length >= this.#batchSize) {
      try {
        await this.#flushBatch()
        callback() // 通知可以继续写入
      } catch (err) {
        callback(err) // 将错误传播到管道
      }
    } else {
      callback() // 暂不插入，继续积累
    }
  }

  // 流结束时，将剩余不足一批的数据写入
  async _final(callback) {
    if (this.#batch.length > 0) {
      try {
        await this.#flushBatch()
        callback()
      } catch (err) {
        callback(err)
      }
    } else {
      callback()
    }
  }

  async #flushBatch() {
    const records = this.#batch.splice(0) // 清空并取出当前批次
    await this.#db.batchInsert(this.#table, records)
    console.log(`批量写入 ${records.length} 条记录`)
  }
}

// 配合数据库可读流构建完整的数据迁移管道
import { pipeline } from 'stream/promises'

const sourceDb = await connectDatabase('source')
const targetDb = await connectDatabase('target')

await pipeline(
  new DatabaseReadable(sourceDb, 'orders'),
  new DatabaseBatchWritable(targetDb, 'orders_backup'),
)

console.log('数据迁移完成')
```
:::

## 四、管道连接（pipe 与 pipeline）

管道是流最强大的特性，它将多个流串联成一条数据处理链。数据从第一个流流出，经过中间转换，最终流入最后一个流，整个过程自动处理背压。

### 1. pipe 的问题

`pipe` 是 Node.js 最早提供的管道方法，但它有一个严重缺陷：**当中间某个流发生错误时，上游和下游的流不会被自动销毁，会导致资源泄漏**。例如，在 `read → transform → write` 的链中，若 `transform` 出错，`read` 和 `write` 的文件描述符不会被关闭。

> [!warning]
> 在生产代码中不要使用裸 `pipe()`，始终使用 `pipeline()` 或手动监听每个流的 `error` 事件并调用 `destroy()`。

### 2. pipeline（推荐）

`stream/promises` 模块提供的 `pipeline` 函数解决了 `pipe` 的所有问题：任何一个流出错时，它会自动销毁管道中的所有流并释放资源，同时将错误以 Promise reject 的形式传播，可用 `try/catch` 捕获。

以下示例展示使用 `pipeline` 完成文件读取、Gzip 压缩、AES 加密的三阶段处理链：

::: details pipeline 文件压缩加密
```js
// src/streams/compress-encrypt.js
import { createReadStream, createWriteStream } from 'fs'
import { createGzip } from 'zlib'
import { createCipheriv, randomBytes, scryptSync } from 'crypto'
import { pipeline } from 'stream/promises'

async function compressAndEncrypt(inputFile, outputFile, password) {
  // 从密码派生 AES-256 密钥
  const key = scryptSync(password, 'salt-value', 32)
  // 随机初始化向量，每次加密都不同
  const iv = randomBytes(16)

  const cipher = createCipheriv('aes-256-cbc', key, iv)

  // 先将 IV 写入输出文件头部（解密时需要）
  const output = createWriteStream(outputFile)
  output.write(iv)

  // pipeline 会在任意步骤出错时自动销毁所有流
  await pipeline(
    createReadStream(inputFile),      // 第一步：读取原始文件
    createGzip(),                      // 第二步：Gzip 压缩
    cipher,                            // 第三步：AES 加密
    output,                            // 第四步：写入目标文件
  )

  console.log(`处理完成: ${inputFile} → ${outputFile}`)
  console.log(`IV（解密所需）: ${iv.toString('hex')}`)
}

await compressAndEncrypt('backup.sql', 'backup.sql.gz.enc', 'my-secret-password')
```
:::

以下示例展示使用 `pipeline` 配合自定义转换流完成 CSV 解析并写入数据库：

::: details pipeline ETL 数据处理管道
```js
// src/streams/etl-pipeline.js
import { createReadStream } from 'fs'
import { pipeline } from 'stream/promises'
import { CsvParserTransform } from './csv-parser.js'
import { FilterTransform } from './filter.js'
import { DatabaseBatchWritable } from './db-writable.js'

async function importCsvToDatabase(csvFile, db) {
  console.time('导入耗时')

  await pipeline(
    createReadStream(csvFile, { encoding: 'utf-8' }),
    new CsvParserTransform(),         // 文本行 → JSON 对象
    new FilterTransform(row => row.amount > 0), // 过滤无效数据
    new DatabaseBatchWritable(db, 'transactions', 1000), // 批量写入
  )

  console.timeEnd('导入耗时')
  console.log('CSV 导入完成')
}

const db = await connectDatabase()
await importCsvToDatabase('transactions-2026.csv', db)
```
:::

### 3. 多源合并流

当需要将多个文件顺序合并为一个输出时，可以使用 `PassThrough` 流作为中间层，依次连接每个源文件：

::: details 多文件顺序合并
```js
// src/streams/merge-files.js
import { createReadStream, createWriteStream } from 'fs'
import { PassThrough } from 'stream'
import { pipeline } from 'stream/promises'

async function mergeFiles(inputFiles, outputFile) {
  const merged = new PassThrough()
  const output = createWriteStream(outputFile)

  // 启动写入管道（不等待）
  const writePromise = pipeline(merged, output)

  // 顺序将每个文件写入 PassThrough
  for (const file of inputFiles) {
    await pipeline(
      createReadStream(file),
      merged,
      { end: false }, // 不结束 PassThrough，后续文件还需要写入
    )
    console.log(`已合并: ${file}`)
  }

  // 所有文件写完后，结束流
  merged.end()
  await writePromise

  console.log(`合并完成 → ${outputFile}`)
}

await mergeFiles(
  ['chunk-001.log', 'chunk-002.log', 'chunk-003.log'],
  'merged.log',
)
```
:::

## 五、转换流（Transform）

转换流同时实现可读和可写接口，数据从可写端流入，经过 `_transform()` 方法处理后从可读端流出。它是流管道中"数据加工"环节的核心工具。

### 1. 大写转换流示例

大写转换流是最简单的转换流示例，展示了 `_transform` 和 `_flush` 两个核心方法。`_transform` 在每块数据到达时调用，`_flush` 在上游结束后、流关闭前调用，用于输出最后的数据（如缓冲区中剩余的内容）。

以下示例展示基础转换流的实现结构：

::: details 大写转换流
```js
// src/streams/uppercase-transform.js
import { Transform } from 'stream'
import { createReadStream, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'

class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // 将输入数据转为大写后推送到可读端
    this.push(chunk.toString('utf-8').toUpperCase())
    // 调用 callback 通知 Node.js 可以继续传递下一块数据
    callback()
  }

  _flush(callback) {
    // 所有数据处理完毕后追加分隔线
    this.push('\n=== END OF DOCUMENT ===\n')
    callback()
  }
}

await pipeline(
  createReadStream('document.txt', { encoding: 'utf-8' }),
  new UpperCaseTransform(),
  createWriteStream('document-upper.txt'),
)
```
:::

### 2. 行分割转换流（CSV 处理）

行分割是流处理文本数据的经典需求。由于 TCP 或文件读取时一个 chunk 不一定对应一整行，需要在转换流内部维护缓冲区，将不完整的行保留到下次数据到达。

以下示例展示可复用的 CSV 解析转换流，将字节流转换为 JSON 对象流：

::: details CSV 解析转换流
```js
// src/streams/csv-parser.js
import { Transform } from 'stream'

class CsvParserTransform extends Transform {
  #buffer = ''
  #headers = null
  #lineCount = 0

  constructor(options = {}) {
    // objectMode: true 让输出端传递 JS 对象而非 Buffer
    super({ ...options, objectMode: true })
  }

  _transform(chunk, encoding, callback) {
    this.#buffer += chunk.toString('utf-8')
    const lines = this.#buffer.split('\n')

    // 最后一个元素可能是不完整的行，保留到下次
    this.#buffer = lines.pop() ?? ''

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue // 跳过空行

      const fields = line.split(',').map(f => f.trim())

      if (this.#headers === null) {
        // 第一行是表头
        this.#headers = fields
      } else {
        // 将字段数组与表头组合为对象
        const record = {}
        this.#headers.forEach((header, i) => {
          record[header] = fields[i] ?? ''
        })
        this.#lineCount++
        this.push(record) // 推送 JSON 对象到下游
      }
    }

    callback()
  }

  _flush(callback) {
    // 处理最后一行（文件末尾可能没有换行符）
    if (this.#buffer.trim() && this.#headers) {
      const fields = this.#buffer.trim().split(',').map(f => f.trim())
      const record = {}
      this.#headers.forEach((header, i) => {
        record[header] = fields[i] ?? ''
      })
      this.push(record)
    }
    console.log(`CSV 解析完成，共 ${this.#lineCount} 条记录`)
    callback()
  }
}

export { CsvParserTransform }
```
:::

### 3. 过滤转换流

过滤转换流根据条件决定是否将数据传递给下游，是构建数据处理管道中常用的"过滤器"节点：

::: details 通用过滤转换流
```js
// src/streams/filter-transform.js
import { Transform } from 'stream'

class FilterTransform extends Transform {
  #predicate

  /**
   * @param {Function} predicate - 返回 true 则传递，false 则丢弃
   */
  constructor(predicate, options = {}) {
    super({ ...options, objectMode: true })
    this.#predicate = predicate
  }

  _transform(record, encoding, callback) {
    // 只有满足条件的记录才推送到下游
    if (this.#predicate(record)) {
      this.push(record)
    }
    callback()
  }
}

export { FilterTransform }
```
:::

### 4. 加密/解密转换流

Node.js 内置的 `crypto` 模块的 `Cipher` 和 `Decipher` 对象本身就是转换流，可以直接接入管道，无需手动实现：

::: details 流式加密与解密
```js
// src/streams/crypto-stream.js
import { createReadStream, createWriteStream } from 'fs'
import { createCipheriv, createDecipheriv, scryptSync, randomBytes } from 'crypto'
import { pipeline } from 'stream/promises'

const KEY = scryptSync('application-secret', 'unique-salt', 32)

// 加密文件
async function encryptFile(input, output) {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', KEY, iv)

  // 将 IV 写入文件头（16 字节），解密时需要读取
  const outputStream = createWriteStream(output)
  outputStream.write(iv)

  await pipeline(
    createReadStream(input),
    cipher, // Cipher 是一个 Transform 流
    outputStream,
  )
  console.log(`加密完成: ${input} → ${output}`)
}

// 解密文件
async function decryptFile(input, output) {
  const inputStream = createReadStream(input)

  // 先读取前 16 字节的 IV
  const iv = await new Promise((resolve, reject) => {
    const chunks = []
    let bytesRead = 0

    inputStream.on('readable', () => {
      const chunk = inputStream.read(16)
      if (chunk) {
        chunks.push(chunk)
        bytesRead += chunk.length
        if (bytesRead >= 16) {
          resolve(Buffer.concat(chunks).slice(0, 16))
        }
      }
    })
    inputStream.on('error', reject)
  })

  const decipher = createDecipheriv('aes-256-cbc', KEY, iv)

  await pipeline(
    inputStream, // 从 IV 之后继续读取
    decipher,
    createWriteStream(output),
  )
  console.log(`解密完成: ${input} → ${output}`)
}
```
:::

## 六、实战应用

### 1. 大文件分片处理

在处理大文件上传或批量数据分片时，流允许在不将整个文件加载到内存的情况下，以固定大小的分片逐一处理。

以下示例展示对大文件按固定大小分片并计算每个分片的 MD5 哈希，用于断点续传的校验：

::: details 大文件分片 MD5 计算
```js
// src/streams/chunk-hasher.js
import { createReadStream } from 'fs'
import { createHash } from 'crypto'
import { stat } from 'fs/promises'

const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB 每片

async function calculateChunkHashes(filePath) {
  const { size } = await stat(filePath)
  const totalChunks = Math.ceil(size / CHUNK_SIZE)
  const hashes = []

  console.log(`文件大小: ${(size / 1024 / 1024).toFixed(2)} MB，共 ${totalChunks} 片`)

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE - 1, size - 1)

    const hash = await new Promise((resolve, reject) => {
      const md5 = createHash('md5')
      const stream = createReadStream(filePath, { start, end })

      stream.on('data', (chunk) => md5.update(chunk))
      stream.on('end', () => resolve(md5.digest('hex')))
      stream.on('error', reject)
    })

    hashes.push({ chunkIndex, start, end, size: end - start + 1, hash })
    console.log(`第 ${chunkIndex + 1}/${totalChunks} 片: ${hash}`)
  }

  return hashes
}

const chunkInfo = await calculateChunkHashes('upload-video.mp4')
console.log('分片信息:', JSON.stringify(chunkInfo, null, 2))
```
:::

### 2. 日志文件实时解析

在生产环境中，经常需要实时监控日志文件（类似 `tail -f` 命令）并解析其中的错误信息。以下使用 `fs.watch` 配合流实现日志实时告警：

::: details 日志文件实时监控与解析
```js
// src/streams/log-watcher.js
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { watch } from 'fs'
import { createInterface } from 'readline'

class LogWatcher {
  #filePath
  #lastSize = 0
  #watcher

  constructor(filePath) {
    this.#filePath = filePath
  }

  async start() {
    // 初始化：记录文件当前大小，不重新读取旧数据
    const { size } = await stat(this.#filePath)
    this.#lastSize = size
    console.log(`开始监控: ${this.#filePath}（从第 ${size} 字节开始）`)

    // 监听文件变化
    this.#watcher = watch(this.#filePath, async (eventType) => {
      if (eventType !== 'change') return

      const { size: newSize } = await stat(this.#filePath)
      if (newSize <= this.#lastSize) return // 文件未增长（如日志轮转）

      // 只读取新增的内容
      const stream = createReadStream(this.#filePath, {
        start: this.#lastSize,
        end: newSize - 1,
        encoding: 'utf-8',
      })

      this.#lastSize = newSize

      const rl = createInterface({ input: stream })

      for await (const line of rl) {
        this.#parseLine(line)
      }
    })
  }

  #parseLine(line) {
    if (!line.trim()) return

    // 解析 JSON 格式日志
    try {
      const log = JSON.parse(line)
      if (log.level === 'ERROR') {
        console.error(`[告警] ${log.timestamp} - ${log.message}`)
        // 可在此发送告警通知（邮件、钉钉、Slack）
      }
    } catch {
      // 非 JSON 格式，直接输出原始行
      if (line.includes('ERROR') || line.includes('FATAL')) {
        console.error(`[告警] ${line}`)
      }
    }
  }

  stop() {
    this.#watcher?.close()
    console.log('监控已停止')
  }
}

const watcher = new LogWatcher('/var/log/app/app.log')
await watcher.start()

// 优雅退出
process.on('SIGINT', () => {
  watcher.stop()
  process.exit(0)
})
```
:::

### 3. 流式 HTTP 下载服务器（支持 Range 断点续传）

流式 HTTP 服务器边读文件边发送响应，内存中只保留当前传输的缓冲区数据。支持 `Range` 请求头可以实现断点续传，这是大文件下载的标准做法。

以下示例展示支持断点续传的完整文件下载服务器：

::: details 支持 Range 断点续传的流式文件服务器
```js
// src/file-server.js
import http from 'http'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import path from 'path'

const FILES_DIR = './public/downloads'

http.createServer(async (req, res) => {
  if (req.method !== 'GET') {
    res.writeHead(405)
    return res.end('Method Not Allowed')
  }

  const filename = path.basename(req.url) // 只取文件名，防止路径穿越
  const filePath = path.join(FILES_DIR, filename)

  let fileStats
  try {
    fileStats = await stat(filePath)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    return res.end('文件未找到')
  }

  const { size } = fileStats
  const rangeHeader = req.headers['range']

  if (rangeHeader) {
    // 解析 Range: bytes=start-end
    const [, startStr, endStr] = rangeHeader.match(/bytes=(\d+)-(\d*)/) ?? []
    const start = parseInt(startStr, 10)
    const end = endStr ? parseInt(endStr, 10) : size - 1

    if (start >= size || end >= size) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` })
      return res.end('Range Not Satisfiable')
    }

    const chunkSize = end - start + 1

    // 206 Partial Content 表示部分内容响应
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'application/octet-stream',
    })

    // 流式传输指定范围的数据
    createReadStream(filePath, { start, end }).pipe(res)
  } else {
    // 普通全量下载
    res.writeHead(200, {
      'Accept-Ranges': 'bytes',
      'Content-Length': size,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    })

    createReadStream(filePath).pipe(res)
  }
}).listen(3000, () => {
  console.log('文件下载服务器启动: http://localhost:3000')
})
```
:::

## 七、企业级流处理实践

### 1. 流的错误处理最佳实践

在企业级应用中，流的错误处理有几条必须遵守的规则：

- 使用 `pipeline()` 而非 `pipe()`，它会自动销毁所有流并传播错误
- 自定义流内部发生错误时，调用 `this.destroy(err)` 而非直接 `throw`
- 不使用 `pipeline()` 时，每个流都必须单独监听 `error` 事件，否则未捕获的错误会导致进程崩溃

> [!danger]
> Node.js 中流的 `error` 事件若无监听器，会直接抛出未捕获异常并终止进程。这是生产环境中服务意外崩溃的常见原因之一。

以下示例展示企业级流错误处理的标准写法：

::: details 企业级流错误处理
```js
// src/streams/safe-pipeline.js
import { pipeline } from 'stream/promises'
import { createReadStream, createWriteStream } from 'fs'
import { createGzip } from 'zlib'

async function safePipeline(inputPath, outputPath) {
  try {
    await pipeline(
      createReadStream(inputPath),
      createGzip(),
      createWriteStream(outputPath),
    )
    console.log('管道执行成功')
  } catch (err) {
    // pipeline 会自动销毁所有流，这里只需处理错误逻辑
    console.error('管道执行失败:', err.message)

    // 根据错误类型决定是否重试
    if (err.code === 'ENOENT') {
      throw new Error(`源文件不存在: ${inputPath}`)
    } else if (err.code === 'ENOSPC') {
      throw new Error('磁盘空间不足')
    }

    throw err
  }
}
```
:::

### 2. 内存使用监控

在处理大量流时，监控内存使用有助于发现背压失效或缓冲区泄漏问题：

::: details 流内存监控工具
```js
// src/streams/memory-monitor.js

// 定期输出内存使用快照
function startMemoryMonitor(intervalMs = 5000) {
  const timer = setInterval(() => {
    const mem = process.memoryUsage()
    console.log({
      rss: `${(mem.rss / 1024 / 1024).toFixed(1)} MB`,       // 进程总内存
      heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`, // 堆内存已用
      heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`, // 堆内存总量
      external: `${(mem.external / 1024 / 1024).toFixed(1)} MB`,  // Buffer 等 C++ 对象
    })
  }, intervalMs)

  // 返回停止函数
  return () => clearInterval(timer)
}

// 检查流缓冲区水位
function checkStreamBuffers(readable, writable) {
  const readableBuffered = readable.readableLength
  const writableBuffered = writable.writableLength

  if (readableBuffered > readable.readableHighWaterMark * 0.8) {
    console.warn(`可读流缓冲区接近上限: ${readableBuffered} / ${readable.readableHighWaterMark}`)
  }

  if (writableBuffered > writable.writableHighWaterMark * 0.8) {
    console.warn(`可写流缓冲区接近上限: ${writableBuffered} / ${writable.writableHighWaterMark}`)
  }
}
```
:::

### 3. ETL 数据处理管道

ETL（Extract-Transform-Load，提取-转换-加载）是流最典型的企业级应用场景。以下示例展示一个完整的 ETL 管道：从 CSV 文件读取交易数据，过滤无效记录，格式转换后批量写入数据库：

::: details 完整 ETL 数据处理管道
```js
// src/etl/run-etl.js
import { createReadStream } from 'fs'
import { pipeline } from 'stream/promises'
import { Transform } from 'stream'
import { CsvParserTransform } from '../streams/csv-parser.js'
import { FilterTransform } from '../streams/filter-transform.js'
import { DatabaseBatchWritable } from '../streams/db-writable.js'

// 数据清洗与格式转换
class TransactionTransform extends Transform {
  constructor() {
    super({ objectMode: true })
  }

  _transform(row, encoding, callback) {
    try {
      const record = {
        id: row['transaction_id']?.trim(),
        userId: parseInt(row['user_id'], 10),
        amount: parseFloat(row['amount']),
        currency: row['currency']?.toUpperCase() ?? 'CNY',
        createdAt: new Date(row['created_at']).toISOString(),
      }

      // 基础数据校验
      if (!record.id || isNaN(record.userId) || isNaN(record.amount)) {
        console.warn('跳过无效记录:', row)
        return callback() // 不推送，丢弃此记录
      }

      this.push(record)
      callback()
    } catch (err) {
      callback(err)
    }
  }
}

async function runEtl(csvFile, db) {
  const stopMonitor = startMemoryMonitor(10000)

  console.log(`ETL 开始: ${csvFile}`)
  console.time('ETL 总耗时')

  try {
    await pipeline(
      // 1. Extract：读取 CSV 文件
      createReadStream(csvFile, { encoding: 'utf-8' }),

      // 2. 解析 CSV 为 JSON 对象
      new CsvParserTransform(),

      // 3. Transform：清洗和转换数据
      new TransactionTransform(),

      // 4. Filter：过滤掉金额为零的记录
      new FilterTransform(record => record.amount !== 0),

      // 5. Load：批量写入数据库
      new DatabaseBatchWritable(db, 'transactions', 500),
    )

    console.timeEnd('ETL 总耗时')
    console.log('ETL 完成')
  } catch (err) {
    console.error('ETL 失败:', err.message)
    throw err
  } finally {
    stopMonitor()
  }
}

const db = await connectDatabase()
await runEtl('transactions-2026-03.csv', db)
await db.close()
```
:::
