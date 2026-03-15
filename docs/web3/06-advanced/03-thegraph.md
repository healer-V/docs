---
title: "The Graph 数据索引"
category: "Web3 · Ethereum"
tags:
  - The Graph
  - Subgraph
  - GraphQL
excerpt: "The Graph 是去中心化的链上数据索引协议，通过 Subgraph 将区块链事件转化为可高效查询的 GraphQL API。"
date: 2026-03-15
---

# The Graph 数据索引

区块链本身并不是为高效查询设计的——你无法直接"查询某地址持有的所有 NFT"或"过去一周交易量最大的代币对"。The Graph 通过去中心化的索引协议，将链上事件和交易数据整理成可通过 GraphQL 高效查询的 API，成为 DeFi 和 NFT 应用不可或缺的数据基础设施。

## 一、为什么需要链上数据索引

### 1. 区块链查询的局限性

直接从区块链读取数据面临以下挑战：

| 查询需求 | 直接读取区块链 | 使用 The Graph |
|---------|--------------|---------------|
| 查询单个变量（如余额） | 调用合约 view 函数，可行 | 不需要 |
| 查询历史事件（如转账记录） | 需遍历区块逐一过滤，极慢 | GraphQL 查询，毫秒级返回 |
| 聚合数据（如总交易量） | 无法直接计算，需遍历全部区块 | 预计算存储，直接查询 |
| 多合约关联查询 | 需分别调用再手动拼接 | 实体关联，一次查询 |
| 分页 + 排序 | 不支持 | 原生支持 |

### 2. 传统解决方案的问题

在 The Graph 出现之前，DApp 开发者通常自建后端服务器来索引链上数据：

::: warning 自建索引的痛点
- **维护成本高**：需要运行全节点 + 数据库 + API 服务
- **中心化风险**：服务器宕机则 DApp 不可用，违背去中心化精神
- **重复劳动**：每个项目各自建一套，没有复用性
- **数据一致性**：链重组（reorg）时需要处理回滚逻辑
:::

## 二、The Graph 协议概览

### 1. 核心架构

The Graph 是一个去中心化的协议，由多种角色协同运作：

| 角色 | 职责 | 激励方式 |
|------|------|---------|
| **Indexer（索引者）** | 运行 Graph 节点，索引 Subgraph 数据并响应查询 | 索引奖励 + 查询手续费（GRT 代币） |
| **Curator（策展人）** | 用 GRT 信号标记有价值的 Subgraph | Subgraph 被使用时获得分成 |
| **Delegator（委托人）** | 将 GRT 委托给 Indexer | 分享 Indexer 的收益 |
| **Developer（开发者）** | 开发和部署 Subgraph | 为应用提供数据查询能力 |

### 2. 工作流程

1. DApp 的智能合约在链上触发事件（Event）
2. Graph 节点监听这些事件，按 Subgraph 定义的映射规则处理数据
3. 处理后的数据存入 Graph 节点的 PostgreSQL 数据库
4. 前端应用通过 GraphQL 端点查询所需数据

## 三、Subgraph 核心概念

Subgraph 是 The Graph 的基本单位，它定义了如何从区块链提取和转换数据。每个 Subgraph 由三部分组成：

### 1. 清单文件（subgraph.yaml）

描述 Subgraph 索引哪些合约、监听哪些事件、使用哪些映射处理器。

### 2. 模式定义（schema.graphql）

使用 GraphQL Schema 定义数据实体的结构和关系，决定了最终可查询的数据模型。

### 3. 映射处理器（mapping.ts）

用 AssemblyScript（类 TypeScript 的语言）编写，定义如何将链上事件转换为 Schema 中的实体。

## 四、开发 Subgraph 完整流程

### 1. 初始化项目

::: details 使用 Graph CLI 初始化 Subgraph
```bash
# 安装 Graph CLI
npm install -g @graphprotocol/graph-cli

# 从已部署的合约初始化 Subgraph
graph init \
  --product subgraph-studio \
  --from-contract 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 \ # USDC 合约地址
  --network mainnet \
  --abi ./abis/ERC20.json \
  token-transfers

cd token-transfers
```
:::

初始化完成后，项目结构如下：

```
token-transfers/
├── abis/
│   └── ERC20.json            # 合约 ABI
├── src/
│   └── mapping.ts            # 映射处理器（AssemblyScript）
├── schema.graphql             # 数据模式定义
├── subgraph.yaml              # Subgraph 清单
├── package.json
└── tsconfig.json
```

### 2. 定义数据模式

::: details schema.graphql —— 定义可查询的实体结构
```graphql
# schema.graphql

"""
代币实体 —— 存储 ERC-20 代币的全局信息
"""
type Token @entity {
  id: ID!                          # 合约地址
  name: String!
  symbol: String!
  decimals: Int!
  totalSupply: BigInt!
  transferCount: BigInt!           # 累计转账次数
  holderCount: BigInt!             # 持有者数量
  holders: [TokenHolder!]! @derivedFrom(field: "token")  # 反向关联 # [!code highlight]
}

"""
持有者实体 —— 记录每个地址的代币余额
"""
type TokenHolder @entity {
  id: ID!                          # token地址-持有者地址
  token: Token!                    # 关联的代币 # [!code highlight]
  address: Bytes!
  balance: BigInt!
  transfersFrom: [Transfer!]! @derivedFrom(field: "from")
  transfersTo: [Transfer!]! @derivedFrom(field: "to")
}

"""
转账记录实体 —— 每次 Transfer 事件创建一条
"""
type Transfer @entity(immutable: true) {  # immutable 优化性能 # [!code highlight]
  id: ID!                          # 交易哈希-日志索引
  token: Token!
  from: TokenHolder!
  to: TokenHolder!
  amount: BigInt!
  timestamp: BigInt!
  blockNumber: BigInt!
  transactionHash: Bytes!
}
```
:::

::: tip 实体设计要点
- 使用 `@entity(immutable: true)` 标记不会更新的实体（如事件记录），可显著提升索引性能
- 使用 `@derivedFrom` 建立反向关联，避免手动维护双向关系
- `id` 字段建议使用有意义的复合键（如 `txHash-logIndex`），便于去重和调试
:::

### 3. 配置清单文件

::: details subgraph.yaml —— 完整的 Subgraph 配置
```yaml
# subgraph.yaml
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: USDC
    network: mainnet
    source:
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" # [!code highlight]
      abi: ERC20
      startBlock: 6082465        # 合约部署区块，避免从创世块开始索引 # [!code highlight]
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Token
        - TokenHolder
        - Transfer
      abis:
        - name: ERC20
          file: ./abis/ERC20.json
      eventHandlers:              # 事件处理器 # [!code highlight]
        - event: Transfer(indexed address,indexed address,uint256)
          handler: handleTransfer
      file: ./src/mapping.ts
```
:::

::: warning startBlock 设置
`startBlock` 必须设置为合约部署的区块号。如果省略此字段，索引器将从创世块开始扫描，白白浪费数小时甚至数天的同步时间。你可以在 Etherscan 上查看合约的部署交易来获取该区块号。
:::

### 4. 编写映射处理器

::: details mapping.ts —— 处理链上事件并存储为实体
```typescript
// src/mapping.ts
import { Transfer as TransferEvent } from "../generated/USDC/ERC20";
import { Token, TokenHolder, Transfer } from "../generated/schema";
import { BigInt, Bytes } from "@graphprotocol/graph-ts";

const ZERO = BigInt.fromI32(0);
const ONE = BigInt.fromI32(1);

/**
 * 获取或创建 Token 实体
 */
function getOrCreateToken(address: string): Token {
  let token = Token.load(address);
  if (token == null) {
    token = new Token(address);
    token.name = "USD Coin";
    token.symbol = "USDC";
    token.decimals = 6;
    token.totalSupply = ZERO;
    token.transferCount = ZERO;
    token.holderCount = ZERO;
  }
  return token;
}

/**
 * 获取或创建 TokenHolder 实体
 */
function getOrCreateHolder(tokenAddress: string, holderAddress: Bytes): TokenHolder { // [!code highlight]
  let holderId = tokenAddress + "-" + holderAddress.toHexString();
  let holder = TokenHolder.load(holderId);
  if (holder == null) {
    holder = new TokenHolder(holderId);
    holder.token = tokenAddress;
    holder.address = holderAddress;
    holder.balance = ZERO;

    // 新持有者，更新计数
    let token = getOrCreateToken(tokenAddress);
    token.holderCount = token.holderCount.plus(ONE);
    token.save();
  }
  return holder;
}

/**
 * 处理 Transfer 事件 —— 每次链上 Transfer 触发时执行
 */
export function handleTransfer(event: TransferEvent): void { // [!code highlight]
  let tokenAddress = event.address.toHexString();
  let token = getOrCreateToken(tokenAddress);

  // 更新转账计数
  token.transferCount = token.transferCount.plus(ONE);
  token.save();

  // 更新发送方余额
  let fromHolder = getOrCreateHolder(tokenAddress, event.params.from);
  fromHolder.balance = fromHolder.balance.minus(event.params.value);
  fromHolder.save();

  // 更新接收方余额
  let toHolder = getOrCreateHolder(tokenAddress, event.params.to);
  toHolder.balance = toHolder.balance.plus(event.params.value);
  toHolder.save();

  // 创建 Transfer 记录
  let transferId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let transfer = new Transfer(transferId);
  transfer.token = tokenAddress;
  transfer.from = fromHolder.id;
  transfer.to = toHolder.id;
  transfer.amount = event.params.value;
  transfer.timestamp = event.block.timestamp;
  transfer.blockNumber = event.block.number;
  transfer.transactionHash = event.transaction.hash;
  transfer.save(); // [!code highlight]
}
```
:::

### 5. 构建与部署

::: details 编译、测试并部署到 Subgraph Studio
```bash
# 生成 AssemblyScript 类型
graph codegen

# 编译 Subgraph
graph build

# 认证（从 Subgraph Studio 获取部署密钥）
graph auth --studio <DEPLOY_KEY>

# 部署到 Subgraph Studio
graph deploy --studio token-transfers

# 部署后你将获得一个 GraphQL 查询端点，如：
# https://api.studio.thegraph.com/query/<ID>/token-transfers/v0.0.1
```
:::

## 五、GraphQL 查询

### 1. 基础查询

Subgraph 部署后，你可以通过 GraphQL 端点查询数据。

::: details 常用查询示例
```graphql
# 查询最近 10 笔 USDC 转账
query RecentTransfers {
  transfers(
    first: 10
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    from {
      address
      balance
    }
    to {
      address
      balance
    }
    amount
    timestamp
    transactionHash
  }
}

# 查询某地址的余额和转账历史
query HolderInfo {
  tokenHolders(
    where: { address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045" }
  ) {
    balance
    transfersFrom(first: 5, orderBy: timestamp, orderDirection: desc) {
      amount
      to { address }
      timestamp
    }
    transfersTo(first: 5, orderBy: timestamp, orderDirection: desc) {
      amount
      from { address }
      timestamp
    }
  }
}

# 查询持仓量前 10 的地址
query TopHolders {
  tokenHolders(
    first: 10
    orderBy: balance
    orderDirection: desc
  ) {
    address
    balance
  }
}
```
:::

### 2. 分页与过滤

The Graph 的 GraphQL API 支持丰富的查询能力：

| 功能 | 语法 | 示例 |
|------|------|------|
| 分页 | `first` + `skip` | `first: 10, skip: 20`（第 3 页） |
| 游标分页 | `first` + `where: { id_gt }` | `where: { id_gt: "上一页最后ID" }` |
| 排序 | `orderBy` + `orderDirection` | `orderBy: timestamp, orderDirection: desc` |
| 等值过滤 | `where: { field: value }` | `where: { from: "0x..." }` |
| 范围过滤 | `_gt`, `_gte`, `_lt`, `_lte` | `where: { amount_gte: "1000000" }` |
| 包含过滤 | `_in`, `_not_in` | `where: { token_in: ["0x...", "0x..."] }` |
| 全文搜索 | 需在 schema 中定义 | `tokenSearch(text: "USD")` |

::: warning 分页限制
- `first` 参数最大值为 1000，不能一次查询超过 1000 条记录
- 大数据量分页推荐使用游标分页（`id_gt`）而非 `skip`，因为 `skip` 在偏移量大时性能很差
:::

### 3. 时间范围查询

::: details 查询特定时间段内的大额转账
```graphql
# 查询过去 24 小时内金额超过 100 万 USDC 的转账
# USDC 精度为 6，所以 1,000,000 USDC = 1000000000000
query LargeTransfers {
  transfers(
    where: {
      timestamp_gte: "1710374400"    # 起始时间戳
      timestamp_lte: "1710460800"    # 结束时间戳
      amount_gte: "1000000000000"    # >= 100 万 USDC
    }
    orderBy: amount
    orderDirection: desc
    first: 50
  ) {
    from { address }
    to { address }
    amount
    timestamp
    transactionHash
  }
}
```
:::

## 六、前端集成

### 1. 使用 urql 查询

::: details 在 React 应用中集成 The Graph（urql）
```tsx
// src/hooks/useTransfers.ts
import { useQuery, gql } from "urql";

const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/<ID>/token-transfers/v0.0.1";

const RECENT_TRANSFERS_QUERY = gql`
  query RecentTransfers($first: Int!, $skip: Int!) {
    transfers(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      from { address balance }
      to { address balance }
      amount
      timestamp
      transactionHash
    }
  }
`;

interface Transfer {
  id: string;
  from: { address: string; balance: string };
  to: { address: string; balance: string };
  amount: string;
  timestamp: string;
  transactionHash: string;
}

export function useRecentTransfers(page: number, pageSize: number = 20) {
  const [result] = useQuery({
    query: RECENT_TRANSFERS_QUERY,
    variables: {
      first: pageSize,
      skip: page * pageSize,
    },
  });

  return {
    transfers: (result.data?.transfers ?? []) as Transfer[],
    loading: result.fetching,
    error: result.error,
  };
}
```

```tsx
// src/components/TransferList.tsx
import { useRecentTransfers } from "../hooks/useTransfers";
import { useState } from "react";
import { formatUnits } from "viem";

export function TransferList() {
  const [page, setPage] = useState(0);
  const { transfers, loading, error } = useRecentTransfers(page);

  if (loading) return <p>加载中...</p>;
  if (error) return <p>查询失败: {error.message}</p>;

  return (
    <div>
      <h2>最近 USDC 转账</h2>
      <table>
        <thead>
          <tr>
            <th>发送方</th>
            <th>接收方</th>
            <th>金额 (USDC)</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.from.address.slice(0, 10)}...</td>
              <td>{tx.to.address.slice(0, 10)}...</td>
              <td>{formatUnits(BigInt(tx.amount), 6)}</td> {/* USDC 6 位精度 */}
              <td>{new Date(Number(tx.timestamp) * 1000).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
          上一页
        </button>
        <span>第 {page + 1} 页</span>
        <button onClick={() => setPage((p) => p + 1)}>下一页</button>
      </div>
    </div>
  );
}
```
:::

### 2. 使用 Apollo Client 查询

::: details 配置 Apollo Client 连接 Subgraph
```typescript
// src/lib/apolloClient.ts
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/<ID>/token-transfers/v0.0.1";

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: SUBGRAPH_URL }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          transfers: {
            // 基于游标的分页合并策略 // [!code highlight]
            keyArgs: ["where", "orderBy", "orderDirection"],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
});
```
:::

## 七、Subgraph 最佳实践

### 1. 事件驱动设计

::: tip 合约设计阶段就要考虑索引需求
Subgraph 只能索引合约触发的事件（Event）。如果你的合约没有触发足够的事件，Subgraph 就无法获取关键数据。在编写合约时，确保所有重要的状态变更都会 emit 对应的事件。
:::

### 2. 实体关系设计

| 关系类型 | 实现方式 | 示例 |
|---------|---------|------|
| 一对一 | 字段直接引用 | `token: Token!` |
| 一对多 | `@derivedFrom` | `holders: [TokenHolder!]! @derivedFrom(field: "token")` |
| 多对多 | 中间实体 | 创建关联实体存储两端 ID |

### 3. 性能优化清单

| 优化项 | 说明 |
|--------|------|
| 设置 `startBlock` | 避免从创世块开始扫描 |
| 使用 `immutable` 实体 | 对只写不更新的数据（如事件记录）标记 `@entity(immutable: true)` |
| 减少 `store.load` 调用 | 避免在映射中频繁加载同一实体，缓存到局部变量 |
| 合理拆分实体 | 频繁更新和不常变化的数据分开存储 |
| 避免深层嵌套查询 | 关联查询超过 3 层会显著增加查询时间 |
| 使用 `Bytes` 而非 `String` 存地址 | `Bytes` 类型在索引和查询中效率更高 |

### 4. 调试与监控

::: details 常用调试手段
```bash
# 查看 Subgraph 同步状态
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ _meta { block { number } hasIndexingErrors } }"}' \
  https://api.studio.thegraph.com/query/<ID>/token-transfers/v0.0.1

# 返回示例：
# {
#   "data": {
#     "_meta": {
#       "block": { "number": 19432156 },  <- 当前索引到的区块
#       "hasIndexingErrors": false          <- 是否有索引错误
#     }
#   }
# }
```
:::

::: warning 索引错误处理
如果 `hasIndexingErrors` 为 `true`，说明映射处理器在某个区块执行时出错，Subgraph 停止同步。常见原因包括：
- 映射代码中访问了空值（null pointer）
- BigInt 溢出
- 合约 ABI 与链上实际不匹配

你需要在 Subgraph Studio 的日志中查看详细错误信息，修复映射代码后重新部署。
:::
