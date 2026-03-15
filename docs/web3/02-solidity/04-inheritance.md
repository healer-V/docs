---
title: "合约继承与接口"
category: "Web3 · Solidity"
tags:
  - Solidity
  - 继承
  - 接口
excerpt: "Solidity 支持多重继承和接口规范，合理使用继承和接口能提升合约的复用性和标准兼容性。"
date: 2026-03-15
---

# 合约继承与接口

## 一、单继承

Solidity 使用 `is` 关键字实现合约继承，子合约自动获得父合约的所有 `public` 和 `internal` 成员。

::: details 单继承基础示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title 基础权限合约
contract Ownable {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    function transferOwnership(address _newOwner) public virtual onlyOwner { // [!code highlight]
        require(_newOwner != address(0), "Ownable: new owner is zero address");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }
}

/// @title 代币合约，继承自 Ownable
contract MyToken is Ownable { // [!code highlight]
    string public name = "MyToken";
    uint256 public totalSupply;

    // 可以直接使用父合约的 onlyOwner 修饰器
    function mint(uint256 _amount) public onlyOwner { // [!code highlight]
        totalSupply += _amount;
    }
}
```
:::

## 二、构造函数继承

如果父合约的构造函数有参数，子合约必须传递这些参数。有两种方式：

::: details 构造函数参数传递
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Base {
    string public projectName;
    uint256 public version;

    constructor(string memory _name, uint256 _version) {
        projectName = _name;
        version = _version;
    }
}

// 方式一：在继承列表中直接传参（参数为固定值时推荐）
contract FixedChild is Base("DeFi Protocol", 1) { // [!code highlight]
    // 无需再写构造函数
}

// 方式二：在子合约构造函数中传参（参数需要动态传入时推荐）
contract DynamicChild is Base { // [!code highlight]
    constructor(string memory _name) Base(_name, 2) { // [!code highlight]
        // 子合约自己的初始化逻辑
    }
}
```
:::

## 三、函数重写

父合约中标记为 `virtual` 的函数可以在子合约中使用 `override` 重写。

::: details 函数重写示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BaseReward {
    /// @notice 计算奖励（可被子合约重写）
    function calculateReward(uint256 _amount) public virtual pure returns (uint256) { // [!code highlight]
        return _amount * 10 / 100; // 默认 10% 奖励
    }
}

contract PremiumReward is BaseReward {
    /// @notice 重写奖励计算：高级用户享受 20%
    function calculateReward(uint256 _amount) public override pure returns (uint256) { // [!code highlight]
        return _amount * 20 / 100;
    }
}

contract SuperReward is BaseReward {
    uint256 public bonusRate = 5;

    /// @notice 重写并扩展：基础奖励 + 额外奖励
    function calculateReward(uint256 _amount) public view override returns (uint256) {
        uint256 baseReward = super.calculateReward(_amount); // 调用父合约实现 // [!code highlight]
        return baseReward + (_amount * bonusRate / 100);
    }
}
```
:::

::: warning
如果你希望子合约能重写某个函数，父合约中必须添加 `virtual` 关键字。子合约重写时必须添加 `override` 关键字。忘记任何一个都会导致编译错误。
:::

## 四、多重继承

Solidity 支持多重继承，一个合约可以同时继承多个父合约。

### 1. 继承顺序规则

多重继承时，你必须按照 **从最基础到最派生** 的顺序列出父合约。

::: details 多重继承示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Pausable {
    bool public paused;

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    function pause() public virtual {
        paused = true;
    }

    function unpause() public virtual {
        paused = false;
    }
}

contract Ownable2 {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
}

// 继承顺序：从最基础到最派生
contract TokenVault is Ownable2, Pausable { // [!code highlight]
    mapping(address => uint256) public deposits;

    // 同时使用两个父合约的修饰器
    function deposit() public payable whenNotPaused { // [!code highlight]
        deposits[msg.sender] += msg.value;
    }

    // 重写 pause，增加 onlyOwner 限制
    function pause() public override onlyOwner { // [!code highlight]
        super.pause();
    }

    function unpause() public override onlyOwner {
        super.unpause();
    }
}
```
:::

### 2. 菱形继承与 C3 线性化

当多个父合约继承自同一个祖先合约时，形成菱形继承（Diamond Inheritance）。Solidity 使用 C3 线性化算法确定函数调用顺序。

::: details 菱形继承示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract A {
    event Log(string message);

    function greet() public virtual {
        emit Log("A.greet");
    }
}

contract B is A {
    function greet() public virtual override {
        emit Log("B.greet");
        super.greet(); // 调用 A.greet
    }
}

contract C is A {
    function greet() public virtual override {
        emit Log("C.greet");
        super.greet(); // 调用 A.greet
    }
}

// 菱形继承：D 同时继承 B 和 C，它们都继承自 A
contract D is B, C { // [!code highlight]
    function greet() public override(B, C) { // 必须指定所有被重写的父合约 // [!code highlight]
        super.greet();
        // C3 线性化顺序：D → C → B → A
        // super.greet() 调用 C.greet()
        // C 中的 super.greet() 调用 B.greet()（不是 A！）
        // B 中的 super.greet() 调用 A.greet()
        // 最终输出顺序：C.greet → B.greet → A.greet
    }
}
```
:::

::: tip
C3 线性化保证每个祖先合约的函数只执行一次，避免重复调用。你可以记住一个简单规则：`super` 调用的是 C3 线性化序列中的下一个合约，而不一定是直接父合约。
:::

## 五、抽象合约

包含未实现函数的合约必须标记为 `abstract`，它不能被直接部署，只能被继承。

::: details 抽象合约示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title 抽象合约：定义 DeFi 策略的通用框架
abstract contract Strategy { // [!code highlight]
    string public strategyName;

    constructor(string memory _name) {
        strategyName = _name;
    }

    /// @notice 抽象函数：子合约必须实现具体投资逻辑
    function invest(uint256 _amount) public virtual returns (uint256); // [!code highlight]

    /// @notice 抽象函数：子合约必须实现具体提取逻辑
    function withdraw(uint256 _amount) public virtual returns (uint256); // [!code highlight]

    /// @notice 已实现的通用函数
    function getStrategyName() public view returns (string memory) {
        return strategyName;
    }
}

/// @title 具体策略实现
contract StakingStrategy is Strategy("Staking") {
    mapping(address => uint256) public stakes;

    function invest(uint256 _amount) public override returns (uint256) { // [!code highlight]
        stakes[msg.sender] += _amount;
        return stakes[msg.sender];
    }

    function withdraw(uint256 _amount) public override returns (uint256) { // [!code highlight]
        require(stakes[msg.sender] >= _amount, "Insufficient stake");
        stakes[msg.sender] -= _amount;
        return _amount;
    }
}
```
:::

## 六、接口

接口（interface）定义了合约必须遵守的函数签名规范，是 ERC 标准的基础。

### 1. 接口规则

| 规则 | 说明 |
|------|------|
| 不能有状态变量 | 接口只定义行为，不存储数据 |
| 不能有构造函数 | 接口不能被部署 |
| 不能实现函数 | 所有函数必须是 `external` 且无函数体 |
| 可以继承其他接口 | 接口之间支持继承 |
| 可以定义事件和错误 | 方便标准化事件格式 |
| 可以定义枚举和结构体 | 方便标准化数据结构 |

### 2. ERC-20 接口示例

::: details 实现 ERC-20 接口
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ERC-20 标准接口
interface IERC20 { // [!code highlight]
    // 事件
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // 必须实现的函数
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title 简化版 ERC-20 代币实现
contract SimpleToken is IERC20 { // [!code highlight]
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 private _totalSupply;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        _totalSupply = _initialSupply * 10**decimals;
        _balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address _account) external view override returns (uint256) {
        return _balances[_account];
    }

    function transfer(address _to, uint256 _amount) external override returns (bool) {
        require(_balances[msg.sender] >= _amount, "Insufficient balance");
        _balances[msg.sender] -= _amount;
        _balances[_to] += _amount;
        emit Transfer(msg.sender, _to, _amount);
        return true;
    }

    function allowance(address _owner, address _spender) external view override returns (uint256) {
        return _allowances[_owner][_spender];
    }

    function approve(address _spender, uint256 _amount) external override returns (bool) {
        _allowances[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _amount) external override returns (bool) {
        require(_balances[_from] >= _amount, "Insufficient balance");
        require(_allowances[_from][msg.sender] >= _amount, "Insufficient allowance");
        _balances[_from] -= _amount;
        _balances[_to] += _amount;
        _allowances[_from][msg.sender] -= _amount;
        emit Transfer(_from, _to, _amount);
        return true;
    }
}
```
:::

### 3. 使用接口调用外部合约

::: details 通过接口与外部合约交互
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// @title 代币分发合约
contract TokenDistributor {
    /// @notice 批量分发代币
    function batchTransfer(
        address _tokenAddress,
        address[] calldata _recipients,
        uint256 _amountEach
    ) external {
        IERC20 token = IERC20(_tokenAddress); // 通过接口包装地址 // [!code highlight]

        for (uint256 i = 0; i < _recipients.length; i++) {
            bool success = token.transfer(_recipients[i], _amountEach); // [!code highlight]
            require(success, "Transfer failed");
        }
    }

    /// @notice 查询代币余额
    function checkBalance(address _token, address _account) external view returns (uint256) {
        return IERC20(_token).balanceOf(_account);
    }
}
```
:::

## 七、使用 OpenZeppelin 基础合约

OpenZeppelin 提供了经过安全审计的标准合约库，是生产环境的首选。

::: details 使用 OpenZeppelin 创建代币
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; // [!code highlight]
import "@openzeppelin/contracts/access/Ownable.sol";    // [!code highlight]

/// @title 基于 OpenZeppelin 的代币合约
contract GovernanceToken is ERC20, Ownable { // [!code highlight]
    uint256 public constant MAX_SUPPLY = 1000000 * 10**18;

    constructor()
        ERC20("Governance Token", "GOV") // 初始化 ERC20
        Ownable(msg.sender)              // 初始化 Ownable
    {
        _mint(msg.sender, 100000 * 10**18); // 初始铸造 10 万枚
    }

    /// @notice 仅 owner 可以铸造新代币
    function mint(address _to, uint256 _amount) public onlyOwner {
        require(totalSupply() + _amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(_to, _amount);
    }
}
```
:::

::: tip
安装 OpenZeppelin 合约库：`npm install @openzeppelin/contracts`。始终使用最新的稳定版本，并定期检查安全公告。
:::

## 八、总结

继承和接口是构建可复用、标准兼容的智能合约的关键机制：

- 使用 `virtual` 和 `override` 明确标注可重写和已重写的函数
- 多重继承按从基础到派生的顺序排列，理解 C3 线性化规则
- 抽象合约定义框架，接口定义标准，两者都不能直接部署
- 生产项目优先使用 OpenZeppelin 等经审计的合约库，避免重复造轮子
