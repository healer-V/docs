---
title: "基本语法与数据类型"
category: "Web3 · Solidity"
tags:
  - Solidity
  - 数据类型
  - 语法
excerpt: "Solidity 的数据类型分为值类型和引用类型，理解它们的存储位置和 Gas 消耗差异是编写高效合约的基础。"
date: 2026-03-15
---

# 基本语法与数据类型

## 一、值类型

值类型的变量在赋值或传参时会创建独立的副本，修改副本不会影响原始值。

### 1. 布尔型

`bool` 类型只有两个值：`true` 和 `false`，支持常见的逻辑运算符。

::: details 布尔型使用示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BooleanExample {
    bool public isActive = true;
    bool public isPaused = false;

    function checkStatus() public view returns (bool) {
        // 逻辑运算：与(&&)、或(||)、非(!)
        return isActive && !isPaused; // [!code highlight]
    }
}
```
:::

### 2. 整数类型

Solidity 提供有符号整数 `int` 和无符号整数 `uint`，支持多种位宽。

| 类型 | 范围 | 常用场景 |
|------|------|----------|
| `uint8` | 0 ~ 255 | 状态枚举、小计数器 |
| `uint16` | 0 ~ 65,535 | 中等范围计数 |
| `uint32` | 0 ~ 4,294,967,295 | 时间戳（秒） |
| `uint128` | 0 ~ 2¹²⁸-1 | 大额计算中间值 |
| `uint256` | 0 ~ 2²⁵⁶-1 | 代币余额、金额（默认） |
| `int256` | -2²⁵⁵ ~ 2²⁵⁵-1 | 需要负数的场景 |

::: tip
`uint` 和 `int` 分别是 `uint256` 和 `int256` 的别名。在合约中优先使用 `uint256`，因为 EVM 以 256 位为单位处理数据，使用较小类型反而可能增加 Gas 消耗（需要额外的位清理操作）。
:::

::: details 整数运算示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract IntegerExample {
    uint256 public totalSupply = 1000000 * 10**18; // 代币总量（含精度）
    int256 public temperature = -10; // 可以存储负数

    function safeAdd(uint256 _a, uint256 _b) public pure returns (uint256) {
        // Solidity 0.8+ 内置溢出检查，溢出时自动 revert
        return _a + _b; // [!code highlight]
    }

    function unsafeAdd(uint256 _a, uint256 _b) public pure returns (uint256) {
        // 使用 unchecked 跳过溢出检查，节省 Gas（仅在确保安全时使用）
        unchecked { // [!code highlight]
            return _a + _b;
        }
    }
}
```
:::

### 3. 地址类型

`address` 是以太坊的核心类型，存储 20 字节的账户地址。

| 类型 | 说明 |
|------|------|
| `address` | 普通地址，不能直接发送 ETH |
| `address payable` | 可支付地址，支持 `transfer` 和 `send` 方法 |

::: details 地址类型操作示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AddressExample {
    address public owner;
    address payable public treasury;

    constructor() {
        owner = msg.sender; // 部署者地址
        treasury = payable(msg.sender); // 转为可支付地址 // [!code highlight]
    }

    /// @notice 查询合约 ETH 余额
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /// @notice 向金库转账
    function withdrawToTreasury(uint256 _amount) public {
        require(msg.sender == owner, "Only owner");
        treasury.transfer(_amount); // [!code highlight]
    }
}
```
:::

### 4. 字节类型与枚举

::: details 字节与枚举示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BytesAndEnum {
    // 固定大小字节类型：bytes1 ~ bytes32
    bytes32 public contractId = keccak256(abi.encodePacked("MyContract"));
    bytes4 public functionSelector = bytes4(keccak256("transfer(address,uint256)"));

    // 枚举类型：适合表示有限状态
    enum OrderStatus { // [!code highlight]
        Pending,    // 0
        Confirmed,  // 1
        Shipped,    // 2
        Delivered,  // 3
        Cancelled   // 4
    }

    OrderStatus public currentStatus = OrderStatus.Pending;

    function confirmOrder() public {
        require(currentStatus == OrderStatus.Pending, "Order not pending");
        currentStatus = OrderStatus.Confirmed;
    }

    function getStatusCode() public view returns (uint8) {
        return uint8(currentStatus); // 枚举可转为整数
    }
}
```
:::

## 二、引用类型

引用类型的变量存储的是数据的引用（指针），赋值时需要明确指定数据存储位置。

### 1. 数组

Solidity 支持固定大小数组和动态数组。

::: details 数组操作示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ArrayExample {
    // 动态数组（状态变量默认存储在 storage）
    uint256[] public tokenIds;

    // 固定大小数组
    address[3] public topHolders;

    /// @notice 添加 Token ID
    function addTokenId(uint256 _id) public {
        tokenIds.push(_id); // [!code highlight]
    }

    /// @notice 移除最后一个元素
    function removeLastTokenId() public {
        require(tokenIds.length > 0, "Array is empty");
        tokenIds.pop();
    }

    /// @notice 获取数组长度
    function getTokenCount() public view returns (uint256) {
        return tokenIds.length;
    }

    /// @notice 获取全部 Token ID（谨慎使用，数组过大会耗尽 Gas）
    function getAllTokenIds() public view returns (uint256[] memory) {
        return tokenIds;
    }
}
```
:::

::: warning
避免在合约中遍历无上限的动态数组。随着数组增长，Gas 消耗会线性增加，最终可能超过区块 Gas 上限导致交易永远无法执行。
:::

### 2. 结构体

结构体允许你自定义复合数据类型，将多个字段组织在一起。

::: details 结构体使用示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StructExample {
    struct Campaign {
        address creator;       // 发起人
        uint256 goalAmount;    // 目标金额
        uint256 raisedAmount;  // 已筹集金额
        uint256 deadline;      // 截止时间
        bool claimed;          // 是否已提取
    }

    Campaign[] public campaigns;

    /// @notice 创建众筹活动
    function createCampaign(uint256 _goal, uint256 _duration) public {
        campaigns.push(Campaign({ // [!code highlight]
            creator: msg.sender,
            goalAmount: _goal,
            raisedAmount: 0,
            deadline: block.timestamp + _duration,
            claimed: false
        }));
    }

    /// @notice 获取活动信息
    function getCampaign(uint256 _index) public view returns (Campaign memory) {
        return campaigns[_index];
    }
}
```
:::

### 3. 映射

`mapping` 是 Solidity 中最常用的数据结构，类似于哈希表（键值对）。

::: details mapping 使用示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MappingExample {
    // 简单映射：地址 => 余额
    mapping(address => uint256) public balances;

    // 嵌套映射：所有者 => (操作者 => 授权额度)
    mapping(address => mapping(address => uint256)) public allowances; // [!code highlight]

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function approve(address _spender, uint256 _amount) public {
        allowances[msg.sender][_spender] = _amount;
    }

    function getAllowance(address _owner, address _spender) public view returns (uint256) {
        return allowances[_owner][_spender];
    }
}
```
:::

::: tip
`mapping` 无法被遍历，也无法获取所有的 key。如果你需要遍历功能，可以额外维护一个 key 数组，或使用 OpenZeppelin 提供的 `EnumerableMap`。
:::

## 三、存储位置

Solidity 有三种数据存储位置，它们在 Gas 消耗和生命周期上有显著差异。

| 存储位置 | 生命周期 | Gas 消耗 | 用途 |
|----------|----------|----------|------|
| `storage` | 永久存储在区块链上 | 最高（SSTORE 约 20,000 Gas） | 状态变量 |
| `memory` | 函数调用期间存在 | 中等 | 函数内临时变量 |
| `calldata` | 函数调用期间存在（只读） | 最低 | external 函数的参数 |

::: details 存储位置对比示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StorageLocationExample {
    struct User {
        string name;
        uint256 age;
    }

    User[] public users;

    /// @notice storage 引用：直接修改链上数据
    function updateUserAge(uint256 _index, uint256 _newAge) public {
        User storage user = users[_index]; // storage 引用 // [!code highlight]
        user.age = _newAge; // 直接修改链上数据
    }

    /// @notice memory 拷贝：不会修改链上数据
    function getUserInfo(uint256 _index) public view returns (string memory, uint256) {
        User memory user = users[_index]; // memory 拷贝 // [!code highlight]
        return (user.name, user.age);
    }

    /// @notice calldata 参数：只读，Gas 最优
    function addUser(string calldata _name, uint256 _age) external { // [!code highlight]
        users.push(User(_name, _age));
    }
}
```
:::

::: danger
混淆 `storage` 和 `memory` 是常见的严重错误。使用 `memory` 获取的是副本，对它的修改不会写入链上。如果你需要修改状态变量中的结构体或数组元素，必须使用 `storage` 引用。
:::

## 四、变量类型

Solidity 中的变量按作用域分为三类。

### 1. 状态变量

状态变量声明在合约内、函数外，永久存储在区块链上。

### 2. 局部变量

局部变量在函数内部声明，仅在函数执行期间存在，不上链。

### 3. 全局变量

全局变量由 EVM 提供，无需声明即可在合约中使用。

| 全局变量 | 类型 | 说明 |
|----------|------|------|
| `msg.sender` | `address` | 当前调用者地址 |
| `msg.value` | `uint256` | 随调用发送的 ETH（单位 wei） |
| `msg.data` | `bytes` | 完整的 calldata |
| `block.timestamp` | `uint256` | 当前区块时间戳（秒） |
| `block.number` | `uint256` | 当前区块编号 |
| `block.chainid` | `uint256` | 当前链 ID |
| `tx.origin` | `address` | 交易发起者（原始 EOA） |
| `gasleft()` | `uint256` | 剩余 Gas |

## 五、常量与不可变量

### 1. constant

`constant` 变量在编译时确定值，不占用存储槽，读取零 Gas 消耗。

### 2. immutable

`immutable` 变量在构造函数中赋值，部署后不可修改，比普通状态变量 Gas 消耗更低。

::: details constant 与 immutable 对比示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ConstantExample {
    // constant：编译时确定，必须在声明时赋值
    uint256 public constant MAX_SUPPLY = 10000; // [!code highlight]
    string public constant TOKEN_NAME = "MyToken";

    // immutable：部署时确定，在构造函数中赋值
    address public immutable deployer; // [!code highlight]
    uint256 public immutable deployTimestamp;

    constructor() {
        deployer = msg.sender;
        deployTimestamp = block.timestamp;
    }

    function getMaxSupply() public pure returns (uint256) {
        return MAX_SUPPLY; // 不读取 storage，使用 pure
    }
}
```
:::

::: tip
优先使用 `constant` 和 `immutable` 声明不会改变的值。它们不仅节省 Gas，还能让合约意图更清晰，避免意外修改。
:::

## 六、类型转换

Solidity 是强类型语言，类型转换需要显式进行。

::: details 类型转换示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TypeConversion {
    /// @notice 整数类型转换
    function intConversion() public pure returns (uint16) {
        uint8 smallNumber = 200;
        uint16 bigNumber = uint16(smallNumber); // 小类型 → 大类型：安全 // [!code highlight]
        return bigNumber;
    }

    /// @notice 地址与整数转换
    function addressConversion(address _addr) public pure returns (uint160) {
        return uint160(_addr); // address 本质是 uint160 // [!code highlight]
    }

    /// @notice bytes 转换
    function bytesConversion() public pure returns (bytes4) {
        bytes32 fullHash = keccak256(abi.encodePacked("hello"));
        return bytes4(fullHash); // 截取前 4 字节
    }
}
```
:::

::: warning
大类型向小类型转换（如 `uint256` → `uint8`）可能导致数据截断。Solidity 0.8+ 在运行时不会自动检查转换溢出，你需要自行确保转换安全。
:::

## 七、总结

掌握 Solidity 的数据类型体系是编写安全高效合约的基础。核心要点：

- **值类型**赋值产生副本，**引用类型**需要指定存储位置
- 默认使用 `uint256`，除非有明确的打包优化需求
- 始终注意 `storage` 和 `memory` 的区别，避免无效修改
- 善用 `constant` 和 `immutable` 降低 Gas 消耗
- 显式类型转换时注意数据截断风险
