---
title: "Provider 与 Signer"
category: "Web3 · Ethereum"
tags:
  - Ethers.js
  - Provider
  - Signer
excerpt: "Provider 负责只读的区块链数据查询，Signer 则代表一个账户身份用于签名和发送交易，二者的分离是 Ethers.js 的核心设计。"
date: 2026-03-15
---

# Provider 与 Signer

## 一、核心概念：读写分离

Ethers.js 最重要的设计决策之一，就是将区块链交互拆分为**只读（Provider）**和**读写（Signer）**两个角色：

- **Provider**：匿名连接，不持有私钥，只能查询链上数据（区块、交易、余额、合约状态等）
- **Signer**：代表一个具体的账户身份，持有私钥或连接到钱包，可以签名消息和发送交易

这种分离带来了清晰的权限边界：查询操作无需用户授权，写入操作必须经过签名确认。

::: tip Provider 与 Signer 的关系
每个 Signer 内部都关联一个 Provider。当你调用合约的只读方法时，Signer 会委托给内部的 Provider 执行查询；当你调用写入方法时，Signer 负责签名并通过 Provider 广播交易。
:::

## 二、Provider 类型详解

Ethers.js v6 提供了多种 Provider 实现，适用于不同的使用场景：

| Provider 类型 | 适用场景 | 说明 |
|--------------|---------|------|
| `JsonRpcProvider` | 后端/脚本 | 连接任意 JSON-RPC 节点，最通用的选择 |
| `BrowserProvider` | 前端 DApp | 封装浏览器钱包（MetaMask 等）注入的 `window.ethereum` |
| `InfuraProvider` | 快速接入 | 内置 Infura API 集成，传入 API Key 即可使用 |
| `AlchemyProvider` | 快速接入 | 内置 Alchemy API 集成，传入 API Key 即可使用 |
| `EtherscanProvider` | 数据查询 | 通过 Etherscan API 查询，适合不频繁的数据读取 |
| `FallbackProvider` | 高可用 | 组合多个 Provider，自动故障切换 |

### 1. JsonRpcProvider

最常用的 Provider，适合服务端脚本和开发调试。

::: details 创建 JsonRpcProvider 并连接不同网络
```typescript{4,7,10,13}
// src/web3/providers.ts
import { JsonRpcProvider } from "ethers";

// 连接以太坊主网（公共 RPC）
const mainnetProvider = new JsonRpcProvider("https://rpc.ankr.com/eth");

// 连接 Sepolia 测试网
const sepoliaProvider = new JsonRpcProvider("https://rpc.ankr.com/eth_sepolia");

// 连接 Polygon 主网
const polygonProvider = new JsonRpcProvider("https://rpc.ankr.com/polygon");

// 连接本地 Hardhat 节点（默认端口 8545）
const localProvider = new JsonRpcProvider("http://127.0.0.1:8545");

// 验证连接
const network = await mainnetProvider.getNetwork();
console.log("已连接网络:", network.name, "Chain ID:", network.chainId.toString());
```
:::

### 2. BrowserProvider（MetaMask 集成）

在前端 DApp 中，你需要使用 `BrowserProvider` 来连接用户的钱包。

::: details 连接 MetaMask 并处理网络切换
```typescript{6,9,16-17,25-34}
// src/web3/browser-provider.ts
import { BrowserProvider } from "ethers";

// 检测钱包环境
function getEthereumProvider(): any {
  if (typeof window !== "undefined" && window.ethereum) {
    return window.ethereum;
  }
  throw new Error("未检测到以太坊钱包，请安装 MetaMask");
}

// 创建 BrowserProvider 并请求连接
async function connectWallet() {
  const ethereum = getEthereumProvider();
  const provider = new BrowserProvider(ethereum);

  // 请求用户授权（会弹出 MetaMask 弹窗）
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { provider, signer, address };
}

// 监听网络切换事件
function setupNetworkListener() {
  const ethereum = getEthereumProvider();

  ethereum.on("chainChanged", (chainId: string) => {
    console.log("网络已切换，Chain ID:", parseInt(chainId, 16));
    // 网络切换后建议刷新页面以重置状态
    window.location.reload();
  });

  ethereum.on("accountsChanged", (accounts: string[]) => {
    if (accounts.length === 0) {
      console.log("用户断开了钱包连接");
    } else {
      console.log("账户已切换:", accounts[0]);
    }
  });
}
```
:::

::: warning MetaMask 弹窗问题
`provider.getSigner()` 会触发 MetaMask 授权弹窗。如果你在页面加载时自动调用，可能造成不好的用户体验。推荐在用户点击"连接钱包"按钮后再调用。
:::

### 3. InfuraProvider / AlchemyProvider

如果你使用 Infura 或 Alchemy 的服务，Ethers.js 内置了对应的 Provider 类，省去手动拼接 URL 的麻烦。

::: details 使用 Infura 和 Alchemy Provider
```typescript{4-5,8-9}
// src/web3/managed-providers.ts
import { InfuraProvider, AlchemyProvider } from "ethers";

// Infura — 传入 API Key 和网络名称
const infuraProvider = new InfuraProvider("mainnet", "YOUR_INFURA_API_KEY");

// Alchemy — 传入 API Key 和网络名称
const alchemyProvider = new AlchemyProvider("mainnet", "YOUR_ALCHEMY_API_KEY");

// 二者使用方式完全相同
const blockNumber = await infuraProvider.getBlockNumber();
console.log("Infura 查询到的区块号:", blockNumber);

const balance = await alchemyProvider.getBalance("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
console.log("Alchemy 查询到的余额:", balance.toString());
```
:::

### 4. FallbackProvider（高可用方案）

生产环境中，单一 RPC 节点可能出现故障或限流。`FallbackProvider` 允许你组合多个 Provider，实现自动故障切换。

::: details 配置 FallbackProvider 实现高可用
```typescript{4-16}
// src/web3/fallback-provider.ts
import { FallbackProvider, JsonRpcProvider, InfuraProvider, AlchemyProvider } from "ethers";

// 配置多个后端 Provider，并设置优先级和权重
const fallbackProvider = new FallbackProvider([
  {
    provider: new InfuraProvider("mainnet", "YOUR_INFURA_KEY"),
    priority: 1,     // 优先级，数字越小越优先
    stallTimeout: 2000, // 超时时间（毫秒）
    weight: 2         // 权重，用于投票机制
  },
  {
    provider: new AlchemyProvider("mainnet", "YOUR_ALCHEMY_KEY"),
    priority: 2,
    stallTimeout: 2000,
    weight: 1
  },
  {
    provider: new JsonRpcProvider("https://rpc.ankr.com/eth"),
    priority: 3,
    stallTimeout: 3000,
    weight: 1
  }
]);

// 使用方式与单个 Provider 完全相同
const blockNumber = await fallbackProvider.getBlockNumber();
console.log("当前区块号:", blockNumber);
```
:::

## 三、Provider 数据查询

Provider 提供了丰富的链上数据查询方法。以下是最常用的查询操作：

### 1. 区块与网络信息

::: details 查询区块与网络信息
```typescript{5,8,11,14,17}
// src/web3/query-blocks.ts
import { JsonRpcProvider } from "ethers";
const provider = new JsonRpcProvider("https://rpc.ankr.com/eth");

// 获取最新区块号
const blockNumber = await provider.getBlockNumber();
console.log("最新区块号:", blockNumber);

// 获取完整的区块信息
const block = await provider.getBlock(blockNumber);
console.log("区块哈希:", block?.hash);
console.log("区块时间:", new Date((block?.timestamp ?? 0) * 1000).toLocaleString());
console.log("矿工/验证者:", block?.miner);

// 获取包含完整交易对象的区块（prefetch = true）
const blockWithTx = await provider.getBlock(blockNumber, true);
console.log("区块交易数:", blockWithTx?.transactions.length);

// 获取网络信息
const network = await provider.getNetwork();
console.log("网络名称:", network.name);
console.log("Chain ID:", network.chainId.toString());

// 获取当前 Gas 费用数据
const feeData = await provider.getFeeData();
console.log("Base Fee:", feeData.gasPrice?.toString(), "wei");
console.log("Max Priority Fee:", feeData.maxPriorityFeePerGas?.toString(), "wei");
```
:::

### 2. 账户与余额查询

::: details 查询账户余额与 Nonce
```typescript{6,9,12}
// src/web3/query-account.ts
import { JsonRpcProvider, formatEther } from "ethers";
const provider = new JsonRpcProvider("https://rpc.ankr.com/eth");

const usdcDeployer = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

// 查询 ETH 余额（返回 bigint，单位为 wei）
const balance = await provider.getBalance(usdcDeployer);
console.log("余额:", formatEther(balance), "ETH");

// 查询账户 Nonce（已发送交易数）
const nonce = await provider.getTransactionCount(usdcDeployer);
console.log("Nonce:", nonce);

// 查询指定区块高度时的余额（历史余额）
const historicalBalance = await provider.getBalance(usdcDeployer, 18000000);
console.log("区块 18000000 时的余额:", formatEther(historicalBalance), "ETH");
```
:::

### 3. 交易查询

::: details 查询交易详情与收据
```typescript{6,13}
// src/web3/query-transaction.ts
import { JsonRpcProvider, formatEther } from "ethers";
const provider = new JsonRpcProvider("https://rpc.ankr.com/eth");

// 通过交易哈希查询交易详情
const txHash = "0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060";
const tx = await provider.getTransaction(txHash);
console.log("发送方:", tx?.from);
console.log("接收方:", tx?.to);
console.log("转账金额:", tx ? formatEther(tx.value) : "0", "ETH");
console.log("Gas Limit:", tx?.gasLimit.toString());

// 查询交易收据（包含执行结果和日志）
const receipt = await provider.getTransactionReceipt(txHash);
console.log("交易状态:", receipt?.status === 1 ? "成功" : "失败");
console.log("实际消耗 Gas:", receipt?.gasUsed.toString());
console.log("所在区块:", receipt?.blockNumber);
console.log("事件日志数:", receipt?.logs.length);
```
:::

### 4. 合约代码查询

::: details 检查地址是否为合约
```typescript{6,9-10}
// src/web3/query-code.ts
import { JsonRpcProvider } from "ethers";
const provider = new JsonRpcProvider("https://rpc.ankr.com/eth");

// 获取地址上部署的合约字节码
const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const code = await provider.getCode(usdcAddress);

// 如果返回 "0x" 表示该地址是普通外部账户（EOA），否则是合约
const isContract = code !== "0x";
console.log("是否为合约:", isContract);
console.log("合约字节码长度:", code.length, "字符");

// 查询普通地址
const eoaAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const eoaCode = await provider.getCode(eoaAddress);
console.log("EOA 地址的代码:", eoaCode); // 输出 "0x"
```
:::

## 四、Signer 详解

Signer 代表一个以太坊账户身份，能够签名消息和发送交易。Ethers.js 中有两种主要的 Signer：

| Signer 类型 | 获取方式 | 适用场景 |
|-------------|---------|---------|
| `Wallet` | 通过私钥或助记词创建 | 后端脚本、自动化交易、测试 |
| `JsonRpcSigner` | 通过 `BrowserProvider.getSigner()` 获取 | 前端 DApp，用户通过钱包确认交易 |

### 1. 使用 Wallet 创建 Signer

::: details 从私钥和助记词创建 Wallet
```typescript{5,9,13,17}
// src/web3/wallet-creation.ts
import { Wallet, JsonRpcProvider } from "ethers";
const provider = new JsonRpcProvider("https://rpc.ankr.com/eth_sepolia");

// 方式一：从私钥创建（注意：私钥不要硬编码，应从环境变量读取）
const privateKey = process.env.PRIVATE_KEY!;
const walletFromKey = new Wallet(privateKey, provider);

// 方式二：从助记词创建
const mnemonic = process.env.MNEMONIC!;
const walletFromMnemonic = Wallet.fromPhrase(mnemonic, provider);

// 方式三：随机生成新钱包（适合测试）
const randomWallet = Wallet.createRandom(provider);
console.log("新钱包地址:", randomWallet.address);
console.log("助记词:", randomWallet.mnemonic?.phrase);

// 方式四：先创建 Wallet 再连接 Provider
const offlineWallet = new Wallet(privateKey);
const connectedWallet = offlineWallet.connect(provider);

console.log("钱包地址:", connectedWallet.address);
```
:::

::: danger 私钥安全
永远不要将私钥或助记词写在代码中或提交到版本控制系统。推荐使用环境变量（`.env` 文件 + `dotenv` 库）或密钥管理服务（如 AWS KMS、HashiCorp Vault）来管理敏感信息。
:::

### 2. 从 BrowserProvider 获取 Signer

::: details 前端环境获取 Signer
```typescript{5,8}
// src/web3/browser-signer.ts
import { BrowserProvider } from "ethers";

// 连接 MetaMask
const provider = new BrowserProvider(window.ethereum);

// 获取当前连接账户的 Signer
const signer = await provider.getSigner();
const address = await signer.getAddress();
console.log("当前账户:", address);

// Signer 可以访问 Provider 的所有查询功能
const balance = await signer.provider.getBalance(address);
console.log("账户余额:", balance.toString());
```
:::

## 五、签名消息

签名消息（Sign Message）是 DApp 中常见的身份验证方式，用于证明用户拥有某个地址的控制权，而不需要发送链上交易。

::: details 签名消息与验证
```typescript{7,10,13-14}
// src/web3/sign-message.ts
import { Wallet, verifyMessage } from "ethers";

const privateKey = process.env.PRIVATE_KEY!;
const wallet = new Wallet(privateKey);

// 对纯文本消息签名
const message = "欢迎登录 MyDApp，请确认你的身份。\n\n时间戳: 1710460800";
const signature = await wallet.signMessage(message);
console.log("签名结果:", signature);

// 验证签名 — 恢复出签名者地址
const recoveredAddress = verifyMessage(message, signature);
const isValid = recoveredAddress.toLowerCase() === wallet.address.toLowerCase();
console.log("签名验证:", isValid ? "通过" : "失败");
console.log("恢复出的地址:", recoveredAddress);
```
:::

::: tip 签名消息的用途
签名消息常用于"连接钱包 + 签名登录"的 Web3 认证流程。后端收到签名后通过 `verifyMessage` 恢复地址，确认用户身份，无需传统的用户名密码体系。
:::

## 六、发送交易

### 1. 发送 ETH 转账

::: details 发送 ETH 转账交易
```typescript{8-13,16,19}
// src/web3/send-transaction.ts
import { Wallet, JsonRpcProvider, parseEther, formatEther } from "ethers";

const provider = new JsonRpcProvider("https://rpc.ankr.com/eth_sepolia");
const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);

// 构造交易参数
const tx = await wallet.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  value: parseEther("0.01"),        // 转账 0.01 ETH
  // 以下为可选参数，不传则自动估算
  // gasLimit: 21000n,
  // maxFeePerGas: parseUnits("20", "gwei"),
});

console.log("交易已广播，哈希:", tx.hash);

// 等待交易确认（1 个区块确认）
const receipt = await tx.wait(1);
console.log("交易已确认!");
console.log("所在区块:", receipt?.blockNumber);
console.log("消耗 Gas:", receipt?.gasUsed.toString());
console.log("实际 Gas 费:", formatEther(receipt!.gasUsed * receipt!.gasPrice), "ETH");
```
:::

### 2. 自定义 Gas 参数

::: details 精细控制 Gas 费用
```typescript{7-8,11-17}
// src/web3/custom-gas.ts
import { Wallet, JsonRpcProvider, parseEther, parseUnits } from "ethers";

const provider = new JsonRpcProvider("https://rpc.ankr.com/eth_sepolia");
const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);

// 查询当前推荐的 Gas 参数
const feeData = await provider.getFeeData();
console.log("当前 Base Fee:", feeData.gasPrice?.toString());

// 发送交易并手动指定 EIP-1559 Gas 参数
const tx = await wallet.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  value: parseEther("0.005"),
  maxFeePerGas: parseUnits("30", "gwei"),          // 最大总费用
  maxPriorityFeePerGas: parseUnits("2", "gwei"),   // 小费/优先费
  gasLimit: 21000n                                   // ETH 转账固定 21000
});

console.log("交易哈希:", tx.hash);
const receipt = await tx.wait();
console.log("交易状态:", receipt?.status === 1 ? "成功" : "失败");
```
:::

::: warning Gas 估算注意事项
虽然 Ethers.js 会自动估算 Gas，但在网络拥堵时自动估算的值可能偏低，导致交易长时间 pending。对于时间敏感的交易，建议手动设置一个稍高的 `maxFeePerGas`。
:::

## 七、ENS 域名解析

Ethers.js 内置了对 ENS（Ethereum Name Service）的完整支持，你可以直接在任何需要地址的地方使用 ENS 域名。

::: details ENS 正向与反向解析
```typescript{5,8,11,14}
// src/web3/ens-resolution.ts
import { JsonRpcProvider, formatEther } from "ethers";
const provider = new JsonRpcProvider("https://rpc.ankr.com/eth");

// 正向解析：ENS 名称 → 以太坊地址
const address = await provider.resolveName("vitalik.eth");
console.log("vitalik.eth 的地址:", address);

// 反向解析：以太坊地址 → ENS 名称
const ensName = await provider.lookupAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
console.log("地址对应的 ENS:", ensName);

// ENS 名称可以直接用于余额查询
const balance = await provider.getBalance("vitalik.eth");
console.log("vitalik.eth 的余额:", formatEther(balance), "ETH");

// 获取 ENS 的头像（Avatar）
const avatarUrl = await provider.getAvatar("vitalik.eth");
console.log("ENS 头像:", avatarUrl);
```
:::

::: tip ENS 解析只在主网可用
ENS 合约部署在以太坊主网上。如果你连接的是测试网或其他 L2 网络，ENS 解析会返回 `null`。部分测试网（如 Sepolia）有独立的 ENS 部署，但域名数据与主网不共享。
:::

## 八、实战：完整的钱包工具类

将上述功能整合为一个可复用的钱包工具类：

::: details 封装钱包工具类
```typescript{7,15,24,35,47}
// src/web3/wallet-service.ts
import {
  JsonRpcProvider, BrowserProvider, Wallet,
  formatEther, parseEther, type TransactionResponse
} from "ethers";

// 钱包连接信息接口
interface WalletConnection {
  address: string;
  balance: string;
  chainId: bigint;
  networkName: string;
}

// 后端环境：通过私钥连接
async function connectWithPrivateKey(
  rpcUrl: string,
  privateKey: string
): Promise<{ wallet: Wallet; info: WalletConnection }> {
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  const network = await provider.getNetwork();

  const info: WalletConnection = {
    address: wallet.address,
    balance: formatEther(await provider.getBalance(wallet.address)),
    chainId: network.chainId,
    networkName: network.name,
  };

  return { wallet, info };
}

// 前端环境：通过 MetaMask 连接
async function connectWithMetaMask(): Promise<{
  provider: BrowserProvider;
  signer: ReturnType<BrowserProvider["getSigner"]> extends Promise<infer T> ? T : never;
  info: WalletConnection;
}> {
  if (!window.ethereum) {
    throw new Error("请安装 MetaMask");
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();

  const info: WalletConnection = {
    address,
    balance: formatEther(await provider.getBalance(address)),
    chainId: network.chainId,
    networkName: network.name,
  };

  return { provider, signer: signer as any, info };
}

// 使用示例
const { wallet, info } = await connectWithPrivateKey(
  "https://rpc.ankr.com/eth_sepolia",
  process.env.PRIVATE_KEY!
);
console.log("已连接:", info);
```
:::

::: tip 下一步
掌握了 Provider 和 Signer 的使用后，接下来你将学习如何使用 Ethers.js 的 Contract 类与智能合约进行交互，包括读取合约状态、发送交易、监听事件等核心操作。
:::
