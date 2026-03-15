---
title: "Web3.js 入门"
category: "Web3 · Web3.js"
tags:
  - Web3.js
  - JavaScript
  - MetaMask
excerpt: "Web3.js 是最早的以太坊 JavaScript 交互库，通过 Provider 连接区块链网络，是理解 DApp 前端开发的起点。"
date: 2026-03-15
---

# Web3.js 入门

## 一、什么是 Web3.js

Web3.js 是以太坊官方维护的 JavaScript 库，为前端和 Node.js 应用提供与以太坊区块链交互的能力。它封装了以太坊 JSON-RPC 接口，让你无需手动构造底层请求，就可以查询链上数据、发送交易、部署和调用智能合约。

### 1. 版本历史

Web3.js 经历了多个大版本的迭代，每次升级都带来了显著的改进：

| 版本 | 发布时间 | 关键特性 | 状态 |
|------|----------|----------|------|
| v0.x | 2015 年 | 初始版本，回调风格 API | 已废弃 |
| v1.x | 2019 年 | Promise 支持、事件订阅、WebSocket | 维护模式 |
| v4.x | 2023 年 | 完全重写，原生 TypeScript、ESM 支持、插件系统 | 当前推荐 |

::: warning
Web3.js v2 和 v3 从未正式发布，版本号直接从 v1.x 跳到 v4.x。如果你在网上看到 v2/v3 相关教程，大概率是过时或错误信息。
:::

### 2. 与其他库的对比

| 特性 | Web3.js v4 | Ethers.js v6 | Viem |
|------|-----------|--------------|------|
| 包体积 | 较大（~600KB） | 中等（~120KB） | 较小（~40KB） |
| TypeScript 支持 | 原生支持 | 原生支持 | 原生支持 |
| 社区生态 | 最成熟，插件丰富 | 社区活跃 | 快速增长 |
| 学习曲线 | 中等 | 较低 | 较高 |
| 模块化 | 支持按需引入 | 支持 | 天然 Tree-shaking |
| 适用场景 | 大型项目、企业应用 | 通用项目 | 追求轻量的现代项目 |

## 二、安装与初始化

### 1. 通过 npm 安装

::: details 安装 Web3.js v4

```bash
# 安装完整包
npm install web3

# 或只安装需要的子模块
npm install web3-eth web3-utils web3-eth-contract
```

:::

### 2. 通过 CDN 引入

如果你在纯 HTML 页面中使用，可以通过 CDN 直接引入：

::: details CDN 引入方式

```html
<!-- 在 HTML 文件中引入 -->
<script src="https://cdn.jsdelivr.net/npm/web3@4/dist/web3.min.js"></script>
<script>
  const web3 = new Web3(window.ethereum);
  console.log('Web3 版本:', web3.version);
</script>
```

:::

### 3. 初始化 Web3 实例

::: details 创建 Web3 实例

```js
// src/utils/web3.js
import { Web3 } from 'web3';

// 方式一：连接本地节点
const web3Local = new Web3('http://127.0.0.1:8545');

// 方式二：连接远程节点（如 Infura）
const INFURA_PROJECT_ID = 'your_infura_project_id';
const web3Infura = new Web3(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

// 方式三：使用 MetaMask 注入的 Provider
const web3MetaMask = new Web3(window.ethereum);

console.log('Web3 版本:', Web3.version);
```

:::

## 三、核心模块

Web3.js v4 采用模块化架构，每个子包负责不同的功能领域：

### 1. web3-eth

`web3-eth` 是最核心的模块，提供与以太坊区块链交互的基础方法，包括查询区块信息、发送交易、获取账户余额等。

::: details web3-eth 基本用法

```js
// src/examples/eth-basic.js
import { Web3 } from 'web3';

const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

// 获取当前区块号
const blockNumber = await web3.eth.getBlockNumber();
console.log('当前区块号:', blockNumber);

// 获取账户余额
const balanceWei = await web3.eth.getBalance(
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' // vitalik.eth
);
const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
console.log('账户余额:', balanceEth, 'ETH');
```

:::

### 2. web3-utils

`web3-utils` 提供一系列工具函数，用于单位转换、编码解码、地址校验等常见操作：

| 方法 | 功能 | 示例 |
|------|------|------|
| `fromWei(value, unit)` | Wei 转其他单位 | `fromWei('1000000000000000000', 'ether')` → `'1'` |
| `toWei(value, unit)` | 其他单位转 Wei | `toWei('1', 'ether')` → `'1000000000000000000'` |
| `isAddress(address)` | 校验以太坊地址格式 | `isAddress('0xAb5...3f')` → `true` |
| `sha3(value)` | 计算 Keccak-256 哈希 | `sha3('hello')` → `'0x1c8a...'` |
| `toHex(value)` | 转十六进制 | `toHex(255)` → `'0xff'` |
| `hexToNumber(hex)` | 十六进制转数字 | `hexToNumber('0xff')` → `255` |

### 3. web3-eth-contract

`web3-eth-contract` 用于智能合约交互，通过 ABI 和合约地址创建合约实例后，你可以像调用普通 JavaScript 方法一样调用合约函数：

::: details 合约交互示例

```js
// src/examples/contract-basic.js
import { Web3 } from 'web3';

const web3 = new Web3(window.ethereum);

// ERC-20 代币合约 ABI（部分）
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }]
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  }
];

// USDT 合约地址（以太坊主网）
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

// 创建合约实例
const usdtContract = new web3.eth.Contract(ERC20_ABI, USDT_ADDRESS);

// 调用 view 函数，不消耗 Gas
const symbol = await usdtContract.methods.symbol().call();
console.log('代币符号:', symbol); // USDT
```

:::

## 四、Provider 类型

Provider 是 Web3.js 与区块链网络通信的桥梁。不同的 Provider 类型适用于不同场景：

### 1. Provider 类型对比

| Provider 类型 | 协议 | 特点 | 适用场景 |
|--------------|------|------|----------|
| HttpProvider | HTTP/HTTPS | 单次请求-响应，无法订阅事件 | 服务端查询、一次性读取 |
| WebsocketProvider | WebSocket | 双向通信，支持事件订阅 | 实时监听、DApp 前端 |
| IpcProvider | IPC | 本地进程通信，性能最高 | 节点所在服务器上的应用 |
| 注入式 Provider | 由钱包注入 | 通过 `window.ethereum` 访问 | 浏览器端 DApp |

### 2. 连接 MetaMask

MetaMask 会在浏览器中注入 `window.ethereum` 对象作为 Provider。你需要主动请求用户授权，才能获取账户信息：

::: details 连接 MetaMask 完整流程

```js
// src/utils/connectWallet.js
import { Web3 } from 'web3';

async function connectMetaMask() {
  // 1. 检测 MetaMask 是否安装
  if (typeof window.ethereum === 'undefined') {
    throw new Error('请先安装 MetaMask 钱包扩展');
  }

  // 2. 请求用户授权连接
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });

  // 3. 创建 Web3 实例
  const web3 = new Web3(window.ethereum);

  // 4. 获取连接信息
  const chainId = await web3.eth.getChainId();
  const currentAccount = accounts[0];

  console.log('已连接账户:', currentAccount);
  console.log('当前链 ID:', chainId);

  return { web3, account: currentAccount, chainId };
}

// 监听账户切换
window.ethereum.on('accountsChanged', (accounts) => {
  console.log('账户已切换:', accounts[0]);
  // 刷新页面或更新状态
});

// 监听网络切换
window.ethereum.on('chainChanged', (chainId) => {
  console.log('网络已切换:', parseInt(chainId, 16));
  window.location.reload();
});
```

:::

::: tip
在生产环境中，推荐使用 `window.ethereum.on('accountsChanged')` 和 `window.ethereum.on('chainChanged')` 监听用户操作，及时更新 DApp 的状态和 UI。
:::

## 五、第一个示例：获取区块号

下面这个完整示例演示了从安装到获取最新区块号的全流程：

::: details 完整示例：连接以太坊并获取区块号

```js
// src/examples/getBlockNumber.js
import { Web3 } from 'web3';

// 使用 Infura 公共节点（需替换为你的 Project ID）
const PROVIDER_URL = 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID';
const web3 = new Web3(PROVIDER_URL);

async function main() {
  try {
    // 获取最新区块号
    const blockNumber = await web3.eth.getBlockNumber(); // {1}
    console.log('最新区块号:', blockNumber);

    // 获取该区块的详细信息
    const block = await web3.eth.getBlock(blockNumber); // {2}
    console.log('区块时间:', new Date(Number(block.timestamp) * 1000));
    console.log('区块中的交易数量:', block.transactions.length);
    console.log('矿工/验证者:', block.miner);
    console.log('Gas 使用量:', block.gasUsed.toString());

    // 获取当前 Gas 价格
    const gasPrice = await web3.eth.getGasPrice();
    console.log('当前 Gas 价格:', web3.utils.fromWei(gasPrice, 'gwei'), 'Gwei');
  } catch (error) {
    console.error('连接以太坊失败:', error.message);
  }
}

main();
```

:::

## 六、Web3.js v4 重要变更

如果你之前使用过 v1.x，升级到 v4 时需要注意以下关键变化：

### 1. 导入方式变更

::: code-group

```js [v4 新写法]
// v4：使用命名导入
import { Web3 } from 'web3';
const web3 = new Web3(provider);
```

```js [v1 旧写法]
// v1：使用默认导入
import Web3 from 'web3';
const web3 = new Web3(provider);
```

:::

### 2. BigInt 替代 BN.js

v4 全面使用原生 `BigInt` 替代了之前的 `BN.js`，这意味着数值运算的方式发生了变化：

::: details BigInt 用法对比

```js
// src/examples/bigint-migration.js
import { Web3 } from 'web3';

const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

// v4 返回的数值类型是 BigInt
const blockNumber = await web3.eth.getBlockNumber();
console.log(typeof blockNumber); // 'bigint' // {1}

// BigInt 运算
const nextBlock = blockNumber + 1n; // 使用 n 后缀表示 BigInt 字面量
console.log('下一个区块:', nextBlock);

// 转换为普通数字（注意溢出风险）
const blockNumberAsNumber = Number(blockNumber);
console.log('区块号（Number）:', blockNumberAsNumber);

// 转换为字符串
const blockNumberAsString = blockNumber.toString();
console.log('区块号（String）:', blockNumberAsString);
```

:::

::: danger
`BigInt` 不能与普通 `Number` 直接混合运算，如 `blockNumber + 1` 会抛出 TypeError。你必须使用 `blockNumber + 1n` 或先进行类型转换。
:::

### 3. 插件系统

v4 引入了插件架构，允许第三方开发者扩展 Web3.js 的功能：

::: details 插件使用示例

```js
// src/examples/plugin-usage.js
import { Web3 } from 'web3';
import { Web3ZkSyncPlugin } from 'web3-plugin-zksync';

const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

// 注册插件
web3.registerPlugin(new Web3ZkSyncPlugin());

// 使用插件扩展的方法
const zkSyncBalance = await web3.zkSync.getBalance('0x...');
```

:::

::: tip
Web3.js v4 的插件生态正在快速发展，你可以在 [npm](https://www.npmjs.com/search?q=web3-plugin) 上搜索 `web3-plugin` 关键字查找可用插件。
:::
