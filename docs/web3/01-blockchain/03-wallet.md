---
title: "钱包与账户"
category: "Web3 · Ethereum"
tags:
  - MetaMask
  - 钱包
  - 密钥管理
excerpt: "区块链钱包是你与链上世界交互的入口，理解公钥、私钥和助记词的关系是保障资产安全的第一步。"
date: 2026-03-15
---

# 钱包与账户

区块链钱包并不像现实中的钱包那样"存放"资产，它本质上是一个密钥管理工具——保存你的私钥，用私钥对交易进行签名，从而证明你有权操作链上某个地址的资产。本文将带你深入理解密钥体系、助记词原理、账户类型，并手把手完成 MetaMask 钱包的安装与配置。

## 一、公钥、私钥与地址

### 1. 三者的关系

以太坊的密钥体系基于椭圆曲线密码学（ECDSA，使用 secp256k1 曲线）。三者之间的推导关系是单向的：

```
私钥 (Private Key)
  │  椭圆曲线乘法（不可逆）
  ▼
公钥 (Public Key)
  │  Keccak-256 哈希 → 取后 20 字节
  ▼
地址 (Address)  →  0x71C7656EC7ab88b098defB751B7401B5f6d8976F
```

| 概念 | 格式 | 长度 | 说明 |
|------|------|------|------|
| **私钥** | 十六进制字符串 | 256 位（64 个十六进制字符） | 控制账户的唯一凭证，必须绝对保密 |
| **公钥** | 十六进制字符串 | 512 位（128 个十六进制字符） | 由私钥推导，可公开 |
| **地址** | `0x` + 40 个十六进制字符 | 160 位（20 字节） | 公钥的 Keccak-256 哈希后 20 字节 |

::: danger
私钥是你资产的唯一控制权。任何人获得你的私钥，就等于完全控制了你的账户。私钥丢失无法找回，泄露无法撤销。没有"客服"，没有"重置密码"，这就是去中心化的代价。
:::

### 2. 用代码理解密钥推导

::: details 从私钥推导地址
```js
// crypto/deriveAddress.js
const { ethers } = require('ethers');

// 随机生成一个钱包（仅供学习，生产环境不要这样生成）
const wallet = ethers.Wallet.createRandom();

console.log('助记词:', wallet.mnemonic.phrase); // [!code highlight]
console.log('私钥:  ', wallet.privateKey);
console.log('公钥:  ', wallet.signingKey.publicKey);
console.log('地址:  ', wallet.address); // [!code highlight]

// 验证：从私钥还原钱包，地址应该一致
const restoredWallet = new ethers.Wallet(wallet.privateKey);
console.log('还原地址:', restoredWallet.address);
console.log('地址一致:', wallet.address === restoredWallet.address); // true
```
:::

### 3. 签名与验证机制

当你发起一笔转账时，钱包会使用你的私钥对交易数据进行签名。网络中的任何节点都可以通过你的公钥（从签名中恢复）来验证这笔交易确实由你授权，而无需知道你的私钥。

```
发送方                                    验证节点
┌─────────────────┐                   ┌─────────────────┐
│ 1. 构造交易数据  │                   │ 4. 从签名恢复公钥 │
│ 2. 用私钥签名    │ ──── 广播 ────▶  │ 5. 推导出地址     │
│ 3. 附带签名发送  │                   │ 6. 对比发送方地址 │
└─────────────────┘                   │ 7. 验证通过 ✓     │
                                      └─────────────────┘
```

::: details 签名与验证示例
```js
// crypto/signAndVerify.js
const { ethers } = require('ethers');

async function signAndVerify() {
  // 创建钱包
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const wallet = new ethers.Wallet(privateKey);
  console.log('签名者地址:', wallet.address);

  // 待签名消息
  const message = '授权转账 1.5 ETH 至 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2';

  // 签名
  const signature = await wallet.signMessage(message); // [!code highlight]
  console.log('签名:', signature);

  // 验证：任何人都可以从签名中恢复签名者地址
  const recoveredAddress = ethers.verifyMessage(message, signature); // [!code highlight]
  console.log('恢复地址:', recoveredAddress);
  console.log('验证通过:', recoveredAddress === wallet.address); // true
}

signAndVerify();
```
:::

## 二、助记词

### 1. 什么是助记词

助记词（Mnemonic Phrase）是一组 12 或 24 个英文单词，基于 **BIP-39** 标准生成。它本质上是私钥的人类可读编码形式——从助记词可以确定性地推导出私钥，从而恢复整个钱包。

```
助记词示例（12 个单词）：
abandon  ability  able  about  above  absent
absorb   abstract absurd abuse  access accident
```

### 2. 助记词的生成过程

1. 生成 128 位（12 词）或 256 位（24 词）的随机熵
2. 对熵进行 SHA-256 哈希，取前 4 位（12 词）或 8 位（24 词）作为校验和
3. 将熵 + 校验和拼接后，每 11 位映射到 BIP-39 标准词库（共 2048 个单词）中的一个单词
4. 得到 12 或 24 个单词的助记词序列

::: warning
助记词等同于私钥。任何人拿到你的助记词，就可以恢复你的全部账户和资产。切勿截图保存、发送给他人，或存储在联网设备上。推荐使用纸质或金属板物理备份。
:::

### 3. 助记词与私钥的关系

```
助记词 (12/24 个单词)
  │  BIP-39 → 种子 (Seed)
  ▼
512 位种子
  │  BIP-32 → 分层确定性推导
  ▼
主私钥 (Master Key)
  │  BIP-44 → 派生路径 m/44'/60'/0'/0/index
  ├──▶ 地址 0 的私钥 → 地址 0
  ├──▶ 地址 1 的私钥 → 地址 1
  └──▶ 地址 N 的私钥 → 地址 N
```

## 三、HD 钱包

### 1. BIP-32：分层确定性钱包

HD 钱包（Hierarchical Deterministic Wallet）是一种通过单个种子（Seed）派生出无限多个密钥对的钱包结构。所有密钥都通过确定性的数学函数从种子推导，因此只需备份一次助记词，就能恢复所有账户。

### 2. BIP-44：多链统一路径

BIP-44 定义了一套标准的派生路径格式：

```
m / purpose' / coin_type' / account' / change / address_index
m /    44'   /     60'    /    0'    /   0    /      0
```

| 层级 | 含义 | 以太坊取值 |
|------|------|-----------|
| `purpose` | 固定为 44（BIP-44 标准） | 44 |
| `coin_type` | 币种编号 | 60（ETH）、0（BTC） |
| `account` | 账户索引 | 0、1、2… |
| `change` | 外部/内部链 | 0（外部接收）、1（找零） |
| `address_index` | 地址序号 | 0、1、2… |

::: tip
以太坊的默认派生路径是 `m/44'/60'/0'/0/0`。当你在 MetaMask 中点击"创建账户"生成第二个地址时，实际上是将 `address_index` 从 0 变为 1，即路径变为 `m/44'/60'/0'/0/1`。
:::

::: details 从助记词派生多个地址
```js
// wallet/hdWallet.js
const { ethers } = require('ethers');

const mnemonic = 'test test test test test test test test test test test junk';

// 从助记词创建 HD 钱包
const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);

// 派生前 5 个地址
for (let i = 0; i < 5; i++) {
  const path = `m/44'/60'/0'/0/${i}`; // [!code highlight]
  const childWallet = hdNode.derivePath(path);
  console.log(`地址 ${i}: ${childWallet.address}`);
  console.log(`  私钥: ${childWallet.privateKey}`);
}
```
:::

## 四、MetaMask 安装与配置

MetaMask 是目前最流行的以太坊浏览器钱包扩展，支持 Chrome、Firefox、Brave 和 Edge。以下是从零开始的完整安装流程。

### 1. 安装步骤

1. 打开 [MetaMask 官网](https://metamask.io)，点击"Download"
2. 选择你的浏览器（推荐 Chrome），跳转到对应的扩展商店
3. 点击"添加到 Chrome"并确认安装
4. 安装完成后，浏览器右上角出现狐狸图标

::: danger
只从 MetaMask 官网（metamask.io）或官方浏览器扩展商店安装。搜索引擎中经常出现钓鱼网站，安装假冒的 MetaMask 扩展会导致你的资产被盗。安装前务必确认扩展的发布者是"metamask.io"。
:::

### 2. 创建钱包

1. 点击"创建新钱包"
2. 设置解锁密码（仅用于本地解锁扩展，不等于私钥）
3. **备份助记词**：MetaMask 会显示 12 个单词，这是你钱包的终极备份
4. 按顺序确认助记词，完成创建

### 3. 添加测试网络

默认情况下 MetaMask 只显示以太坊主网。开发测试时需要添加测试网：

1. 点击 MetaMask 顶部的网络选择器
2. 点击"显示测试网络"开关
3. 选择 **Sepolia 测试网**
4. 前往 [Sepolia Faucet](https://sepoliafaucet.com) 获取测试 ETH

::: details 通过代码添加自定义网络到 MetaMask
```js
// src/utils/addNetwork.js

/**
 * 向 MetaMask 添加自定义网络（如 Layer2 或本地开发链）
 */
async function addCustomNetwork() {
  if (!window.ethereum) {
    alert('请先安装 MetaMask');
    return;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain', // [!code highlight]
      params: [{
        chainId: '0xaa36a7', // Sepolia 的 chainId（十六进制）
        chainName: 'Sepolia Testnet',
        nativeCurrency: {
          name: 'SepoliaETH',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://sepolia.infura.io/v3/YOUR_API_KEY'], // [!code highlight]
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
      }],
    });
    console.log('网络添加成功');
  } catch (error) {
    console.error('添加网络失败:', error);
  }
}
```
:::

## 五、账户类型

以太坊中存在两种截然不同的账户类型，理解它们的区别对 DApp 开发至关重要。

### 1. EOA 与合约账户对比

| 维度 | EOA（外部拥有账户） | 合约账户（Contract Account） |
|------|---------------------|---------------------------|
| **控制方式** | 由私钥持有者控制 | 由合约代码逻辑控制 |
| **创建方式** | 生成密钥对即创建 | 通过部署交易创建 |
| **是否有代码** | 无 | 有（不可变的字节码） |
| **能否发起交易** | 可以 | 不可以（只能被调用后执行） |
| **Gas 消耗** | 发起交易时支付 | 被调用时由调用者支付 |
| **地址格式** | 与合约账户相同（0x + 40 字符） | 与 EOA 相同 |
| **典型用途** | 用户钱包 | 智能合约（DeFi 协议、NFT 合约等） |

### 2. 账户抽象（EIP-4337）

传统模式下，只有 EOA 能发起交易，这导致了诸多用户体验问题（必须持有 ETH 支付 Gas、丢失私钥无法恢复等）。EIP-4337 引入了"账户抽象"概念，允许合约账户具备类似 EOA 的主动发起能力，带来了以下改进：

- **社交恢复**：通过预设的"监护人"地址恢复钱包，无需担心私钥丢失
- **Gas 代付**：DApp 可以代用户支付 Gas，降低使用门槛
- **批量交易**：一次签名执行多笔操作（如授权 + 交换代币）
- **多签认证**：需要多个签名方共同授权才能执行高价值操作

::: tip
账户抽象是以太坊改善用户体验的关键方向。如果你正在设计面向大众用户的 DApp，建议关注 EIP-4337 和 Safe（原 Gnosis Safe）等相关基础设施。
:::

## 六、安全最佳实践

私钥和助记词的安全管理是区块链世界中最重要的事情，没有之一。以下是你必须遵守的安全准则。

### 1. 必须做的事

- 将助记词抄写在纸上或刻在金属板上，存放在安全的物理位置
- 使用硬件钱包（如 Ledger、Trezor）存储大额资产
- 为不同用途创建不同的钱包地址（日常交互、长期持有、开发测试）
- 定期检查已授权的合约权限，撤销不再使用的授权（通过 revoke.cash）
- 在签名任何交易前仔细阅读交易内容

### 2. 绝对不能做的事

::: danger 安全红线
- **不要**将助记词或私钥以截图、照片形式保存在手机或电脑上
- **不要**将助记词或私钥通过微信、邮件、Telegram 等任何通讯工具发送
- **不要**在任何网站上输入助记词（除非你在恢复自己的钱包）
- **不要**将私钥写在代码中并提交到 GitHub
- **不要**点击"空投"链接或 Discord 中陌生人发送的 DApp 链接
- **不要**将所有资产放在一个热钱包（浏览器扩展钱包）中
- **不要**在不明来源的 DApp 上执行 `approve(MAX_UINT256)` 无限授权
:::

### 3. 常见攻击方式

| 攻击类型 | 手段 | 防范措施 |
|---------|------|---------|
| **钓鱼网站** | 仿冒知名 DApp 界面，诱导输入助记词 | 核实 URL，使用书签访问常用 DApp |
| **恶意合约授权** | 诱导你授权无限额度的代币转移 | 使用 revoke.cash 定期检查和撤销授权 |
| **假空投** | 发送可疑代币到你的地址，交互后盗取资产 | 不要与不明代币交互 |
| **剪贴板劫持** | 恶意软件替换你复制的钱包地址 | 粘贴后仔细核对地址的前后几位 |
| **社会工程** | 假冒客服/项目方索要私钥 | 没有任何正当理由需要你提供私钥 |

::: warning
在 Web3 世界中，"Don't trust, verify"（不要信任，去验证）是生存法则。每一笔签名、每一次授权都可能带来不可逆的后果，养成谨慎操作的习惯比任何安全工具都重要。
:::

## 七、本章小结

通过本文，你已经掌握了区块链钱包和账户的核心知识：

- **密钥体系**：私钥 → 公钥 → 地址，三者的推导关系是单向不可逆的
- **助记词**：基于 BIP-39 标准的私钥人类可读编码，是钱包的终极备份
- **HD 钱包**：通过 BIP-32/44 标准从单个种子派生无限多个地址
- **MetaMask**：最主流的浏览器钱包扩展，是 DApp 开发和使用的基本工具
- **账户类型**：EOA 由私钥控制，合约账户由代码逻辑控制，EIP-4337 正在模糊两者的界限
- **安全实践**：私钥和助记词是你的一切，物理备份、硬件钱包、谨慎授权是核心原则

下一篇将深入 Gas 与交易机制，带你理解以太坊的费用模型和交易生命周期。
