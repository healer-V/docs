---
title: "连接区块链与读取数据"
category: "Web3 · Web3.js"
tags:
  - Web3.js
  - Provider
  - 查询
excerpt: "通过 Web3.js 连接以太坊节点后，你可以查询区块信息、账户余额和智能合约状态等链上数据。"
date: 2026-03-15
---

# 连接区块链与读取数据

## 一、连接 MetaMask 钱包

MetaMask 是最常用的以太坊浏览器钱包，连接流程遵循 EIP-1102 规范。你需要主动调用 `eth_requestAccounts` 请求用户授权，获取其账户地址后方可进行后续操作。

### 1. 完整连接流程

::: details MetaMask 连接与状态管理

```js
// src/wallet/connectWallet.js
import { Web3 } from 'web3';

let web3Instance = null;
let currentAccount = null;

/**
 * 连接 MetaMask 钱包
 * @returns {Promise<{web3: Web3, account: string, chainId: bigint}>}
 */
async function connectWallet() {
  // 第一步：检测 MetaMask 是否存在
  if (typeof window.ethereum === 'undefined') { // {1}
    alert('未检测到 MetaMask，请先安装钱包扩展');
    window.open('https://metamask.io/download/', '_blank');
    return null;
  }

  try {
    // 第二步：请求用户授权
    const accounts = await window.ethereum.request({ // {2}
      method: 'eth_requestAccounts'
    });

    // 第三步：创建 Web3 实例
    web3Instance = new Web3(window.ethereum); // {3}
    currentAccount = accounts[0];

    // 第四步：获取网络信息
    const chainId = await web3Instance.eth.getChainId();

    console.log('连接成功');
    console.log('账户地址:', currentAccount);
    console.log('链 ID:', chainId);

    return { web3: web3Instance, account: currentAccount, chainId };
  } catch (error) {
    if (error.code === 4001) {
      console.warn('用户拒绝了连接请求');
    } else {
      console.error('连接失败:', error.message);
    }
    return null;
  }
}

export { connectWallet, web3Instance, currentAccount };
```

:::

### 2. 监听钱包状态变化

用户可能在 DApp 使用过程中切换账户或网络，你必须监听这些事件并及时响应：

::: details 监听账户与网络切换

```js
// src/wallet/walletEvents.js

/**
 * 注册钱包事件监听
 * @param {Function} onAccountChange - 账户切换回调
 * @param {Function} onChainChange - 网络切换回调
 */
function setupWalletListeners(onAccountChange, onChainChange) {
  if (typeof window.ethereum === 'undefined') return;

  // 监听账户切换
  window.ethereum.on('accountsChanged', (accounts) => { // {1}
    if (accounts.length === 0) {
      console.log('用户断开了钱包连接');
      onAccountChange(null);
    } else {
      console.log('账户已切换至:', accounts[0]);
      onAccountChange(accounts[0]);
    }
  });

  // 监听网络切换
  window.ethereum.on('chainChanged', (chainIdHex) => { // {2}
    const chainId = parseInt(chainIdHex, 16);
    console.log('网络已切换至链 ID:', chainId);
    onChainChange(chainId);
  });

  // 监听断开连接
  window.ethereum.on('disconnect', (error) => {
    console.error('钱包连接已断开:', error.message);
  });
}

/**
 * 移除所有事件监听（组件卸载时调用）
 */
function removeWalletListeners() {
  if (typeof window.ethereum === 'undefined') return;
  window.ethereum.removeAllListeners('accountsChanged');
  window.ethereum.removeAllListeners('chainChanged');
  window.ethereum.removeAllListeners('disconnect');
}

export { setupWalletListeners, removeWalletListeners };
```

:::

::: warning
每次网络切换后，之前缓存的合约实例、余额等数据都可能失效。建议在 `chainChanged` 回调中重新初始化 Web3 实例或直接刷新页面。
:::

## 二、读取区块信息

以太坊的区块包含了丰富的链上数据，通过 Web3.js 可以方便地查询这些信息。

### 1. 获取区块号与区块详情

::: details 查询区块信息

```js
// src/examples/readBlocks.js
import { Web3 } from 'web3';

const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

async function readBlockInfo() {
  // 获取最新区块号
  const latestBlockNumber = await web3.eth.getBlockNumber();
  console.log('最新区块号:', latestBlockNumber);

  // 获取完整区块信息（不含完整交易数据）
  const block = await web3.eth.getBlock(latestBlockNumber);
  console.log('区块哈希:', block.hash);
  console.log('父区块哈希:', block.parentHash);
  console.log('出块时间:', new Date(Number(block.timestamp) * 1000));
  console.log('交易数量:', block.transactions.length);
  console.log('Gas 上限:', block.gasLimit.toString());
  console.log('Gas 使用:', block.gasUsed.toString());
  console.log('基础费用:', web3.utils.fromWei(block.baseFeePerGas, 'gwei'), 'Gwei');

  // 获取包含完整交易对象的区块
  const blockWithTx = await web3.eth.getBlock(latestBlockNumber, true); // {1}
  if (blockWithTx.transactions.length > 0) {
    const firstTx = blockWithTx.transactions[0];
    console.log('第一笔交易:', {
      hash: firstTx.hash,
      from: firstTx.from,
      to: firstTx.to,
      value: web3.utils.fromWei(firstTx.value, 'ether') + ' ETH'
    });
  }
}

readBlockInfo();
```

:::

### 2. 区块对象字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `number` | `bigint` | 区块高度 |
| `hash` | `string` | 区块哈希 |
| `parentHash` | `string` | 父区块哈希 |
| `timestamp` | `bigint` | 出块时间戳（秒） |
| `transactions` | `string[] \| object[]` | 交易哈希数组或交易对象数组 |
| `gasLimit` | `bigint` | 该区块的 Gas 上限 |
| `gasUsed` | `bigint` | 该区块实际使用的 Gas |
| `baseFeePerGas` | `bigint` | EIP-1559 基础费用（Wei） |
| `miner` | `string` | 出块验证者地址 |

::: tip
`getBlock` 的第二个参数为 `true` 时，`transactions` 字段返回完整的交易对象数组；为 `false`（默认）时只返回交易哈希字符串数组。在只需要交易数量的场景下，使用默认值可以减少数据传输量。
:::

## 三、查询账户余额

### 1. 获取 ETH 余额

`getBalance` 返回的值单位是 Wei（以太坊最小单位），你通常需要用 `fromWei` 转换为 Ether 以便展示：

::: details 查询并转换 ETH 余额

```js
// src/examples/getBalance.js
import { Web3 } from 'web3';

const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

async function getAccountBalance(address) {
  // 校验地址格式
  if (!web3.utils.isAddress(address)) { // {1}
    throw new Error(`无效的以太坊地址: ${address}`);
  }

  // 获取余额（返回 Wei 为单位的 BigInt）
  const balanceWei = await web3.eth.getBalance(address); // {2}
  console.log('余额（Wei）:', balanceWei.toString());

  // 转换为 Ether
  const balanceEther = web3.utils.fromWei(balanceWei, 'ether'); // {3}
  console.log('余额（ETH）:', balanceEther);

  return balanceEther;
}

// 查询 Vitalik 的地址余额
getAccountBalance('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
```

:::

### 2. 单位转换参考

以太坊有多种面额单位，`fromWei` 和 `toWei` 支持以下单位名称：

| 单位名称 | Wei 值 | 常用场景 |
|----------|--------|----------|
| `wei` | 1 | 最小单位 |
| `kwei` | 10³ | 极少使用 |
| `mwei` | 10⁶ | 极少使用 |
| `gwei` | 10⁹ | Gas 价格 |
| `microether` | 10¹² | 极少使用 |
| `milliether` | 10¹⁵ | 极少使用 |
| `ether` | 10¹⁸ | ETH 余额、转账金额 |

::: details 单位转换示例

```js
// src/examples/unitConversion.js
import { Web3 } from 'web3';

const web3 = new Web3();

// Ether → Wei
const weiValue = web3.utils.toWei('1.5', 'ether');
console.log('1.5 ETH =', weiValue, 'Wei');
// 输出: 1500000000000000000

// Wei → Ether
const etherValue = web3.utils.fromWei('1500000000000000000', 'ether');
console.log('1500000000000000000 Wei =', etherValue, 'ETH');
// 输出: 1.5

// Gwei → Wei（Gas 计算常用）
const gasPriceWei = web3.utils.toWei('30', 'gwei');
console.log('30 Gwei =', gasPriceWei, 'Wei');
// 输出: 30000000000

// Wei → Gwei
const gasPriceGwei = web3.utils.fromWei('30000000000', 'gwei');
console.log('30000000000 Wei =', gasPriceGwei, 'Gwei');
// 输出: 30
```

:::

## 四、读取智能合约状态

调用合约的 `view` 和 `pure` 函数不需要消耗 Gas，也不需要签名，是读取链上数据的主要方式。

### 1. 创建合约实例

要与智能合约交互，你需要两样东西：合约 ABI（Application Binary Interface）和合约地址。

::: details 创建 ERC-20 合约实例

```js
// src/contracts/erc20.js
import { Web3 } from 'web3';

const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

// ERC-20 标准 ABI（常用方法）
const ERC20_ABI = [
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
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
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  }
];

// USDC 合约地址（以太坊主网）
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // {1}

// 创建合约实例
const usdcContract = new web3.eth.Contract(ERC20_ABI, USDC_ADDRESS); // {2}

export { usdcContract, web3 };
```

:::

### 2. 调用 view 函数

::: details 读取 ERC-20 代币信息

```js
// src/examples/readContract.js
import { Web3 } from 'web3';

const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

const ERC20_ABI = [
  // ... 省略 ABI 定义，使用上面的完整 ABI
];

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const usdcContract = new web3.eth.Contract(ERC20_ABI, USDC_ADDRESS);

async function readTokenInfo() {
  // 读取代币基础信息
  const name = await usdcContract.methods.name().call(); // {1}
  const symbol = await usdcContract.methods.symbol().call();
  const decimals = await usdcContract.methods.decimals().call();
  const totalSupply = await usdcContract.methods.totalSupply().call();

  console.log('代币名称:', name);        // USD Coin
  console.log('代币符号:', symbol);      // USDC
  console.log('小数位数:', decimals);     // 6
  console.log('总供应量:', totalSupply);

  // 格式化总供应量显示
  const formattedSupply = Number(totalSupply) / Math.pow(10, Number(decimals));
  console.log('总供应量（格式化）:', formattedSupply.toLocaleString(), symbol);

  // 查询某地址的代币余额
  const walletAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
  const tokenBalance = await usdcContract.methods
    .balanceOf(walletAddress) // {2}
    .call();

  const formattedBalance = Number(tokenBalance) / Math.pow(10, Number(decimals));
  console.log(`${walletAddress} 持有: ${formattedBalance} ${symbol}`);
}

readTokenInfo();
```

:::

::: warning
调用 `.call()` 是在本地节点模拟执行，不会上链，也不消耗 Gas。但如果你调用一个非 `view` 函数时使用 `.call()`，虽然不会报错，但返回的结果仅为模拟值，实际链上状态不会改变。
:::

## 五、批量请求

当你需要同时查询多个数据时，逐个请求效率很低。Web3.js v4 支持使用 `BatchRequest` 批量发送多个 RPC 请求，减少网络开销：

::: details 批量查询示例

```js
// src/examples/batchRequest.js
import { Web3 } from 'web3';

const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

async function batchQuery() {
  const batch = new web3.BatchRequest(); // {1}

  // 添加多个查询到批次中
  const blockNumberPromise = batch.add(
    web3.eth.getBlockNumber.request()
  );
  const gasPricePromise = batch.add(
    web3.eth.getGasPrice.request()
  );
  const balancePromise = batch.add(
    web3.eth.getBalance.request('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
  );

  // 一次性发送所有请求
  await batch.execute(); // {2}

  // 获取结果
  const blockNumber = await blockNumberPromise;
  const gasPrice = await gasPricePromise;
  const balance = await balancePromise;

  console.log('区块号:', blockNumber);
  console.log('Gas 价格:', web3.utils.fromWei(gasPrice, 'gwei'), 'Gwei');
  console.log('余额:', web3.utils.fromWei(balance, 'ether'), 'ETH');
}

batchQuery();
```

:::

::: tip
批量请求在查询多个代币余额、多个账户状态等场景下尤其有用。所有请求会被合并为一个 HTTP 请求发送到节点，响应速度通常比逐个请求快 3-5 倍。
:::

## 六、常用工具函数

`web3.utils` 提供了一系列在 DApp 开发中高频使用的工具方法：

### 1. 地址与哈希

::: details 地址校验与哈希计算

```js
// src/examples/utilsFunctions.js
import { Web3 } from 'web3';

const web3 = new Web3();

// 地址校验
const validAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const invalidAddress = '0x123';

console.log('有效地址:', web3.utils.isAddress(validAddress));   // true
console.log('无效地址:', web3.utils.isAddress(invalidAddress)); // false

// 地址校验和（EIP-55 大小写混合格式）
const checksumAddress = web3.utils.toChecksumAddress(
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
);
console.log('校验和地址:', checksumAddress);
// 输出: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

// Keccak-256 哈希
const messageHash = web3.utils.sha3('Hello Ethereum');
console.log('消息哈希:', messageHash);

// 对 ABI 编码后的数据做哈希（用于事件签名等）
const eventSignature = web3.utils.sha3('Transfer(address,address,uint256)');
console.log('Transfer 事件签名:', eventSignature);
```

:::

### 2. 进制转换

::: details 十六进制与数字互转

```js
// src/examples/hexConversion.js
import { Web3 } from 'web3';

const web3 = new Web3();

// 数字 → 十六进制
const hexValue = web3.utils.toHex(255);
console.log('255 →', hexValue); // '0xff'

// 十六进制 → 数字
const numberValue = web3.utils.hexToNumber('0xff');
console.log('0xff →', numberValue); // 255

// 十六进制 → 字符串
const textValue = web3.utils.hexToUtf8('0x48656c6c6f');
console.log('Hex → UTF8:', textValue); // 'Hello'

// 字符串 → 十六进制
const hexText = web3.utils.utf8ToHex('Hello');
console.log('UTF8 → Hex:', hexText); // '0x48656c6c6f'

// 十六进制 → BigInt
const bigIntValue = web3.utils.hexToNumberString('0xde0b6b3a7640000');
console.log('Hex → NumberString:', bigIntValue); // '1000000000000000000'
```

:::
