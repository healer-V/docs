---
title: "安全最佳实践"
category: "Web3 · Solidity"
tags:
  - Solidity
  - 安全
  - 审计
excerpt: "智能合约一旦部署就无法修改，安全漏洞将导致不可逆的资产损失，掌握常见攻击模式和防护措施至关重要。"
date: 2026-03-15
---

# 安全最佳实践

## 一、重入攻击

重入攻击（Reentrancy Attack）是智能合约历史上最臭名昭著的漏洞，2016 年 The DAO 事件因此损失了价值约 6000 万美元的 ETH，直接导致以太坊硬分叉。

### 1. 攻击原理

当合约 A 向合约 B 发送 ETH 时，会触发合约 B 的 `receive()` 或 `fallback()` 函数。如果合约 A 在发送 ETH 之后才更新状态，攻击合约 B 可以在 `receive()` 中再次调用合约 A 的提取函数，形成递归调用，反复提取资金。

### 2. 漏洞代码 vs 安全代码

::: details 存在重入漏洞的合约
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title 存在重入漏洞的合约 - 请勿在生产中使用！
contract VulnerableVault {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() public {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");

        // 危险：先发送 ETH，再更新状态
        (bool success, ) = msg.sender.call{value: amount}(""); // [!code highlight]
        require(success, "Transfer failed");

        balances[msg.sender] = 0; // 状态更新在转账之后！ // [!code highlight]
    }
}

/// @title 攻击合约
contract ReentrancyAttacker {
    VulnerableVault public vault;

    constructor(address _vaultAddress) {
        vault = VulnerableVault(_vaultAddress);
    }

    function attack() external payable {
        vault.deposit{value: msg.value}();
        vault.withdraw();
    }

    // 接收 ETH 时再次调用 withdraw，形成递归
    receive() external payable { // [!code highlight]
        if (address(vault).balance >= 1 ether) {
            vault.withdraw(); // 重入调用！ // [!code highlight]
        }
    }
}
```
:::

### 3. Checks-Effects-Interactions 模式

这是防御重入攻击的核心原则：先检查条件（Checks），再更新状态（Effects），最后进行外部交互（Interactions）。

::: details 安全的合约实现
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title 使用 CEI 模式的安全合约
contract SecureVault {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() public {
        uint256 amount = balances[msg.sender];

        // Checks：检查条件
        require(amount > 0, "No balance"); // [!code highlight]

        // Effects：先更新状态
        balances[msg.sender] = 0; // [!code highlight]

        // Interactions：最后进行外部调用
        (bool success, ) = msg.sender.call{value: amount}(""); // [!code highlight]
        require(success, "Transfer failed");
    }
}
```
:::

### 4. 使用 ReentrancyGuard

OpenZeppelin 提供了现成的重入防护修饰器，通过互斥锁阻止嵌套调用。

::: details ReentrancyGuard 使用示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; // [!code highlight]

contract ProtectedVault is ReentrancyGuard { // [!code highlight]
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // nonReentrant 修饰器阻止重入
    function withdraw() public nonReentrant { // [!code highlight]
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");

        balances[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
```
:::

::: danger
即使使用了 `ReentrancyGuard`，也建议同时遵循 CEI 模式。防御应当分层叠加，不要依赖单一机制。跨合约的重入（合约 A → 合约 B → 合约 A 的另一个函数）更隐蔽，需要特别注意。
:::

## 二、整数溢出

### 1. 问题说明

在 Solidity 0.8 之前，整数运算溢出不会报错，而是静默回绕。例如 `uint8(255) + 1 = 0`，这可能导致灾难性后果。

| Solidity 版本 | 溢出行为 | 防护方式 |
|--------------|---------|---------|
| < 0.8.0 | 静默回绕，不报错 | 必须使用 SafeMath 库 |
| >= 0.8.0 | 自动检查，溢出时 revert | 内置保护，无需额外处理 |
| >= 0.8.0 + `unchecked` | 跳过溢出检查 | 开发者自行确保安全 |

### 2. Solidity 0.8+ 的内置保护

::: details 溢出保护对比
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OverflowExample {
    /// @notice 安全运算：溢出时自动 revert
    function safeIncrement(uint8 _value) public pure returns (uint8) {
        return _value + 1; // 如果 _value = 255，交易会 revert // [!code highlight]
    }

    /// @notice 使用 unchecked 跳过检查（仅在确保安全时使用）
    function unsafeIncrement(uint256 _value) public pure returns (uint256) {
        unchecked { // [!code highlight]
            return _value + 1; // 节省约 100 Gas，但失去溢出保护
        }
    }

    /// @notice 安全的 unchecked 使用场景：循环计数器
    function sumArray(uint256[] calldata _numbers) public pure returns (uint256 total) {
        for (uint256 i = 0; i < _numbers.length; ) {
            total += _numbers[i];
            unchecked { i++; } // i 不可能溢出（受数组长度限制） // [!code highlight]
        }
    }
}
```
:::

::: warning
`unchecked` 块内的代码不受溢出保护，仅在你能数学证明不会溢出时使用。常见的安全使用场景是循环变量 `i++`，因为循环条件已限制了范围。
:::

## 三、访问控制

缺乏适当的访问控制是合约被攻击的另一大原因。关键操作必须限制调用者权限。

### 1. Ownable 模式

::: details 基础访问控制
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Treasury is Ownable {
    constructor() Ownable(msg.sender) {}

    /// @notice 仅 owner 可以提取资金
    function withdraw(address _to, uint256 _amount) public onlyOwner { // [!code highlight]
        require(address(this).balance >= _amount, "Insufficient funds");
        payable(_to).transfer(_amount);
    }

    receive() external payable {}
}
```
:::

### 2. 基于角色的访问控制

对于复杂系统，单一 owner 不够灵活。OpenZeppelin 的 `AccessControl` 支持多角色管理。

::: details 角色访问控制示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol"; // [!code highlight]

contract TokenWithRoles is AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE"); // [!code highlight]
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE"); // [!code highlight]

    mapping(address => uint256) public balances;
    bool public paused;

    constructor() {
        // 部署者获得管理员角色
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /// @notice 仅 MINTER_ROLE 可以铸造
    function mint(address _to, uint256 _amount) public onlyRole(MINTER_ROLE) { // [!code highlight]
        require(!paused, "Contract paused");
        balances[_to] += _amount;
    }

    /// @notice 仅 PAUSER_ROLE 可以暂停
    function togglePause() public onlyRole(PAUSER_ROLE) { // [!code highlight]
        paused = !paused;
    }
}
```
:::

## 四、tx.origin 与 msg.sender

### 1. 区别说明

| 属性 | 含义 | 钓鱼风险 |
|------|------|---------|
| `msg.sender` | 直接调用者（可以是合约或 EOA） | 安全 |
| `tx.origin` | 交易发起的原始 EOA | 有钓鱼风险 |

### 2. tx.origin 钓鱼攻击

::: details tx.origin 钓鱼攻击演示
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title 使用 tx.origin 的危险合约
contract UnsafeWallet {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function sendEther(address payable _to, uint256 _amount) public {
        // 危险：使用 tx.origin 进行身份验证
        require(tx.origin == owner, "Not owner"); // [!code highlight]
        _to.transfer(_amount);
    }

    receive() external payable {}
}

/// @title 钓鱼攻击合约
contract PhishingAttack {
    address payable public attacker;
    UnsafeWallet public targetWallet;

    constructor(address _walletAddress) {
        attacker = payable(msg.sender);
        targetWallet = UnsafeWallet(payable(_walletAddress));
    }

    // 诱骗受害者调用此函数（例如伪装成空投领取）
    function claimAirdrop() external { // [!code highlight]
        // tx.origin 是受害者（EOA），msg.sender 是本合约
        // UnsafeWallet 检查 tx.origin == owner 会通过！
        targetWallet.sendEther(attacker, address(targetWallet).balance);
    }
}
```
:::

::: danger
永远不要使用 `tx.origin` 进行身份验证。攻击者可以构造钓鱼合约，诱骗用户调用，此时 `tx.origin` 是用户地址，攻击合约可以冒充用户操作目标合约。始终使用 `msg.sender`。
:::

## 五、拒绝服务攻击

### 1. 推送模式 vs 拉取模式

::: details 拒绝服务漏洞与防护
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title 危险的推送（Push）模式 - 请勿使用
contract VulnerableRefund {
    address[] public funders;
    mapping(address => uint256) public contributions;

    /// @notice 向所有人退款 - 存在 DoS 风险
    function refundAll() public {
        // 如果某个 funder 是恶意合约（revert 所有转账），
        // 整个循环会失败，所有人都无法收到退款
        for (uint256 i = 0; i < funders.length; i++) { // [!code highlight]
            payable(funders[i]).transfer(contributions[funders[i]]); // 危险！
        }
    }
}

/// @title 安全的拉取（Pull）模式
contract SafeRefund {
    mapping(address => uint256) public pendingWithdrawals; // [!code highlight]

    /// @notice 记录待退款金额（不直接发送）
    function _addRefund(address _to, uint256 _amount) internal {
        pendingWithdrawals[_to] += _amount; // [!code highlight]
    }

    /// @notice 用户自行提取退款
    function withdrawRefund() public { // [!code highlight]
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No pending refund");

        pendingWithdrawals[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdraw failed");
    }
}
```
:::

::: tip
处理向多个地址发送 ETH 的场景时，始终使用拉取（Pull）模式：合约只记录待领取金额，由用户主动调用提取。推送（Push）模式中任何一个接收地址失败都会阻塞整个操作。
:::

## 六、前置交易攻击

前置交易（Front-Running）是矿工或 MEV 机器人利用交易在内存池中可见的特性，抢先执行获利交易。

| 攻击方式 | 说明 | 防护措施 |
|----------|------|----------|
| 三明治攻击 | 在目标交易前后各插入一笔交易 | 设置滑点容忍度 |
| 抢先交易 | 提高 Gas 费抢先执行 | 使用 commit-reveal 方案 |
| 尾随交易 | 在目标交易后紧跟执行 | 使用 Flashbots 等私有交易池 |

::: details Commit-Reveal 防前置交易方案
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title 使用 Commit-Reveal 的安全竞拍
contract CommitRevealAuction {
    struct Commitment {
        bytes32 hash;
        uint256 commitTime;
        bool revealed;
    }

    mapping(address => Commitment) public commitments;
    uint256 public commitDeadline;
    uint256 public revealDeadline;
    address public highestBidder;
    uint256 public highestBid;

    uint256 constant COMMIT_DURATION = 1 days;
    uint256 constant REVEAL_DURATION = 1 days;

    constructor() {
        commitDeadline = block.timestamp + COMMIT_DURATION;
        revealDeadline = commitDeadline + REVEAL_DURATION;
    }

    /// @notice 第一阶段：提交出价的哈希（隐藏真实出价）
    function commitBid(bytes32 _hash) external payable { // [!code highlight]
        require(block.timestamp < commitDeadline, "Commit phase ended");
        commitments[msg.sender] = Commitment({
            hash: _hash,
            commitTime: block.timestamp,
            revealed: false
        });
    }

    /// @notice 第二阶段：揭示真实出价
    function revealBid(uint256 _bidAmount, bytes32 _secret) external { // [!code highlight]
        require(block.timestamp >= commitDeadline, "Still in commit phase");
        require(block.timestamp < revealDeadline, "Reveal phase ended");

        Commitment storage commitment = commitments[msg.sender];
        require(!commitment.revealed, "Already revealed");

        // 验证哈希匹配
        bytes32 expectedHash = keccak256(abi.encodePacked(_bidAmount, _secret, msg.sender));
        require(commitment.hash == expectedHash, "Hash mismatch"); // [!code highlight]

        commitment.revealed = true;

        if (_bidAmount > highestBid) {
            highestBidder = msg.sender;
            highestBid = _bidAmount;
        }
    }

    /// @notice 生成提交哈希的辅助函数（离线调用）
    function generateHash(uint256 _bid, bytes32 _secret, address _bidder) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_bid, _secret, _bidder));
    }
}
```
:::

## 七、安全审计清单

在合约部署之前，使用以下清单逐项检查：

| 检查项 | 类别 | 说明 |
|--------|------|------|
| 遵循 CEI 模式 | 重入防护 | 外部调用放在函数最后 |
| 使用 ReentrancyGuard | 重入防护 | 涉及 ETH 转账的函数加锁 |
| 使用 `msg.sender` 而非 `tx.origin` | 身份验证 | 防止钓鱼攻击 |
| 使用 Solidity 0.8+ | 溢出保护 | 内置算术溢出检查 |
| 关键函数有访问控制 | 权限管理 | onlyOwner 或角色检查 |
| 使用拉取模式发送 ETH | DoS 防护 | 避免批量推送失败 |
| 外部调用检查返回值 | 调用安全 | `call` 返回值必须检查 |
| 避免硬编码 Gas | 兼容性 | Gas 成本可能因硬分叉改变 |
| 设置合理的限额 | 风险控制 | 单笔、单日限额 |
| 实现紧急暂停 | 应急机制 | Pausable 模式 |
| 状态变量初始化 | 默认值 | 确认默认值是否安全 |
| 循环有上限 | Gas 优化 | 避免无限循环耗尽 Gas |

## 八、安全分析工具

| 工具 | 类型 | 特点 | 安装方式 |
|------|------|------|----------|
| Slither | 静态分析 | 速度快，检测常见漏洞模式 | `pip3 install slither-analyzer` |
| Mythril | 符号执行 | 深度分析，覆盖路径广 | `pip3 install mythril` |
| Echidna | 模糊测试 | 基于属性的模糊测试 | 预编译二进制或 Docker |
| Foundry Forge | 测试框架 | invariant 测试、fuzz 测试 | `curl -L https://foundry.paradigm.xyz \| bash` |
| Solhint | 代码检查 | 风格和安全规则检查 | `npm install -g solhint` |

::: details 使用 Slither 分析合约
```bash
# 安装 Slither
pip3 install slither-analyzer

# 分析 Hardhat 项目中的合约
cd my-solidity-project
slither . --print human-summary

# 分析单个合约文件
slither contracts/MyContract.sol

# 输出详细的漏洞报告
slither . --json report.json
```
:::

::: tip
自动化工具能发现常见的模式化漏洞，但无法替代人工审计。对于管理大额资金的合约，务必聘请专业安全审计团队（如 OpenZeppelin、Trail of Bits、Certik）进行全面审计。
:::

## 九、安全编码原则总结

| 原则 | 实践 |
|------|------|
| 最小权限 | 每个角色只赋予必要的权限 |
| 失败安全 | 出现异常时合约应进入安全状态 |
| 防御纵深 | 多层防护，不依赖单一机制 |
| 简洁至上 | 代码越简单，攻击面越小 |
| 已知模式 | 优先使用经审计的库（OpenZeppelin） |
| 持续监控 | 部署后持续监控异常交易 |

::: danger
智能合约一旦部署就无法修改代码逻辑。虽然可以使用代理模式实现可升级合约，但这本身也引入了新的安全风险（如代理管理员权限被盗）。在部署前投入足够的时间进行测试和审计，远比部署后亡羊补牢代价小。
:::

## 十、总结

智能合约安全不是可选项，而是必选项。核心要点：

- 重入攻击用 CEI 模式 + `ReentrancyGuard` 双重防护
- Solidity 0.8+ 已内置溢出检查，`unchecked` 仅在确保安全时使用
- 用 `msg.sender` 做身份验证，永远不用 `tx.origin`
- ETH 发送使用拉取模式，避免推送模式的 DoS 风险
- 部署前使用 Slither 等工具扫描，重要合约聘请专业团队审计
- 没有绝对安全的合约，但遵循最佳实践可以大幅降低风险
