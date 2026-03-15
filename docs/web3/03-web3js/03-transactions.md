---
title: "发送交易与合约调用"
category: "Web3 · Web3.js"
tags:
  - Web3.js
  - 交易
  - 合约调用
excerpt: "发送交易是改变区块链状态的唯一方式，掌握 ETH 转账和合约写入方法的调用是 DApp 开发的核心能力。"
date: 2026-03-15
---

# 发送交易与合约调用

## 一、交易基础概念

在以太坊中，任何对链上状态的修改（转账、合约调用、合约部署）都必须通过交易来完成。每笔交易需要消耗 Gas 作为手续费，并由发送方的私钥签名。

### 1. 交易对象字段

发送交易时，你需要构造一个交易对象。以下是常用字段说明：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `from` | `string` | 是 | 发送方地址 |
| `to` | `string` | 是（合约部署除外） | 接收方地址或合约地址 |
| `value` | `string \| bigint` | 否 | 发送的 ETH 数量（Wei） |
| `gas` | `string \| number` | 否 | Gas 上限，未指定时自动估算 |
| `gasPrice` | `string \| bigint` | 否 | Gas 价格（Legacy 交易） |
| `maxFeePerGas` | `string \| bigint` | 否 | 最大 Gas 费用（EIP-1559） |
| `maxPriorityFeePerGas` | `string \| bigint` | 否 | 最大矿工小费（EIP-1559） |
| `data` | `string` | 否 | 附加数据，合约调用时为编码后的方法和参数 |
| `nonce` | `number` | 否 | 交易序号，未指定时自动获取 |

### 2. Legacy 与 EIP-1559 交易对比

| 特性 | Legacy 交易 | EIP-1559 交易 |
|------|------------|---------------|
| Gas 费用字段 | `gasPrice` | `maxFeePerGas` + `maxPriorityFeePerGas` |
| 费用可预测性 | 低，需手动估算 | 高，协议自动调整 baseFee |
| 多余 Gas 费 | 全额支付给矿工 | 超出部分退还给发送方 |
| 支持网络 | 所有 EVM 链 | 以太坊主网、大部分 L2 |
| 推荐程度 | 仅用于不支持 1559 的链 | 推荐在支持的链上使用 |

## 二、发送 ETH 转账

### 1. 通过 MetaMask 发送转账

在浏览器 DApp 中，交易签名由 MetaMask 完成，用户确认后交易自动广播：

::: details MetaMask 转账示例

```js
// src/transactions/sendEther.js
import { Web3 } from 'web3';

const web3 = new Web3(window.ethereum);

/**
 * 发送 ETH 转账
 * @param {string} toAddress - 接收方地址
 * @param {string} amountInEther - 转账金额（单位：ETH）
 * @returns {Promise<object>} 交易回执
 */
async function sendEther(toAddress, amountInEther) {
  // 1. 获取当前连接账户
  const accounts = await web3.eth.getAccounts();
  const fromAddress = accounts[0];

  if (!fromAddress) {
    throw new Error('请先连接 MetaMask 钱包');
  }

  // 2. 校验接收方地址
  if (!web3.utils.isAddress(toAddress)) {
    throw new Error('无效的接收方地址');
  }

  // 3. 构造交易对象
  const transactionObject = { // {1}
    from: fromAddress,
    to: toAddress,
    value: web3.utils.toWei(amountInEther, 'ether'), // 转换为 Wei
  };

  // 4. 估算 Gas
  const estimatedGas = await web3.eth.estimateGas(transactionObject); // {2}
  console.log('预估 Gas:', estimatedGas.toString());

  transactionObject.gas = estimatedGas;

  // 5. 发送交易（MetaMask 会弹出确认窗口）
  const receipt = await web3.eth.sendTransaction(transactionObject); // {3}

  console.log('交易成功！');
  console.log('交易哈希:', receipt.transactionHash);
  console.log('区块号:', receipt.blockNumber);
  console.log('实际 Gas 消耗:', receipt.gasUsed.toString());

  return receipt;
}

// 调用示例：向目标地址发送 0.01 ETH
sendEther('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18', '0.01')
  .then(receipt => console.log('交易回执:', receipt))
  .catch(error => console.error('交易失败:', error.message));
```

:::

::: warning
在调用 `sendTransaction` 之前，务必先使用 `estimateGas` 预估 Gas 消耗。如果不设置 Gas 上限，MetaMask 会自动估算并添加缓冲，但在合约调用场景下可能不够准确。
:::

### 2. 交易确认追踪

发送交易后，你可以通过事件监听交易的确认过程：

::: details 追踪交易确认状态

```js
// src/transactions/trackTransaction.js
import { Web3 } from 'web3';

const web3 = new Web3(window.ethereum);

async function sendAndTrackTransaction(toAddress, amountInEther) {
  const accounts = await web3.eth.getAccounts();

  const promiEvent = web3.eth.sendTransaction({
    from: accounts[0],
    to: toAddress,
    value: web3.utils.toWei(amountInEther, 'ether')
  });

  // 监听交易哈希（交易已发送到网络）
  promiEvent.on('transactionHash', (hash) => { // {1}
    console.log('交易已发送，哈希:', hash);
    console.log('可在 Etherscan 查看: https://etherscan.io/tx/' + hash);
  });

  // 监听交易回执（交易已被打包进区块）
  promiEvent.on('receipt', (receipt) => { // {2}
    console.log('交易已确认！');
    console.log('所在区块:', receipt.blockNumber);
    console.log('Gas 消耗:', receipt.gasUsed.toString());
    console.log('交易状态:', receipt.status ? '成功' : '失败');
  });

  // 监听确认次数
  promiEvent.on('confirmation', ({ confirmations, receipt }) => { // {3}
    console.log(`已获得 ${confirmations} 次确认`);
    if (confirmations >= 12n) {
      console.log('交易已经足够安全（12 次确认）');
    }
  });

  // 监听错误
  promiEvent.on('error', (error) => {
    console.error('交易出错:', error.message);
  });

  // 等待最终结果
  const receipt = await promiEvent;
  return receipt;
}
```

:::

::: tip
通常 1 次确认即表示交易已被打包，但对于大额转账，建议等待 12 次以上确认再视为最终确定，以防止因区块重组导致交易回滚。
:::

## 三、调用合约写入方法

与 `.call()` 不同，合约的写入方法会修改链上状态，必须通过 `.send()` 发送交易：

### 1. ERC-20 代币转账

::: details 调用合约 transfer 方法

```js
// src/transactions/tokenTransfer.js
import { Web3 } from 'web3';

const web3 = new Web3(window.ethereum);

// ERC-20 合约 ABI（转账相关）
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: 'success', type: 'bool' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: 'success', type: 'bool' }]
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

async function transferToken(toAddress, amount) {
  const accounts = await web3.eth.getAccounts();
  const senderAddress = accounts[0];

  const tokenContract = new web3.eth.Contract(ERC20_ABI, USDT_ADDRESS);

  // 获取代币精度
  const decimals = await tokenContract.methods.decimals().call();

  // 计算实际转账数量（考虑精度）
  const tokenAmount = BigInt(amount) * (10n ** BigInt(decimals)); // {1}

  // 先估算 Gas
  const gasEstimate = await tokenContract.methods
    .transfer(toAddress, tokenAmount)
    .estimateGas({ from: senderAddress }); // {2}

  console.log('预估 Gas:', gasEstimate.toString());

  // 发送交易
  const receipt = await tokenContract.methods
    .transfer(toAddress, tokenAmount) // {3}
    .send({
      from: senderAddress,
      gas: gasEstimate
    });

  console.log('代币转账成功！');
  console.log('交易哈希:', receipt.transactionHash);

  return receipt;
}

// 向目标地址转账 100 USDT
transferToken('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18', '100');
```

:::

### 2. 合约授权（Approve）

在 DeFi 场景中，你经常需要先授权某个合约使用你的代币，然后才能进行兑换或质押：

::: details 代币授权流程

```js
// src/transactions/tokenApprove.js
import { Web3 } from 'web3';

const web3 = new Web3(window.ethereum);

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: 'success', type: 'bool' }]
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

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const UNISWAP_ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

async function approveToken(tokenAddress, spenderAddress, amount) {
  const accounts = await web3.eth.getAccounts();
  const ownerAddress = accounts[0];

  const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);

  // 检查当前授权额度
  const currentAllowance = await tokenContract.methods
    .allowance(ownerAddress, spenderAddress)
    .call();
  console.log('当前授权额度:', currentAllowance.toString());

  // 如果授权额度已足够，跳过授权
  if (BigInt(currentAllowance) >= BigInt(amount)) { // {1}
    console.log('授权额度充足，无需重复授权');
    return null;
  }

  // 发送授权交易
  const receipt = await tokenContract.methods
    .approve(spenderAddress, amount) // {2}
    .send({ from: ownerAddress });

  console.log('授权成功！');
  console.log('交易哈希:', receipt.transactionHash);

  return receipt;
}

// 授权 Uniswap Router 使用最大额度的 USDC
const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
approveToken(USDC_ADDRESS, UNISWAP_ROUTER, MAX_UINT256);
```

:::

::: danger
授权 `MAX_UINT256`（无限授权）虽然方便，但存在安全风险——如果被授权的合约存在漏洞或遭到攻击，你的所有代币都可能被盗。建议只授权实际需要的金额，或在使用后及时将授权额度清零。
:::

## 四、Gas 估算

准确估算 Gas 是确保交易成功且不浪费手续费的关键。

### 1. 基本 Gas 估算

::: details 多种场景的 Gas 估算

```js
// src/transactions/gasEstimation.js
import { Web3 } from 'web3';

const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

async function estimateGasExamples() {
  const senderAddress = '0xYourAddress';

  // 场景一：普通 ETH 转账
  const ethTransferGas = await web3.eth.estimateGas({ // {1}
    from: senderAddress,
    to: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
    value: web3.utils.toWei('0.1', 'ether')
  });
  console.log('ETH 转账 Gas:', ethTransferGas.toString()); // 通常为 21000

  // 场景二：获取当前 Gas 价格
  const gasPrice = await web3.eth.getGasPrice(); // {2}
  console.log('当前 Gas 价格:', web3.utils.fromWei(gasPrice, 'gwei'), 'Gwei');

  // 场景三：计算交易手续费
  const txFeeWei = ethTransferGas * gasPrice;
  const txFeeEther = web3.utils.fromWei(txFeeWei.toString(), 'ether');
  console.log('预估手续费:', txFeeEther, 'ETH'); // {3}

  // 场景四：获取 EIP-1559 费用建议（v4 新增）
  const feeHistory = await web3.eth.getFeeHistory(
    5,       // 查看最近 5 个区块
    'latest',
    [25, 50, 75] // 第 25、50、75 百分位的优先费
  );
  console.log('最近区块基础费用:', feeHistory.baseFeePerGas);
  console.log('优先费分布:', feeHistory.reward);
}

estimateGasExamples();
```

:::

### 2. 安全的 Gas 设置策略

::: tip
在生产环境中，建议在 `estimateGas` 的结果上增加 20%-30% 的缓冲，防止因链上状态变化导致 Gas 不足而交易失败：

```js
const estimatedGas = await web3.eth.estimateGas(txObject);
const safeGasLimit = estimatedGas * 130n / 100n; // 增加 30% 缓冲
txObject.gas = safeGasLimit;
```

:::

## 五、服务端签名交易

在服务端（如 Node.js 后端），没有 MetaMask 帮你签名，你需要使用私钥手动签名交易：

::: details 服务端签名并发送交易

```js
// src/server/sendSignedTransaction.js
import { Web3 } from 'web3';

const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

/**
 * 使用私钥签名并发送交易
 * @param {string} privateKey - 发送方私钥（不含 0x 前缀也可以）
 * @param {string} toAddress - 接收方地址
 * @param {string} amountInEther - 转账金额
 */
async function sendSignedTransaction(privateKey, toAddress, amountInEther) {
  // 1. 从私钥获取账户对象
  const account = web3.eth.accounts.privateKeyToAccount(privateKey); // {1}
  console.log('发送方地址:', account.address);

  // 2. 获取 nonce（交易序号）
  const nonce = await web3.eth.getTransactionCount(account.address);

  // 3. 构造交易对象
  const txObject = {
    from: account.address,
    to: toAddress,
    value: web3.utils.toWei(amountInEther, 'ether'),
    gas: 21000n,
    nonce: nonce,
    // EIP-1559 费用参数
    maxFeePerGas: web3.utils.toWei('30', 'gwei'),
    maxPriorityFeePerGas: web3.utils.toWei('2', 'gwei'),
    chainId: 1 // 以太坊主网
  };

  // 4. 签名交易
  const signedTx = await account.signTransaction(txObject); // {2}
  console.log('签名后的交易数据:', signedTx.rawTransaction);

  // 5. 广播已签名的交易
  const receipt = await web3.eth.sendSignedTransaction( // {3}
    signedTx.rawTransaction
  );

  console.log('交易成功！');
  console.log('交易哈希:', receipt.transactionHash);
  console.log('区块号:', receipt.blockNumber);

  return receipt;
}
```

:::

::: danger
私钥是控制账户资产的最高权限凭证。在服务端代码中，绝对不要将私钥硬编码在源文件里。应该使用环境变量、密钥管理服务（如 AWS KMS、HashiCorp Vault）或硬件安全模块（HSM）来安全存储私钥。
:::

## 六、交易回执与状态判断

交易被打包后，你可以通过交易回执（Receipt）判断交易是否成功：

### 1. 交易回执字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `transactionHash` | `string` | 交易哈希 |
| `blockNumber` | `bigint` | 所在区块号 |
| `blockHash` | `string` | 所在区块哈希 |
| `from` | `string` | 发送方地址 |
| `to` | `string` | 接收方地址 |
| `gasUsed` | `bigint` | 实际消耗的 Gas |
| `effectiveGasPrice` | `bigint` | 实际支付的 Gas 价格 |
| `status` | `bigint` | `1n` 表示成功，`0n` 表示失败 |
| `logs` | `object[]` | 交易中触发的事件日志 |

### 2. 根据交易哈希查询回执

::: details 查询交易回执

```js
// src/transactions/getReceipt.js
import { Web3 } from 'web3';

const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

async function checkTransactionStatus(txHash) {
  // 获取交易回执
  const receipt = await web3.eth.getTransactionReceipt(txHash); // {1}

  if (!receipt) {
    console.log('交易尚未被打包，可能仍在 Pending 中');
    return null;
  }

  // 判断交易状态
  if (receipt.status === 1n) { // {2}
    console.log('交易执行成功');
    console.log('Gas 消耗:', receipt.gasUsed.toString());

    // 计算实际手续费
    const txFee = receipt.gasUsed * receipt.effectiveGasPrice;
    console.log('手续费:', web3.utils.fromWei(txFee.toString(), 'ether'), 'ETH');
  } else {
    console.log('交易执行失败（Reverted）');
  }

  // 查看事件日志
  if (receipt.logs.length > 0) {
    console.log('事件日志数量:', receipt.logs.length);
    receipt.logs.forEach((log, index) => {
      console.log(`日志 ${index}:`, {
        address: log.address,
        topics: log.topics,
        data: log.data
      });
    });
  }

  return receipt;
}

checkTransactionStatus('0xYourTransactionHash');
```

:::

## 七、错误处理

交易可能因各种原因失败，完善的错误处理是构建可靠 DApp 的必备能力：

::: details 交易错误处理

```js
// src/transactions/errorHandling.js
import { Web3 } from 'web3';

const web3 = new Web3(window.ethereum);

async function safeSendTransaction(txObject) {
  try {
    // 先预执行，检查是否会 revert
    await web3.eth.call(txObject); // {1}

    // 预执行通过，发送真实交易
    const receipt = await web3.eth.sendTransaction(txObject);
    return { success: true, receipt };
  } catch (error) {
    // 分类处理不同类型的错误
    if (error.code === 4001) { // {2}
      // 用户在 MetaMask 中点击了"拒绝"
      return { success: false, reason: '用户取消了交易' };
    }

    if (error.message.includes('insufficient funds')) { // {3}
      return { success: false, reason: 'ETH 余额不足以支付 Gas 费用' };
    }

    if (error.message.includes('nonce too low')) {
      return { success: false, reason: '交易 Nonce 冲突，请稍后重试' };
    }

    if (error.message.includes('execution reverted')) { // {4}
      // 尝试解析 revert 原因
      const revertReason = error.data?.message || error.message;
      return { success: false, reason: `合约执行失败: ${revertReason}` };
    }

    // 未知错误
    console.error('未知交易错误:', error);
    return { success: false, reason: '交易发送失败，请稍后重试' };
  }
}
```

:::

::: tip
在发送写入交易之前，先用 `web3.eth.call()` 模拟执行是一个很好的实践。如果合约逻辑会 revert，`call` 会立即抛出错误并附带 revert reason，这样可以在用户确认交易之前就发现问题，避免浪费 Gas。
:::
