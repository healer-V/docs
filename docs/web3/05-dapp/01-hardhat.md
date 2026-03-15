---
title: "Hardhat 开发框架"
category: "Web3 · Ethereum"
tags:
  - Hardhat
  - 测试
  - 部署
excerpt: "Hardhat 是以太坊智能合约开发的主流框架，提供编译、测试、部署和调试的完整工具链。"
date: 2026-03-15
---

# Hardhat 开发框架

在以太坊智能合约开发中，你需要一个可靠的开发框架来完成编译、测试、部署和调试等一系列工作。Hardhat 是当前最主流的选择，它提供了灵活的插件体系、内置的本地区块链网络以及强大的调试能力，能够显著提升你的开发效率。

## 一、什么是 Hardhat

Hardhat 是一个面向以太坊的开发环境，核心功能包括：

- **编译合约**：支持 Solidity 多版本编译，自动管理依赖
- **自动化测试**：基于 Mocha + Chai 的测试框架，内置 Ethers.js 集成
- **本地区块链**：Hardhat Network 提供即时挖矿、可 fork 主网的本地链
- **部署脚本**：使用 JavaScript/TypeScript 编写可复用的部署流程
- **调试工具**：支持 `console.log` 在 Solidity 中打印变量，支持堆栈追踪

### 1. 主流开发框架对比

在选择开发框架之前，你可以参考以下对比：

| 特性 | Hardhat | Truffle | Foundry |
|------|---------|---------|---------|
| 语言 | JavaScript / TypeScript | JavaScript | Solidity (测试也用 Solidity) |
| 测试框架 | Mocha + Chai + Ethers.js | Mocha + Chai + Web3.js | Forge (Solidity 原生) |
| 本地链 | Hardhat Network | Ganache | Anvil |
| 编译速度 | 中等 | 中等 | 极快 (Rust 实现) |
| 插件生态 | 丰富 | 丰富 | 较少但增长中 |
| 调试能力 | console.log + 堆栈追踪 | 有限 | 详细的 Trace |
| 主网 Fork | 支持 | 需配置 Ganache | 支持 |
| 学习曲线 | 低（前端友好） | 低 | 中等（需熟悉 Solidity 测试） |
| 社区活跃度 | 高 | 逐渐下降 | 高速增长 |

::: tip
如果你是前端开发者或 JavaScript/TypeScript 技术栈，Hardhat 是最佳选择。如果你更偏向底层合约开发且希望极致速度，可以关注 Foundry。
:::

### 2. 适用场景

- **DApp 全栈开发**：Hardhat + Ethers.js + React/Vue 是最常见的技术组合
- **合约原型验证**：Hardhat Network 的即时挖矿让你快速验证想法
- **主网 Fork 测试**：在本地模拟主网状态，测试与已部署合约的交互

## 二、项目初始化

### 1. 环境准备

你需要先安装 Node.js（推荐 v18+）和包管理工具。

::: details 检查环境版本
```bash
# 检查 Node.js 版本
node --version
# v18.17.0

# 检查 npm 版本
npm --version
# 9.6.7
```
:::

### 2. 创建 Hardhat 项目

使用 `npx hardhat init` 可以快速创建项目：

::: details 初始化项目
```bash
# 创建项目目录
mkdir my-dapp-contracts && cd my-dapp-contracts

# 初始化 npm 项目
npm init -y

# 安装 Hardhat
npm install --save-dev hardhat

# 初始化 Hardhat 项目（选择 TypeScript 项目）
npx hardhat init
# 选择：Create a TypeScript project
# 按提示确认 .gitignore、安装依赖等

# 安装常用依赖
npm install --save-dev @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-verify
npm install @openzeppelin/contracts
```
:::

### 3. 项目结构

初始化完成后，你会看到以下目录结构：

```
my-dapp-contracts/
├── contracts/          # Solidity 合约源码
│   └── Lock.sol        # 示例合约
├── ignition/           # 部署模块（Hardhat Ignition）
│   └── modules/
│       └── Lock.ts     # 部署脚本
├── test/               # 测试文件
│   └── Lock.ts         # 测试脚本
├── hardhat.config.ts   # Hardhat 配置文件
├── package.json
└── tsconfig.json
```

::: warning
`contracts/` 目录下只放 Solidity 源码文件。编译产物会自动生成到 `artifacts/` 和 `cache/` 目录，这两个目录应添加到 `.gitignore` 中。
:::

## 三、配置文件详解

`hardhat.config.ts` 是整个项目的核心配置文件，控制着编译器版本、网络连接、插件加载等所有行为。

::: details hardhat.config.ts 完整配置示例
```ts{5-8,14-30}
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

// 加载 .env 文件中的环境变量
dotenv.config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  // Solidity 编译器配置
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // 优化次数，值越大部署成本越高但调用成本越低
      },
    },
  },

  // 网络配置
  networks: {
    // Hardhat 内置本地网络（默认）
    hardhat: {
      chainId: 31337,
      // 可选：fork 主网
      // forking: {
      //   url: "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY",
      //   blockNumber: 19000000,
      // },
    },
    // Sepolia 测试网
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },

  // Etherscan 验证配置
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },

  // Gas 报告（测试时显示 gas 消耗）
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
};

export default config;
```
:::

::: danger
永远不要将私钥硬编码在配置文件中。使用 `.env` 文件存储敏感信息，并确保 `.env` 已添加到 `.gitignore`。
:::

配置好 `.env` 文件：

::: details .env 文件示例
```bash
# .env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ETHERSCAN_API_KEY=your-etherscan-api-key
```
:::

## 四、编译合约

### 1. 编写合约

在 `contracts/` 目录下创建一个简单的合约：

::: details 编写 Greeting 合约
```solidity
// contracts/Greeting.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol"; // Hardhat 调试工具

contract Greeting {
    string private greeting;
    address public owner;

    event GreetingChanged(address indexed changer, string newGreeting);

    modifier onlyOwner() {
        require(msg.sender == owner, "Greeting: caller is not owner");
        _;
    }

    constructor(string memory _greeting) {
        greeting = _greeting;
        owner = msg.sender;
        console.log("Deploying Greeting with message:", _greeting);
    }

    function getGreeting() public view returns (string memory) {
        return greeting;
    }

    function setGreeting(string memory _greeting) public onlyOwner {
        console.log("Changing greeting from '%s' to '%s'", greeting, _greeting);
        greeting = _greeting;
        emit GreetingChanged(msg.sender, _greeting);
    }
}
```
:::

### 2. 执行编译

::: details 编译命令
```bash
# 编译所有合约
npx hardhat compile

# 输出示例：
# Compiled 1 Solidity file successfully
# 编译产物在 artifacts/contracts/Greeting.sol/Greeting.json
```
:::

编译完成后，`artifacts/` 目录下会生成 ABI 和字节码文件，后续测试和部署都会用到这些产物。

## 五、编写测试

测试是智能合约开发中最重要的环节。合约一旦部署到链上就无法修改，因此充分的测试至关重要。

### 1. 测试基础结构

Hardhat 使用 Mocha 作为测试运行器，Chai 提供断言库，`@nomicfoundation/hardhat-toolbox` 集成了 Ethers.js。

::: details Greeting 合约完整测试
```ts{12-13,25-27,40-44}
// test/Greeting.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { Greeting } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Greeting", function () {
  let greeting: Greeting;
  let owner: SignerWithAddress;
  let otherUser: SignerWithAddress;

  // 每个测试用例前重新部署合约，保证测试隔离
  beforeEach(async function () {
    [owner, otherUser] = await ethers.getSigners();

    const GreetingFactory = await ethers.getContractFactory("Greeting");
    greeting = await GreetingFactory.deploy("Hello, Ethereum!");
    await greeting.waitForDeployment();
  });

  describe("部署", function () {
    it("应正确设置初始问候语", async function () {
      expect(await greeting.getGreeting()).to.equal("Hello, Ethereum!");
    });

    // 验证部署者被设置为 owner
    it("应将部署者设置为合约拥有者", async function () {
      expect(await greeting.owner()).to.equal(owner.address);
    });
  });

  describe("修改问候语", function () {
    it("owner 应能成功修改问候语", async function () {
      await greeting.setGreeting("Hi, Web3!");
      expect(await greeting.getGreeting()).to.equal("Hi, Web3!");
    });

    it("非 owner 修改应被拒绝", async function () {
      await expect(
        greeting.connect(otherUser).setGreeting("Hacked!")
      ).to.be.revertedWith("Greeting: caller is not owner");
    });

    // 验证事件触发
    it("修改时应触发 GreetingChanged 事件", async function () {
      await expect(greeting.setGreeting("New greeting"))
        .to.emit(greeting, "GreetingChanged")
        .withArgs(owner.address, "New greeting");
    });
  });
});
```
:::

### 2. 运行测试

::: details 执行测试命令
```bash
# 运行所有测试
npx hardhat test

# 运行指定测试文件
npx hardhat test test/Greeting.ts

# 显示 gas 消耗报告
REPORT_GAS=true npx hardhat test

# 查看测试覆盖率
npx hardhat coverage
```
:::

::: tip
在编写测试时，遵循 AAA 模式（Arrange-Act-Assert）：先准备测试数据，再执行操作，最后验证结果。每个 `it` 块只测试一个行为。
:::

## 六、Hardhat Network

Hardhat Network 是 Hardhat 内置的本地以太坊网络，专为开发和测试设计。

### 1. 核心特性

| 特性 | 说明 |
|------|------|
| 即时挖矿 | 每笔交易立即出块，无需等待 |
| 自动账户 | 提供 20 个预充值的测试账户（各 10000 ETH） |
| console.log | 在 Solidity 代码中打印调试信息 |
| 堆栈追踪 | 交易失败时显示完整的 Solidity 调用栈 |
| 主网 Fork | 复制主网状态到本地，与真实合约交互 |

### 2. 启动独立节点

你可以启动一个独立的 Hardhat 节点，供前端开发或 MetaMask 连接：

::: details 启动本地节点
```bash
# 启动 Hardhat 本地节点（监听 http://127.0.0.1:8545）
npx hardhat node

# 输出示例：
# Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
# Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
# Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
# ...
```
:::

### 3. Fork 主网

Fork 模式允许你在本地复制主网（或任意网络）的状态，使用真实的合约和数据进行测试：

::: details 配置主网 Fork
```ts
// hardhat.config.ts 中的网络配置
networks: {
  hardhat: {
    forking: {
      url: "https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY",
      blockNumber: 19500000, // 固定区块号保证测试可复现
    },
  },
}
```
:::

::: warning
Fork 主网需要 RPC 节点提供商的 API Key（如 Alchemy、Infura）。免费额度通常足够开发使用，但频繁 fork 可能会消耗较多请求额度。
:::

## 七、部署合约

### 1. 编写部署脚本

Hardhat 推荐使用 Hardhat Ignition 进行部署管理，但你也可以使用传统的脚本方式：

::: details 使用脚本部署
```ts{8-15}
// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 部署 Greeting 合约
  const GreetingFactory = await ethers.getContractFactory("Greeting");
  const greeting = await GreetingFactory.deploy("Hello from Hardhat!");
  await greeting.waitForDeployment();

  const contractAddress = await greeting.getAddress();
  console.log("Greeting deployed to:", contractAddress);

  // 部署后验证
  const storedGreeting = await greeting.getGreeting();
  console.log("Stored greeting:", storedGreeting);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```
:::

### 2. 执行部署

::: details 部署命令
```bash
# 部署到本地网络（需先启动 npx hardhat node）
npx hardhat run scripts/deploy.ts --network localhost

# 部署到 Sepolia 测试网
npx hardhat run scripts/deploy.ts --network sepolia
```
:::

## 八、部署到 Sepolia 测试网

将合约部署到公开的测试网是上线主网前的必要步骤。以下是完整的操作流程：

### 1. 准备工作

| 步骤 | 说明 | 获取方式 |
|------|------|----------|
| 获取测试 ETH | Sepolia 测试网的 ETH 用于支付 gas | [Sepolia Faucet](https://sepoliafaucet.com/) |
| 获取 RPC URL | 连接 Sepolia 网络的节点地址 | Alchemy / Infura 注册获取 |
| 获取 Etherscan API Key | 用于合约源码验证 | [Etherscan](https://etherscan.io/apis) 注册获取 |

### 2. 部署并验证

::: details 部署到 Sepolia 并验证源码
```bash
# 第一步：部署合约
npx hardhat run scripts/deploy.ts --network sepolia
# 输出：Greeting deployed to: 0x1234...abcd

# 第二步：验证合约源码（使合约在 Etherscan 上可读）
# 参数需要与部署时的构造函数参数一致
npx hardhat verify --network sepolia 0x1234...abcd "Hello from Hardhat!"
# 输出：Successfully verified contract Greeting on Etherscan
```
:::

::: tip
合约验证后，任何人都可以在 Etherscan 上查看源码并直接与合约交互（Read/Write Contract 选项卡）。这对项目透明度和用户信任非常重要。
:::

## 九、Hardhat Console

Hardhat 提供了一个交互式控制台，让你可以直接与合约交互，非常适合快速调试：

::: details 使用 Hardhat Console
```bash
# 启动控制台（连接本地网络）
npx hardhat console --network localhost
```

```js
// 在控制台中执行
const Greeting = await ethers.getContractFactory("Greeting");
const greeting = await Greeting.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

// 读取当前问候语
await greeting.getGreeting();
// 'Hello from Hardhat!'

// 修改问候语
const tx = await greeting.setGreeting("Console says hi!");
await tx.wait();

// 再次读取确认
await greeting.getGreeting();
// 'Console says hi!'
```
:::

## 十、常用插件

Hardhat 的插件机制让你可以按需扩展功能：

| 插件 | 功能 | 安装命令 |
|------|------|----------|
| `@nomicfoundation/hardhat-toolbox` | 集成 Ethers, Chai, Coverage, Gas Reporter 等 | `npm i -D @nomicfoundation/hardhat-toolbox` |
| `@nomicfoundation/hardhat-verify` | 在 Etherscan 上验证合约源码 | `npm i -D @nomicfoundation/hardhat-verify` |
| `hardhat-gas-reporter` | 测试时输出 gas 消耗报告 | `npm i -D hardhat-gas-reporter` |
| `solidity-coverage` | 生成测试覆盖率报告 | `npm i -D solidity-coverage` |
| `hardhat-deploy` | 更强大的部署管理工具 | `npm i -D hardhat-deploy` |
| `@typechain/hardhat` | 为合约生成 TypeScript 类型 | `npm i -D @typechain/hardhat` |

::: tip
`@nomicfoundation/hardhat-toolbox` 是一个元包，它包含了上述大部分插件。如果你使用 `npx hardhat init` 创建 TypeScript 项目，这个包会默认安装。
:::
