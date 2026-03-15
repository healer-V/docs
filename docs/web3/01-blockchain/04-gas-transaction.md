---
title: "Gas 与交易机制"
category: "Web3 · Ethereum"
tags:
  - Gas
  - 交易
  - EIP-1559
excerpt: "Gas 是以太坊网络的计算燃料，理解 Gas 计费和交易生命周期是优化 DApp 成本和用户体验的关键。"
date: 2026-03-15
---

# Gas 与交易机制

在以太坊网络中，每一次状态变更（转账、合约调用、合约部署）都需要消耗 Gas。Gas 是以太坊的"计算燃料"，它既是防止网络滥用的经济机制，也是你作为 DApp 开发者必须深入理解的成本因素。本文将从 Gas 的基本概念出发，深入讲解 EIP-1559 费用模型、交易的完整生命周期以及 Gas 估算的实践方法。

## 一、什么是 Gas

### 1. Gas 的本质

Gas 是 EVM 执行计算操作的度量单位。每条 EVM 指令都有固定的 Gas 消耗量，复杂的操作消耗更多 Gas。这个机制确保了两件事：

- **防止无限循环**：每笔交易都有 Gas 上限，EVM 执行到 Gas 耗尽就会自动停止
- **公平定价**：计算量越大的操作支付越多费用，防止低成本攻击

### 2. 常见操作的 Gas 消耗

| 操作 | Gas 消耗 | 说明 |
|------|---------|------|
| 普通 ETH 转账 | 21,000 | 最简单的交易类型 |
| SSTORE（存储写入新值） | 20,000 | 向 Storage 写入新的非零值 |
| SSTORE（更新已有值） | 5,000 | 修改 Storage 中已存在的值 |
| SLOAD（存储读取） | 2,100 | 从 Storage 读取一个 slot |
| MSTORE（内存写入） | 3 | 向 Memory 写入 32 字节 |
| ADD（加法运算） | 3 | 最基础的算术操作 |
| CREATE（部署合约） | 32,000 | 创建新合约的基础开销 |
| LOG（触发事件） | 375 + 375×topics + 8×bytes | 事件日志的 Gas 由主题数和数据量决定 |

::: tip
从表中可以看到，Storage 操作的 Gas 成本是 Memory 操作的数千倍。这就是为什么 Solidity 优化的第一条建议永远是"减少 Storage 读写"。
:::

## 二、Gas Price、Gas Limit 与 Gas Used

理解 Gas 费用的计算，你需要区分三个核心概念：

### 1. 三者的关系

| 概念 | 含义 | 由谁决定 |
|------|------|---------|
| **Gas Limit** | 你愿意为这笔交易支付的 Gas 上限 | 发送方设定 |
| **Gas Used** | 交易实际消耗的 Gas 数量 | EVM 执行后确定 |
| **Gas Price** | 每单位 Gas 的价格（单位：Gwei） | 市场供需决定 |

**实际费用计算公式：**

```
交易费用 = Gas Used × Gas Price

例：一笔合约调用
  Gas Used = 65,000
  Gas Price = 30 Gwei
  费用 = 65,000 × 30 Gwei = 1,950,000 Gwei = 0.00195 ETH
```

### 2. Gas Limit 的注意事项

- 如果 Gas Limit 设置过低，交易在执行途中耗尽 Gas，会触发 **Out of Gas** 错误，交易回滚，但已消耗的 Gas 不会退还
- 如果 Gas Limit 设置过高，多余的 Gas 会自动退还给你，不会多扣费
- MetaMask 等钱包会自动估算合理的 Gas Limit，通常不需要手动调整

::: warning
Gas Limit 设置过低导致交易失败时，你仍然要支付已消耗的 Gas 费用。这是以太坊最常见的"白花钱"场景之一。钱包自动估算的值通常已经包含了安全余量，不建议手动调低。
:::

## 三、EIP-1559 费用模型

### 1. 旧模型的问题

在 EIP-1559 之前，以太坊使用简单的"第一价格拍卖"模型：用户自行设定 Gas Price，矿工优先打包出价高的交易。这带来了严重的问题：

- **费用不可预测**：用户很难估算合理的 Gas Price，经常多付或少付
- **频繁超付**：为了确保交易被及时打包，用户倾向于大幅提高 Gas Price
- **体验差**：Gas Price 设低了交易长时间挂起，设高了白白多花钱

### 2. EIP-1559 的新机制

2021 年 8 月的 London 升级引入了 EIP-1559，彻底改变了 Gas 费用的计算方式。

**新模型的两个核心组成：**

| 组成部分 | 含义 | 去向 |
|---------|------|------|
| **Base Fee（基础费用）** | 由协议根据网络拥堵程度自动计算 | 直接销毁（burn），不给验证者 |
| **Priority Fee（优先费/小费）** | 用户自行设定，给验证者的激励 | 支付给打包交易的验证者 |

**费用计算公式：**

```
交易费用 = Gas Used × (Base Fee + Priority Fee)

maxFeePerGas = 你愿意支付的每单位 Gas 的最高总价
maxPriorityFeePerGas = 你愿意给验证者的每单位 Gas 的最高小费

实际支付 = Gas Used × min(maxFeePerGas, Base Fee + maxPriorityFeePerGas)
退还金额 = Gas Limit × maxFeePerGas - 实际支付
```

### 3. Base Fee 的动态调节

Base Fee 的调整规则非常直观：

- 当前区块的 Gas 使用量超过目标值（区块容量的 50%）→ 下一个区块的 Base Fee 最多**上涨 12.5%**
- 当前区块的 Gas 使用量低于目标值 → 下一个区块的 Base Fee 最多**下降 12.5%**

这种机制使得 Gas 费用在网络拥堵时自动上涨以抑制需求，在空闲时自动下降以降低成本。

### 4. 新旧模型对比

| 维度 | Legacy（旧模型） | EIP-1559（新模型） |
|------|-----------------|-------------------|
| **费用参数** | `gasPrice` | `maxFeePerGas` + `maxPriorityFeePerGas` |
| **费用可预测性** | 低（靠猜测） | 高（Base Fee 由协议计算） |
| **超付退还** | 不退还多余的 Gas Price | 退还 maxFeePerGas 与实际费用的差额 |
| **ETH 供应影响** | 全部费用给矿工 | Base Fee 被销毁，具有通缩效应 |
| **用户体验** | 手动设定 Gas Price | 钱包自动推荐合理费用 |
| **交易类型** | Type 0 | Type 2 |

::: tip
EIP-1559 引入的 Base Fee 销毁机制意味着以太坊交易越多，被销毁的 ETH 越多。在网络活跃时期，ETH 的销毁量可能超过新增发行量，使 ETH 变为通缩资产。你可以在 [ultrasound.money](https://ultrasound.money) 实时查看 ETH 的销毁数据。
:::

## 四、交易生命周期

一笔以太坊交易从创建到最终确认，经历以下完整流程：

### 1. 交易的七个阶段

```
(1) 构造     (2) 签名     (3) 广播     (4) 内存池
用户填写   →  私钥签名  →  发送到节点 →  等待被打包
交易参数      生成签名      传播到全网     按费用排序
    │             │             │             │
    ▼             ▼             ▼             ▼
(7) 最终确认  (6) 确认     (5) 打包
多个区块后  ←  写入区块  ←  验证者选中
认为不可逆    获得区块号     执行交易
```

### 2. 各阶段详解

#### (1) 构造交易

用户或 DApp 填写交易的基本参数：

| 字段 | 说明 | 示例 |
|------|------|------|
| `to` | 接收方地址（合约部署时为空） | `0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2` |
| `value` | 转账 ETH 数量（Wei） | `1000000000000000000`（1 ETH） |
| `data` | 合约调用的编码数据 | `0xa9059cbb000000...`（调用 transfer 函数） |
| `nonce` | 发送方的交易序号 | `42` |
| `maxFeePerGas` | 最高每 Gas 价格 | `50000000000`（50 Gwei） |
| `maxPriorityFeePerGas` | 最高优先费 | `2000000000`（2 Gwei） |
| `gasLimit` | Gas 上限 | `21000`（普通转账） |
| `chainId` | 链 ID | `1`（主网）、`11155111`（Sepolia） |

#### (2) 签名

钱包使用发送方的私钥对交易数据进行 ECDSA 签名，生成 `v`、`r`、`s` 三个签名参数。签名后的交易不可修改，任何改动都会导致签名验证失败。

#### (3) 广播

签名后的交易通过 JSON-RPC 接口（如 `eth_sendRawTransaction`）发送到以太坊节点，节点验证基本格式后将交易传播到全网。

#### (4) 内存池（Mempool）

交易进入节点的内存池等待被打包。内存池中的交易按优先费（Priority Fee）排序，出价高的交易被优先选中。

::: warning
内存池中的交易是公开可见的。这意味着套利机器人可以看到你的交易并抢先执行（Front-running），这就是 MEV（最大可提取价值）问题的根源。在 DeFi 交易中，你可以使用 Flashbots Protect 等私有交易服务来避免被抢跑。
:::

#### (5) 打包

验证者从内存池中选取一批交易，构建新区块。EVM 逐条执行交易中的操作码，更新世界状态。

#### (6) 确认

交易所在的区块被添加到链上后获得第一次确认。后续每产生一个新区块，确认数加一。

#### (7) 最终确认

在以太坊 PoS 中，一个 Epoch（32 个 Slot，约 6.4 分钟）后交易被"最终确认"（Finalized），此后理论上不可逆转。

## 五、交易类型

以太坊目前支持三种交易类型：

| 类型 | 编号 | 引入时间 | 费用参数 | 说明 |
|------|------|---------|---------|------|
| **Legacy** | Type 0 | 创世 | `gasPrice` | 旧版交易格式 |
| **EIP-2930** | Type 1 | Berlin 升级（2021.4） | `gasPrice` + `accessList` | 增加访问列表，预声明要访问的地址和 Storage slot |
| **EIP-1559** | Type 2 | London 升级（2021.8） | `maxFeePerGas` + `maxPriorityFeePerGas` | 新费用模型，当前主流 |

::: tip
目前绝大多数钱包和 DApp 默认使用 Type 2（EIP-1559）交易。除非你在与旧版合约或特殊链交互，否则不需要关心 Type 0 和 Type 1。
:::

## 六、Nonce 管理

### 1. 什么是 Nonce

Nonce 是每个 EOA 账户的交易计数器，从 0 开始递增。每发送一笔交易，Nonce 加一。Nonce 的作用是：

- **防止重放攻击**：同一笔交易不能被重复执行
- **保证交易顺序**：Nonce 为 5 的交易必须在 Nonce 为 4 的交易之后执行

### 2. 常见的 Nonce 问题

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 交易卡住（Pending） | Nonce 过低的交易被拒绝，后续交易全部阻塞 | 用相同 Nonce 发送一笔更高 Gas Price 的交易覆盖 |
| Nonce 不连续 | 跳过了某个 Nonce（如 Nonce 3 后直接发 Nonce 5） | 补发缺失 Nonce 的交易 |
| Nonce too low | 使用了已被确认的 Nonce 值 | 获取最新 Nonce（`eth_getTransactionCount`） |

::: details 获取和管理 Nonce
```js
// transaction/nonceManager.js
const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_API_KEY');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function sendWithNonce() {
  // 获取当前 Nonce（包括 pending 交易）
  const nonce = await provider.getTransactionCount(wallet.address, 'pending'); // [!code highlight]
  console.log('当前 Nonce:', nonce);

  const tx = await wallet.sendTransaction({
    to: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
    value: ethers.parseEther('0.01'),
    nonce: nonce, // 显式指定 Nonce // [!code highlight]
  });

  console.log('交易哈希:', tx.hash);
  const receipt = await tx.wait();
  console.log('确认区块:', receipt.blockNumber);
}

/**
 * 加速卡住的交易：用相同 Nonce 发送更高 Gas 的空交易
 */
async function speedUpTransaction(stuckNonce) {
  const feeData = await provider.getFeeData();
  const tx = await wallet.sendTransaction({
    to: wallet.address, // 发给自己
    value: 0,
    nonce: stuckNonce, // 使用卡住交易的同一个 Nonce // [!code highlight]
    maxFeePerGas: feeData.maxFeePerGas * 2n, // 翻倍 Gas Price // [!code highlight]
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas * 2n,
  });
  console.log('加速交易已发送:', tx.hash);
}

sendWithNonce();
```
:::

## 七、Gas 估算实践

在 DApp 开发中，准确估算 Gas 是保障用户体验的关键。估算过低会导致交易失败，估算过高会让用户看到不必要的高额费用提示。

### 1. 使用 ethers.js 估算 Gas

::: details Gas 估算完整示例
```js
// transaction/estimateGas.js
const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_API_KEY');

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
];

const TOKEN_ADDRESS = '0x779877A7B0D9E8603169DdbD7836e478b4624789'; // Sepolia LINK
const contract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);

async function estimateTransferGas() {
  const recipient = '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2';
  const amount = ethers.parseUnits('100', 18); // 100 LINK

  // 1. 估算 Gas Used
  const estimatedGas = await contract.transfer.estimateGas(recipient, amount, { // [!code highlight]
    from: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // 模拟发送方
  });
  console.log('预估 Gas Used:', estimatedGas.toString());

  // 2. 获取当前 Gas 费用建议
  const feeData = await provider.getFeeData(); // [!code highlight]
  console.log('当前 Base Fee:', ethers.formatUnits(feeData.gasPrice, 'gwei'), 'Gwei');
  console.log('建议 maxFeePerGas:', ethers.formatUnits(feeData.maxFeePerGas, 'gwei'), 'Gwei');
  console.log('建议 maxPriorityFeePerGas:', ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei'), 'Gwei');

  // 3. 计算预估总费用
  const estimatedCost = estimatedGas * feeData.maxFeePerGas; // [!code highlight]
  console.log('预估最大费用:', ethers.formatEther(estimatedCost), 'ETH');

  // 4. 添加安全余量（建议增加 20%）
  const gasLimitWithBuffer = estimatedGas * 120n / 100n; // [!code highlight]
  console.log('带余量的 Gas Limit:', gasLimitWithBuffer.toString());
}

estimateTransferGas();
```
:::

### 2. Gas 优化建议

在编写智能合约时，以下策略可以有效降低 Gas 消耗：

| 优化策略 | 说明 | 节省幅度 |
|---------|------|---------|
| 减少 Storage 写入 | 用 Memory 变量缓存 Storage 值，批量更新 | 高 |
| 使用 `calldata` 替代 `memory` | 外部函数的只读数组参数用 `calldata` | 中 |
| 短路求值 | `require` 中把低成本检查放前面 | 低 |
| 打包存储变量 | 将多个小于 256 位的变量放在同一个 Storage slot | 高 |
| 使用事件替代 Storage | 不需要链上读取的数据用 Event 记录 | 高 |
| 避免循环中的 Storage 操作 | 先读到 Memory，循环结束后一次写回 | 高 |

::: details Solidity Gas 优化示例
```solidity
// contracts/GasOptimized.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GasOptimized {
    // 优化：将多个小变量打包到同一个 32 字节 slot
    uint128 public totalDeposits;  // slot 0 的前 16 字节
    uint64 public lastUpdateTime;  // slot 0 的中间 8 字节  // [!code highlight]
    uint64 public depositCount;    // slot 0 的后 8 字节    // [!code highlight]

    mapping(address => uint256) public balances;

    event Deposited(address indexed user, uint256 amount);

    /// 未优化版本：每次循环都读写 Storage
    function batchTransferBad(address[] calldata recipients, uint256 amount) external {
        for (uint256 i = 0; i < recipients.length; i++) {
            balances[recipients[i]] += amount;   // 每次循环写入 Storage
            totalDeposits += uint128(amount);     // 每次循环写入 Storage
        }
    }

    /// 优化版本：先在 Memory 中累计，最后一次性写入 Storage
    function batchTransferGood(address[] calldata recipients, uint256 amount) external { // [!code highlight]
        uint128 totalAdded = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            balances[recipients[i]] += amount;
            totalAdded += uint128(amount);        // Memory 中累计 // [!code highlight]
        }
        totalDeposits += totalAdded;              // 一次 Storage 写入 // [!code highlight]
        depositCount += uint64(recipients.length);

        // 用事件记录详情，比存 Storage 便宜得多
        for (uint256 i = 0; i < recipients.length; i++) {
            emit Deposited(recipients[i], amount);
        }
    }
}
```
:::

::: danger
Gas 估算（`estimateGas`）是基于当前链上状态的模拟执行。如果在你发送交易之前链上状态发生了变化（例如代币余额已被其他交易花费），实际执行时 Gas 消耗可能与估算不同，甚至导致交易回滚。在高频交互的 DeFi 场景中，务必设置合理的滑点保护和 Gas 余量。
:::

## 八、本章小结

通过本文，你已经全面理解了以太坊的 Gas 与交易机制：

- **Gas 本质**：EVM 计算操作的度量单位，Storage 操作远比 Memory 昂贵
- **Gas 三要素**：Gas Limit（上限）、Gas Used（实际消耗）、Gas Price（单价）
- **EIP-1559**：Base Fee（协议自动计算并销毁）+ Priority Fee（给验证者的小费），大幅改善了费用可预测性
- **交易生命周期**：构造 → 签名 → 广播 → 内存池 → 打包 → 确认 → 最终确认
- **Nonce 管理**：防止重放攻击和保证交易顺序，卡住的交易可通过同 Nonce 覆盖解决
- **Gas 估算**：使用 `estimateGas` 预估消耗，添加 20% 安全余量，在合约层面通过减少 Storage 操作等策略降低成本

至此，区块链基础章节的四篇内容已经覆盖了你进入 Web3 开发所需的全部底层知识。下一章将开始学习 Solidity 智能合约开发语言。
