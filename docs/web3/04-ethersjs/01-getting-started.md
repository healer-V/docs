---
title: "Ethers.js 入门"
category: "Web3 · Ethereum"
tags:
  - Ethers.js
  - JavaScript
  - TypeScript
excerpt: "Ethers.js 是轻量级的以太坊交互库，以优秀的 TypeScript 支持和清晰的 API 设计成为现代 DApp 开发的首选。"
date: 2026-03-15
---

# Ethers.js 入门

## 一、什么是 Ethers.js

Ethers.js 是一个完整且精简的以太坊（Ethereum）JavaScript/TypeScript 交互库。它由 Richard Moore 创建并维护，目标是为开发者提供一个**轻量、安全、功能完备**的区块链交互工具。

Ethers.js 的设计哲学围绕三个核心原则：

| 设计原则 | 说明 |
|----------|------|
| **Tiny（精简）** | 压缩后仅约 120KB，远小于同类库，适合前端 DApp 场景 |
| **Complete（完备）** | 涵盖 Provider、Signer、Contract、ABI 编解码、ENS 等全部以太坊交互能力 |
| **Extensible（可扩展）** | 模块化架构，你可以替换任意底层实现，如自定义 Provider 或 Signer |

::: tip 为什么选择 Ethers.js
与直接使用 JSON-RPC 接口相比，Ethers.js 帮你处理了 ABI 编码/解码、BigNumber 运算、交易签名、Gas 估算等繁琐细节，让你专注于业务逻辑。
:::

## 二、Ethers.js v6 与 v5 对比

2023 年 Ethers.js 发布了 v6 大版本，带来了大量破坏性变更。如果你正在启动新项目，推荐直接使用 v6；如果你维护现有项目，需要了解以下关键差异：

| 特性 | v5 | v6 |
|------|----|----|
| **BigNumber** | 使用自定义 `BigNumber` 类 | 使用原生 `bigint` 类型 |
| **Provider 创建** | `new ethers.providers.JsonRpcProvider()` | `new ethers.JsonRpcProvider()` |
| **MetaMask 连接** | `new ethers.providers.Web3Provider(window.ethereum)` | `new ethers.BrowserProvider(window.ethereum)` |
| **工具函数** | `ethers.utils.parseEther()` | `ethers.parseEther()` |
| **合约部署** | `factory.deploy()` 返回合约实例 | `factory.deploy()` 返回合约实例，需 `await contract.waitForDeployment()` |
| **事件监听** | `contract.on('Transfer', callback)` | 相同，但过滤器 API 有调整 |
| **包体积** | ~120KB (min+gzip) | ~88KB (min+gzip)，更精简 |
| **TypeScript** | 良好支持 | 原生 TypeScript 重写，类型更精确 |

::: warning v5 到 v6 迁移注意
v6 移除了 `BigNumber` 类，所有数值运算改为原生 `bigint`。如果你的代码中大量使用 `BigNumber.from()`、`.mul()`、`.div()` 等方法，迁移时需要逐一替换为 `bigint` 运算符。
:::

## 三、Ethers.js vs Web3.js

Ethers.js 和 Web3.js 是以太坊生态中最主流的两个交互库。以下是详细对比：

| 对比维度 | Ethers.js (v6) | Web3.js (v4) |
|----------|---------------|--------------|
| **包体积** | ~88KB (min+gzip) | ~200KB+ (min+gzip) |
| **TypeScript 支持** | 原生 TypeScript 编写，类型完备 | v4 起改用 TypeScript，但类型覆盖仍有不足 |
| **API 设计** | Provider/Signer 分离，职责清晰 | 统一的 `web3` 对象，耦合度较高 |
| **维护状况** | 单人维护（Richard Moore），更新稳定 | Chainlink 团队接手，活跃开发中 |
| **学习曲线** | API 更直观，文档质量高 | 概念较多，文档分散 |
| **ENS 支持** | 内置，开箱即用 | 需额外配置 |
| **License** | MIT | LGPL-3.0 |
| **社区生态** | Hardhat 默认集成 | Truffle 默认集成（Truffle 已停止维护） |

::: tip 如何选择
对于新项目，推荐使用 Ethers.js v6。它的 TypeScript 支持更好，包体积更小，且 Hardhat、Foundry 等主流开发框架都默认集成了 Ethers.js。
:::

## 四、安装与环境准备

### 1. 安装 Ethers.js

::: code-group
```bash [npm]
npm install ethers
```

```bash [yarn]
yarn add ethers
```

```bash [pnpm]
pnpm add ethers
```
:::

### 2. TypeScript 配置

Ethers.js v6 自带完整的类型声明，无需额外安装 `@types` 包。确保你的 `tsconfig.json` 中 `target` 至少为 `ES2020`，以支持原生 `bigint`：

::: details tsconfig.json 配置示例
```json{3-4}
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```
:::

### 3. 获取 RPC 节点

与区块链交互需要一个 RPC 节点。你可以使用以下服务商的免费套餐快速开始：

| 服务商 | 免费额度 | 支持链 |
|--------|---------|--------|
| [Infura](https://infura.io) | 100,000 请求/天 | Ethereum, Polygon, Arbitrum 等 |
| [Alchemy](https://alchemy.com) | 300,000,000 CU/月 | Ethereum, Polygon, Optimism 等 |
| [Ankr](https://ankr.com) | 无限制（公共 RPC） | 多链支持 |

## 五、核心模块概览

Ethers.js v6 将所有功能模块扁平化导出，不再需要通过 `ethers.providers`、`ethers.utils` 等子路径访问。以下是核心模块：

| 模块 | 说明 | 常用类/函数 |
|------|------|-------------|
| **Provider** | 只读的区块链连接，用于查询数据 | `JsonRpcProvider`, `BrowserProvider`, `InfuraProvider` |
| **Signer** | 代表一个账户，可签名和发送交易 | `Wallet`, `JsonRpcSigner` |
| **Contract** | 智能合约交互封装 | `Contract`, `ContractFactory` |
| **ABI** | ABI 编码/解码工具 | `AbiCoder`, `Interface` |
| **Utils** | 常用工具函数 | `parseEther`, `formatEther`, `keccak256`, `toUtf8Bytes` |

### 1. 模块导入方式

::: details 模块导入示例
```typescript
// v6 推荐：直接从 ethers 顶层导入
import { ethers, JsonRpcProvider, Contract, Wallet, parseEther, formatEther } from "ethers";

// 也可以使用命名空间方式（兼容 v5 风格）
import { ethers } from "ethers";
const provider = new ethers.JsonRpcProvider("https://rpc.ankr.com/eth");
```
:::

## 六、第一个示例：连接区块链并读取数据

下面通过一个完整示例，演示如何使用 Ethers.js 连接以太坊主网并读取链上数据。

### 1. 读取区块信息与账户余额

::: details 连接以太坊主网并查询数据
```typescript{5,8,11,14,17}
// src/web3/basic-query.ts
import { JsonRpcProvider, formatEther } from "ethers";

// 创建 Provider，连接以太坊主网（使用公共 RPC）
const provider = new JsonRpcProvider("https://rpc.ankr.com/eth");

// 查询当前区块号
const blockNumber = await provider.getBlockNumber();
console.log("当前区块号:", blockNumber);

// 查询 Vitalik 的 ETH 余额
const vitalikAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const balance = await provider.getBalance(vitalikAddress);
console.log("Vitalik 的余额:", formatEther(balance), "ETH");

// 查询最新区块详情
const latestBlock = await provider.getBlock("latest");
console.log("最新区块时间:", new Date((latestBlock?.timestamp ?? 0) * 1000).toLocaleString());
console.log("区块内交易数:", latestBlock?.transactions.length);

// 查询当前 Gas 价格
const feeData = await provider.getFeeData();
console.log("Gas 价格:", feeData.gasPrice?.toString(), "wei");
console.log("Max Fee:", feeData.maxFeePerGas?.toString(), "wei");
```
:::

### 2. 在浏览器中连接 MetaMask

::: details 浏览器环境连接 MetaMask
```typescript{4-5,10,13}
// src/web3/connect-metamask.ts
import { BrowserProvider, formatEther } from "ethers";

// 检查 MetaMask 是否安装
if (typeof window.ethereum === "undefined") {
  throw new Error("请先安装 MetaMask 钱包扩展");
}

// 创建 BrowserProvider（v6 中替代了 Web3Provider）
const provider = new BrowserProvider(window.ethereum);

// 请求用户授权连接钱包
const signer = await provider.getSigner();
const userAddress = await signer.getAddress();
console.log("已连接钱包地址:", userAddress);

// 查询当前账户余额
const balance = await provider.getBalance(userAddress);
console.log("账户余额:", formatEther(balance), "ETH");

// 获取当前连接的网络信息
const network = await provider.getNetwork();
console.log("网络名称:", network.name);
console.log("Chain ID:", network.chainId.toString());
```
:::

::: danger 安全提示
永远不要在前端代码中硬编码私钥或助记词。浏览器环境下应始终通过 MetaMask 等钱包插件获取 Signer，让用户在钱包中确认每一笔交易。
:::

## 七、选择 v5 还是 v6

### 1. 推荐使用 v6 的场景

- 新项目启动，没有历史包袱
- 项目使用 TypeScript，希望获得更精确的类型推导
- 需要更小的打包体积
- 使用 Hardhat 3.x 或最新的开发工具链

### 2. 暂时留在 v5 的场景

- 已有大量基于 v5 的代码，迁移成本高
- 依赖的第三方库尚未适配 v6（如部分旧版 Hardhat 插件）
- 项目 `target` 不支持 `bigint`（如需兼容 IE 或低版本 Node.js）

::: tip 下一步
了解了 Ethers.js 的基本概念后，接下来你将深入学习 Provider 和 Signer 的使用方式，掌握区块链数据查询与交易发送的核心能力。
:::
