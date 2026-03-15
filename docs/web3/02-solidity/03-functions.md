---
title: "函数与修饰器"
category: "Web3 · Solidity"
tags:
  - Solidity
  - 函数
  - modifier
excerpt: "函数是智能合约的核心执行单元，修饰器（modifier）提供了优雅的访问控制和前置条件检查机制。"
date: 2026-03-15
---

# 函数与修饰器

## 一、函数声明与可见性

Solidity 函数的基本语法结构为：

```solidity
function 函数名(参数类型 参数名) 可见性 状态可变性 returns (返回类型) {
    // 函数体
}
```

### 1. 四种可见性修饰符

| 可见性 | 合约内部 | 子合约 | 外部合约 | 外部交易 | Gas 消耗 |
|--------|---------|--------|---------|---------|----------|
| `public` | 可调用 | 可调用 | 可调用 | 可调用 | 较高（自动生成 getter） |
| `private` | 可调用 | 不可调用 | 不可调用 | 不可调用 | 最低 |
| `internal` | 可调用 | 可调用 | 不可调用 | 不可调用 | 低 |
| `external` | 不可直接调用 | 不可调用 | 可调用 | 可调用 | 最优（calldata 直接读取） |

::: tip
`external` 函数的参数直接从 calldata 读取，比 `public` 函数更节省 Gas。如果一个函数只被外部调用，优先使用 `external`。在合约内部调用 `external` 函数需要使用 `this.functionName()`，但这会产生一次外部调用的 Gas 开销。
:::

::: details 可见性示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VisibilityExample {
    uint256 private secretNumber = 42;

    // public：任何人都可以调用
    function getPublicInfo() public view returns (string memory) {
        return "This is public";
    }

    // private：仅当前合约可调用
    function _calculateReward(uint256 _amount) private pure returns (uint256) { // [!code highlight]
        return _amount * 2;
    }

    // internal：当前合约和子合约可调用
    function _validateInput(uint256 _value) internal pure returns (bool) { // [!code highlight]
        return _value > 0 && _value <= 10000;
    }

    // external：仅外部调用，参数使用 calldata 更省 Gas
    function processOrder(bytes calldata _orderData) external pure returns (bytes32) { // [!code highlight]
        return keccak256(_orderData);
    }

    function demo() public view returns (uint256) {
        // 内部可以调用 private 和 internal 函数
        uint256 reward = _calculateReward(secretNumber);
        return reward;
    }
}
```
:::

### 2. 命名约定

| 可见性 | 命名约定 | 示例 |
|--------|----------|------|
| `public` / `external` | 驼峰命名 | `getBalance()` |
| `private` / `internal` | 下划线前缀 + 驼峰 | `_calculateFee()` |

## 二、状态可变性

状态可变性（State Mutability）决定了函数能否读取或修改区块链状态。

| 修饰符 | 读取状态 | 修改状态 | 接收 ETH | Gas 消耗 |
|--------|---------|---------|---------|----------|
| （默认） | 可以 | 可以 | 不可以 | 需要 Gas |
| `view` | 可以 | 不可以 | 不可以 | 外部调用免费 |
| `pure` | 不可以 | 不可以 | 不可以 | 外部调用免费 |
| `payable` | 可以 | 可以 | 可以 | 需要 Gas |

::: details 状态可变性示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MutabilityExample {
    uint256 public totalDeposits;
    mapping(address => uint256) public userDeposits;

    // view：只读取状态变量，不修改
    function getUserDeposit(address _user) public view returns (uint256) { // [!code highlight]
        return userDeposits[_user];
    }

    // pure：不读取也不修改状态变量，纯计算
    function calculateFee(uint256 _amount, uint256 _feeRate) public pure returns (uint256) { // [!code highlight]
        return (_amount * _feeRate) / 10000;
    }

    // payable：可以接收 ETH
    function deposit() public payable { // [!code highlight]
        require(msg.value > 0, "Must send ETH");
        userDeposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
    }

    // 默认（无修饰符）：可以修改状态
    function resetDeposit(address _user) public {
        totalDeposits -= userDeposits[_user];
        userDeposits[_user] = 0;
    }
}
```
:::

::: warning
`view` 和 `pure` 函数在被外部直接调用时不消耗 Gas（因为只需要本地节点计算）。但如果它们被另一个消耗 Gas 的函数内部调用，则会计入该交易的 Gas 消耗。
:::

## 三、函数参数与返回值

### 1. 多返回值

Solidity 支持返回多个值，调用方可以使用解构赋值接收。

::: details 多返回值示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReturnExample {
    struct TokenInfo {
        string name;
        string symbol;
        uint8 decimals;
    }

    TokenInfo private tokenInfo = TokenInfo("MyToken", "MTK", 18);

    /// @notice 返回多个值
    function getTokenDetails() public view returns (
        string memory name,
        string memory symbol,
        uint8 decimals
    ) {
        return (tokenInfo.name, tokenInfo.symbol, tokenInfo.decimals); // [!code highlight]
    }

    /// @notice 命名返回值（自动返回）
    function calculateSplit(uint256 _total) public pure returns (
        uint256 half,     // [!code highlight]
        uint256 remainder // [!code highlight]
    ) {
        half = _total / 2;
        remainder = _total - half;
        // 不需要显式 return，命名返回值会自动返回
    }

    function demo() public view {
        // 解构赋值接收多返回值
        (string memory name, , uint8 decimals) = getTokenDetails(); // [!code highlight]
        // 使用逗号跳过不需要的值
    }
}
```
:::

## 四、构造函数

`constructor` 是合约部署时自动执行的特殊函数，仅执行一次，用于初始化合约状态。

::: details 构造函数示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TokenSale {
    address public owner;
    string public tokenName;
    uint256 public tokenPrice;
    uint256 public saleStartTime;

    /// @notice 构造函数：设置代币销售的初始参数
    constructor(
        string memory _tokenName,
        uint256 _priceInWei
    ) {
        owner = msg.sender; // [!code highlight]
        tokenName = _tokenName;
        tokenPrice = _priceInWei;
        saleStartTime = block.timestamp;
    }
}
```
:::

## 五、receive 与 fallback 函数

这两个特殊函数处理合约接收 ETH 和未匹配调用的场景。

```
                     合约接收调用
                         │
                    msg.data 是否为空？
                    ┌─────┴─────┐
                   是           否
                    │            │
              receive() 是否存在？  匹配到函数？
              ┌─────┴─────┐     ┌─────┴─────┐
             是           否   是           否
              │            │    │            │
         receive()    fallback() 执行对应函数  fallback() 是否存在？
                                            ┌─────┴─────┐
                                           是           否
                                            │            │
                                       fallback()    revert
```

::: details receive 与 fallback 示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EtherReceiver {
    event EtherReceived(address indexed sender, uint256 amount);
    event FallbackCalled(address indexed sender, uint256 amount, bytes data);

    /// @notice 接收纯 ETH 转账（msg.data 为空时触发）
    receive() external payable { // [!code highlight]
        emit EtherReceived(msg.sender, msg.value);
    }

    /// @notice 兜底函数（没有匹配的函数签名时触发）
    fallback() external payable { // [!code highlight]
        emit FallbackCalled(msg.sender, msg.value, msg.data);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
```
:::

::: warning
如果你的合约需要接收 ETH（如通过 `transfer`、`send` 或直接转账），必须实现 `receive()` 或 `fallback()` 函数，否则转账交易会被 revert。
:::

## 六、自定义修饰器

修饰器（modifier）是 Solidity 独有的语法特性，用于在函数执行前后插入检查逻辑，避免重复代码。

### 1. 基本修饰器

::: details onlyOwner 修饰器模式
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AccessControl {
    address public owner;
    bool private locked;

    constructor() {
        owner = msg.sender;
    }

    /// @notice 权限检查修饰器：仅合约所有者可调用
    modifier onlyOwner() { // [!code highlight]
        require(msg.sender == owner, "Not the owner");
        _; // 占位符：表示被修饰函数的代码执行位置 // [!code highlight]
    }

    /// @notice 防重入修饰器
    modifier nonReentrant() { // [!code highlight]
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    /// @notice 使用修饰器保护的函数
    function withdraw(uint256 _amount) public onlyOwner nonReentrant { // [!code highlight]
        require(address(this).balance >= _amount, "Insufficient balance");
        payable(owner).transfer(_amount);
    }

    /// @notice 转移所有权
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}
```
:::

### 2. 带参数的修饰器

::: details 带参数的修饰器示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AdvancedModifiers {
    mapping(address => uint256) public balances;
    uint256 public minDeposit = 0.01 ether;

    /// @notice 参数化修饰器：检查最小金额
    modifier minimumAmount(uint256 _min) { // [!code highlight]
        require(msg.value >= _min, "Below minimum amount");
        _;
    }

    /// @notice 时间限制修饰器
    modifier onlyBefore(uint256 _deadline) { // [!code highlight]
        require(block.timestamp < _deadline, "Too late");
        _;
    }

    /// @notice 组合使用多个修饰器（按从左到右的顺序执行）
    function deposit(uint256 _deadline)
        public
        payable
        minimumAmount(minDeposit) // [!code highlight]
        onlyBefore(_deadline)    // [!code highlight]
    {
        balances[msg.sender] += msg.value;
    }
}
```
:::

::: tip
多个修饰器按声明顺序从左到右依次执行。执行到 `_` 时进入下一个修饰器或函数体，函数体执行完后按相反顺序完成各修饰器 `_` 之后的代码。
:::

## 七、函数重载

Solidity 支持函数重载（Function Overloading），即同一合约中可以有同名但参数不同的函数。

::: details 函数重载示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OverloadingExample {
    event Transfer(address indexed to, uint256 amount);

    /// @notice 向单个地址转账
    function distribute(address _to, uint256 _amount) public { // [!code highlight]
        // 转账逻辑
        emit Transfer(_to, _amount);
    }

    /// @notice 向多个地址等额转账
    function distribute(address[] calldata _recipients, uint256 _amountEach) public { // [!code highlight]
        for (uint256 i = 0; i < _recipients.length; i++) {
            emit Transfer(_recipients[i], _amountEach);
        }
    }
}
```
:::

::: danger
函数重载虽然方便，但在外部调用时可能引发歧义。EVM 通过函数选择器（函数签名的前 4 字节哈希）区分不同重载版本，如果参数类型存在隐式转换关系（如 `uint8` 和 `uint256`），编译器可能报错。建议优先使用不同的函数名以提高代码清晰度。
:::

## 八、总结

函数和修饰器是 Solidity 合约的核心构建块，关键要点：

- 根据调用场景选择合适的可见性，外部调用优先用 `external`
- 正确标注 `view` / `pure` / `payable`，让意图明确且节省 Gas
- 善用修饰器抽取重复的检查逻辑，保持函数体简洁
- 理解 `receive` / `fallback` 的触发条件，确保合约能正确处理 ETH 转账
