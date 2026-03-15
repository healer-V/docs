---
title: "合约交互"
category: "Web3 · Ethereum"
tags:
  - Ethers.js
  - Contract
  - TypeChain
excerpt: "Ethers.js 的 Contract 类提供了类型安全的合约交互接口，结合 TypeChain 可以获得完整的 IDE 自动补全支持。"
date: 2026-03-15
---

# 合约交互

## 一、创建 Contract 实例

在 Ethers.js 中，与智能合约交互的核心是 `Contract` 类。创建一个 Contract 实例需要三个要素：

| 要素 | 说明 |
|------|------|
| **合约地址** | 合约在链上的部署地址 |
| **ABI** | 合约的接口描述，定义了可调用的方法和事件 |
| **Provider 或 Signer** | 传入 Provider 则只能调用只读方法；传入 Signer 则可以发送交易 |

::: details 创建 Contract 实例
```typescript{5-20,23,26}
// src/web3/create-contract.ts
import { Contract, JsonRpcProvider, Wallet } from "ethers";

// ERC-20 标准 ABI（精简版，只包含常用方法）
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

// USDC 合约地址（以太坊主网）
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const provider = new JsonRpcProvider("https://rpc.ankr.com/eth");

// 只读合约实例（传入 Provider）
const usdcReadOnly = new Contract(USDC_ADDRESS, ERC20_ABI, provider);

// 可写合约实例（传入 Signer）
const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);
const usdcWritable = new Contract(USDC_ADDRESS, ERC20_ABI, wallet);
```
:::

::: tip 人类可读 ABI
Ethers.js 支持"人类可读 ABI"（Human-Readable ABI），你可以用简洁的字符串格式代替冗长的 JSON ABI。这在开发和调试阶段非常方便。生产环境通常使用编译器生成的完整 JSON ABI。
:::

## 二、读取合约状态

所有标记为 `view` 或 `pure` 的合约方法都是只读的，调用时不消耗 Gas，也不需要 Signer。

::: details 读取 ERC-20 代币信息
```typescript{6,9,12,15-16}
// src/web3/read-contract.ts
import { Contract, JsonRpcProvider, formatUnits } from "ethers";

const provider = new JsonRpcProvider("https://rpc.ankr.com/eth");
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

const usdc = new Contract(USDC_ADDRESS, ERC20_ABI, provider);

// 读取代币基本信息
const tokenName = await usdc.name();
const tokenSymbol = await usdc.symbol();
const decimals = await usdc.decimals();
const totalSupply = await usdc.totalSupply();

console.log("代币名称:", tokenName);           // USD Coin
console.log("代币符号:", tokenSymbol);           // USDC
console.log("小数位数:", decimals);              // 6
console.log("总供应量:", formatUnits(totalSupply, decimals), tokenSymbol);

// 查询指定地址的代币余额
const holderAddress = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";
const balance = await usdc.balanceOf(holderAddress);
console.log("持有余额:", formatUnits(balance, decimals), tokenSymbol);
```
:::

## 三、写入合约（发送交易）

调用会修改链上状态的方法（如 `transfer`、`approve`）需要 Signer 签名并发送交易。

### 1. 调用写入方法

::: details ERC-20 代币转账
```typescript{13-14,17}
// src/web3/write-contract.ts
import { Contract, Wallet, JsonRpcProvider, parseUnits, formatUnits } from "ethers";

const provider = new JsonRpcProvider("https://rpc.ankr.com/eth_sepolia");
const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);

const TOKEN_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Sepolia USDC
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const token = new Contract(TOKEN_ADDRESS, ERC20_ABI, wallet);
const decimals = await token.decimals();

// 转账 10 USDC 给目标地址
const recipientAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";
const transferAmount = parseUnits("10", decimals);
const tx = await token.transfer(recipientAddress, transferAmount);

console.log("交易已广播:", tx.hash);

// 等待交易确认
const receipt = await tx.wait(1);
console.log("交易状态:", receipt?.status === 1 ? "成功" : "失败");
console.log("Gas 消耗:", receipt?.gasUsed.toString());
```
:::

### 2. 使用 Overrides 自定义交易参数

你可以在合约调用时传入额外参数来控制 Gas、value 等：

::: details 使用 overrides 控制交易参数
```typescript{6-11}
// src/web3/contract-overrides.ts
import { Contract, Wallet, JsonRpcProvider, parseUnits, parseEther } from "ethers";

// ...省略初始化代码

// 在合约方法的最后一个参数传入 overrides 对象
const tx = await token.transfer(recipientAddress, transferAmount, {
  gasLimit: 100000n,                               // 手动设置 Gas Limit
  maxFeePerGas: parseUnits("25", "gwei"),          // EIP-1559 最大费用
  maxPriorityFeePerGas: parseUnits("2", "gwei"),   // 矿工小费
  // value: parseEther("0.1"),                      // 如果合约方法是 payable，可附带 ETH
});

// 对于 payable 方法（如向合约充值），通过 overrides.value 传入 ETH 数量
const WETH_ABI = ["function deposit() payable"];
const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // Sepolia WETH
const weth = new Contract(WETH_ADDRESS, WETH_ABI, wallet);

const depositTx = await weth.deposit({
  value: parseEther("0.1") // 存入 0.1 ETH，换取 0.1 WETH
});
await depositTx.wait();
console.log("WETH 存款成功");
```
:::

## 四、监听合约事件

智能合约通过事件（Event）向外部通知状态变更。Ethers.js 提供了实时监听和历史查询两种方式。

### 1. 实时监听事件

::: details 实时监听 ERC-20 Transfer 事件
```typescript{8-9,17}
// src/web3/listen-events.ts
import { Contract, JsonRpcProvider, formatUnits } from "ethers";

const provider = new JsonRpcProvider("wss://eth-mainnet.g.alchemy.com/v2/YOUR_KEY");
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function decimals() view returns (uint8)",
];

const usdc = new Contract(USDC_ADDRESS, ERC20_ABI, provider);

// 监听所有 Transfer 事件
usdc.on("Transfer", (from, to, value, event) => {
  console.log("--- 检测到转账 ---");
  console.log("从:", from);
  console.log("到:", to);
  console.log("金额:", formatUnits(value, 6), "USDC");
  console.log("区块:", event.log.blockNumber);
  console.log("交易哈希:", event.log.transactionHash);
});

console.log("开始监听 USDC 转账事件...");

// 停止监听（清理资源）
// usdc.removeAllListeners("Transfer");
```
:::

::: warning WebSocket 连接
实时事件监听需要 WebSocket 连接（`wss://`）。HTTP RPC 不支持事件订阅。如果你使用 HTTP Provider，应改用轮询或 `queryFilter` 查询历史事件。
:::

### 2. 使用事件过滤器

::: details 过滤特定地址的事件
```typescript{6-7,10-11}
// src/web3/event-filters.ts
import { Contract, JsonRpcProvider, formatUnits } from "ethers";

const provider = new JsonRpcProvider("wss://eth-mainnet.g.alchemy.com/v2/YOUR_KEY");
const usdc = new Contract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
], provider);

// 只监听从特定地址发出的转账
const fromFilter = usdc.filters.Transfer("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
usdc.on(fromFilter, (from, to, value, event) => {
  console.log(`Vitalik 转出了 ${formatUnits(value, 6)} USDC 到 ${to}`);
});

// 只监听发送到特定地址的转账（第一个参数传 null 表示不过滤）
const toFilter = usdc.filters.Transfer(null, "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18");
usdc.on(toFilter, (from, to, value) => {
  console.log(`收到来自 ${from} 的 ${formatUnits(value, 6)} USDC`);
});
```
:::

### 3. 查询历史事件

::: details 使用 queryFilter 查询历史事件
```typescript{7-8,14}
// src/web3/query-events.ts
import { Contract, JsonRpcProvider, formatUnits } from "ethers";

const provider = new JsonRpcProvider("https://rpc.ankr.com/eth");
const usdc = new Contract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function decimals() view returns (uint8)",
], provider);

// 查询最近 1000 个区块内的 Transfer 事件
const currentBlock = await provider.getBlockNumber();
const fromBlock = currentBlock - 1000;

// 使用过滤器查询特定地址的转账记录
const filter = usdc.filters.Transfer("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
const events = await usdc.queryFilter(filter, fromBlock, currentBlock);

console.log(`找到 ${events.length} 笔转账记录：`);
for (const event of events) {
  if ("args" in event) {
    console.log({
      from: event.args.from,
      to: event.args.to,
      amount: formatUnits(event.args.value, 6) + " USDC",
      block: event.blockNumber,
      txHash: event.transactionHash,
    });
  }
}
```
:::

::: danger queryFilter 区块范围限制
大多数 RPC 服务商限制单次查询的区块范围（通常为 2000-10000 个区块）。如果你需要查询更大范围的历史事件，应分批查询并合并结果。
:::

## 五、合约部署

### 1. 使用 ContractFactory 部署合约

::: details 部署智能合约
```typescript{7-8,11,14}
// src/web3/deploy-contract.ts
import { ContractFactory, Wallet, JsonRpcProvider } from "ethers";

const provider = new JsonRpcProvider("https://rpc.ankr.com/eth_sepolia");
const deployer = new Wallet(process.env.PRIVATE_KEY!, provider);

// 合约 ABI 和字节码（通常由 Solidity 编译器生成）
const TOKEN_ABI = [
  "constructor(string name, string symbol, uint256 initialSupply)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

// 字节码来自 Solidity 编译输出（此处为示意，实际值更长）
const TOKEN_BYTECODE = "0x608060405234801561001057600080fd5b5060405161...";

// 创建 ContractFactory
const factory = new ContractFactory(TOKEN_ABI, TOKEN_BYTECODE, deployer);

// 部署合约，传入构造函数参数
const contract = await factory.deploy("MyToken", "MTK", 1000000n * 10n ** 18n);
console.log("部署交易哈希:", contract.deploymentTransaction()?.hash);

// 等待合约部署完成
await contract.waitForDeployment();
const contractAddress = await contract.getAddress();
console.log("合约已部署到:", contractAddress);

// 验证部署成功
const name = await contract.name();
console.log("代币名称:", name);
```
:::

## 六、TypeChain 集成

TypeChain 是一个代码生成工具，能根据合约 ABI 自动生成 TypeScript 类型定义，让你在调用合约方法时获得完整的 IDE 自动补全和类型检查。

### 1. 安装与配置

::: details 安装 TypeChain
```bash
# 安装 TypeChain 核心包和 Ethers.js v6 适配器
npm install --save-dev typechain @typechain/ethers-v6

# 如果你使用 Hardhat，安装 Hardhat 插件
npm install --save-dev @typechain/hardhat
```
:::

### 2. 生成类型

::: details 从 ABI 文件生成 TypeScript 类型
```bash
# 将合约 ABI JSON 文件放在 abi/ 目录下
# 运行 TypeChain 生成类型
npx typechain --target ethers-v6 --out-dir src/types/contracts 'abi/*.json'
```
:::

### 3. 使用生成的类型

::: details 享受完整的类型安全和自动补全
```typescript{2,6,9,12}
// src/web3/typechain-usage.ts
import { MyToken__factory } from "../types/contracts";
import { JsonRpcProvider, Wallet, parseUnits } from "ethers";

const provider = new JsonRpcProvider("https://rpc.ankr.com/eth_sepolia");
const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);

// 使用工厂类连接已部署的合约 — 返回值自动带有完整类型
const token = MyToken__factory.connect("0xContractAddress...", wallet);

// IDE 会自动补全所有合约方法，参数类型也会被检查
const tokenName: string = await token.name();     // 返回类型自动推导为 string
const balance: bigint = await token.balanceOf(wallet.address); // 返回类型自动推导为 bigint

// 如果传入错误的参数类型，TypeScript 编译器会报错
// const wrongCall = await token.balanceOf(123);  // TS Error: 参数类型不匹配

// 事件监听也有类型支持
token.on(token.filters.Transfer(), (from, to, value) => {
  // from: string, to: string, value: bigint — 自动推导
  console.log(`${from} → ${to}: ${value}`);
});
```
:::

::: tip TypeChain 的价值
在没有 TypeChain 的情况下，合约方法的参数和返回值类型都是 `any`，很容易传错参数类型导致运行时报错。TypeChain 将这些错误前移到编译阶段，极大提升了开发体验和代码可靠性。
:::

## 七、Multicall 批量查询

当你需要同时读取多个合约状态时，逐个调用效率很低。Multicall 模式通过一次 RPC 请求执行多个只读调用，显著减少网络延迟。

### 1. 手动实现 Multicall

::: details 使用 Multicall3 合约批量查询
```typescript{10-11,20-30,33}
// src/web3/multicall.ts
import { Contract, JsonRpcProvider, Interface, formatUnits } from "ethers";

const provider = new JsonRpcProvider("https://rpc.ankr.com/eth");

// Multicall3 合约地址（几乎所有 EVM 链通用）
const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

// Multicall3 ABI（只需 aggregate3 方法）
const MULTICALL3_ABI = [
  "function aggregate3((address target, bool allowFailure, bytes callData)[]) view returns ((bool success, bytes returnData)[])",
];

const multicall = new Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);

// 定义要查询的 ERC-20 代币列表
const tokens = [
  { name: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  { name: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  { name: "DAI",  address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
];

const holderAddress = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";
const erc20Interface = new Interface(["function balanceOf(address) view returns (uint256)"]);

// 构建批量调用参数
const calls = tokens.map(token => ({
  target: token.address,
  allowFailure: true,
  callData: erc20Interface.encodeFunctionData("balanceOf", [holderAddress]),
}));

// 一次 RPC 请求查询所有代币余额
const results = await multicall.aggregate3(calls);

// 解析结果
results.forEach((result: { success: boolean; returnData: string }, index: number) => {
  const token = tokens[index];
  if (result.success) {
    const [balance] = erc20Interface.decodeFunctionResult("balanceOf", result.returnData);
    console.log(`${token.name} 余额: ${formatUnits(balance, token.decimals)}`);
  } else {
    console.log(`${token.name} 查询失败`);
  }
});
```
:::

### 2. 性能对比

| 查询方式 | 10 个代币余额 | 网络请求数 | 耗时（估计） |
|---------|-------------|-----------|------------|
| 逐个调用 | 10 次 `balanceOf` | 10 次 | ~2-5 秒 |
| Multicall | 1 次 `aggregate3` | 1 次 | ~0.2-0.5 秒 |

::: warning Multicall 的局限
Multicall 只适用于只读调用（`view`/`pure`）。写入操作无法批量执行，因为每笔交易都需要独立签名。如果你需要批量写入，可以考虑编写一个批处理合约。
:::

## 八、Gas 估算与优化

### 1. 预估 Gas 消耗

::: details 在发送交易前估算 Gas
```typescript{8,11-12}
// src/web3/gas-estimation.ts
import { Contract, Wallet, JsonRpcProvider, parseUnits } from "ethers";

const provider = new JsonRpcProvider("https://rpc.ankr.com/eth_sepolia");
const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);

const token = new Contract("0xTokenAddress...", [
  "function transfer(address to, uint256 amount) returns (bool)",
], wallet);

// 估算 Gas（不实际发送交易）
const estimatedGas = await token.transfer.estimateGas(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  parseUnits("100", 6)
);
console.log("预估 Gas:", estimatedGas.toString());

// 获取当前 Gas 价格
const feeData = await provider.getFeeData();
const gasCost = estimatedGas * (feeData.gasPrice ?? 0n);
console.log("预估 Gas 费:", gasCost.toString(), "wei");

// 建议在估算值基础上增加 20% 缓冲
const gasLimitWithBuffer = estimatedGas * 120n / 100n;
console.log("建议 Gas Limit:", gasLimitWithBuffer.toString());
```
:::

### 2. Gas 优化建议

| 优化策略 | 说明 |
|---------|------|
| 使用 Multicall 批量查询 | 将多次只读调用合并为一次请求 |
| 合理设置 Gas Limit | 在估算值基础上增加 10%-20% 缓冲，避免交易失败 |
| 选择合适的时机 | 避免在网络拥堵时发送非紧急交易，Gas 价格会显著上升 |
| 使用 EIP-1559 参数 | 设置 `maxFeePerGas` 和 `maxPriorityFeePerGas` 可以更精确地控制费用 |

## 九、实战：完整的 ERC-20 代币交互

下面通过一个完整示例，演示 ERC-20 代币的常见操作：查询余额、授权和转账。

::: details 完整的 ERC-20 代币交互示例
```typescript{14,29,37,47,62}
// src/web3/erc20-complete.ts
import { Contract, Wallet, JsonRpcProvider, parseUnits, formatUnits, MaxUint256 } from "ethers";

// ========== 初始化配置 ==========
const provider = new JsonRpcProvider("https://rpc.ankr.com/eth_sepolia");
const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);

const TOKEN_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Sepolia USDC
const SPENDER_ADDRESS = "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD"; // Uniswap Router

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

const token = new Contract(TOKEN_ADDRESS, ERC20_ABI, wallet);

// ========== 1. 查询代币信息 ==========
async function getTokenInfo() {
  const [name, symbol, decimals, balance] = await Promise.all([
    token.name(),
    token.symbol(),
    token.decimals(),
    token.balanceOf(wallet.address),
  ]);

  console.log(`代币: ${name} (${symbol})`);
  console.log(`小数位: ${decimals}`);
  console.log(`你的余额: ${formatUnits(balance, decimals)} ${symbol}`);

  return { name, symbol, decimals, balance };
}

// ========== 2. 查询并设置授权额度 ==========
async function checkAndApprove(spender: string, requiredAmount: bigint, decimals: number) {
  // 查询当前授权额度
  const currentAllowance = await token.allowance(wallet.address, spender);
  console.log(`当前授权额度: ${formatUnits(currentAllowance, decimals)}`);

  if (currentAllowance >= requiredAmount) {
    console.log("授权额度充足，无需重新授权");
    return;
  }

  // 授权无限额度（生产环境中建议授权精确数量）
  console.log("正在授权...");
  const approveTx = await token.approve(spender, MaxUint256);
  console.log("授权交易哈希:", approveTx.hash);

  const receipt = await approveTx.wait(1);
  console.log("授权成功! Gas 消耗:", receipt?.gasUsed.toString());
}

// ========== 3. 转账代币 ==========
async function transferTokens(to: string, amount: string, decimals: number) {
  const transferAmount = parseUnits(amount, decimals);

  // 先检查余额是否充足
  const balance = await token.balanceOf(wallet.address);
  if (balance < transferAmount) {
    throw new Error(`余额不足: 持有 ${formatUnits(balance, decimals)}，需要 ${amount}`);
  }

  // 估算 Gas
  const estimatedGas = await token.transfer.estimateGas(to, transferAmount);
  console.log("预估 Gas:", estimatedGas.toString());

  // 发送转账交易
  const tx = await token.transfer(to, transferAmount, {
    gasLimit: estimatedGas * 120n / 100n, // 增加 20% 缓冲
  });
  console.log("转账交易哈希:", tx.hash);

  const receipt = await tx.wait(1);
  console.log("转账成功!");
  console.log("Gas 消耗:", receipt?.gasUsed.toString());

  // 查询转账后的余额
  const newBalance = await token.balanceOf(wallet.address);
  console.log("转账后余额:", formatUnits(newBalance, decimals));
}

// ========== 4. 监听转账事件 ==========
function watchTransfers() {
  // 监听发送到你地址的转账
  const incomingFilter = token.filters.Transfer(null, wallet.address);
  token.on(incomingFilter, (from, to, value) => {
    console.log(`收到 ${formatUnits(value, 6)} USDC，来自 ${from}`);
  });

  // 监听从你地址发出的转账
  const outgoingFilter = token.filters.Transfer(wallet.address);
  token.on(outgoingFilter, (from, to, value) => {
    console.log(`转出 ${formatUnits(value, 6)} USDC，到 ${to}`);
  });

  console.log("正在监听你的 USDC 转账事件...");
}

// ========== 执行完整流程 ==========
async function main() {
  const { decimals } = await getTokenInfo();

  // 授权 Uniswap Router 使用你的代币
  const requiredAmount = parseUnits("1000", decimals);
  await checkAndApprove(SPENDER_ADDRESS, requiredAmount, decimals);

  // 转账 50 USDC
  await transferTokens(
    "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    "50",
    decimals
  );

  // 开始监听后续转账
  watchTransfers();
}

main().catch(console.error);
```
:::

::: danger 授权安全
上面的示例中使用了 `MaxUint256` 进行无限授权，这在便利性上是最优的，但存在安全风险——如果被授权的合约存在漏洞，攻击者可能转走你的全部代币。生产环境中建议只授权实际需要的精确数量。
:::

::: tip 下一步
掌握了合约交互的核心技能后，你可以尝试与更复杂的 DeFi 协议（如 Uniswap、Aave）进行交互，或者学习如何使用 Hardhat 搭建完整的智能合约开发和测试环境。
:::
