---
title: "DApp 前端集成"
category: "Web3 · Web3.js"
tags:
  - DApp
  - React
  - wagmi
excerpt: "DApp 前端通过 wagmi + Ethers.js 连接钱包并与智能合约交互，完整的前端集成是用户体验的关键。"
date: 2026-03-15
---

# DApp 前端集成

智能合约部署到链上后，用户需要通过前端界面与其交互。DApp（Decentralized Application）前端与传统 Web 应用的核心区别在于：数据来自区块链而非中心化数据库，用户操作需要通过钱包签名而非账号密码。本文将带你使用 React + wagmi + viem 构建一个完整的 DApp 前端。

## 一、DApp 架构概述

### 1. 技术栈选型

| 层级 | 技术 | 职责 |
|------|------|------|
| UI 框架 | React + TypeScript | 构建用户界面 |
| Web3 交互库 | wagmi v2 | 提供 React Hooks 封装，简化合约交互 |
| 底层通信 | viem | 底层以太坊交互（wagmi v2 的默认底层库） |
| 钱包连接 | ConnectKit / RainbowKit | 提供开箱即用的钱包连接 UI |
| 状态管理 | TanStack Query（wagmi 内置） | 缓存链上数据，自动刷新 |
| 构建工具 | Vite | 快速开发和构建 |

::: tip
wagmi v2 使用 viem 替代了 Ethers.js 作为底层库。viem 提供了更好的类型安全和更小的包体积。如果你之前使用 Ethers.js，两者的 API 风格有所不同，但 wagmi 的 Hooks 层抽象屏蔽了大部分差异。
:::

### 2. 数据流架构

```
用户操作 → wagmi Hook → viem → JSON-RPC → 区块链节点 → 智能合约
                                    ↓
                              交易广播到网络
                                    ↓
                              矿工/验证者打包
                                    ↓
                              交易确认 → 前端更新 UI
```

与传统 Web 应用不同，写操作（如转账）不是即时完成的，需要等待区块确认。这对前端的加载状态管理和用户反馈提出了更高要求。

## 二、项目搭建

### 1. 初始化项目

::: details 创建 DApp 前端项目
```bash
# 使用 Vite 创建 React + TypeScript 项目
npm create vite@latest my-dapp-frontend -- --template react-ts
cd my-dapp-frontend

# 安装 wagmi 及相关依赖
npm install wagmi viem@2.x @tanstack/react-query

# 安装钱包连接 UI 组件（二选一）
npm install connectkit
# 或
# npm install @rainbow-me/rainbowkit

# 安装 UI 组件库（可选）
npm install antd
```
:::

### 2. 配置 wagmi

::: details wagmi 配置文件
```ts{8-16,20-31}
// src/config/wagmi.ts
import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

// 创建 wagmi 配置
export const wagmiConfig = createConfig(
  getDefaultConfig({
    // 支持的链
    chains: [mainnet, sepolia],

    // RPC 传输配置
    transports: {
      [mainnet.id]: http("https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"),
      [sepolia.id]: http("https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"),
    },

    // 项目信息（用于 WalletConnect）
    walletConnectProjectId: "YOUR_WALLETCONNECT_PROJECT_ID",

    // 应用元信息
    appName: "My DApp",
    appDescription: "A token transfer DApp",
    appUrl: "https://mydapp.xyz",
    appIcon: "https://mydapp.xyz/logo.png",
  })
);
```
:::

### 3. 设置 Provider

::: details 应用入口配置 Provider
```tsx{8-16}
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { wagmiConfig } from "./config/wagmi";
import App from "./App";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <App />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
```
:::

## 三、钱包连接

### 1. 连接按钮

ConnectKit 提供了开箱即用的连接按钮，自动处理钱包检测、连接、断开等逻辑：

::: details 钱包连接组件
```tsx
// src/components/WalletConnect.tsx
import { ConnectKitButton } from "connectkit";
import { useAccount, useBalance } from "wagmi";

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({ address });

  return (
    <div className="wallet-section">
      {/* ConnectKit 自带的连接按钮，包含完整的连接/断开 UI */}
      <ConnectKitButton />

      {isConnected && address && (
        <div className="wallet-info">
          <p>地址: {`${address.slice(0, 6)}...${address.slice(-4)}`}</p>
          <p>网络: {chain?.name ?? "Unknown"}</p>
          <p>余额: {balance ? `${Number(balance.formatted).toFixed(4)} ${balance.symbol}` : "加载中..."}</p>
        </div>
      )}
    </div>
  );
}
```
:::

### 2. 使用 wagmi Hooks

wagmi 提供了丰富的 Hooks 来获取钱包和链上信息：

| Hook | 功能 | 返回值 |
|------|------|--------|
| `useAccount()` | 获取连接的账户信息 | `address`, `isConnected`, `chain` |
| `useConnect()` | 连接钱包 | `connect()`, `connectors` |
| `useDisconnect()` | 断开钱包 | `disconnect()` |
| `useBalance()` | 查询 ETH/代币余额 | `data.formatted`, `data.symbol` |
| `useChainId()` | 获取当前链 ID | `chainId` |
| `useSwitchChain()` | 切换网络 | `switchChain()` |

### 3. 网络切换

当用户连接的网络与 DApp 要求的不一致时，你需要引导用户切换：

::: details 网络切换组件
```tsx{9-12}
// src/components/NetworkSwitch.tsx
import { useAccount, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";

export function NetworkSwitch() {
  const { chain } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  // 目标网络 ID（Sepolia 测试网）
  const targetChainId = sepolia.id;
  const isWrongNetwork = chain && chain.id !== targetChainId;

  if (!isWrongNetwork) return null;

  return (
    <div className="network-warning">
      <p>你当前连接的是 {chain?.name}，请切换到 Sepolia 测试网</p>
      <button
        onClick={() => switchChain({ chainId: targetChainId })}
        disabled={isPending}
      >
        {isPending ? "切换中..." : "切换到 Sepolia"}
      </button>
    </div>
  );
}
```
:::

::: warning
永远在用户操作前检查网络是否正确。在错误的网络上发起交易会导致交易失败并浪费 gas 费。
:::

## 四、读取合约数据

### 1. 定义合约 ABI

在与合约交互前，你需要准备合约的 ABI 和地址：

::: details 合约配置
```ts
// src/config/contracts.ts
export const TOKEN_CONTRACT = {
  address: "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`,
  abi: [
    {
      type: "function",
      name: "name",
      inputs: [],
      outputs: [{ type: "string" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "symbol",
      inputs: [],
      outputs: [{ type: "string" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "decimals",
      inputs: [],
      outputs: [{ type: "uint8" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "totalSupply",
      inputs: [],
      outputs: [{ type: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "balanceOf",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ type: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "transfer",
      inputs: [
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ type: "bool" }],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "approve",
      inputs: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ type: "bool" }],
      stateMutability: "nonpayable",
    },
    {
      type: "event",
      name: "Transfer",
      inputs: [
        { name: "from", type: "address", indexed: true },
        { name: "to", type: "address", indexed: true },
        { name: "value", type: "uint256", indexed: false },
      ],
    },
  ] as const,
} as const;
```
:::

### 2. 读取代币信息

使用 `useReadContract` 读取合约中的 view 函数：

::: details 代币信息展示组件
```tsx{8-23}
// src/components/TokenInfo.tsx
import { useReadContract, useAccount } from "wagmi";
import { formatUnits } from "viem";
import { TOKEN_CONTRACT } from "../config/contracts";

export function TokenInfo() {
  const { address: userAddress } = useAccount();

  // 读取代币名称
  const { data: tokenName } = useReadContract({
    ...TOKEN_CONTRACT,
    functionName: "name",
  });

  // 读取代币符号
  const { data: tokenSymbol } = useReadContract({
    ...TOKEN_CONTRACT,
    functionName: "symbol",
  });

  // 读取小数位数
  const { data: decimals } = useReadContract({
    ...TOKEN_CONTRACT,
    functionName: "decimals",
  });

  // 读取总供应量
  const { data: totalSupply } = useReadContract({
    ...TOKEN_CONTRACT,
    functionName: "totalSupply",
  });

  // 读取用户余额（需要连接钱包后才查询）
  const { data: userBalance, isLoading: balanceLoading } = useReadContract({
    ...TOKEN_CONTRACT,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress, // 只在钱包连接后查询
    },
  });

  return (
    <div className="token-info">
      <h2>代币信息</h2>
      <table>
        <tbody>
          <tr>
            <td>名称</td>
            <td>{tokenName ?? "加载中..."}</td>
          </tr>
          <tr>
            <td>符号</td>
            <td>{tokenSymbol ?? "加载中..."}</td>
          </tr>
          <tr>
            <td>总供应量</td>
            <td>
              {totalSupply && decimals
                ? `${Number(formatUnits(totalSupply, decimals)).toLocaleString()} ${tokenSymbol}`
                : "加载中..."}
            </td>
          </tr>
          <tr>
            <td>你的余额</td>
            <td>
              {balanceLoading
                ? "加载中..."
                : userBalance && decimals
                  ? `${Number(formatUnits(userBalance, decimals)).toLocaleString()} ${tokenSymbol}`
                  : "请连接钱包"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```
:::

::: tip
`useReadContract` 底层使用 TanStack Query 管理缓存。数据会在组件挂载时自动请求，并在窗口重新聚焦时自动刷新。你也可以通过 `refetchInterval` 设置轮询间隔。
:::

## 五、写入合约数据

### 1. 发起交易

使用 `useWriteContract` 向合约发送交易（需要用户通过钱包确认）：

::: details 代币转账组件
```tsx{10-12,20-43}
// src/components/TokenTransfer.tsx
import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseEther, isAddress } from "viem";
import { TOKEN_CONTRACT } from "../config/contracts";

export function TokenTransfer() {
  const { isConnected } = useAccount();
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");

  // 发起合约写操作
  const {
    writeContract,
    data: txHash,       // 交易哈希
    isPending,          // 等待用户在钱包中确认
    error: writeError,
  } = useWriteContract();

  // 等待交易确认
  const {
    isLoading: isConfirming, // 交易已提交，等待区块确认
    isSuccess: isConfirmed,  // 交易已确认
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // 处理转账提交
  function handleTransfer() {
    if (!isAddress(toAddress)) {
      alert("请输入有效的以太坊地址");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert("请输入有效的转账金额");
      return;
    }

    writeContract({
      ...TOKEN_CONTRACT,
      functionName: "transfer",
      args: [toAddress as `0x${string}`, parseEther(amount)],
    });
  }

  return (
    <div className="transfer-form">
      <h2>代币转账</h2>

      <div className="form-group">
        <label>接收地址</label>
        <input
          type="text"
          placeholder="0x..."
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          disabled={isPending || isConfirming}
        />
      </div>

      <div className="form-group">
        <label>转账金额</label>
        <input
          type="number"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isPending || isConfirming}
          min="0"
          step="0.01"
        />
      </div>

      <button
        onClick={handleTransfer}
        disabled={!isConnected || isPending || isConfirming}
      >
        {!isConnected
          ? "请先连接钱包"
          : isPending
            ? "请在钱包中确认..."
            : isConfirming
              ? "交易确认中..."
              : "转账"}
      </button>

      {/* 交易状态展示 */}
      {txHash && (
        <div className="tx-status">
          <p>
            交易哈希:{" "}
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {`${txHash.slice(0, 10)}...${txHash.slice(-8)}`}
            </a>
          </p>
          {isConfirming && <p className="status-pending">等待区块确认...</p>}
          {isConfirmed && <p className="status-success">交易已确认</p>}
        </div>
      )}

      {/* 错误展示 */}
      {(writeError || confirmError) && (
        <div className="tx-error">
          <p>交易失败: {(writeError || confirmError)?.message}</p>
        </div>
      )}
    </div>
  );
}
```
:::

### 2. 交易状态说明

一笔链上交易会经历以下状态：

| 状态 | 对应字段 | 用户感知 |
|------|----------|----------|
| 待签名 | `isPending = true` | 钱包弹窗请求用户确认 |
| 已提交 | `txHash` 有值，`isConfirming = true` | 交易已广播到网络，等待矿工打包 |
| 已确认 | `isConfirmed = true` | 交易已包含在区块中，操作完成 |
| 失败 | `writeError` 或 `confirmError` | 用户拒绝签名，或链上执行回滚 |

::: warning
在交易确认前不要让用户离开页面或发起新交易。使用 `useWaitForTransactionReceipt` 跟踪确认状态，并在 UI 上清晰展示当前进度。
:::

## 六、显示 NFT 和代币余额

### 1. 代币余额列表

::: details 多代币余额展示
```tsx{10-24}
// src/components/TokenBalances.tsx
import { useAccount, useReadContracts } from "wagmi";
import { formatUnits } from "viem";

// 常见代币列表
const TOKEN_LIST = [
  { name: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  { name: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  { name: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
] as const;

const balanceOfAbi = [{
  type: "function" as const,
  name: "balanceOf" as const,
  inputs: [{ name: "account" as const, type: "address" as const }],
  outputs: [{ type: "uint256" as const }],
  stateMutability: "view" as const,
}] as const;

export function TokenBalances() {
  const { address } = useAccount();

  // 批量读取多个合约数据（减少 RPC 请求）
  const { data: balances, isLoading } = useReadContracts({
    contracts: TOKEN_LIST.map((token) => ({
      address: token.address as `0x${string}`,
      abi: balanceOfAbi,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
    })),
    query: {
      enabled: !!address,
    },
  });

  if (!address) return <p>请连接钱包查看代币余额</p>;
  if (isLoading) return <p>加载代币余额中...</p>;

  return (
    <div className="token-balances">
      <h2>代币余额</h2>
      <table>
        <thead>
          <tr>
            <th>代币</th>
            <th>余额</th>
          </tr>
        </thead>
        <tbody>
          {TOKEN_LIST.map((token, index) => {
            const result = balances?.[index];
            const balance = result?.status === "success" ? result.result : 0n;
            return (
              <tr key={token.address}>
                <td>{token.name}</td>
                <td>
                  {Number(formatUnits(balance as bigint, token.decimals)).toLocaleString(
                    "en-US",
                    { minimumFractionDigits: 2, maximumFractionDigits: 4 }
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```
:::

### 2. NFT 展示

::: details NFT 画廊组件
```tsx{12-27}
// src/components/NFTGallery.tsx
import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";

const NFT_CONTRACT = {
  address: "0xABCD...your-nft-address" as `0x${string}`,
  abi: [
    {
      type: "function",
      name: "balanceOf",
      inputs: [{ name: "owner", type: "address" }],
      outputs: [{ type: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "tokenOfOwnerByIndex",
      inputs: [
        { name: "owner", type: "address" },
        { name: "index", type: "uint256" },
      ],
      outputs: [{ type: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "tokenURI",
      inputs: [{ name: "tokenId", type: "uint256" }],
      outputs: [{ type: "string" }],
      stateMutability: "view",
    },
  ] as const,
} as const;

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string | number }>;
}

export function NFTGallery() {
  const { address } = useAccount();
  const [nftList, setNftList] = useState<NFTMetadata[]>([]);

  // 查询用户持有的 NFT 数量
  const { data: nftBalance } = useReadContract({
    ...NFT_CONTRACT,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (!nftBalance || nftBalance === 0n) {
      setNftList([]);
      return;
    }

    // 根据 balance 逐个查询 tokenURI 并获取 metadata
    async function fetchNFTs() {
      const metadataList: NFTMetadata[] = [];
      const count = Number(nftBalance);

      for (let i = 0; i < count; i++) {
        try {
          // 实际项目中你需要通过合约读取 tokenOfOwnerByIndex 和 tokenURI
          // 这里简化为直接 fetch metadata
          const metadataUrl = `https://ipfs.io/ipfs/QmYourCID/metadata/${i}.json`;
          const response = await fetch(metadataUrl);
          const metadata: NFTMetadata = await response.json();
          // 将 IPFS URI 转换为 HTTP 网关地址
          metadata.image = metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/");
          metadataList.push(metadata);
        } catch (error) {
          console.error(`Failed to fetch NFT #${i}:`, error);
        }
      }

      setNftList(metadataList);
    }

    fetchNFTs();
  }, [nftBalance]);

  if (!address) return <p>请连接钱包查看你的 NFT</p>;

  return (
    <div className="nft-gallery">
      <h2>我的 NFT ({nftBalance?.toString() ?? 0})</h2>
      <div className="nft-grid">
        {nftList.map((nft, index) => (
          <div key={index} className="nft-card">
            <img src={nft.image} alt={nft.name} loading="lazy" />
            <h3>{nft.name}</h3>
            <p>{nft.description}</p>
            <div className="nft-attributes">
              {nft.attributes.map((attr) => (
                <span key={attr.trait_type} className="attribute-tag">
                  {attr.trait_type}: {attr.value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```
:::

## 七、错误处理与用户体验

### 1. 常见错误类型

| 错误类型 | 原因 | 处理方式 |
|----------|------|----------|
| `UserRejectedRequestError` | 用户在钱包中点击拒绝 | 提示"你取消了操作" |
| `InsufficientFundsError` | ETH 余额不足以支付 gas | 提示充值 ETH |
| `ContractFunctionRevertedError` | 合约执行回滚（如余额不足） | 展示 revert 原因 |
| `ChainMismatchError` | 连接的网络与合约所在链不一致 | 引导切换网络 |
| `ConnectorNotConnectedError` | 钱包未连接 | 引导连接钱包 |

### 2. 统一错误处理

::: details 错误处理工具函数
```ts{4-22}
// src/utils/errorHandler.ts
import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from "viem";

/**
 * 将 Web3 错误转换为用户友好的中文提示
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof BaseError) {
    // 用户拒绝签名
    if (error.walk((e) => e instanceof UserRejectedRequestError)) {
      return "你取消了交易签名";
    }

    // 合约执行回滚
    const revertError = error.walk(
      (e) => e instanceof ContractFunctionRevertedError
    ) as ContractFunctionRevertedError | null;

    if (revertError) {
      const reason = revertError.data?.errorName ?? "未知原因";
      return `合约执行失败: ${reason}`;
    }

    // 余额不足
    if (error.message.includes("insufficient funds")) {
      return "ETH 余额不足，无法支付 gas 费用";
    }

    return error.shortMessage || error.message;
  }

  return "发生未知错误，请稍后重试";
}
```
:::

### 3. 加载状态与交易确认 UX

::: details 交易状态提示组件
```tsx
// src/components/TransactionToast.tsx
import { useEffect } from "react";

interface TransactionToastProps {
  txHash?: `0x${string}`;
  isPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  error?: Error | null;
}

export function TransactionToast({
  txHash,
  isPending,
  isConfirming,
  isConfirmed,
  error,
}: TransactionToastProps) {
  // 交易确认后自动关闭提示
  useEffect(() => {
    if (isConfirmed) {
      const timer = setTimeout(() => {
        // 可在此触发关闭 toast 的逻辑
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed]);

  if (!isPending && !isConfirming && !isConfirmed && !error) return null;

  return (
    <div className="transaction-toast">
      {isPending && (
        <div className="toast-pending">
          <span className="spinner" />
          <p>请在钱包中确认交易...</p>
        </div>
      )}

      {isConfirming && txHash && (
        <div className="toast-confirming">
          <span className="spinner" />
          <p>交易已提交，等待区块确认...</p>
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            在 Etherscan 上查看
          </a>
        </div>
      )}

      {isConfirmed && (
        <div className="toast-success">
          <p>交易已确认</p>
        </div>
      )}

      {error && (
        <div className="toast-error">
          <p>交易失败</p>
          <p className="error-detail">{error.message}</p>
        </div>
      )}
    </div>
  );
}
```
:::

::: tip
好的 DApp UX 需要在每个交互阶段给用户明确反馈：操作发起 -> 钱包确认中 -> 交易广播中 -> 区块确认中 -> 操作完成。避免出现无任何反馈的"空白等待"状态。
:::

## 八、完整示例：代币转账页面

以下是一个整合了钱包连接、代币信息展示和转账功能的完整页面：

::: details 完整的 App.tsx
```tsx{18-26}
// src/App.tsx
import { useAccount } from "wagmi";
import { WalletConnect } from "./components/WalletConnect";
import { NetworkSwitch } from "./components/NetworkSwitch";
import { TokenInfo } from "./components/TokenInfo";
import { TokenTransfer } from "./components/TokenTransfer";
import { TokenBalances } from "./components/TokenBalances";
import "./App.css";

function App() {
  const { isConnected } = useAccount();

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Token Transfer DApp</h1>
        <WalletConnect />
      </header>

      {/* 网络检查 */}
      <NetworkSwitch />

      <main className="app-main">
        {/* 代币信息（无需连接钱包即可查看） */}
        <section className="section">
          <TokenInfo />
        </section>

        {/* 以下功能需要连接钱包 */}
        {isConnected ? (
          <>
            <section className="section">
              <TokenBalances />
            </section>

            <section className="section">
              <TokenTransfer />
            </section>
          </>
        ) : (
          <div className="connect-prompt">
            <p>请连接钱包以使用转账功能</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          合约地址:{" "}
          <a
            href="https://sepolia.etherscan.io/address/0x1234...5678"
            target="_blank"
            rel="noopener noreferrer"
          >
            0x1234...5678
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
```
:::

::: details 基础样式
```css
/* src/App.css */
.app-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.section {
  margin: 24px 0;
  padding: 20px;
  border-radius: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
}

button {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #2563eb;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tx-status {
  margin-top: 16px;
  padding: 12px;
  border-radius: 8px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.tx-error {
  margin-top: 16px;
  padding: 12px;
  border-radius: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.connect-prompt {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.network-warning {
  padding: 12px 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  margin: 16px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nft-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.nft-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.nft-card img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.nft-card h3 {
  margin: 8px 12px 4px;
  font-size: 14px;
}

.nft-card p {
  margin: 0 12px 8px;
  font-size: 12px;
  color: #6b7280;
}

.attribute-tag {
  display: inline-block;
  margin: 2px 4px 8px;
  padding: 2px 8px;
  background: #eff6ff;
  border-radius: 4px;
  font-size: 11px;
  color: #3b82f6;
}
```
:::

::: danger
在生产环境中，你需要注意以下安全事项：
1. 不要在前端代码中硬编码私钥或敏感信息
2. 所有用户输入（地址、金额）必须经过严格校验
3. 使用 HTTPS 部署前端，防止中间人攻击
4. 合约地址应从可信来源获取，防止钓鱼合约
5. 大额操作建议添加二次确认弹窗
:::
