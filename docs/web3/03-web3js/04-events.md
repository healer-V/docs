---
title: "事件监听与过滤"
category: "Web3 · Web3.js"
tags:
  - Web3.js
  - Event
  - WebSocket
excerpt: "通过监听智能合约事件，DApp 前端可以实时响应链上状态变化，是构建交互式去中心化应用的关键技术。"
date: 2026-03-15
---

# 事件监听与过滤

## 一、合约事件概述

智能合约通过 `emit` 关键字触发事件（Event），事件数据被记录在交易日志（Log）中，存储在区块链上但不影响合约状态。对于 DApp 前端来说，监听事件是获取链上实时状态变化最高效的方式。

### 1. 事件的核心特点

| 特性 | 说明 |
|------|------|
| 存储位置 | 交易日志（Transaction Log），不在合约 Storage 中 |
| Gas 成本 | 比写入 Storage 便宜约 5 倍 |
| 可索引参数 | 最多 3 个 `indexed` 参数，支持高效过滤 |
| 读取方式 | 通过 RPC 查询或 WebSocket 订阅 |
| 链上可见性 | 合约代码内部无法读取事件，仅供外部监听 |

### 2. 事件 ABI 结构

以 ERC-20 的 `Transfer` 事件为例，其 ABI 定义如下：

::: details Transfer 事件 ABI

```js
// ERC-20 Transfer 事件的 ABI 定义
const TRANSFER_EVENT_ABI = {
  name: 'Transfer',
  type: 'event',
  inputs: [
    { name: 'from', type: 'address', indexed: true },   // 索引参数：可用于过滤
    { name: 'to', type: 'address', indexed: true },      // 索引参数：可用于过滤
    { name: 'value', type: 'uint256', indexed: false }   // 非索引参数：只能读取
  ]
};
```

:::

::: tip
`indexed` 参数会被存储在日志的 `topics` 中，支持快速过滤查询。非 `indexed` 参数存储在 `data` 中，查询时无法作为过滤条件。每个事件最多可以有 3 个 `indexed` 参数。
:::

## 二、实时事件订阅

使用 `contract.events.EventName()` 可以订阅合约的实时事件。注意：实时订阅必须使用 WebSocket Provider，HTTP Provider 不支持持久连接。

### 1. 基本事件订阅

::: details 监听 ERC-20 Transfer 事件

```js
// src/events/subscribeTransfer.js
import { Web3 } from 'web3';

// 实时订阅必须使用 WebSocket Provider
const web3 = new Web3('wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID'); // {1}

const ERC20_ABI = [
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  }
];

// USDT 合约地址
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const usdtContract = new web3.eth.Contract(ERC20_ABI, USDT_ADDRESS);

// 订阅所有 Transfer 事件
const transferSubscription = usdtContract.events.Transfer(); // {2}

transferSubscription.on('data', (event) => { // {3}
  const { from, to, value } = event.returnValues;
  const amount = Number(value) / 1e6; // USDT 精度为 6

  console.log('检测到 USDT 转账:');
  console.log(`  发送方: ${from}`);
  console.log(`  接收方: ${to}`);
  console.log(`  金额: ${amount.toLocaleString()} USDT`);
  console.log(`  交易哈希: ${event.transactionHash}`);
  console.log(`  区块号: ${event.blockNumber}`);
  console.log('---');
});

transferSubscription.on('error', (error) => {
  console.error('事件订阅出错:', error.message);
});

transferSubscription.on('connected', (subscriptionId) => {
  console.log('订阅已建立，ID:', subscriptionId);
});
```

:::

### 2. Provider 类型与事件订阅的关系

| Provider 类型 | 实时订阅 | 历史查询 | 适用场景 |
|--------------|----------|----------|----------|
| HttpProvider | 不支持 | 支持 | 一次性查询历史事件 |
| WebsocketProvider | 支持 | 支持 | DApp 实时监听 |
| IpcProvider | 支持 | 支持 | 节点本地应用 |
| MetaMask（注入式） | 有限支持 | 支持 | 浏览器 DApp |

::: warning
MetaMask 注入的 Provider 底层可能使用 HTTP 连接，对实时事件订阅的支持不完整。如果你的 DApp 需要稳定的事件监听，建议直接使用 WebSocket Provider 连接节点服务（如 Infura、Alchemy 的 WebSocket 端点）。
:::

## 三、事件过滤

通过 `filter` 参数，你可以只监听满足特定条件的事件，避免处理大量无关数据。

### 1. 按索引参数过滤

只有 `indexed` 参数才能用作过滤条件：

::: details 过滤特定地址的转账事件

```js
// src/events/filterEvents.js
import { Web3 } from 'web3';

const web3 = new Web3('wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID');

const ERC20_ABI = [
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ]
  }
];

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const usdcContract = new web3.eth.Contract(ERC20_ABI, USDC_ADDRESS);

// 监控的钱包地址
const WATCHED_WALLET = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

// 场景一：只监听从特定地址发出的转账
const outgoingTransfers = usdcContract.events.Transfer({
  filter: { from: WATCHED_WALLET } // {1}
});

outgoingTransfers.on('data', (event) => {
  const { to, value } = event.returnValues;
  console.log(`[转出] → ${to}, 金额: ${Number(value) / 1e6} USDC`);
});

// 场景二：只监听转入特定地址的转账
const incomingTransfers = usdcContract.events.Transfer({
  filter: { to: WATCHED_WALLET } // {2}
});

incomingTransfers.on('data', (event) => {
  const { from, value } = event.returnValues;
  console.log(`[转入] ← ${from}, 金额: ${Number(value) / 1e6} USDC`);
});

// 场景三：监听多个地址之间的转账（OR 条件）
const multiAddressFilter = usdcContract.events.Transfer({
  filter: { // {3}
    from: [
      '0xAddress1',
      '0xAddress2',
      '0xAddress3'
    ]
  }
});

multiAddressFilter.on('data', (event) => {
  console.log('多地址监控命中:', event.returnValues);
});
```

:::

::: tip
在 `filter` 中，同一个参数传入数组表示 OR 逻辑（匹配任一值即可）。不同参数之间是 AND 逻辑（必须同时满足）。例如 `{ from: addrA, to: addrB }` 表示从 A 转到 B 的事件。
:::

### 2. 过滤参数组合规则

| 过滤条件 | 语义 | 示例 |
|----------|------|------|
| `{ from: addrA }` | 从 A 发出的所有转账 | 监控某地址支出 |
| `{ to: addrB }` | 所有转入 B 的转账 | 监控某地址收入 |
| `{ from: addrA, to: addrB }` | 从 A 转到 B（AND） | 监控特定转账路径 |
| `{ from: [addrA, addrB] }` | 从 A 或 B 发出（OR） | 批量监控多个地址 |

## 四、查询历史事件

除了实时订阅，你还可以查询过去某段区块范围内已发生的事件。`getPastEvents` 可以配合 HTTP Provider 使用，不要求 WebSocket 连接。

### 1. 基本用法

::: details 查询历史 Transfer 事件

```js
// src/events/pastEvents.js
import { Web3 } from 'web3';

const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

const ERC20_ABI = [
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ]
  }
];

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const usdcContract = new web3.eth.Contract(ERC20_ABI, USDC_ADDRESS);

async function queryPastTransfers() {
  const latestBlock = await web3.eth.getBlockNumber();

  // 查询最近 1000 个区块内的 Transfer 事件
  const events = await usdcContract.getPastEvents('Transfer', { // {1}
    fromBlock: latestBlock - 1000n,
    toBlock: 'latest'
  });

  console.log(`找到 ${events.length} 笔 USDC 转账`);

  // 统计转账总额
  let totalTransferred = 0n;
  events.forEach((event) => {
    totalTransferred += BigInt(event.returnValues.value);
  });

  const totalUSDC = Number(totalTransferred) / 1e6;
  console.log(`总转账金额: ${totalUSDC.toLocaleString()} USDC`);

  // 显示前 5 笔转账
  events.slice(0, 5).forEach((event, index) => {
    const { from, to, value } = event.returnValues;
    console.log(`[${index + 1}] ${from} → ${to}: ${Number(value) / 1e6} USDC`);
  });
}

queryPastTransfers();
```

:::

### 2. 带过滤条件的历史查询

::: details 查询特定地址的历史转账

```js
// src/events/filteredPastEvents.js
import { Web3 } from 'web3';

const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

const ERC20_ABI = [
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ]
  }
];

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const usdcContract = new web3.eth.Contract(ERC20_ABI, USDC_ADDRESS);

async function getWalletTransferHistory(walletAddress, blockRange = 5000n) {
  const latestBlock = await web3.eth.getBlockNumber();
  const fromBlock = latestBlock - blockRange;

  // 查询转出记录
  const sentEvents = await usdcContract.getPastEvents('Transfer', { // {1}
    filter: { from: walletAddress },
    fromBlock: fromBlock,
    toBlock: 'latest'
  });

  // 查询转入记录
  const receivedEvents = await usdcContract.getPastEvents('Transfer', { // {2}
    filter: { to: walletAddress },
    fromBlock: fromBlock,
    toBlock: 'latest'
  });

  console.log(`=== ${walletAddress} 的 USDC 交易记录 ===`);
  console.log(`时间范围: 区块 ${fromBlock} ~ ${latestBlock}`);
  console.log(`转出笔数: ${sentEvents.length}`);
  console.log(`转入笔数: ${receivedEvents.length}`);

  // 计算净流入
  let totalSent = 0n;
  let totalReceived = 0n;

  sentEvents.forEach(e => { totalSent += BigInt(e.returnValues.value); });
  receivedEvents.forEach(e => { totalReceived += BigInt(e.returnValues.value); });

  const netFlow = Number(totalReceived - totalSent) / 1e6;
  console.log(`净流入: ${netFlow >= 0 ? '+' : ''}${netFlow.toLocaleString()} USDC`);

  return { sentEvents, receivedEvents, netFlow };
}

getWalletTransferHistory('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
```

:::

::: warning
大部分公共节点（如 Infura、Alchemy）对 `getPastEvents` 的查询范围有限制，通常最多支持 10,000 个区块。如果你需要查询更大范围的历史数据，需要分批查询或使用 The Graph 等索引服务。
:::

## 五、WebSocket 连接管理

在生产环境中，WebSocket 连接可能因为网络波动而断开。你需要实现自动重连机制来保证事件监听的可靠性。

### 1. 自动重连机制

::: details WebSocket 自动重连

```js
// src/events/wsReconnect.js
import { Web3 } from 'web3';

class ReliableWebSocketProvider {
  constructor(wsUrl, options = {}) {
    this.wsUrl = wsUrl;
    this.reconnectInterval = options.reconnectInterval || 5000; // 重连间隔 5 秒
    this.maxRetries = options.maxRetries || 10;
    this.retryCount = 0;
    this.web3 = null;
    this.subscriptions = [];
  }

  /**
   * 建立 WebSocket 连接
   */
  connect() {
    const wsProvider = new Web3.providers.WebsocketProvider(this.wsUrl, {
      reconnect: { // {1}
        auto: true,
        delay: this.reconnectInterval,
        maxAttempts: this.maxRetries,
        onTimeout: false
      },
      timeout: 30000
    });

    wsProvider.on('connect', () => {
      console.log('WebSocket 已连接');
      this.retryCount = 0;
      // 重新建立之前的事件订阅
      this._resubscribeAll();
    });

    wsProvider.on('close', () => { // {2}
      console.warn('WebSocket 连接已关闭');
    });

    wsProvider.on('error', (error) => {
      console.error('WebSocket 错误:', error.message);
    });

    this.web3 = new Web3(wsProvider);
    return this.web3;
  }

  /**
   * 注册需要在重连后恢复的订阅
   */
  addSubscription(setupFn) {
    this.subscriptions.push(setupFn);
    // 如果已连接，立即执行
    if (this.web3) {
      setupFn(this.web3);
    }
  }

  /**
   * 重连后恢复所有订阅
   */
  _resubscribeAll() {
    console.log(`重新建立 ${this.subscriptions.length} 个事件订阅...`);
    this.subscriptions.forEach(setupFn => setupFn(this.web3));
  }

  /**
   * 断开连接并清理
   */
  disconnect() {
    if (this.web3 && this.web3.currentProvider) {
      this.web3.currentProvider.disconnect();
    }
    this.subscriptions = [];
  }
}

// 使用示例
const wsManager = new ReliableWebSocketProvider(
  'wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID'
);

const web3 = wsManager.connect();

// 注册事件订阅（断线重连后会自动恢复）
wsManager.addSubscription((web3Instance) => {
  const contract = new web3Instance.eth.Contract(ERC20_ABI, USDC_ADDRESS);
  const subscription = contract.events.Transfer();
  subscription.on('data', (event) => {
    console.log('Transfer 事件:', event.returnValues);
  });
});
```

:::

## 六、取消订阅

当你不再需要监听某个事件时，应及时取消订阅，释放资源：

::: details 取消事件订阅

```js
// src/events/unsubscribe.js
import { Web3 } from 'web3';

const web3 = new Web3('wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID');

const ERC20_ABI = [
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ]
  }
];

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const usdcContract = new web3.eth.Contract(ERC20_ABI, USDC_ADDRESS);

// 创建订阅
const subscription = usdcContract.events.Transfer();

subscription.on('data', (event) => {
  console.log('Transfer:', event.returnValues);
});

// 10 秒后取消订阅
setTimeout(async () => {
  await subscription.unsubscribe(); // {1}
  console.log('已取消 Transfer 事件订阅');
}, 10000);

// 取消所有订阅
async function unsubscribeAll() {
  await web3.eth.clearSubscriptions(); // {2}
  console.log('已清除所有事件订阅');
}
```

:::

::: tip
在 React/Vue 组件中，务必在组件卸载时取消事件订阅，避免内存泄漏。对于 React，可以在 `useEffect` 的清理函数中调用 `unsubscribe()`；对于 Vue，可以在 `onUnmounted` 中处理。
:::

## 七、处理链重组

区块链偶尔会发生链重组（Chain Reorg），即已确认的区块被替换为另一条更长的链。这可能导致之前收到的事件被撤销。

### 1. 重组对事件的影响

| 情况 | 说明 | 处理方式 |
|------|------|----------|
| 事件在重组后仍存在 | 交易被打包在新链的区块中 | 无需处理 |
| 事件在重组后消失 | 交易未被新链包含 | 需要回滚相关 UI 更新 |
| 事件参数变化 | 极罕见，区块号可能变化 | 重新查询确认 |

### 2. 安全的事件处理策略

::: details 考虑链重组的事件处理

```js
// src/events/safeEventHandler.js
import { Web3 } from 'web3';

const web3 = new Web3('wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID');

/**
 * 安全的事件处理器，考虑链重组
 * 事件先进入 pending 状态，达到确认阈值后才视为 finalized
 */
class SafeEventHandler {
  constructor(confirmationThreshold = 12) {
    this.confirmationThreshold = confirmationThreshold;
    this.pendingEvents = new Map(); // txHash → eventData
    this.confirmedCallbacks = [];
  }

  /**
   * 注册事件确认后的回调
   */
  onConfirmed(callback) {
    this.confirmedCallbacks.push(callback);
  }

  /**
   * 处理新事件（进入 pending 队列）
   */
  handleNewEvent(event) { // {1}
    const key = `${event.transactionHash}-${event.logIndex}`;
    this.pendingEvents.set(key, {
      event,
      firstSeen: Date.now(),
      blockNumber: event.blockNumber
    });
    console.log(`[Pending] 新事件: ${key}, 区块: ${event.blockNumber}`);
  }

  /**
   * 检查 pending 事件是否已达到确认阈值
   */
  async checkConfirmations() { // {2}
    const currentBlock = await web3.eth.getBlockNumber();

    for (const [key, data] of this.pendingEvents) {
      const confirmations = currentBlock - data.blockNumber;

      if (confirmations >= BigInt(this.confirmationThreshold)) {
        // 验证交易回执仍然存在（未被重组掉）
        const receipt = await web3.eth.getTransactionReceipt(
          data.event.transactionHash
        );

        if (receipt && receipt.status === 1n) { // {3}
          console.log(`[Confirmed] 事件已确认 (${confirmations} 次): ${key}`);
          this.confirmedCallbacks.forEach(cb => cb(data.event));
          this.pendingEvents.delete(key);
        } else {
          console.warn(`[Reorged] 事件已被重组移除: ${key}`);
          this.pendingEvents.delete(key);
        }
      }
    }
  }
}

// 使用示例
const safeHandler = new SafeEventHandler(12);

safeHandler.onConfirmed((event) => {
  const { from, to, value } = event.returnValues;
  console.log(`确认转账: ${from} → ${to}, ${Number(value) / 1e6} USDC`);
  // 在这里安全地更新 UI 或数据库
});

// 订阅事件
const contract = new web3.eth.Contract(ERC20_ABI, USDC_ADDRESS);
const subscription = contract.events.Transfer();

subscription.on('data', (event) => {
  safeHandler.handleNewEvent(event);
});

// 定期检查确认状态（每 15 秒）
setInterval(() => safeHandler.checkConfirmations(), 15000);
```

:::

::: danger
对于涉及资金操作的业务逻辑（如交易所充值入账、NFT 铸造确认），绝对不要在收到事件后立即执行。必须等待足够的区块确认数（通常 12-30 个区块）后再处理，以避免因链重组导致资金损失。
:::

## 八、实战：ERC-20 转账监控面板

下面是一个完整的实战示例，展示如何构建一个代币转账实时监控功能：

::: details 完整的转账监控示例

```js
// src/monitor/transferMonitor.js
import { Web3 } from 'web3';

const ERC20_ABI = [
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ]
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  }
];

class TransferMonitor {
  constructor(wsUrl) {
    this.web3 = new Web3(wsUrl);
    this.monitors = new Map();
    this.transferHistory = [];
    this.maxHistoryLength = 100;
  }

  /**
   * 添加代币监控
   * @param {string} tokenAddress - 代币合约地址
   * @param {object} options - 过滤选项
   */
  async addToken(tokenAddress, options = {}) { // {1}
    const contract = new this.web3.eth.Contract(ERC20_ABI, tokenAddress);

    // 获取代币信息
    const [symbol, decimals] = await Promise.all([
      contract.methods.symbol().call(),
      contract.methods.decimals().call()
    ]);

    const tokenInfo = {
      address: tokenAddress,
      symbol,
      decimals: Number(decimals)
    };

    // 构造过滤条件
    const filterOptions = {};
    if (options.watchAddresses) {
      filterOptions.filter = {
        to: options.watchAddresses // 监控转入这些地址的转账
      };
    }
    if (options.minAmount) {
      tokenInfo.minAmount = options.minAmount;
    }

    // 创建订阅
    const subscription = contract.events.Transfer(filterOptions); // {2}

    subscription.on('data', (event) => {
      this._handleTransferEvent(event, tokenInfo);
    });

    subscription.on('error', (error) => {
      console.error(`[${symbol}] 订阅错误:`, error.message);
    });

    this.monitors.set(tokenAddress, { subscription, tokenInfo });
    console.log(`开始监控 ${symbol} (${tokenAddress})`);
  }

  /**
   * 处理转账事件
   */
  _handleTransferEvent(event, tokenInfo) { // {3}
    const { from, to, value } = event.returnValues;
    const amount = Number(value) / Math.pow(10, tokenInfo.decimals);

    // 如果设置了最小金额过滤，忽略小额转账
    if (tokenInfo.minAmount && amount < tokenInfo.minAmount) {
      return;
    }

    const transferRecord = {
      token: tokenInfo.symbol,
      from: from,
      to: to,
      amount: amount,
      txHash: event.transactionHash,
      blockNumber: Number(event.blockNumber),
      timestamp: Date.now()
    };

    // 存入历史记录
    this.transferHistory.unshift(transferRecord);
    if (this.transferHistory.length > this.maxHistoryLength) {
      this.transferHistory.pop();
    }

    // 格式化输出
    const shortFrom = `${from.slice(0, 6)}...${from.slice(-4)}`;
    const shortTo = `${to.slice(0, 6)}...${to.slice(-4)}`;
    console.log(
      `[${tokenInfo.symbol}] ${shortFrom} → ${shortTo}: ` +
      `${amount.toLocaleString()} ${tokenInfo.symbol} ` +
      `(区块 ${event.blockNumber})`
    );
  }

  /**
   * 移除代币监控
   */
  async removeToken(tokenAddress) {
    const monitor = this.monitors.get(tokenAddress);
    if (monitor) {
      await monitor.subscription.unsubscribe();
      this.monitors.delete(tokenAddress);
      console.log(`已停止监控 ${monitor.tokenInfo.symbol}`);
    }
  }

  /**
   * 获取转账历史
   */
  getHistory(tokenSymbol = null) {
    if (tokenSymbol) {
      return this.transferHistory.filter(r => r.token === tokenSymbol);
    }
    return this.transferHistory;
  }

  /**
   * 停止所有监控并清理资源
   */
  async shutdown() {
    for (const [address] of this.monitors) {
      await this.removeToken(address);
    }
    await this.web3.eth.clearSubscriptions();
    console.log('所有监控已停止');
  }
}

// 使用示例
async function main() {
  const monitor = new TransferMonitor(
    'wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID'
  );

  // 监控 USDT，只关注大额转账（> 10,000 USDT）
  await monitor.addToken(
    '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    { minAmount: 10000 }
  );

  // 监控 USDC
  await monitor.addToken(
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    { minAmount: 10000 }
  );

  // 30 秒后查看历史记录
  setTimeout(() => {
    const history = monitor.getHistory();
    console.log(`\n=== 转账历史 (共 ${history.length} 条) ===`);
    history.forEach(r => {
      console.log(`${r.token}: ${r.amount.toLocaleString()} (${r.txHash})`);
    });
  }, 30000);

  // 优雅退出
  process.on('SIGINT', async () => {
    await monitor.shutdown();
    process.exit(0);
  });
}

main().catch(console.error);
```

:::

::: tip
在实际项目中，你可以将 `TransferMonitor` 封装为一个独立的服务模块，结合前端框架（如 React 的 Context 或 Vue 的 Pinia）将实时数据流注入到 UI 组件中，实现完整的链上数据可视化面板。
:::
