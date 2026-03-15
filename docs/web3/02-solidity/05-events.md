---
title: "事件与日志"
category: "Web3 · Solidity"
tags:
  - Solidity
  - Event
  - 日志
excerpt: "事件是智能合约与外部世界通信的桥梁，通过 EVM 日志系统记录链上行为，前端可实时监听和查询。"
date: 2026-03-15
---

# 事件与日志

## 一、事件基础

事件（Event）是 Solidity 中将数据写入 EVM 日志的机制。日志存储在区块链上，但合约内部无法读取，主要供外部应用（如前端 DApp、区块浏览器）使用。

### 1. 事件声明

使用 `event` 关键字声明事件，参数可标记为 `indexed` 以支持过滤查询。

::: details 事件声明与触发示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EventBasics {
    // 声明事件：最多 3 个 indexed 参数
    event Transfer( // [!code highlight]
        address indexed from,   // indexed：可被过滤
        address indexed to,     // indexed：可被过滤
        uint256 amount          // 非 indexed：存储在 data 部分
    );

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    mapping(address => uint256) public balances;

    function transfer(address _to, uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");

        balances[msg.sender] -= _amount;
        balances[_to] += _amount;

        // 使用 emit 触发事件
        emit Transfer(msg.sender, _to, _amount); // [!code highlight]
    }
}
```
:::

::: warning
Solidity 0.8+ 要求使用 `emit` 关键字触发事件。虽然早期版本可以省略 `emit`，但这会降低代码可读性，现代编译器已强制要求使用 `emit`。
:::

### 2. 为什么使用事件

| 用途 | 说明 |
|------|------|
| 前端通知 | DApp 实时监听合约状态变化，更新 UI |
| 链上记录 | 低成本记录操作历史（比状态变量便宜很多） |
| 链下索引 | The Graph 等索引服务通过事件构建查询 API |
| 调试追踪 | 开发阶段追踪合约执行流程 |
| 合约间通信 | 作为异步通知机制（合约本身无法读取日志） |

::: tip
事件的 Gas 消耗远低于状态变量写入。一次 `SSTORE`（写状态变量）至少消耗 20,000 Gas，而一次 `LOG` 操作基础消耗仅 375 Gas + 每字节 8 Gas。如果数据不需要在合约内部读取，优先使用事件记录。
:::

## 二、EVM 日志机制

理解底层日志结构有助于你设计高效的事件。

### 1. 日志结构

每条 EVM 日志包含以下部分：

| 组成部分 | 说明 | 限制 |
|----------|------|------|
| `address` | 触发事件的合约地址 | 自动填充 |
| `topics[0]` | 事件签名的 keccak256 哈希 | 自动生成 |
| `topics[1-3]` | `indexed` 参数的值 | 最多 3 个 |
| `data` | 非 `indexed` 参数的 ABI 编码 | 无大小限制 |

### 2. indexed 与非 indexed 对比

| 特性 | indexed 参数 | 非 indexed 参数 |
|------|-------------|----------------|
| 存储位置 | topics（哈希索引） | data（原始数据） |
| 可过滤查询 | 可以 | 不可以 |
| 值类型存储 | 直接存储原值 | ABI 编码 |
| 引用类型存储 | 存储 keccak256 哈希 | 完整 ABI 编码 |
| Gas 消耗 | 每个 topic 额外 375 Gas | 每字节 8 Gas |
| 最大数量 | 3 个 | 不限 |

::: danger
`indexed` 参数如果是引用类型（`string`、`bytes`、数组、结构体），存储的是其 keccak256 哈希值，你无法从日志中还原原始数据。如果你需要从事件中检索字符串内容，不要将它标记为 `indexed`。
:::

::: details indexed 参数行为演示
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract IndexedDemo {
    // string 类型的 indexed 参数：只存储哈希，无法还原
    event ProductListed(
        uint256 indexed productId,     // 值类型：存储原值，可精确过滤
        address indexed seller,        // 值类型：存储原值，可精确过滤
        string productName,            // 引用类型：不要 indexed，保留完整内容 // [!code highlight]
        uint256 price
    );

    function listProduct(uint256 _id, string calldata _name, uint256 _price) external {
        emit ProductListed(_id, msg.sender, _name, _price);
    }
}
```
:::

## 三、常见事件模式

### 1. ERC-20 标准事件

ERC-20 代币标准定义了两个必须实现的事件。

::: details ERC-20 标准事件模式
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ERC20Events {
    /// @notice 代币转移事件（包括铸造和销毁）
    /// @dev 铸造时 from 为零地址，销毁时 to 为零地址
    event Transfer(address indexed from, address indexed to, uint256 value); // [!code highlight]

    /// @notice 授权事件
    event Approval(address indexed owner, address indexed spender, uint256 value); // [!code highlight]

    mapping(address => uint256) private _balances;
    uint256 private _totalSupply;

    /// @notice 铸造代币
    function _mint(address _to, uint256 _amount) internal {
        _totalSupply += _amount;
        _balances[_to] += _amount;
        emit Transfer(address(0), _to, _amount); // from = 零地址表示铸造 // [!code highlight]
    }

    /// @notice 销毁代币
    function _burn(address _from, uint256 _amount) internal {
        require(_balances[_from] >= _amount, "Insufficient balance");
        _balances[_from] -= _amount;
        _totalSupply -= _amount;
        emit Transfer(_from, address(0), _amount); // to = 零地址表示销毁 // [!code highlight]
    }
}
```
:::

### 2. 治理与管理事件

::: details 治理合约事件模式
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Governance {
    // 状态变更事件：记录关键参数修改
    event FeeRateUpdated(uint256 oldRate, uint256 newRate, address indexed updatedBy); // [!code highlight]
    event ContractPaused(address indexed pausedBy, uint256 timestamp);
    event ContractUnpaused(address indexed unpausedBy, uint256 timestamp);

    // 角色管理事件
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    uint256 public feeRate = 300; // 3%
    bool public paused;
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    function updateFeeRate(uint256 _newRate) external {
        require(msg.sender == admin, "Not admin");
        require(_newRate <= 1000, "Fee too high"); // 最高 10%

        uint256 oldRate = feeRate;
        feeRate = _newRate;
        emit FeeRateUpdated(oldRate, _newRate, msg.sender); // 记录变更前后的值 // [!code highlight]
    }

    function togglePause() external {
        require(msg.sender == admin, "Not admin");
        paused = !paused;
        if (paused) {
            emit ContractPaused(msg.sender, block.timestamp);
        } else {
            emit ContractUnpaused(msg.sender, block.timestamp);
        }
    }
}
```
:::

::: tip
状态变更事件建议同时记录旧值和新值（如 `oldRate` 和 `newRate`），这样外部应用无需额外查询链上状态即可完整还原变更历史。
:::

### 3. 自定义错误与事件配合

::: details 自定义错误配合事件使用
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AuctionHouse {
    struct Auction {
        address seller;
        address highestBidder;
        uint256 highestBid;
        uint256 endTime;
        bool ended;
    }

    mapping(uint256 => Auction) public auctions;

    event AuctionCreated(uint256 indexed auctionId, address indexed seller, uint256 endTime);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 amount);

    // 自定义错误（比 require 字符串更省 Gas）
    error AuctionNotActive(uint256 auctionId);
    error BidTooLow(uint256 currentBid, uint256 yourBid);

    function placeBid(uint256 _auctionId) external payable {
        Auction storage auction = auctions[_auctionId];

        if (block.timestamp >= auction.endTime || auction.ended) {
            revert AuctionNotActive(_auctionId);
        }
        if (msg.value <= auction.highestBid) {
            revert BidTooLow(auction.highestBid, msg.value);
        }

        // 退还上一个最高出价者
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;

        emit BidPlaced(_auctionId, msg.sender, msg.value); // [!code highlight]
    }
}
```
:::

## 四、前端监听事件

事件最重要的消费者是前端 DApp。以下是使用 Ethers.js 监听和查询事件的方式。

### 1. 实时监听

::: details Ethers.js 实时监听事件
```javascript
// frontend/src/utils/eventListener.js
import { ethers } from "ethers";

const provider = new ethers.BrowserProvider(window.ethereum);
const contractAddress = "0x1234...abcd";
const contractABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

const contract = new ethers.Contract(contractAddress, contractABI, provider);

// 监听所有 Transfer 事件
contract.on("Transfer", (from, to, value, event) => { // [!code highlight]
    console.log(`转账: ${from} → ${to}, 金额: ${ethers.formatEther(value)} ETH`);
    console.log(`交易哈希: ${event.log.transactionHash}`);
});

// 监听特定地址的 Transfer 事件（利用 indexed 过滤）
const myAddress = "0xabcd...1234";
const filterByReceiver = contract.filters.Transfer(null, myAddress); // [!code highlight]
contract.on(filterByReceiver, (from, to, value) => {
    console.log(`收到 ${ethers.formatEther(value)} ETH，来自 ${from}`);
});
```
:::

### 2. 查询历史事件

::: details Ethers.js 查询历史事件
```javascript
// frontend/src/utils/queryEvents.js
import { ethers } from "ethers";

async function getTransferHistory(contract, fromBlock, toBlock) {
    // 查询指定区块范围内的 Transfer 事件
    const filter = contract.filters.Transfer(); // [!code highlight]
    const events = await contract.queryFilter(filter, fromBlock, toBlock); // [!code highlight]

    const transfers = events.map(event => ({
        from: event.args.from,
        to: event.args.to,
        value: ethers.formatEther(event.args.value),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
    }));

    return transfers;
}

// 查询最近 1000 个区块的事件
const currentBlock = await provider.getBlockNumber();
const history = await getTransferHistory(contract, currentBlock - 1000, currentBlock);
console.log(`共找到 ${history.length} 笔转账记录`);
```
:::

::: warning
查询大范围的历史事件可能很慢且消耗大量 RPC 请求。对于生产环境，建议使用 The Graph 等索引服务来高效查询历史事件，而非直接使用 `queryFilter`。
:::

## 五、匿名事件

使用 `anonymous` 关键字声明的事件不会将事件签名存储在 `topics[0]`，这意味着你可以有 4 个 `indexed` 参数（而非 3 个），但无法通过事件名过滤。

::: details 匿名事件示例
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AnonymousEventDemo {
    // 匿名事件：可以有 4 个 indexed 参数
    event HighValueTransfer(
        address indexed from,
        address indexed to,
        uint256 indexed amount,
        uint256 indexed timestamp // 第 4 个 indexed 参数 // [!code highlight]
    ) anonymous; // [!code highlight]

    // 普通事件：最多 3 个 indexed 参数
    event NormalTransfer(
        address indexed from,
        address indexed to,
        uint256 amount
    );
}
```
:::

::: tip
匿名事件的使用场景很少。由于无法通过事件签名过滤，前端解析和索引都更复杂。除非你确实需要 4 个可过滤参数，否则建议使用普通事件。
:::

## 六、事件设计最佳实践

| 实践要点 | 说明 |
|----------|------|
| 所有状态修改都触发事件 | 确保链上行为可追踪，便于审计和前端同步 |
| `indexed` 用于过滤字段 | 地址、ID 等常用过滤条件标记为 `indexed` |
| 引用类型不要 `indexed` | `string`、`bytes` 标记 `indexed` 后只存储哈希 |
| 记录变更前后的值 | 状态修改事件同时包含旧值和新值 |
| 遵循社区命名约定 | 动作使用过去式或名词（`Transfer`、`Approval`） |
| 控制事件参数数量 | 参数过多会增加 Gas，通常 3-5 个参数即可 |

## 七、总结

事件是连接链上合约与链下应用的核心纽带：

- 使用 `event` 声明、`emit` 触发，最多 3 个 `indexed` 参数
- `indexed` 参数存储在 topics 中支持高效过滤，但引用类型会被哈希
- 事件 Gas 消耗远低于状态变量写入，适合记录不需要合约内读取的数据
- 前端通过 Ethers.js 等库实时监听或查询历史事件
- 遵循 ERC 标准事件规范，确保生态兼容性
