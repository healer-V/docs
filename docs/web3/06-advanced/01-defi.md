---
title: "DeFi 核心概念"
category: "Web3 · Ethereum"
tags:
  - DeFi
  - AMM
  - 流动性
excerpt: "DeFi（去中心化金融）通过智能合约重构传统金融服务，AMM、流动性池和借贷协议是其三大核心支柱。"
date: 2026-03-15
---

# DeFi 核心概念

DeFi（Decentralized Finance，去中心化金融）是构建在区块链上的开放金融生态系统。与传统金融不同，DeFi 通过智能合约替代中间机构，实现了无许可、透明、可组合的金融服务。本章将带你深入理解 DeFi 的核心机制和关键协议。

## 一、什么是 DeFi

DeFi 是指运行在公链（主要是以太坊）上的去中心化金融应用集合。它利用智能合约自动执行金融逻辑，任何人只需一个钱包地址即可参与，无需 KYC（身份验证）或中介审批。

### 1. DeFi 与 CeFi 对比

| 对比维度 | CeFi（中心化金融） | DeFi（去中心化金融） |
|----------|-------------------|---------------------|
| 托管方式 | 平台托管用户资产 | 用户自持私钥，资产自管 |
| 准入门槛 | 需要 KYC、银行账户 | 只需钱包地址，无许可 |
| 透明度 | 内部账本，用户不可审计 | 链上公开，任何人可验证 |
| 运行时间 | 工作日/交易时段 | 7×24 小时不间断 |
| 可组合性 | 各平台孤立，难以互通 | 协议间可自由组合（"DeFi 乐高"） |
| 风险类型 | 平台跑路、审查冻结 | 智能合约漏洞、预言机攻击 |
| 交易速度 | 取决于银行系统（T+1 或更久） | 取决于区块确认时间（秒到分钟级） |

### 2. DeFi 的核心价值

- **无许可性**：任何人可以参与，不受地域和身份限制
- **可组合性**：协议之间可以像乐高积木一样自由组合，创造新的金融产品
- **透明性**：所有交易和合约代码在链上公开可审计
- **非托管**：用户始终掌握自己资产的私钥

## 二、核心协议分类

DeFi 生态包含多种协议类型，每种解决不同的金融需求。

### 1. 去中心化交易所（DEX）

DEX 允许用户在无中介的情况下直接交换代币。不同于 CEX（中心化交易所）的订单簿模式，大多数 DEX 采用 AMM（自动做市商）模型。

代表项目：Uniswap、SushiSwap、Curve Finance

### 2. 借贷协议（Lending）

借贷协议允许用户存入资产赚取利息，或以超额抵押的方式借出资产。利率由供需关系通过算法动态调整。

代表项目：Aave、Compound、MakerDAO

### 3. 稳定币（Stablecoin）

稳定币锚定法币价值（通常是美元），是 DeFi 的基础交易媒介。分为中心化抵押型（USDT、USDC）和去中心化超额抵押型（DAI）。

### 4. 收益聚合器（Yield Aggregator）

自动在不同 DeFi 协议之间调配资金，为用户获取最优收益。

代表项目：Yearn Finance、Beefy Finance

## 三、AMM 机制详解

AMM（Automated Market Maker，自动做市商）是 DeFi 最重要的创新之一，它用数学公式替代传统的订单簿撮合。

### 1. 恒定乘积公式

Uniswap 采用的核心公式非常简洁：

```
x × y = k
```

其中：
- `x` 是池中代币 A 的数量
- `y` 是池中代币 B 的数量
- `k` 是一个常数，在没有新增或移除流动性时保持不变

### 2. 交换过程

假设一个 ETH/USDC 流动性池中有 10 ETH 和 30,000 USDC，则 `k = 10 × 30,000 = 300,000`。

当你用 1 ETH 买入 USDC 时：

1. 池中 ETH 变为 `10 + 1 = 11`
2. 根据 `x × y = k`，新的 USDC 数量为 `300,000 ÷ 11 ≈ 27,272.73`
3. 你获得 `30,000 - 27,272.73 = 2,727.27 USDC`
4. 实际成交价约为 `2,727.27 USDC/ETH`，低于当前现货价 `3,000 USDC/ETH`

::: warning 价格影响与滑点
- **价格影响（Price Impact）**：你的交易本身会改变池中代币比例，导致实际成交价偏离市场价。交易量越大，价格影响越大。
- **滑点（Slippage）**：从提交交易到链上确认之间，池子状态可能已被其他交易改变，导致最终成交价与预期不同。你可以在前端设置滑点容忍度（如 0.5%），超出则交易回滚。
:::

### 3. AMM 交换流程示意

::: details AMM 交换的 Solidity 简化实现
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleAMM {
    IERC20 public tokenA;
    IERC20 public tokenB;
    uint256 public reserveA;
    uint256 public reserveB;

    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    /// @notice 用 tokenA 交换 tokenB
    /// @param amountAIn 输入的 tokenA 数量
    /// @param minAmountBOut 最少获得的 tokenB 数量（滑点保护） // [!code highlight]
    function swap(uint256 amountAIn, uint256 minAmountBOut) external {
        require(amountAIn > 0, "Invalid input amount");

        // 根据恒定乘积公式计算输出
        // newReserveA × newReserveB = reserveA × reserveB
        uint256 amountBOut = (reserveB * amountAIn) / (reserveA + amountAIn); // [!code highlight]

        require(amountBOut >= minAmountBOut, "Slippage exceeded"); // [!code highlight]

        // 执行转账
        tokenA.transferFrom(msg.sender, address(this), amountAIn);
        tokenB.transfer(msg.sender, amountBOut);

        // 更新储备量
        reserveA += amountAIn;
        reserveB -= amountBOut;
    }

    /// @notice 添加流动性
    function addLiquidity(uint256 amountA, uint256 amountB) external {
        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);
        reserveA += amountA;
        reserveB += amountB;
    }
}
```
:::

## 四、流动性池与 LP 代币

### 1. 流动性提供者（LP）

流动性池需要用户存入资产才能运作。作为流动性提供者（Liquidity Provider），你需要按池子当前比例同时存入两种代币，换取 LP 代币作为你在池中份额的凭证。

LP 代币的作用：
- 代表你在流动性池中的份额比例
- 可随时赎回对应份额的底层资产
- 持有期间累积交易手续费收入
- 可用于其他 DeFi 协议中进行质押获取额外收益

### 2. 无常损失详解

::: danger 无常损失（Impermanent Loss）
无常损失是流动性提供者面临的核心风险。当池中代币的价格比例相对于你存入时发生变化，你取出的资产价值会低于"单纯持有不做 LP"的价值，这个差额就是无常损失。
:::

**具体例子**：

假设你向 ETH/USDC 池存入 1 ETH + 3,000 USDC（总价值 6,000 USD），此时 ETH 价格为 3,000 USD。

| ETH 价格变化 | LP 资产价值 | 单纯持有价值 | 无常损失 |
|-------------|-----------|------------|---------|
| 不变（3,000 USD） | 6,000 USD | 6,000 USD | 0% |
| +25%（3,750 USD） | 6,614 USD | 6,750 USD | -2.02% |
| +50%（4,500 USD） | 7,348 USD | 7,500 USD | -2.02% |
| +100%（6,000 USD） | 8,485 USD | 9,000 USD | -5.72% |
| -25%（2,250 USD） | 5,196 USD | 5,250 USD | -1.03% |
| -50%（1,500 USD） | 4,243 USD | 4,500 USD | -5.72% |

::: tip
只要价格发生任意方向的偏移，无常损失就会出现。价格偏移越大，损失越大。之所以叫"无常"，是因为如果价格最终回到初始比例，损失就会消失。手续费收入通常可以部分甚至完全覆盖无常损失。
:::

## 五、借贷协议

### 1. 运作模型

以 Aave 和 Compound 为代表的借贷协议，其核心逻辑如下：

**存款方（Supplier）**：
1. 将资产存入协议的资金池
2. 获得等值的生息代币（如 Aave 的 aToken、Compound 的 cToken）
3. 利息实时累积，赎回时本息一并取回

**借款方（Borrower）**：
1. 先存入抵押资产
2. 根据抵押率（Collateral Factor）借出所需代币
3. 持续支付借款利息
4. 还款后取回抵押物

### 2. 关键参数

| 参数 | 说明 | 典型值 |
|------|------|--------|
| 抵押率（LTV） | 可借出金额 / 抵押品价值 | ETH: 80%，USDC: 85% |
| 清算阈值 | 低于此值触发清算 | ETH: 82.5% |
| 清算罚金 | 清算时额外扣除的比例 | 5%-10% |
| 存款 APY | 存款年化收益率 | 动态，1%-8% |
| 借款 APR | 借款年化利率 | 动态，2%-15% |

### 3. 清算机制

::: warning 清算风险
当你的借款价值 / 抵押品价值超过清算阈值时，任何人都可以调用清算函数，偿还你的部分债务并获得你的抵押品（含清算罚金）。在市场剧烈波动时，清算可能在几分钟内发生，务必保持健康的抵押率。
:::

## 六、闪电贷

### 1. 什么是闪电贷

闪电贷（Flash Loan）是 DeFi 独有的创新：你可以在**一笔交易内**借出任意数量的资产，只要在交易结束前连本带息归还，否则整笔交易回滚，就像从未发生过一样。

这意味着你不需要任何抵押品，就可以调动数百万美元的资金。

### 2. 典型用例

- **套利**：在不同 DEX 之间利用价差获利
- **清算**：借入资金执行清算操作，赚取清算罚金
- **抵押品置换**：一次性将 Aave 中的抵押品从 ETH 换成 WBTC
- **自清算**：借入资金偿还自己的债务，避免被他人清算

### 3. 闪电贷代码示例

::: details 使用 Aave V3 闪电贷进行套利
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@aave/v3-core/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol"; // [!code highlight]
import "@aave/v3-core/contracts/interfaces/IPoolAddressesProvider.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IDex {
    function swap(address tokenIn, address tokenOut, uint256 amountIn) external returns (uint256);
}

contract FlashLoanArbitrage is FlashLoanSimpleReceiverBase { // [!code highlight]
    address public owner;
    IDex public dexA; // 价格较低的 DEX
    IDex public dexB; // 价格较高的 DEX

    constructor(
        address _addressProvider,
        address _dexA,
        address _dexB
    ) FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider)) {
        owner = msg.sender;
        dexA = IDex(_dexA);
        dexB = IDex(_dexB);
    }

    /// @notice 发起闪电贷
    /// @param asset 借入的代币地址
    /// @param amount 借入的数量
    function executeArbitrage(address asset, uint256 amount) external {
        require(msg.sender == owner, "Only owner");
        // 向 Aave 池发起闪电贷，手续费为借款金额的 0.05%
        POOL.flashLoanSimple(address(this), asset, amount, "", 0); // [!code highlight]
    }

    /// @notice Aave 回调函数 —— 闪电贷资金到账后自动执行
    function executeOperation( // [!code highlight]
        address asset,
        uint256 amount,
        uint256 premium, // 手续费
        address initiator,
        bytes calldata
    ) external override returns (bool) {
        require(msg.sender == address(POOL), "Caller must be pool");
        require(initiator == address(this), "Initiator must be this contract");

        // 步骤 1：在 DEX A 用 USDC 买入 ETH（低价买入）
        IERC20(asset).approve(address(dexA), amount);
        uint256 ethReceived = dexA.swap(asset, 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, amount);

        // 步骤 2：在 DEX B 用 ETH 卖出换回 USDC（高价卖出）
        IERC20(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2).approve(address(dexB), ethReceived);
        uint256 usdcReceived = dexB.swap(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, asset, ethReceived);

        // 步骤 3：确保有足够资金偿还闪电贷 + 手续费
        uint256 totalOwed = amount + premium;
        require(usdcReceived >= totalOwed, "Arbitrage not profitable"); // [!code highlight]

        // 步骤 4：授权 Aave 池取回借款和手续费
        IERC20(asset).approve(address(POOL), totalOwed);

        // 利润留在合约中，后续由 owner 提取
        return true;
    }

    /// @notice 提取套利利润
    function withdrawProfit(address token) external {
        require(msg.sender == owner, "Only owner");
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner, balance);
    }
}
```
:::

## 七、收益耕作

收益耕作（Yield Farming）是指通过在 DeFi 协议中提供流动性或参与治理来获取额外代币奖励的策略。

### 1. 基本流程

1. 在 DEX 中提供流动性，获得 LP 代币
2. 将 LP 代币质押到收益农场合约
3. 获得治理代币奖励（如 UNI、SUSHI、CAKE）
4. 可选择复投（将奖励重新投入）以获得复利效果

### 2. 风险提示

::: danger 收益耕作的风险
- **智能合约风险**：农场合约可能存在漏洞被攻击
- **无常损失**：作为 LP 面临的价格波动风险
- **代币贬值**：奖励代币价格可能大幅下跌，导致实际收益远低于 APY 显示值
- **Rug Pull**：不明来源的项目可能携款跑路
- **高 APY 陷阱**：超高年化通常不可持续，往往伴随极高风险
:::

## 八、主流 DeFi 协议对比

| 协议 | 类型 | 核心机制 | TVL 量级 | 治理代币 | 特色 |
|------|------|---------|---------|---------|------|
| **Uniswap** | DEX | AMM（恒定乘积） | 50 亿+ USD | UNI | 集中流动性（V3），最大 DEX |
| **Aave** | 借贷 | 资金池 + 动态利率 | 100 亿+ USD | AAVE | 闪电贷首创者，多链部署 |
| **MakerDAO** | 稳定币 | 超额抵押铸造 DAI | 80 亿+ USD | MKR | 去中心化稳定币 DAI 发行方 |
| **Curve** | DEX | 稳定币优化 AMM | 40 亿+ USD | CRV | 低滑点稳定币交换，ve 代币经济 |
| **Compound** | 借贷 | cToken 生息模型 | 30 亿+ USD | COMP | 借贷挖矿先驱 |
| **Lido** | 质押 | 流动性质押 | 150 亿+ USD | LDO | ETH 流动性质押最大协议 |

::: tip 如何评估 DeFi 协议的安全性
1. **审计报告**：查看是否有知名审计公司（Trail of Bits、OpenZeppelin）的审计报告
2. **TVL 与历史**：高 TVL 和长期运行记录是信任信号
3. **开源代码**：合约代码是否在 Etherscan 上验证并开源
4. **治理透明度**：是否有活跃的社区治理和提案流程
5. **Bug Bounty**：是否在 Immunefi 等平台设立了漏洞赏金计划
:::
