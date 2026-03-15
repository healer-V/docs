---
title: "以太坊基础"
category: "Web3 · Ethereum"
tags:
  - Ethereum
  - EVM
  - 智能合约
excerpt: "以太坊是第一个支持图灵完备智能合约的区块链平台，通过 EVM 执行链上程序，是 DApp 开发的核心基础设施。"
date: 2026-03-15
---

# 以太坊基础

以太坊（Ethereum）由 Vitalik Buterin 于 2013 年提出、2015 年正式上线，它将区块链从"只能转账"扩展为"可编程的世界计算机"。你可以在以太坊上部署智能合约（Smart Contract），构建去中心化应用（DApp），实现无需中间人的金融、治理、身份等各类业务逻辑。本文将带你全面了解以太坊的核心架构和关键概念。

## 一、以太坊与比特币的对比

以太坊和比特币都是公有链，但设计目标截然不同。比特币专注于成为"数字黄金"和点对点支付系统，而以太坊的目标是成为通用的去中心化计算平台。

| 维度 | 比特币（Bitcoin） | 以太坊（Ethereum） |
|------|------------------|-------------------|
| **诞生时间** | 2009 年 | 2015 年 |
| **创始人** | 中本聪（匿名） | Vitalik Buterin |
| **核心定位** | 去中心化数字货币 | 去中心化计算平台 |
| **脚本能力** | 非图灵完备（Script） | 图灵完备（Solidity / Vyper） |
| **出块时间** | 约 10 分钟 | 约 12 秒 |
| **共识机制** | PoW | PoS（2022 年 Merge 后） |
| **原生代币** | BTC | ETH |
| **最小单位** | 1 satoshi = 10⁻⁸ BTC | 1 wei = 10⁻¹⁸ ETH |
| **状态模型** | UTXO（未花费交易输出） | 账户模型（Account-based） |
| **智能合约** | 不支持 | 完整支持 |

::: tip
以太坊使用"账户模型"而非比特币的"UTXO 模型"，这意味着每个地址有一个持续更新的余额状态，更接近你熟悉的银行账户概念，也更适合编写复杂的合约逻辑。
:::

## 二、EVM：以太坊虚拟机

### 1. 什么是 EVM

EVM（Ethereum Virtual Machine，以太坊虚拟机）是以太坊的核心执行引擎。你用 Solidity 或 Vyper 编写的智能合约代码，经过编译后生成字节码（Bytecode），由 EVM 在每个节点上确定性地执行。

EVM 的关键特性：

- **图灵完备**：可以执行任意复杂的计算逻辑（循环、条件分支、递归等）
- **沙箱隔离**：合约在独立的执行环境中运行，无法访问网络、文件系统或其他合约的私有状态
- **确定性**：相同的输入在任何节点上都产生完全相同的输出，这是全网达成共识的前提
- **Gas 计量**：每条指令都有固定的 Gas 消耗，防止无限循环和资源滥用

### 2. 从源码到执行的完整流程

```
Solidity 源码 (.sol)
       │
       ▼
  Solidity 编译器 (solc)
       │
       ├──▶ 字节码 (Bytecode)  → 部署到链上
       │
       └──▶ ABI (Application Binary Interface) → 前端调用接口

部署后：
  用户发起交易 → 节点接收 → EVM 加载合约字节码 → 逐条执行指令 → 更新世界状态
```

### 3. EVM 的存储结构

EVM 为每个合约提供三种数据存储区域：

| 存储区域 | 持久性 | Gas 成本 | 用途 |
|---------|--------|---------|------|
| **Storage** | 永久存储（写入区块链） | 极高（SSTORE 约 20,000 Gas） | 合约状态变量 |
| **Memory** | 函数调用期间有效 | 较低 | 临时计算数据 |
| **Stack** | 指令执行期间有效 | 最低 | EVM 指令操作数 |

::: warning
Storage 的读写成本远高于 Memory。在编写 Solidity 合约时，你应该尽量减少对 Storage 的写入操作，将频繁读取的状态变量缓存到 Memory 中，这是 Gas 优化的第一原则。
:::

## 三、智能合约

### 1. 什么是智能合约

智能合约（Smart Contract）是部署在区块链上的自执行程序。一旦部署，合约代码不可修改（除非使用代理模式），任何人都可以调用它的公开函数，且执行结果由全网验证。

你可以把智能合约理解为一个"链上自动售货机"：规则写在代码里，满足条件自动执行，不需要人工干预，也没有人能中途篡改规则。

### 2. 第一个智能合约

下面是一个最简单的 Solidity 智能合约，实现了一个链上计数器。

::: details 计数器合约示例
```solidity
// contracts/Counter.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title 链上计数器
/// @notice 演示智能合约的基本结构：状态变量、函数、事件
contract Counter {
    uint256 private count; // Storage 状态变量 // [!code highlight]
    address public owner;  // 合约所有者

    event CountChanged(address indexed operator, uint256 newCount); // [!code highlight]

    constructor() {
        owner = msg.sender; // 部署者成为 owner
        count = 0;
    }

    /// @notice 计数加一
    function increment() external {
        count += 1;
        emit CountChanged(msg.sender, count);
    }

    /// @notice 计数减一
    function decrement() external {
        require(count > 0, "Counter: cannot go below zero"); // [!code highlight]
        count -= 1;
        emit CountChanged(msg.sender, count);
    }

    /// @notice 查询当前计数（view 函数不消耗 Gas）
    function getCount() external view returns (uint256) {
        return count;
    }
}
```
:::

### 3. 合约的生命周期

| 阶段 | 说明 |
|------|------|
| **编写** | 用 Solidity / Vyper 编写合约源码 |
| **编译** | 通过编译器生成字节码和 ABI |
| **部署** | 发送一笔特殊交易（`to` 字段为空），将字节码写入区块链 |
| **交互** | 用户通过交易调用合约函数，EVM 执行逻辑并更新状态 |
| **销毁** | 调用 `selfdestruct`（已在 Dencun 升级中被弃用，不建议使用） |

## 四、DApp 架构

DApp（Decentralized Application，去中心化应用）是以智能合约为后端、区块链为数据层的应用程序。一个典型的 DApp 架构包含以下层次：

```
┌─────────────────────────────────────────────┐
│               前端（React / Vue）             │
│   使用 ethers.js / viem 与合约交互            │
├─────────────────────────────────────────────┤
│               钱包（MetaMask）                │
│   签名交易、管理账户、连接网络                  │
├─────────────────────────────────────────────┤
│            JSON-RPC 节点（Infura / Alchemy）  │
│   提供区块链数据读写的 API 接口                 │
├─────────────────────────────────────────────┤
│              以太坊区块链                      │
│   智能合约存储 + 执行层                        │
└─────────────────────────────────────────────┘
```

::: details 前端连接合约示例
```js
// src/services/counterContract.js
import { ethers } from 'ethers';

const COUNTER_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const COUNTER_ABI = [
  'function increment() external',
  'function decrement() external',
  'function getCount() external view returns (uint256)',
  'event CountChanged(address indexed operator, uint256 newCount)',
];

/** 获取合约实例（只读） */
export function getReadOnlyContract() {
  const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_API_KEY');
  return new ethers.Contract(COUNTER_ADDRESS, COUNTER_ABI, provider); // [!code highlight]
}

/** 获取合约实例（可写，需要钱包签名） */
export async function getWritableContract() {
  if (!window.ethereum) {
    throw new Error('请安装 MetaMask 钱包');
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner(); // [!code highlight]
  return new ethers.Contract(COUNTER_ADDRESS, COUNTER_ABI, signer);
}

/** 调用 increment 并等待交易确认 */
export async function incrementCounter() {
  const contract = await getWritableContract();
  const tx = await contract.increment();
  const receipt = await tx.wait(); // 等待交易被打包进区块 // [!code highlight]
  console.log('交易哈希:', receipt.hash);
  console.log('所在区块:', receipt.blockNumber);
}
```
:::

::: tip
在 DApp 开发中，"读取"链上数据（调用 `view` / `pure` 函数）是免费的，不需要发送交易；而"写入"数据（修改状态变量）需要发送交易并支付 Gas。这一区分直接影响你的前端交互设计。
:::

## 五、以太坊 2.0 与 The Merge

### 1. 从 PoW 到 PoS

以太坊于 2022 年 9 月 15 日完成了 **The Merge**（合并），将共识机制从 PoW 切换为 PoS。这是以太坊路线图中最关键的里程碑之一。

The Merge 的核心变化：

- **能耗降低 99.95%**：不再需要矿机消耗电力
- **验证者取代矿工**：质押 32 ETH 即可成为验证者节点
- **出块时间稳定**：固定为每 12 秒一个 Slot
- **Slashing 惩罚**：恶意或离线的验证者会被罚没部分质押

### 2. 以太坊路线图

以太坊的升级路线围绕五个核心方向展开：

| 阶段 | 目标 | 关键技术 |
|------|------|---------|
| **The Merge** | 转向 PoS | Beacon Chain 合并 |
| **The Surge** | 提升吞吐量至 10 万+ TPS | Danksharding、EIP-4844（Proto-Danksharding） |
| **The Scourge** | 抵抗 MEV 和审查 | PBS（提议者-构建者分离） |
| **The Verge** | 降低验证成本 | Verkle Trees |
| **The Purge** | 精简协议和历史数据 | 状态过期、历史数据裁剪 |

## 六、Layer2 扩容方案

### 1. 为什么需要 Layer2

以太坊主网（Layer1）的交易处理能力有限（约 15-30 TPS），在高峰期 Gas 费用可能飙升到几十甚至上百美元。Layer2 方案通过将大量交易的执行移到链下，仅将最终结果提交到主网，从而在不牺牲安全性的前提下大幅提升性能并降低成本。

### 2. Rollup 方案对比

当前主流的 Layer2 方案都基于 Rollup 技术，分为两大类：

| 维度 | Optimistic Rollup | ZK Rollup |
|------|-------------------|-----------|
| **验证方式** | 欺诈证明（乐观假设交易有效） | 零知识证明（数学证明交易有效） |
| **提款周期** | 约 7 天（等待挑战期） | 几分钟到几小时 |
| **EVM 兼容性** | 高（现有合约几乎无需修改） | 逐步完善（zkEVM 发展中） |
| **Gas 节省** | 约 3-8 倍 | 约 10-40 倍 |
| **技术成熟度** | 较成熟 | 快速发展中 |
| **代表项目** | Optimism、Arbitrum、Base | zkSync、StarkNet、Scroll |

::: tip
如果你是 DApp 开发新手，建议从 Optimistic Rollup（如 Arbitrum 或 Base）起步，因为它们的 EVM 兼容性最好，现有的 Solidity 合约和开发工具几乎可以直接迁移。
:::

### 3. EIP-4844 与 Proto-Danksharding

2024 年 3 月的 Dencun 升级引入了 EIP-4844（Proto-Danksharding），为 Layer2 创造了一种新的数据类型——Blob。Blob 数据存储在信标链上，约 18 天后自动清除，成本远低于传统的 Calldata。这一升级使得 Layer2 的交易费用降低了约 90%。

## 七、测试网络

在开发 DApp 时，你不应该直接在主网上测试，而应该使用测试网。测试网的 ETH 没有实际价值，可以通过水龙头（Faucet）免费获取。

| 测试网 | 共识机制 | 状态 | 说明 |
|--------|---------|------|------|
| **Sepolia** | PoS | 活跃（推荐） | 以太坊官方推荐的主要测试网 |
| **Holesky** | PoS | 活跃 | 专为质押和基础设施测试设计 |
| **Goerli** | PoS | 已弃用 | 2024 年初关闭 |

::: warning
Sepolia 是目前以太坊官方推荐的应用开发测试网。如果你在网上看到使用 Ropsten、Rinkeby 或 Goerli 的旧教程，请注意这些测试网已经停止运行，你需要将网络切换为 Sepolia。
:::

::: details 在代码中配置 Sepolia 测试网
```js
// hardhat.config.js
require('@nomicfoundation/hardhat-toolbox');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.20',
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`, // [!code highlight]
      accounts: [process.env.DEPLOYER_PRIVATE_KEY], // [!code highlight]
      chainId: 11155111,
    },
  },
};
```
:::

::: danger
永远不要将私钥硬编码在代码文件中或提交到 Git 仓库！上方示例通过 `process.env` 从环境变量读取私钥，你应该使用 `.env` 文件配合 `dotenv` 库管理敏感信息，并将 `.env` 添加到 `.gitignore`。
:::

## 八、本章小结

通过本文，你应该已经建立起对以太坊的全景认知：

- **以太坊 vs 比特币**：以太坊是可编程区块链，支持图灵完备的智能合约
- **EVM**：所有合约以字节码形式在 EVM 中确定性执行，Storage / Memory / Stack 三级存储各有用途
- **智能合约**：链上自执行程序，一旦部署不可修改，通过交易触发状态变更
- **DApp 架构**：前端 + 钱包 + RPC 节点 + 链上合约的分层结构
- **PoS 与路线图**：The Merge 完成后以太坊进入 PoS 时代，后续围绕扩容、抗审查、降低验证成本持续升级
- **Layer2**：Optimistic Rollup 和 ZK Rollup 是当前主流的扩容路径
- **测试网**：开发时使用 Sepolia，通过 Faucet 获取测试 ETH

下一篇将深入钱包与账户体系，带你理解公钥、私钥、助记词的关系以及 MetaMask 的使用方法。
